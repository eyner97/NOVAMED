// frontend/src/hooks/useRutasClinicas.js
import { useEffect, useState } from "react";
import { getRutasClinicas, getPuestosSalud } from "../services/api";

/**
 * Devuelve una lista PLANA de ubicaciones normalizadas para el mapa.
 * - De rutas_clinicas: tipo = "clinica"
 * - De puestos_salud: tipo = row.tipo (ej. "centro", "hospital", "puesto")
 * Sin IndexedDB: el modo offline lo maneja tu Service Worker con SWR.
 */
export function useRutasClinicas() {
  const [rutas, setRutas] = useState([]);
  const [online, setOnline] = useState(navigator.onLine);

  // 🔹 Normaliza strings de tipo a valores esperados por la UI ("clinica", "centro", "hospital", "puesto")
  const normalizeTipo = (raw) => {
    const t = (raw || "").toString().trim().toLowerCase();
    if (!t) return "";
    if (t === "clinica" || t === "clínica" || t === "clinica_movil" || t === "clínica_móvil") return "clinica";
    if (t.includes("hospital")) return "hospital";
    if (t.includes("centro")) return "centro";
    if (t.includes("puesto")) return "puesto";
    return t; // fallback
  };

  useEffect(() => {
    const cargar = async () => {
      try {
        // 👇 allSettled para no perder todo si un endpoint falla
        const [rcRes, psRes] = await Promise.allSettled([
          getRutasClinicas(), // puntos de rutas_clinicas (clínicas móviles en ruta)
          getPuestosSalud(),  // centros/hospitales/puestos con lat/lng
        ]);

        const rutasApi = rcRes.status === "fulfilled" ? rcRes.value : [];
        const puestos  = psRes.status === "fulfilled" ? psRes.value : [];

        // Rutas clíncias → tipo fijo "clinica"
        const normRutas = (Array.isArray(rutasApi) ? rutasApi : [])
          .filter(r => r?.latitud != null && r?.longitud != null)
          .map(r => ({
            id: `rc_${r.id}`,
            nombre: r.nombre ?? r.puntoEncuentro ?? "Ruta clínica",
            descripcion: r.descripcion ?? null,
            latitud: Number(r.latitud),
            longitud: Number(r.longitud),
            tipo: "clinica",
            fuente: "rutas_clinicas",
            municipio_id: r.municipio_id ?? r.municipioId ?? null, // <-- AÑADE ESTO
          }));

        // Puestos salud → tipo normalizado (centro/hospital/puesto)
        const normPuestos = (Array.isArray(puestos) ? puestos : [])
          .filter(p => p?.latitud != null && p?.longitud != null)
          .map(p => ({
            id: `ps_${p.id}`,
            nombre: p.nombre,
            descripcion: p.direccion ?? p.telefono ?? null,
            latitud: Number(p.latitud),
            longitud: Number(p.longitud),
            tipo: normalizeTipo(p.tipo), // "centro", "hospital", "puesto", etc.
            fuente: "puestos_salud",
            municipio_id: p.municipio_id ?? p.municipioId ?? null, // <-- AÑADE ESTO
          }));

        // Mezcla + desduplicación
        const all = [...normRutas, ...normPuestos];
        const uniq = Array.from(new Map(all.map(x => [x.id, x])).values());

        setRutas(uniq);
      } catch {
        setRutas([]);
      }
    };

    cargar();

    const goOn = () => setOnline(true);
    const goOff = () => setOnline(false);
    window.addEventListener("online", goOn);
    window.addEventListener("offline", goOff);
    return () => {
      window.removeEventListener("online", goOn);
      window.removeEventListener("offline", goOff);
    };
  }, [online]);

  return rutas;
}
