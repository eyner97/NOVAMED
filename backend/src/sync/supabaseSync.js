// backend/src/sync/supabaseSync.js
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const prisma = new PrismaClient();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const toStr = (v) => (v == null ? null : String(v));
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const toDate = (v) => (v ? new Date(v) : null);

export async function syncFromSupabase() {
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
    await prisma.departamentos.upsert({
      where: { id },
      update: {
        nombre: toStr(d.nombre),
        codigo: toStr(d.codigo),
        created_at: toDate(d.created_at),
      },
      create: {
        id,
        nombre: toStr(d.nombre),
        codigo: toStr(d.codigo),
        created_at: toDate(d.created_at),
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
    const depto = await prisma.departamentos.findUnique({ where: { id: deptoId } });
    if (!depto) {
      console.warn(`Municipio SKIPPED (depto no existe): ${m.nombre} (${deptoId})`);
      continue;
    }
    await prisma.municipios.upsert({
      where: { id },
      update: {
        nombre: toStr(m.nombre),
        codigo: toStr(m.codigo),
        departamento_id: deptoId,
        created_at: toDate(m.created_at),
      },
      create: {
        id,
        nombre: toStr(m.nombre),
        codigo: toStr(m.codigo),
        departamento_id: deptoId,
        created_at: toDate(m.created_at),
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
    await prisma.clinicas_moviles.upsert({
      where: { id },
      update: {
        nombre: toStr(c.nombre),
        descripcion: toStr(c.descripcion),
        telefono: toStr(c.telefono),
        activa: !!c.activa,
        created_at: toDate(c.created_at),
      },
      create: {
        id,
        nombre: toStr(c.nombre),
        descripcion: toStr(c.descripcion),
        telefono: toStr(c.telefono),
        activa: !!c.activa,
        created_at: toDate(c.created_at),
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
    const muni = await prisma.municipios.findUnique({ where: { id: muniId } });
    if (!muni) {
      puestosSkip++;
      console.warn(`Puesto SKIPPED (municipio no existe): ${p.nombre} (${muniId})`);
      continue;
    }
    await prisma.puestos_salud.upsert({
      where: { id },
      update: {
        nombre: toStr(p.nombre),
        tipo: toStr(p.tipo), // enum en PG → string local
        direccion: toStr(p.direccion),
        telefono: toStr(p.telefono),
        municipio_id: muniId,
        lat: toNum(p.lat),
        lng: toNum(p.lng),
      },
      create: {
        id,
        nombre: toStr(p.nombre),
        tipo: toStr(p.tipo),
        direccion: toStr(p.direccion),
        telefono: toStr(p.telefono),
        municipio_id: muniId,
        lat: toNum(p.lat),
        lng: toNum(p.lng),
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

    const clin = await prisma.clinicas_moviles.findUnique({ where: { id: clinId } });
    const muni = await prisma.municipios.findUnique({ where: { id: muniId } });
    if (!clin || !muni) {
      rutasSkip++;
      console.warn(`Ruta SKIPPED (FK falta) id=${id} clinica=${clinId} municipio=${muniId}`);
      continue;
    }

    await prisma.rutas_clinicas.upsert({
      where: { id },
      update: {
        clinica_id: clinId,
        municipio_id: muniId,
        fecha: toDate(r.fecha),
        hora_inicio: toStr(r.hora_inicio),
        hora_fin: toStr(r.hora_fin),
        punto_encuentro: toStr(r.punto_encuentro),
        lat: toNum(r.lat),
        lng: toNum(r.lng),

        // Campos legado opcionales: no los pisamos si no llegan
        // nombre/descripcion pueden quedarse como estaban si tu API local los usa
      },
      create: {
        id,
        clinica_id: clinId,
        municipio_id: muniId,
        fecha: toDate(r.fecha),
        hora_inicio: toStr(r.hora_inicio),
        hora_fin: toStr(r.hora_fin),
        punto_encuentro: toStr(r.punto_encuentro),
        lat: toNum(r.lat),
        lng: toNum(r.lng),
      },
    });
    rutasOk++;
  }
  console.log(`Rutas clínicas OK: ${rutasOk} | SKIP por FK: ${rutasSkip}`);

  // 6) Jornadas de salud (requiere municipio existente)
  const { data: jornadas, error: jornadasErr } = await supabase
    .from("jornadas_salud")
    .select("id,titulo,descripcion,tipo,fecha,hora_inicio,hora_fin,municipio_id,lugar,lat,lng,geom,created_at");
  if (jornadasErr) {
    console.error("Supabase jornadas_salud:", jornadasErr);
    return;
  }
  let jornadasOk = 0, jornadasSkip = 0;
  for (const j of jornadas) {
    const id = toStr(j.id);
    const muniId = toStr(j.municipio_id);
    const muni = await prisma.municipios.findUnique({ where: { id: muniId } });
    if (!muni) {
      jornadasSkip++;
      console.warn(`Jornada SKIPPED (municipio no existe): ${j.titulo} (${muniId})`);
      continue;
    }
    await prisma.jornadas_salud.upsert({
      where: { id },
      update: {
        titulo: toStr(j.titulo),
        descripcion: toStr(j.descripcion),
        tipo: toStr(j.tipo),
        fecha: toDate(j.fecha),
        hora_inicio: toStr(j.hora_inicio),
        hora_fin: toStr(j.hora_fin),
        municipio_id: muniId,
        lugar: toStr(j.lugar),
        lat: toNum(j.lat),
        lng: toNum(j.lng),
        geom: toStr(j.geom),
        created_at: toDate(j.created_at),
      },
      create: {
        id,
        titulo: toStr(j.titulo),
        descripcion: toStr(j.descripcion),
        tipo: toStr(j.tipo),
        fecha: toDate(j.fecha),
        hora_inicio: toStr(j.hora_inicio),
        hora_fin: toStr(j.hora_fin),
        municipio_id: muniId,
        lugar: toStr(j.lugar),
        lat: toNum(j.lat),
        lng: toNum(j.lng),
        geom: toStr(j.geom),
        created_at: toDate(j.created_at),
      },
    });
    jornadasOk++;
  }
  console.log(`Jornadas de salud OK: ${jornadasOk} | SKIP por FK: ${jornadasSkip}`);

  // 7) Servicios de salud
  const { data: servicios, error: serviciosErr } = await supabase
    .from("servicios_salud")
    .select("id,nombre,descripcion");
  if (serviciosErr) {
    console.error("Supabase servicios_salud:", serviciosErr);
    return;
  }
  for (const s of servicios) {
    const id = toStr(s.id);
    await prisma.servicios_salud.upsert({
      where: { id },
      update: {
        nombre: toStr(s.nombre),
        descripcion: toStr(s.descripcion),
      },
      create: {
        id,
        nombre: toStr(s.nombre),
        descripcion: toStr(s.descripcion),
      },
    });
  }
  console.log(`Servicios de salud: ${servicios.length}`);

  // 8) Relación: Jornadas - Servicios (Pivot)
  const { data: jsData, error: jsErr } = await supabase
    .from("jornadas_servicios")
    .select("jornada_id,servicio_id");
  if (jsErr) {
    console.error("Supabase jornadas_servicios:", jsErr);
    return;
  }
  let jsOk = 0, jsSkip = 0;
  for (const js of jsData) {
    const jornadaId = toStr(js.jornada_id);
    const servicioId = toStr(js.servicio_id);
    const jornada = await prisma.jornadas_salud.findUnique({ where: { id: jornadaId } });
    const servicio = await prisma.servicios_salud.findUnique({ where: { id: servicioId } });
    if (!jornada || !servicio) {
      jsSkip++;
      console.warn(`JornadaServicio SKIPPED (FK falta): jornada_id=${jornadaId}, servicio_id=${servicioId}`);
      continue;
    }
    // Para tablas con llave compuesta, usamos el objeto compuesto en 'where'
    await prisma.jornadas_servicios.upsert({
      where: {
        // Se asume que Prisma genera un campo compuesto llamado 'jornada_id_servicio_id'
        jornada_id_servicio_id: { jornada_id: jornadaId, servicio_id: servicioId },
      },
      update: {},
      create: {
        jornada_id: jornadaId,
        servicio_id: servicioId,
      },
    });
    jsOk++;
  }
  console.log(`JornadasServicios OK: ${jsOk} | SKIP por FK: ${jsSkip}`);

  // 9) Enfermedades
  const { data: enfermedades, error: enfermedadesErr } = await supabase
    .from("enfermedades")
    .select("id,nombre,descripcion,signos_alarma,nivel_riesgo,etiquetas,created_at");
  if (enfermedadesErr) {
    console.error("Supabase enfermedades:", enfermedadesErr);
    return;
  }
  for (const enf of enfermedades) {
    const id = toStr(enf.id);
    const nombre = toStr(enf.nombre);
    await prisma.enfermedades.upsert({
      where: { nombre }, // Cambia aquí
      update: {
        descripcion: toStr(enf.descripcion),
        signos_alarma: toStr(enf.signos_alarma),
        nivel_riesgo: toStr(enf.nivel_riesgo),
        etiquetas: toStr(enf.etiquetas),
        created_at: toDate(enf.created_at),
      },
      create: {
        id,
        nombre,
        descripcion: toStr(enf.descripcion),
        signos_alarma: toStr(enf.signos_alarma),
        nivel_riesgo: toStr(enf.nivel_riesgo),
        etiquetas: toStr(enf.etiquetas),
        created_at: toDate(enf.created_at),
      },
    });
  }
  console.log(`Enfermedades: ${enfermedades.length}`);

  // 10) Síntomas
  const { data: sintomas, error: sintomasErr } = await supabase
    .from("sintomas")
    .select("id,nombre,created_at");
  if (sintomasErr) {
    console.error("Supabase sintomas:", sintomasErr);
    return;
  }
  for (const s of sintomas) {
    const id = toStr(s.id);
    const nombre = toStr(s.nombre);
    await prisma.sintomas.upsert({
      where: { nombre }, // Cambia aquí
      update: {
        created_at: toDate(s.created_at),
      },
      create: {
        id,
        nombre,
        created_at: toDate(s.created_at),
      },
    });
  }
  console.log(`Síntomas: ${sintomas.length}`);

  // 11) Relación enfermedad_sintoma (pivot)
  const { data: enfSint, error: enfSintErr } = await supabase
    .from("enfermedad_sintoma")
    .select("enfermedad_id,sintoma_id,peso");
  if (enfSintErr) {
    console.error("Supabase enfermedad_sintoma:", enfSintErr);
    return;
  }
  let enfSintOk = 0, enfSintSkip = 0;
  for (const rel of enfSint) {
    const enfermedadId = toStr(rel.enfermedad_id);
    const sintomaId = toStr(rel.sintoma_id);
    const enfermedad = await prisma.enfermedades.findUnique({ where: { id: enfermedadId } });
    const sintoma = await prisma.sintomas.findUnique({ where: { id: sintomaId } });
    if (!enfermedad || !sintoma) {
      enfSintSkip++;
      console.warn(`enfermedad_sintoma SKIPPED (FK falta): enfermedad_id=${enfermedadId}, sintoma_id=${sintomaId}`);
      continue;
    }
    await prisma.enfermedad_sintoma.upsert({
      where: {
        sintoma_id_enfermedad_id: { sintoma_id: sintomaId, enfermedad_id: enfermedadId },
      },
      update: {
        peso: toNum(rel.peso),
      },
      create: {
        sintoma_id: sintomaId,
        enfermedad_id: enfermedadId,
        peso: toNum(rel.peso),
      },
    });
    enfSintOk++;
  }
  console.log(`enfermedad_sintoma OK: ${enfSintOk} | SKIP por FK: ${enfSintSkip}`);

  console.log("== Sync completo ==");
}

// Esta sección se adapta para Módulos ES
const currentFileUrl = import.meta.url;
const currentFilePath = fileURLToPath(currentFileUrl);

// Comprueba si el script se está ejecutando directamente
if (process.argv[1] === currentFilePath) {
  syncFromSupabase()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error("Error en sync:", e);
      process.exit(1);
    });
}
