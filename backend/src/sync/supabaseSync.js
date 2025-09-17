// backend/src/sync/supabaseSync.js
const { createClient } = require("@supabase/supabase-js");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const prisma = new PrismaClient();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const toStr = (v) => (v == null ? null : String(v));
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const toDate = (v) => (v ? new Date(v) : null);

async function syncFromSupabase() {
  console.log("== Iniciando sync desde Supabase ==");

  // 1) Departamentos
  const { data: deps, error: depsErr } = await supabase
    .from("departamentos")
    .select("id,nombre,codigo,created_at");
  if (depsErr) {
    console.error("Supabase departamentos:", depsErr);
    return;
  }
  for (const d of deps) {
    const id = toStr(d.id);
    await prisma.departamento.upsert({
      where: { id },
      update: {
        nombre: toStr(d.nombre),
        codigo: toStr(d.codigo),
        createdAt: toDate(d.created_at),
      },
      create: {
        id,
        nombre: toStr(d.nombre),
        codigo: toStr(d.codigo),
        createdAt: toDate(d.created_at),
      },
    });
  }
  console.log(`Departamentos: ${deps.length}`);

  // 2) Municipios (OJO: columna es 'codigo' SIN acento)
  const { data: munis, error: munisErr } = await supabase
    .from("municipios")
    .select("id,departamento_id,nombre,codigo,created_at");
  if (munisErr) {
    console.error("Supabase municipios:", munisErr);
    return;
  }
  for (const m of munis) {
    const id = toStr(m.id);
    const deptoId = toStr(m.departamento_id);
    // Verifica que el departamento exista
    const depto = await prisma.departamento.findUnique({ where: { id: deptoId } });
    if (!depto) {
      console.warn(`Municipio SKIPPED (depto no existe): ${m.nombre} (${deptoId})`);
      continue;
    }
    await prisma.Municipio.upsert({
      where: { id },
      update: {
        nombre: toStr(m.nombre),
        codigo: toStr(m.codigo),
        departamentoId: deptoId,
        createdAt: toDate(m.created_at),
      },
      create: {
        id,
        nombre: toStr(m.nombre),
        codigo: toStr(m.codigo),
        departamentoId: deptoId,
        createdAt: toDate(m.created_at),
      },
    });
  }
  console.log(`Municipios: ${munis.length}`);

  // 3) Clínicas móviles (tabla sin acentos: 'clinicas_moviles')
  const { data: clinicas, error: clinErr } = await supabase
    .from("clinicas_moviles")
    .select("id,nombre,descripcion,telefono,activa,created_at");
  if (clinErr) {
    console.error("Supabase clinicas_moviles:", clinErr);
    return;
  }
  for (const c of clinicas) {
    const id = toStr(c.id);
    await prisma.clinicaMovil.upsert({
      where: { id },
      update: {
        nombre: toStr(c.nombre),
        descripcion: toStr(c.descripcion),
        telefono: toStr(c.telefono),
        activa: !!c.activa,
        createdAt: toDate(c.created_at),
      },
      create: {
        id,
        nombre: toStr(c.nombre),
        descripcion: toStr(c.descripcion),
        telefono: toStr(c.telefono),
        activa: !!c.activa,
        createdAt: toDate(c.created_at),
      },
    });
  }
  console.log(`Clínicas móviles: ${clinicas.length}`);

  // 4) Puestos de salud (requiere municipio existente)
  const { data: puestos, error: puestosErr } = await supabase
    .from("puestos_salud")
    .select("id,nombre,tipo,direccion,telefono,municipio_id,lat,lng");
  if (puestosErr) {
    console.error("Supabase puestos_salud:", puestosErr);
    return;
  }
  let puestosOk = 0, puestosSkip = 0;
  for (const p of puestos) {
    const id = toStr(p.id);
    const muniId = toStr(p.municipio_id);
    const muni = await prisma.municipio.findUnique({ where: { id: muniId } });
    if (!muni) {
      puestosSkip++;
      console.warn(`Puesto SKIPPED (municipio no existe): ${p.nombre} (${muniId})`);
      continue;
    }
    await prisma.puestoSalud.upsert({
      where: { id },
      update: {
        nombre: toStr(p.nombre),
        tipo: toStr(p.tipo), // enum en PG → string local
        direccion: toStr(p.direccion),
        telefono: toStr(p.telefono),
        municipioId: muniId,
        latitud: toNum(p.lat),
        longitud: toNum(p.lng),
      },
      create: {
        id,
        nombre: toStr(p.nombre),
        tipo: toStr(p.tipo),
        direccion: toStr(p.direccion),
        telefono: toStr(p.telefono),
        municipioId: muniId,
        latitud: toNum(p.lat),
        longitud: toNum(p.lng),
      },
    });
    puestosOk++;
  }
  console.log(`Puestos de salud OK: ${puestosOk} | SKIP por FK: ${puestosSkip}`);

  // 5) Rutas clínicas (requiere clinica y municipio)
  const { data: rutas, error: rutasErr } = await supabase
    .from("rutas_clinicas")
    .select("id,clinica_id,municipio_id,fecha,hora_inicio,hora_fin,punto_encuentro,lat,lng");
  if (rutasErr) {
    console.error("Supabase rutas_clinicas:", rutasErr);
    return;
  }
  let rutasOk = 0, rutasSkip = 0;
  for (const r of rutas) {
    const id = toStr(r.id);
    const clinId = toStr(r.clinica_id);
    const muniId = toStr(r.municipio_id);

    const clin = await prisma.clinicaMovil.findUnique({ where: { id: clinId } });
    const muni = await prisma.municipio.findUnique({ where: { id: muniId } });
    if (!clin || !muni) {
      rutasSkip++;
      console.warn(`Ruta SKIPPED (FK falta) id=${id} clinica=${clinId} municipio=${muniId}`);
      continue;
    }

    await prisma.rutaClinica.upsert({
      where: { id },
      update: {
        clinicaId: clinId,
        municipioId: muniId,
        fecha: toDate(r.fecha),
        horaInicio: toStr(r.hora_inicio),
        horaFin: toStr(r.hora_fin),
        puntoEncuentro: toStr(r.punto_encuentro),
        latitud: toNum(r.lat),
        longitud: toNum(r.lng),

        // Campos legado opcionales: no los pisamos si no llegan
        // nombre/descripcion pueden quedarse como estaban si tu API local los usa
      },
      create: {
        id,
        clinicaId: clinId,
        municipioId: muniId,
        fecha: toDate(r.fecha),
        horaInicio: toStr(r.hora_inicio),
        horaFin: toStr(r.hora_fin),
        puntoEncuentro: toStr(r.punto_encuentro),
        latitud: toNum(r.lat),
        longitud: toNum(r.lng),
      },
    });
    rutasOk++;
  }
  console.log(`Rutas clínicas OK: ${rutasOk} | SKIP por FK: ${rutasSkip}`);

  console.log("== Sync completo ==");
}

if (require.main === module) {
  syncFromSupabase()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error("Error en sync:", e);
      process.exit(1);
    });
}

module.exports = { syncFromSupabase };
