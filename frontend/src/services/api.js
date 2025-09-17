// frontend/src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Ya existente
export async function getRutasClinicas() {
  const res = await fetch(`${API_URL}/api/rutas`);
  if (!res.ok) throw new Error("Error en /api/rutas");
  return res.json();
}

// NUEVOS: catálogos y datasets
export async function getDepartamentos() {
  const res = await fetch(`${API_URL}/api/departamentos`);
  if (!res.ok) throw new Error("Error en /api/departamentos");
  return res.json();
}

export async function getMunicipios() {
  const res = await fetch(`${API_URL}/api/municipios`);
  if (!res.ok) throw new Error("Error en /api/municipios");
  const data = await res.json();

  // 🔧 Normaliza a camelCase lo que el Mapa.jsx espera:
  // - departamentoId (en vez de departamento_id)
  // - deja el resto igual
  return data.map((m) => ({
    ...m,
    departamentoId: m.departamentoId ?? m.departamento_id, // <- clave
  }));
}


export async function getClinicasMoviles() {
  const res = await fetch(`${API_URL}/api/clinicas`);
  if (!res.ok) throw new Error("Error en /api/clinicas");
  return res.json();
}

export async function getPuestosSalud() {
  const res = await fetch(`${API_URL}/api/puestos-salud`);
  if (!res.ok) throw new Error("Error en /api/puestos-salud");
  return res.json();
}
