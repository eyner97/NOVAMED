// src/pages/Mapa.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, LayersControl, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useRutasClinicas } from "../hooks/useRutasClinicas";
import { getDepartamentos, getMunicipios } from "../services/api";
import "../styles/Mapa.css";

const { BaseLayer } = LayersControl;

// 🟢 ÍCONOS ESPECÍFICOS POR TIPO (para los marcadores del mapa)
const iconClinica = L.icon({
  iconUrl: "/icons/icon_clinic.png",
  iconSize: [45, 45],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const iconCentro = L.icon({
  iconUrl: "/icons/icon_centro_salud.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
});

const iconHospital = L.icon({
  iconUrl: "/icons/icon_hospital.png",
  iconSize: [45, 45],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const iconUser = L.icon({
  iconUrl: "/icons/user-pin-white.png",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// 🔹 Helper: devuelve el ícono según el tipo ya normalizado en tu hook
function getIcon(tipo) {
  if (tipo === "clinica") return iconClinica;
  if (tipo === "centro") return iconCentro;
  if (tipo === "hospital") return iconHospital;
  return iconCentro; // fallback
}

// 🔹 SVGs compactos para paneles (contraste por currentColor)
function SvgForTipo({ tipo }) {
  if (tipo === "clinica") {
    // Camioncito (clínica móvil)
    return (
      <svg viewBox="0 0 24 24" className="mini" aria-hidden="true">
        <path d="M3 6h11v8H3zM14 9h3l3 3v2h-6V9z" fill="currentColor"/>
        <circle cx="7" cy="16" r="2" fill="currentColor"/>
        <circle cx="16" cy="16" r="2" fill="currentColor"/>
        <path d="M7 10h2v-2h2v2h2v2h-2v2h-2v-2H7z" fill="#fff"/>
      </svg>
    );
  }
  if (tipo === "hospital") {
    // Cruz (hospital)
    return (
      <svg viewBox="0 0 24 24" className="mini" aria-hidden="true">
        <path d="M10 3h4v6h6v4h-6v6h-4v-6H4V9h6z" fill="currentColor"/>
      </svg>
    );
  }
  // Edificio (centro de salud u otros)
  return (
    <svg viewBox="0 0 24 24" className="mini" aria-hidden="true">
      <path d="M3 10h18v2H3v-2zm2-6h14v4H5V4zm0 10h14v6H5v-6z" fill="currentColor"/>
    </svg>
  );
}

// Aproximación a los límites de Nicaragua (para abarcar el país al cargar)
const NIC_BOUNDS = L.latLngBounds(
  L.latLng(10.7, -87.9), // Suroeste (aprox)
  L.latLng(15.1, -82.5)  // Noreste (aprox)
);

function FlyToUser({ userPos }) {
  const map = useMap();
  useEffect(() => {
    if (userPos) {
      map.flyTo(userPos, 15, { duration: 0.8 });
    }
  }, [userPos, map]);
  return null;
}

function FitBoundsToCiudad({ ciudad, rutas }) {
  const map = useMap();
  useEffect(() => {
    if (!ciudad) return;
    const candidates = rutas.filter(
      (u) => String(u.municipio_id) === String(ciudad)
    );
    if (candidates.length) {
      const bounds = L.latLngBounds(
        candidates.map((u) => [Number(u.latitud), Number(u.longitud)])
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [ciudad, rutas, map]);
  return null;
}

export default function Mapa() {
  const rutas = useRutasClinicas(); // consume API/backend
  const [selected, setSelected] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]); // [[lat,lng], ...] de OSRM
  const [routeKm, setRouteKm] = useState(null);
  const [toast, setToast] = useState(null);

  // --- búsqueda por nombre ---
  const [search, setSearch] = useState("");

  // filtro por tipo
  const [tipoFiltro, setTipoFiltro] = useState("todos"); // "todos" | "clinicas" | "centro" | "hospital"

  // Estado para modal Dep/Municipio
  const [showGeoModal, setShowGeoModal] = useState(false);
  const [dep, setDep] = useState("");     // nombre de departamento seleccionado
  const [ciudad, setCiudad] = useState(""); // aquí guardarás el municipio_id
  const [ciudadFiltrada, setCiudadFiltrada] = useState(""); // aquí también el municipio_id

  // catálogos desde BD
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [muniFiltrados, setMuniFiltrados] = useState([]);

  // 🆕 Centro de referencia actual (última acción de enfoque: buscar/Ir)
  const [focusCenter, setFocusCenter] = useState(null);

  // --- toggle ubicación + notificación ---
  const [locEnabled, setLocEnabled] = useState(false);

  const requestLocation = async () => {
    if (!("geolocation" in navigator)) {
      setToast("Geolocalización no soportada en este dispositivo.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(loc);
        setToast("Ubicación activada.");
        setLocEnabled(true);
      },
      () => {
        setToast("Permiso denegado o error de geolocalización.");
        setLocEnabled(false);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );
  };

  const toggleLocation = () => {
    if (locEnabled) {
      setLocEnabled(false);
      setUserPos(null);
      setRouteCoords([]);
      setRouteKm(null);
      setToast("Ubicación desactivada.");
    } else {
      requestLocation();
    }
  };

  // --- Routing real por calles con OSRM ---
  const fetchOSRMRoute = async (fromLatLng, toLatLng) => {
    try {
      const [fromLat, fromLng] = fromLatLng;
      const [toLat, toLng] = toLatLng;
      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.routes || !data.routes[0]) throw new Error("Sin rutas");
      const geom = data.routes[0].geometry.coordinates; // [lng,lat]
      const meters = data.routes[0].distance;
      const latlngs = geom.map(([lng, lat]) => [lat, lng]);
      setRouteCoords(latlngs);
      setRouteKm((meters / 1000).toFixed(2));
    } catch {
      setToast("No se pudo calcular la ruta (OSRM).");
      setRouteCoords([]);
      setRouteKm(null);
    }
  };

  const calcularRuta = (destino) => {
    if (!userPos) {
      setToast("Activa tu ubicación primero.");
      return;
    }
    const to = [destino.latitud, destino.longitud];
    setSelected(destino);
    fetchOSRMRoute(userPos, to);
  };

  // cargar catálogos una vez
  useEffect(() => {
    (async () => {
      const [depsRes, munisRes] = await Promise.allSettled([getDepartamentos(), getMunicipios()]);
      const dList = depsRes.status === "fulfilled" && Array.isArray(depsRes.value) ? depsRes.value : [];
      const mRaw  = munisRes.status === "fulfilled" && Array.isArray(munisRes.value) ? munisRes.value : [];
      const mList = mRaw.map((m) => ({
        ...m,
        departamentoId: m.departamentoId ?? m.departamento_id ?? m.departamentoid ?? null,
      }));
      setDepartamentos(dList);
      setMunicipios(mList);
      if (dList.length) {
        setDep(dList[0].nombre);
        const byDep = mList.filter((m) => m.departamentoId === dList[0].id);
        setMuniFiltrados(byDep);
        if (byDep.length) setCiudad(byDep[0].nombre);
      }
    })().catch(() => {
      setDepartamentos([]); setMunicipios([]); setMuniFiltrados([]);
    });
  }, []);

  // sincroniza combo municipios según el departamento elegido
  useEffect(() => {
    if (!dep || !departamentos.length) {
      setMuniFiltrados([]);
      return;
    }
    const d = departamentos.find((x) => x.nombre === dep);
    const list = d ? municipios.filter((m) => m.departamentoId === d.id) : [];
    setMuniFiltrados(list);
    // No cambies ciudad aquí
  }, [dep, departamentos, municipios]);

  // --- Guía de uso ---
  const [showHelp, setShowHelp] = useState(false);

  // controlar mapa y encuadre inicial NIC
  const mapRef = useRef(null);
  const whenCreated = (map) => {
    mapRef.current = map;
    // Abarcar Nicaragua al cargar
    map.fitBounds(NIC_BOUNDS, { padding: [20, 20] });
    window.addEventListener("map-center", (e) => {
      const c = e.detail || [12.136389, -86.251389];
      map.flyTo(c, 13, { duration: 0.8 });
    });
  };

  // 🔎 Filtrado por tipo y búsqueda (igual que tenías)
  const filtradosBase = useMemo(() => {
    const base = rutas.filter((r) =>
      r.nombre?.toLowerCase().includes(search.toLowerCase())
    );
    if (tipoFiltro === "todos") return base;
    if (tipoFiltro === "clinicas") return base.filter((r) => r.tipo === "clinica");
    return base.filter((r) => r.tipo === tipoFiltro); // "centro" | "hospital"
  }, [rutas, search, tipoFiltro]);

  // 🆕 Si hay ciudad elegida, intenta priorizar marcadores que contengan el nombre de esa ciudad.
  const filtrados = useMemo(() => {
    if (!ciudadFiltrada) return filtradosBase;

    // Encuentra los markers del municipio seleccionado
    const municipioMarkers = filtradosBase.filter(
      (u) => String(u.municipio_id) === String(ciudadFiltrada)
    );

    // Si no hay markers en el municipio, muestra todos (o puedes retornar [])
    if (!municipioMarkers.length) return filtradosBase;

    // Calcula el centroide del municipio
    const centroidOfMarkers = (markers) => {
      if (!markers.length) return [0, 0];
      const lat = markers.reduce((sum, m) => sum + Number(m.latitud), 0) / markers.length;
      const lng = markers.reduce((sum, m) => sum + Number(m.longitud), 0) / markers.length;
      return [lat, lng];
    };

    const [clat, clng] = centroidOfMarkers(municipioMarkers);

    // Filtra los markers a 100km o menos del centroide
    return filtradosBase.filter(
      (u) =>
        haversineKm(clat, clng, Number(u.latitud), Number(u.longitud)) <= 100
    );
  }, [filtradosBase, ciudadFiltrada]);

  // 🧭 “Ir” en el modal: enfoca al centroide de los marcadores candidatos de esa ciudad
  const centroidOfMarkers = (points) => {
    if (!points || !points.length) return [12.136389, -86.251389];
    const sum = points.reduce(
      (acc, p) => [acc[0] + Number(p.latitud), acc[1] + Number(p.longitud)],
      [0, 0]
    );
    return [sum[0] / points.length, sum[1] / points.length];
  };

  const goToCiudad = () => {
    setCiudadFiltrada(ciudad); // ciudad es el municipio_id seleccionado
    setShowGeoModal(false);
  };

  // permitir Enter dentro del modal para ejecutar “Ir”
  const onGeoModalKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      goToCiudad();
    }
  };

  // 🆕 Ordena panel izquierdo por cercanía al focusCenter (si existe)
  const leftList = useMemo(() => {
    if (!focusCenter) return filtrados; // comportamiento original
    const [clat, clng] = focusCenter;
    const withDist = filtrados.map(u => ({
      ...u,
      _d: Math.hypot(Number(u.latitud) - clat, Number(u.longitud) - clng)
    }));
    return withDist.sort((a, b) => a._d - b._d);
  }, [filtrados, focusCenter]);

  // ✅ BÚSQUEDA por nombre (botón y Enter): ahora busca en TODO el dataset
  const onBuscarClick = () => {
    const key = search.trim().toLowerCase();
    if (!key) {
      setToast("Escribe un nombre para buscar.");
      return;
    }
    // busca en todas las rutas, no solo en los filtrados por tipo/ciudad
    const allMatches = rutas.filter(r => r.nombre?.toLowerCase().includes(key));
    const item = allMatches[0] || filtrados[0];
    if (item && mapRef.current) {
      const center = [Number(item.latitud), Number(item.longitud)];
      mapRef.current.flyTo(center, 15, { duration: 0.6 });
      setSelected(item);
      setFocusCenter(center);
    } else {
      setToast("Sin resultados para la búsqueda.");
    }
  };
  const onSearchKey = (e) => {
    if (e.key === "Enter") onBuscarClick();
  };

  return (
    <div className="mapa-page">
      {/* Barra superior */}
      <header className="mapa-header">
        {/* Home: ícono blanco */}
        <button className="icon-btn home-btn" onClick={() => (window.location.href = "/")} aria-label="Inicio">
          <svg viewBox="0 0 24 24" className="icon white">
            <path d="M12 3l8 6v10a1 1 0 0 1-1 1h-5v-6h-6v6H5a1 1 0 0 1-1-1V9l8-6z" fill="currentColor"/>
          </svg>
        </button>

        {/* Buscador */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Buscar unidad"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={onSearchKey}
          />
          <button aria-label="Buscar" onClick={onBuscarClick}>
            <svg viewBox="0 0 24 24" className="icon">
              <path d="M15.5 14h-.79l-.28-.27a6.471 6.471 0 001.57-4.23C16 6.01 13.99 4 11.5 4S7 6.01 7 8.5 9.01 13 11.5 13c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l4.25 4.25 1.49-1.49L15.5 14zM11.5 11C10.12 11 9 9.88 9 8.5S10.12 6 11.5 6 14 7.12 14 8.5 12.88 11 11.5 11z" fill="currentColor"/>
            </svg>
          </button>
        </div>

        {/* Acciones: toggle + ubicación+lupa + ayuda */}
        <div className="actions">
          {/* Toggle switch */}
          <label className="switch" title="Mostrar ubicación">
            <input type="checkbox" checked={locEnabled} onChange={toggleLocation} />
            <span className="slider"></span>
            <span className="switch-text">Mostrar ubicación</span>
          </label>

          {/* Ubicación + lupa (abre modal glass) */}
          <button className="icon-btn" onClick={() => setShowGeoModal(true)} aria-label="Buscar por departamento y ciudad">
            <svg viewBox="0 0 24 24" className="icon white">
              <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7zm0 9a2 2 0 110-4 2 2 0 010 4z" fill="currentColor"/>
              <path d="M15.5 14h-.8l-.3-.3a6 6 0 10-1.6 1.6l.3.3v.8l4.3 4.3 1.5-1.5-4.3-4.3z" fill="currentColor" opacity="0.9"/>
            </svg>
          </button>

          {/* Ayuda */}
          <button className="icon-btn" onClick={() => setShowHelp(true)} aria-label="Cómo usar">
            <svg viewBox="0 0 24 24" className="icon white">
              <path d="M11 18h2v2h-2v-2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.88 15h-1.75v-1.5h1.75V17zm2.62-6.26l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1 .45-1.9 1.17-2.63l1.24-1.26A2 2 0 1011 8H9a4 4 0 118 0c0 1.1-.45 2.1-1.5 2.74z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Filtros fuera de la franja azul */}
      <div className="filters">
        <button className={tipoFiltro === "todos" ? "active" : ""} onClick={() => setTipoFiltro("todos")}>Todos</button>
        <button className={tipoFiltro === "clinicas" ? "active" : ""} onClick={() => setTipoFiltro("clinicas")}>Clínicas móviles</button>
        <button className={tipoFiltro === "centro" ? "active" : ""} onClick={() => setTipoFiltro("centro")}>Centros de salud</button>
        <button className={tipoFiltro === "hospital" ? "active" : ""} onClick={() => setTipoFiltro("hospital")}>Hospitales</button>
      </div>

      <main className="mapa-main">
        {/* Panel izquierdo: ahora con scroll oculto hasta hover */}
        <aside className="sidebar-left scrollable hide-scroll-until-hover">
          <h3>Unidad más cercana</h3>
          {leftList.map((u) => (
            <div key={u.id} className="unidad-card">
              <div className="unidad-title">
                {/* SVG dinámico por tipo (contrasta con el fondo) */}
                <SvgForTipo tipo={u.tipo} />
                <h4>{u.nombre}</h4>
              </div>
              <p className="unidad-dist">
                {focusCenter
                  ? `${Math.max(0.1, Math.hypot(u.latitud - focusCenter[0], u.longitud - focusCenter[1]).toFixed(2))}°`
                  : `${Math.floor(Math.random() * 4) + 1} km`}
              </p>
              <button className="ruta-btn" onClick={() => calcularRuta(u)}>Ver ruta</button>
            </div>
          ))}
        </aside>

        {/* Mapa */}
        <section className="map-container">
          <MapContainer
            center={[12.865, -85.207]}
            zoom={7}
            className="leaflet-map"
            whenCreated={whenCreated}
          >
            {userPos && <FlyToUser userPos={userPos} />}
            {/* Solo hace zoom si hay ciudadFiltrada */}
            {ciudadFiltrada && <FitBoundsToCiudad ciudad={ciudadFiltrada} rutas={rutas} />}
            <LayersControl position="topright">
              <BaseLayer checked name="Mapa base">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              </BaseLayer>
              <BaseLayer name="Satélite">
                <TileLayer
                  url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenTopoMap"
                />
              </BaseLayer>
            </LayersControl>

            {filtrados.map((u) => (
              <Marker
                key={u.id}
                position={[u.latitud, u.longitud]}
                icon={getIcon(u.tipo)}
                eventHandlers={{ click: () => setSelected(u) }}
              >
                <Popup>{u.nombre}</Popup>
              </Marker>
            ))}

            {userPos && (
              <Marker position={userPos} icon={iconUser}>
                <Popup>Tu ubicación</Popup>
              </Marker>
            )}

            {routeCoords.length > 1 && (
              <Polyline positions={routeCoords} pathOptions={{ color: "#2b5dbd", weight: 5 }} />
            )}

            <FlyToUser userPos={userPos} />
          </MapContainer>
        </section>

        {/* Panel derecho */}
        <aside className="sidebar-right">
          {selected ? (
            <>
              <div className="card-right">
                <div className="card-icon">
                  {/* SVG dinámico por tipo (usa currentColor para seguir la paleta) */}
                  <SvgForTipo tipo={selected.tipo} />
                </div>
                <h3>{selected.nombre}</h3>
                <p>{selected.descripcion}</p>
                <p>📍 {selected.latitud}, {selected.longitud}</p>
                <p>📞 012 345 678</p>
                <p>🕑 24/7</p>
                <button className="ruta-btn big" onClick={() => calcularRuta(selected)}>
                  Cómo llegar
                </button>
                {routeKm && (
                  <div className="distancia">Distancia: {routeKm} km</div>
                )}
              </div>
            </>
          ) : (
            <div className="card-right"><p>Selecciona una unidad en el mapa</p></div>
          )}
        </aside>
      </main>

      {/* Toast notificaciones */}
      {toast && (
        <div className="toast" onAnimationEnd={() => setToast(null)}>
          {toast}
        </div>
      )}

      {/* Modal Glass: Departamento / Municipio (desde BD) */}
      {showGeoModal && (
        <div className="modal-overlay" onClick={() => setShowGeoModal(false)}>
          <div className="modal-glass" onClick={(e)=>e.stopPropagation()} onKeyDown={onGeoModalKey} tabIndex={0}>
            <h4>Buscar por ubicación</h4>

            <label>Departamento</label>
            <select
              value={dep}
              onChange={(e)=>setDep(e.target.value)}
            >
              {departamentos.length
                ? departamentos.map((d) => <option key={d.id} value={d.nombre}>{d.nombre}</option>)
                : <option value="">(Sin datos)</option>
              }
            </select>

            <label>Municipios</label>
            <select
              value={ciudad}
              onChange={e => setCiudad(e.target.value)}
            >
              <option value="">Seleccione municipio</option>
              {muniFiltrados.map(m => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>

            <div className="modal-actions">
              <button
                className="ruta-btn"
                onClick={goToCiudad}
              >
                Ir
              </button>
              <button
                className="link-btn"
                onClick={() => setShowGeoModal(false)}
              >
                Cerrar
              </button>
              <button
                className="link-btn"
                onClick={() => {
                  setCiudadFiltrada(""); // Limpia el filtro
                  setFocusCenter(null);  // Opcional: quita el enfoque de ciudad
                  setShowGeoModal(false);
                  if (mapRef.current) {
                    mapRef.current.fitBounds(NIC_BOUNDS, { padding: [20, 20] }); // Vuelve a mostrar todo el país
                  }
                }}
                style={{ color: "#c00", marginLeft: 8 }}
              >
                Limpiar filtro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de ayuda */}
      {showHelp && (
        <div className="modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-modal" onClick={(e)=>e.stopPropagation()}>
            <h3>¿Cómo usar esta vista?</h3>
            <ol>
              <li>Usa <b>Buscar unidad</b> para filtrar por nombre. Presiona Enter o el ícono para hacer zoom.</li>
              <li>Activa <b>Mostrar ubicación</b> para centrarte y calcular rutas.</li>
              <li>Desde el panel izquierdo, toca <b>Ver ruta</b> para una unidad.</li>
              <li>En el panel derecho, <b>Cómo llegar</b> calcula la ruta real por calles y muestra la <b>distancia</b>.</li>
              <li>El botón <b>ubicación + lupa</b> abre filtros por <b>Departamento</b> y <b>Municipio</b> desde tu BD.</li>
              <li>Usa la capa de mapa en la esquina para cambiar base/satélite.</li>
            </ol>
            <button className="link-btn" onClick={()=>setShowHelp(false)}>Entendido</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Haversine: calcula la distancia en km entre 2 puntos (lat, lng) usando la fórmula del haversine
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
