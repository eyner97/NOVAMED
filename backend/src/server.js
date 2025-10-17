import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { initializeAI, isAiReady, askAI } from "../utils/aiClient.js";

dotenv.config();

// Inicializar el asistente de IA al arrancar el servidor
initializeAI().catch(err => console.error("Fallo al inicializar el asistente de IA:", err));

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// backend/src/server.js
app.listen(4000, '0.0.0.0', () => console.log('API en 4000'));

// ✅ Healthcheck (segundo código)
app.get("/api/health", (req, res) => res.json({ ok: true }));

// --------------------
// 🟢 Parte de tu código (ubicaciones en memoria)
// --------------------
let ubicaciones = [
  { id: 1, nombre: "Ejemplo", lat: 12.123, lng: -86.123, fecha: new Date() },
];

app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});

app.get("/ubicaciones", (req, res) => {
  res.json(ubicaciones);
});

app.post("/ubicaciones", (req, res) => {
  const nueva = { id: Date.now(), ...req.body };
  ubicaciones.push(nueva);
  res.json(nueva);
});

// --------------------
// 🔵 Parte de Prisma (rutas_clinicas)
// --------------------

// Listar rutas
app.get("/api/rutas", async (req, res) => {
  try {
    const rutas = await prisma.rutas_clinicas.findMany({
      orderBy: { fecha: "desc" },
      include: {
        clinica: true, // Incluye la clínica móvil asociada
      },
    });
    // Mapea para exponer teléfono y fecha directamente
    const rutasConTelefonoYFecha = rutas.map(r => ({
      ...r,
      clinica_telefono: r.clinica?.telefono ?? null,
      clinica_nombre: r.clinica?.nombre ?? null,
      fecha: r.fecha ? r.fecha.toISOString().slice(0,10) : null, // Formato YYYY-MM-DD
    }));
    res.json(rutasConTelefonoYFecha);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error listando rutas" });
  }
});

// Crear ruta
app.post("/api/rutas", async (req, res) => {
  try {
    // Extraer todos los campos necesarios del body
    const { clinica_id, municipio_id, fecha, hora_inicio, hora_fin, punto_encuentro, lat, lng } = req.body;

    // Validar que los campos requeridos existan
    if (!clinica_id || !municipio_id || !fecha || !hora_inicio || !hora_fin) {
      return res.status(400).json({ error: "Faltan campos requeridos: clinica_id, municipio_id, fecha, hora_inicio, hora_fin" });
    }

    const ruta = await prisma.rutas_clinicas.create({
      data: {
        // Usar los nombres de campo del schema.prisma
        clinica_id,
        municipio_id,
        fecha: new Date(fecha), // Asegurarse que sea un objeto Date
        hora_inicio,
        hora_fin,
        punto_encuentro,
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
      },
    });
    res.status(201).json(ruta);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error creando ruta" });
  }
});

// Actualizar ruta
app.put("/api/rutas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Usar los nombres de campo correctos del schema
    const { punto_encuentro, lat, lng, estado } = req.body;
    const ruta = await prisma.rutas_clinicas.update({
      where: { id },
      data: {
        punto_encuentro,
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
        estado,
      },
    });
    res.json(ruta);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error actualizando ruta" });
  }
});

// Eliminar ruta
app.delete("/api/rutas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.rutas_clinicas.delete({ where: { id } });
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error eliminando ruta" });
  }
});

// --------------------
// 🟣 ENDPOINTS AÑADIDOS (consultas con relaciones)
// --------------------

// Departamentos (lista)
app.get("/api/departamentos", async (req, res) => {
  try {
    const departamentos = await prisma.departamentos.findMany({
      orderBy: { nombre: "asc" },
    });
    res.json(departamentos);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error listando departamentos" });
  }
});

// Departamentos con municipios
app.get("/api/departamentos-con-municipios", async (req, res) => {
  try {
    const departamentos = await prisma.departamentos.findMany({
      orderBy: { nombre: "asc" },
      include: { municipios: true },
    });
    res.json(departamentos);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error listando departamentos con municipios" });
  }
});

// Municipios (lista)
app.get("/api/municipios", async (req, res) => {
  try {
    const municipios = await prisma.municipios.findMany({
      orderBy: { nombre: "asc" },
    });
    res.json(municipios);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error listando municipios" });
  }
});

