// frontend/src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Ya existente
export async function getRutasClinicas() {
  const res = await fetch(`${API_URL}/api/rutas`);
  if (!res.ok) throw new Error("Error en /api/rutas");
  return res.json();
}

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
    departamentoId: m.departamentoId ?? m.departamento_id,
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

// ============================
// ENDPOINTS NUEVOS PARA FRONTEND
// ============================

// --- Jornadas de Salud ---
export async function getJornadas() {
  const res = await fetch(`${API_URL}/api/jornadas`);
  if (!res.ok) throw new Error("Error en /api/jornadas");
  return res.json();
}

export async function createJornada(jornadaData) {
  const res = await fetch(`${API_URL}/api/jornadas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(jornadaData),
  });
  if (!res.ok) throw new Error("Error creando jornada de salud");
  return res.json();
}

export async function updateJornada(id, jornadaData) {
  const res = await fetch(`${API_URL}/api/jornadas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(jornadaData),
  });
  if (!res.ok) throw new Error("Error actualizando jornada de salud");
  return res.json();
}

export async function deleteJornada(id) {
  const res = await fetch(`${API_URL}/api/jornadas/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error eliminando jornada de salud");
  return res;
}

// --- Servicios de Salud ---
export async function getServicios() {
  const res = await fetch(`${API_URL}/api/servicios`);
  if (!res.ok) throw new Error("Error en /api/servicios");
  return res.json();
}

export async function createServicio(servicioData) {
  const res = await fetch(`${API_URL}/api/servicios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(servicioData),
  });
  if (!res.ok) throw new Error("Error creando servicio de salud");
  return res.json();
}

export async function updateServicio(id, servicioData) {
  const res = await fetch(`${API_URL}/api/servicios/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(servicioData),
  });
  if (!res.ok) throw new Error("Error actualizando servicio de salud");
  return res.json();
}

export async function deleteServicio(id) {
  const res = await fetch(`${API_URL}/api/servicios/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error eliminando servicio de salud");
  return res;
}

// --- Asociación: Jornadas - Servicios ---
export async function associateServicioToJornada(jornadaId, servicioId) {
  const res = await fetch(`${API_URL}/api/jornadas/${jornadaId}/servicios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ servicio_id: servicioId }),
  });
  if (!res.ok) throw new Error("Error asociando servicio a la jornada");
  return res.json();
}

// --- Chat con IA ---
export async function askChat(prompt, departamento) {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, departamento }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Error al comunicarse con el asistente de IA");
  }

  return res.json();
}

// --- Nuevos endpoints sugeridos ---
export async function getTemas() {
  const res = await fetch(`${API_URL}/api/temas`);
  return res.json();
}
export async function getArticulos() {
  const res = await fetch(`${API_URL}/api/articulos`);
  return res.json();
}
export async function getTips() {
  const res = await fetch(`${API_URL}/api/tips`);
  return res.json();
}

// --- Autenticación ---
export async function registerPhone(nombre, telefono, password) {
  const res = await fetch(`${API_URL}/api/auth/register-phone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, telefono, password }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Error registrando");
  return res.json();
}

export async function loginPhone(telefono, password) {
  const res = await fetch(`${API_URL}/api/auth/login-phone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telefono, password }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Error iniciando sesión");
  return res.json();
}
