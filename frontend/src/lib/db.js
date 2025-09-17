import Dexie from "dexie";

export const db = new Dexie("miPWA_DB");

// v1 existente
db.version(1).stores({
  ubicaciones: "id,latitud,longitud,nombre,descripcion",
});

// v2: añadimos catálogos (no rompe v1)
db.version(2).stores({
  // catálogos para el modal (offline)
  departamentos: "id,nombre,codigo",
  municipios: "id,departamentoId,nombre,codigo",
  // opcional: caches específicos si luego quieres consultarlos directo
  clinicas: "id,nombre,descripcion,telefono,activa",
  puestos_salud: "id,nombre,tipo,municipioId,latitud,longitud",
}).upgrade(async (tx) => {
  // (sin cambios) – se crearon nuevas stores.
});

// v3: MIGRACIÓN SUAVE -> normaliza snake_case -> camelCase en municipios
db.version(3).stores({
  // mantenemos exactamente las mismas definiciones de índices
  departamentos: "id,nombre,codigo",
  municipios: "id,departamentoId,nombre,codigo",
  clinicas: "id,nombre,descripcion,telefono,activa",
  puestos_salud: "id,nombre,tipo,municipioId,latitud,longitud",
}).upgrade(async (tx) => {
  const municipios = tx.table("municipios");
  const todos = await municipios.toArray();
  for (const m of todos) {
    // si quedaron registros viejos con 'departamento_id', los normalizamos
    if (m.departamento_id && !m.departamentoId) {
      m.departamentoId = m.departamento_id;
      delete m.departamento_id;
      await municipios.put(m); // re-escribe el registro normalizado
    }
  }
});