// Municipios con departamento
app.get("/api/municipios-con-departamento", async (req, res) => {
  try {
    const municipios = await prisma.municipios.findMany({
      orderBy: { nombre: "asc" },
      include: { departamento: true },
    });
    res.json(municipios);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error listando municipios con departamento" });
  }
});

// Clínicas móviles (lista)
app.get("/api/clinicas", async (req, res) => {
  try {
    const clinicas = await prisma.clinicas_moviles.findMany({
      orderBy: { created_at: "desc" },
    });
    res.json(clinicas);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error listando clínicas móviles" });
  }
});

// Puestos de salud (lista)
app.get("/api/puestos-salud", async (req, res) => {
  try {
    const puestos = await prisma.puestos_salud.findMany({
      orderBy: { nombre: "asc" },
    });
    res.json(puestos);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error listando puestos de salud" });
  }
});

// Puestos de salud con municipio y departamento (relación completa)
app.get("/api/puestos-salud-detalle", async (req, res) => {
  try {
    const puestos = await prisma.puestos_salud.findMany({
      orderBy: { nombre: "asc" },
      include: {
        municipio: {
          include: {
            departamento: true,
          },
        },
      },
    });
    res.json(puestos);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error listando puestos con relaciones" });
  }
});

// Rutas con clínica y municipio (detalle)
app.get("/api/rutas/detalle", async (req, res) => {
  try {
    const rutas = await prisma.rutas_clinicas.findMany({
      orderBy: { fecha: "desc" },
      include: {
        clinica: true,
        municipio: {
          include: { departamento: true },
        },
      },
    });
    res.json(rutas);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error listando rutas con relaciones" });
  }
});

import { syncFromSupabase } from "./sync/supabaseSync.js";

// Llama la primera vez al arrancar
syncFromSupabase().catch((e) => console.error("Error inicial sync:", e));

// Cada 3 minutos (180000 ms)
setInterval(() => {
  syncFromSupabase().catch((e) => console.error("Error en sync periódica:", e));
}, 180_000);

// ============================
// ENDPOINTS NUEVOS PARA FRONTEND
// ============================

