import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

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
    const rutas = await prisma.rutaClinica.findMany({
      orderBy: { updatedAt: "desc" },
    });
    res.json(rutas);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error listando rutas" });
  }
});

// Crear ruta
app.post("/api/rutas", async (req, res) => {
  try {
    const { id, nombre, descripcion, latitud, longitud } = req.body;
    const ruta = await prisma.rutaClinica.create({
      data: {
        id: id || crypto.randomUUID(),
        nombre,
        descripcion,
        latitud: Number(latitud),
        longitud: Number(longitud),
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
    const { nombre, descripcion, latitud, longitud } = req.body;
    const ruta = await prisma.rutaClinica.update({
      where: { id },
      data: {
        nombre,
        descripcion,
        latitud: Number(latitud),
        longitud: Number(longitud),
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
    await prisma.rutaClinica.delete({ where: { id } });
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
    const departamentos = await prisma.Departamento.findMany({
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
    const departamentos = await prisma.Departamento.findMany({
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
    const municipios = await prisma.Municipio.findMany({
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
    const municipios = await prisma.Municipio.findMany({
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
    const clinicas = await prisma.clinicaMovil.findMany({
      orderBy: { createdAt: "desc" },
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
    const puestos = await prisma.puestoSalud.findMany({
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
    const puestos = await prisma.puestoSalud.findMany({
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
    const rutas = await prisma.rutaClinica.findMany({
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

// --------------------
// 🚀 Levantar servidor
// --------------------
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
