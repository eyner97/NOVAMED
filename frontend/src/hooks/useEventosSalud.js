import { useEffect, useState } from "react";
import { getJornadas } from "../services/api";

/**
 * Hook para obtener jornadas de salud (eventos), con soporte offline (localStorage).
 * Devuelve un array de jornadas con toda la información relevante.
 */
const STORAGE_KEY = "novamed.events";

export function useEventosSalud() {
  const [eventos, setEventos] = useState([]);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    async function fetchJornadas() {
      try {
        let data = [];
        if (navigator.onLine) {
          data = await getJornadas();
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } else {
          const cached = localStorage.getItem(STORAGE_KEY);
          data = cached ? JSON.parse(cached) : [];
        }
        setEventos(Array.isArray(data) ? data : []);
      } catch {
        const cached = localStorage.getItem(STORAGE_KEY);
        setEventos(cached ? JSON.parse(cached) : []);
      }
    }
    fetchJornadas();

    const goOn = () => setOnline(true);
    const goOff = () => setOnline(false);
    window.addEventListener("online", goOn);
    window.addEventListener("offline", goOff);
    return () => {
      window.removeEventListener("online", goOn);
      window.removeEventListener("offline", goOff);
    };
  }, [online]);

  return eventos;
}