// --- Endpoint para el Chat con IA ---
app.post("/api/chat", async (req, res) => {
  try {
    const { prompt, departamento } = req.body;
    if (!prompt) return res.status(400).json({ error: "El 'prompt' es requerido." });

    // Palabras clave para clínicas móviles
    const clinicaKeywords = [
      "clinica movil", "clínica móvil", "clinicas moviles", "clínicas móviles",
      "clinica móvil", "clinicas móviles", "clínica movil", "clínicas moviles"
    ];
    const promptLower = prompt.toLowerCase();

    let extraInfo = "";
    if (clinicaKeywords.some(k => promptLower.includes(k))) {
      // 1. Consulta departamentos → municipios → rutas_clinicas → clinica_moviles
      const departamentos = await prisma.departamentos.findMany({
        orderBy: { nombre: "asc" },
        include: {
          municipios: {
            orderBy: { nombre: "asc" },
            include: {
              rutas: {
                orderBy: { fecha: "desc" },
                include: {
                  clinica: {
                    select: {
                      nombre: true,
                      descripcion: true,
                      telefono: true,
                    }
                  }
                }
              }
            }
          }
        }
      });

      // 2. Formatea la información como matrices de cadenas
      const departamentosArr = departamentos.map(dep => {
        const municipiosArr = dep.municipios.map(mun => {
          const rutasArr = mun.rutas.map(ruta => {
            if (!ruta.clinica) return null;
            return `  - Clínica móvil: ${ruta.clinica.nombre}
      Descripción: ${ruta.clinica.descripcion || "N/D"}
      Teléfono: ${ruta.clinica.telefono || "N/D"}
      Fecha: ${ruta.fecha?.toISOString().slice(0,10) || "N/D"}
      Hora inicio: ${ruta.hora_inicio || "N/D"}
      Municipio: ${mun.nombre}
      Departamento: ${dep.nombre}`;
          }).filter(Boolean);
          return rutasArr.length
            ? `• Municipio: ${mun.nombre}\n${rutasArr.join("\n")}`
            : null;
        }).filter(Boolean);
        return municipiosArr.length
          ? `=== Departamento: ${dep.nombre} ===\n${municipiosArr.join("\n\n")}`
          : null;
      }).filter(Boolean);

      extraInfo = `
Información actual de clínicas móviles y rutas en Nicaragua:
${departamentosArr.length ? departamentosArr.join("\n\n") : "No hay rutas de clínicas móviles registradas."}

Utiliza estos datos para responder si el usuario pregunta por clínicas móviles o rutas.
      `;
    }

    // Palabras clave para síntomas/enfermedades
    const sintomasKeywords = [
      "síntoma", "sintoma", "síntomas", "sintomas", "me siento mal", "enfermo", "enfermedad", "dolor", "fiebre", "malestar", "tengo", "presento"
    ];

    if (sintomasKeywords.some(k => promptLower.includes(k))) {
      // 1. Consulta enfermedades con síntomas y pesos
      const enfermedades = await prisma.enfermedades.findMany({
        orderBy: { nombre: "asc" },
        include: {
          sintomas_rel: {
            include: {
              sintoma: true
            },
            orderBy: { peso: "desc" }
          }
        }
      });

      // 2. Formatea la información
      const enfermedadesArr = enfermedades.map(enf => {
        const sintomasArr = enf.sintomas_rel.map(rel => 
          `  - Síntoma: ${rel.sintoma.nombre} (peso: ${rel.peso})`
        ).join("\n");
        return `=== Enfermedad: ${enf.nombre} ===
Descripción: ${enf.descripcion || "N/D"}
Signos de alarma: ${enf.signos_alarma || "N/D"}
Nivel de riesgo: ${enf.nivel_riesgo || "N/D"}
Síntomas asociados:
${sintomasArr || "  - N/D"}
`;
      });

      extraInfo += `
Información actual de enfermedades y síntomas en la base de datos:
${enfermedadesArr.length ? enfermedadesArr.join("\n") : "No hay enfermedades registradas."}

Utiliza estos datos para responder si el usuario menciona síntomas, enfermedades o malestares.
      `;
    }


    // Palabras clave para hospitales, centros y puestos de salud
    const puestosKeywords = [
      "hospital", "hospitales", "hospital público", "hospital privado", "hospital general", "hospital nacional",
      "centro de salud", "centros de salud", "centro salud", "centros salud",
      "puesto de salud", "puestos de salud", "puesto salud", "puestos salud"
    ];
    if (puestosKeywords.some(k => promptLower.includes(k))) {
      // 1. Consulta departamentos → municipios → puestos_salud
      const departamentos = await prisma.departamentos.findMany({
        orderBy: { nombre: "asc" },
        include: {
          municipios: {
            orderBy: { nombre: "asc" },
            include: {
              puestos: {
                orderBy: { nombre: "asc" },
                select: {
                  nombre: true,
                  tipo: true,
                  direccion: true,
                  telefono: true,
                  lat: true,
                  lng: true,
                  municipio: {
                    select: { nombre: true }
                  }
                }
              }
            }
          }
        }
      });

      // Si se recibió el nombre del departamento, filtra solo ese
      let departamentosFiltrados = departamentos;
      if (departamento) {
        const depNorm = departamento.trim().toLowerCase();
        departamentosFiltrados = departamentos.filter(dep =>
          dep.nombre.trim().toLowerCase() === depNorm
        );
      }

      const departamentosArr = departamentosFiltrados.map(dep => {
        const municipiosArr = dep.municipios.map(mun => {
          const puestosArr = mun.puestos.map(puesto => {
            return `  - ${puesto.tipo ? puesto.tipo.charAt(0).toUpperCase() + puesto.tipo.slice(1) : "Unidad"}: ${puesto.nombre}
    Dirección: ${puesto.direccion || "N/D"}
    Teléfono: ${puesto.telefono || "N/D"}
    Municipio: ${puesto.municipio?.nombre || mun.nombre}
    Lat: ${puesto.lat ?? "N/D"}
    Lng: ${puesto.lng ?? "N/D"}`;
          }).filter(Boolean);
          return puestosArr.length
            ? `• Municipio: ${mun.nombre}\n${puestosArr.join("\n")}`
            : null;
        }).filter(Boolean);
        return municipiosArr.length
          ? `=== Departamento: ${dep.nombre} ===\n${municipiosArr.join("\n\n")}`
          : null;
      }).filter(Boolean);

      extraInfo += `
Información actual de hospitales, centros y puestos de salud en Nicaragua:
${departamentosArr.length ? departamentosArr.join("\n\n") : "No hay unidades registradas."}

Utiliza estos datos para responder si el usuario pregunta por hospitales, centros o puestos de salud.
  `;
    }

    // Palabras clave para jornadas/eventos de salud
    const jornadasKeywords = [
      "jornada de salud", "evento de salud", "vacunación", "vacunacion", "charla", "feria de salud", "actividad de salud", "campaña de salud", "evento médico", "evento medico", "jornadas", "eventos", "vacunas", "taller de salud"
    ];

    if (jornadasKeywords.some(k => promptLower.includes(k))) {
      // 1. Consulta departamentos → municipios → jornadas_salud → jornadas_servicios → servicios_salud
      const departamentos = await prisma.departamentos.findMany({
        orderBy: { nombre: "asc" },
        include: {
          municipios: {
            orderBy: { nombre: "asc" },
            include: {
              jornadas: {
                orderBy: { fecha: "desc" },
                include: {
                  servicios: {
                    include: {
                      servicio: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      // 2. Formatea la información agrupada
      const departamentosArr = departamentos.map(dep => {
        const municipiosArr = dep.municipios.map(mun => {
          const jornadasArr = mun.jornadas.map(jornada => {
            const serviciosArr = jornada.servicios.map(js =>
              `      - Servicio: ${js.servicio?.nombre || "N/D"}${js.servicio?.descripcion ? " (" + js.servicio.descripcion + ")" : ""}`
            ).join("\n");
            return `    • Jornada: ${jornada.titulo}
      Descripción: ${jornada.descripcion || "N/D"}
      Tipo: ${jornada.tipo || "N/D"}
      Fecha: ${jornada.fecha ? jornada.fecha.toISOString().slice(0,10) : "N/D"}
      Hora inicio: ${jornada.hora_inicio || "N/D"}
      Hora fin: ${jornada.hora_fin || "N/D"}
      Lugar: ${jornada.lugar || "N/D"}
      Servicios asociados:
${serviciosArr || "      - N/D"}`;
          }).filter(Boolean);
          return jornadasArr.length
            ? `  ◦ Municipio: ${mun.nombre}\n${jornadasArr.join("\n\n")}`
            : null;
        }).filter(Boolean);
        return municipiosArr.length
          ? `=== Departamento: ${dep.nombre} ===\n${municipiosArr.join("\n\n")}`
          : null;
      }).filter(Boolean);

      extraInfo += `
Información actual de jornadas/eventos de salud en Nicaragua:
${departamentosArr.length ? departamentosArr.join("\n\n") : "No hay jornadas de salud registradas."}

Utiliza estos datos para responder si el usuario pregunta por jornadas, eventos, vacunación, charlas o actividades de salud.
      `;
    }

    // 3. Enviar el prompt modificado a la IA
    const aiResponse = await askAI(extraInfo ? `${extraInfo}\n\nPregunta del usuario: ${prompt}` : prompt);
    res.json({ response: aiResponse });

  } catch (e) {
    console.error("Error en el endpoint /api/chat:", e);
    res.status(500).json({ error: "Error al procesar la solicitud del chat." });
  }
});


// --- Jornadas de Salud ---

// Listar jornadas (ordenadas por fecha descendente)
app.get("/api/jornadas", async (req, res) => {
  try {
    const jornadas = await prisma.jornadas_salud.findMany({
      orderBy: { fecha: "desc" },
      include: { municipio: { include: { departamento: true } } },
    });
    res.json(jornadas);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error listando jornadas de salud" });
  }
});

// Crear jornada
app.post("/api/jornadas", async (req, res) => {
  try {
    const { titulo, descripcion, tipo, fecha, hora_inicio, hora_fin, municipio_id, lugar, lat, lng, geom, created_at } = req.body;
    if (!titulo || !fecha || !hora_inicio || !hora_fin || !municipio_id) {
      return res.status(400).json({ error: "Faltan campos requeridos: titulo, fecha, hora_inicio, hora_fin y municipio_id" });
    }

    // Verificar existencia del municipio
    const muni = await prisma.municipios.findUnique({ where: { id: municipio_id } });
    if (!muni) {
      return res.status(400).json({ error: "El municipio proporcionado no existe" });
    }

    const jornada = await prisma.jornadas_salud.create({
      data: {
        titulo,
        descripcion,
        tipo,
        fecha: new Date(fecha),
        hora_inicio,
        hora_fin,
        municipio_id,
        lugar,
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
        geom,
        created_at: created_at ? new Date(created_at) : undefined,
      },
    });
    res.status(201).json(jornada);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error creando jornada de salud" });
  }
});

// Actualizar jornada
app.put("/api/jornadas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, tipo, fecha, hora_inicio, hora_fin, municipio_id, lugar, lat, lng, geom } = req.body;

    // Opcional: validar que el municipio exista si se suministra
    if (municipio_id) {
      const muni = await prisma.municipios.findUnique({ where: { id: municipio_id } });
      if (!muni) {
        return res.status(400).json({ error: "El municipio proporcionado no existe" });
      }
    }

    const jornada = await prisma.jornadas_salud.update({
      where: { id },
      data: {
        titulo,
        descripcion,
        tipo,
        fecha: fecha ? new Date(fecha) : undefined,
        hora_inicio,
        hora_fin,
        municipio_id,
        lugar,
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
        geom,
      },
    });
    res.json(jornada);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error actualizando jornada de salud" });
  }
});

// Eliminar jornada
app.delete("/api/jornadas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.jornadas_salud.delete({ where: { id } });
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error eliminando jornada de salud" });
  }
});

// --- Servicios de Salud ---

// Listar servicios (ordenados alfabéticamente)
app.get("/api/servicios", async (req, res) => {
  try {
    const servicios = await prisma.servicios_salud.findMany({
      orderBy: { nombre: "asc" },
    });
    res.json(servicios);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error listando servicios de salud" });
  }
});

// Crear servicio
app.post("/api/servicios", async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }
    const servicio = await prisma.servicios_salud.create({
      data: {
        nombre,
        descripcion,
      },
    });
    res.status(201).json(servicio);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error creando servicio de salud" });
  }
});

// Actualizar servicio
app.put("/api/servicios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    const servicio = await prisma.servicios_salud.update({
      where: { id },
      data: {
        nombre,
        descripcion,
      },
    });
    res.json(servicio);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error actualizando servicio de salud" });
  }
});

// Eliminar servicio
app.delete("/api/servicios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.servicios_salud.delete({ where: { id } });
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error eliminando servicio de salud" });
  }
});

// --- Opcional: Gestión de la relación Jornadas - Servicios ---
// Este endpoint permite asociar un servicio a una jornada existente
app.post("/api/jornadas/:jornadaId/servicios", async (req, res) => {
  try {
    const { jornadaId } = req.params;
    const { servicio_id } = req.body;
    if (!servicio_id) {
      return res.status(400).json({ error: "El servicio_id es obligatorio" });
    }

    // Verificar que la jornada y el servicio existan
    const jornada = await prisma.jornadas_salud.findUnique({ where: { id: jornadaId } });
    const servicio = await prisma.servicios_salud.findUnique({ where: { id: servicio_id } });
    if (!jornada || !servicio) {
      return res.status(400).json({ error: "La jornada o el servicio no existen" });
    }

    // Crear la relación en la tabla pivot
    const relacion = await prisma.jornadas_servicios.create({
      data: {
        jornada_id: jornadaId,
        servicio_id,
      },
    });
    res.status(201).json(relacion);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error asociando servicio a la jornada" });
  }
});

// Carrusel de temas
app.get('/api/temas', async (_, res) => {
  const { data, error } = await supabaseAdmin
    .from('v_temas_con_portada')
    .select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Artículos por tema
app.get('/api/articulos', async (req, res) => {
  const { tema, limit = 10 } = req.query;
  let q = supabaseAdmin.from('v_articulos_recientes').select('*').limit(+limit);
  if (tema) q = q.eq('tema', tema);
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Tip del día
app.get('/api/tips', async (req, res) => {
  const { limit = 1 } = req.query;
  const { data, error } = await supabaseAdmin
    .from('v_tips').select('*').limit(+limit);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// --------------------
// 🚀 Levantar servidor
// --------------------
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
