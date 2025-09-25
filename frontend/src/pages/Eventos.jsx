// src/components/EventsView.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { format, subDays, startOfDay, differenceInMilliseconds } from "date-fns";
import { useEventosSalud } from "../hooks/useEventosSalud";
import "../styles/eventos.css";

/* === SVG Íconos (inline, limpios) === */
// Home
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" className="ev-ico" aria-hidden="true">
    <path d="M3 10.5L12 3l9 7.5v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9z" />
  </svg>
);

// Lupa + ubicación
const SearchLocationIcon = () => (
  <svg viewBox="0 0 24 24" className="ev-ico" aria-hidden="true">
    <path d="M11 2a7 7 0 0 1 7 7c0 4.5-7 13-7 13S4 13.5 4 9a7 7 0 0 1 7-7zm0 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM20.3 20.3l-3.2-3.2 1.4-1.4 3.2 3.2-1.4 1.4z" />
  </svg>
);

// Campana
const BellIcon = () => (
  <svg viewBox="0 0 24 24" className="ev-ico" aria-hidden="true">
    <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm8-6V11a8 8 0 1 0-16 0v5l-2 2v1h20v-1l-2-2z" />
  </svg>
);

// Usuario
const UserIcon = () => (
  <svg viewBox="0 0 24 24" className="ev-ico" aria-hidden="true">
    <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" />
  </svg>
);

/* Íconos de servicio — refinados */
const SyringeIcon = () => (
  <svg viewBox="0 0 24 24" className="ev-card-icon" aria-hidden="true">
    {/* Cuerpo de la jeringa */}
    <rect x="10.2" y="4.2" width="6.6" height="2" rx="0.5" />
    <rect x="7.8" y="6.2" width="9" height="2" rx="0.5" />
    {/* Ángulo y aguja */}
    <path d="M20.5 3.5l-2 2-.7-.7-7.6 7.6 1.4 1.4-2.1 2.1-1.4-1.4-3.3 3.3 1.4 1.4 3.3-3.3 1.4 1.4 2.1-2.1 1.4 1.4 7.6-7.6-.7-.7 2-2-1.4-1.4zM5 20h6v1H5z" />
    {/* Émbolo y marcas */}
    <rect x="12.2" y="3" width="3.2" height="0.9" rx="0.45" />
    <rect x="11" y="8.6" width="3.6" height="0.9" rx="0.45" />
    <rect x="12.6" y="7.2" width="3.6" height="0.9" rx="0.45" />
  </svg>
);

const TalkIcon = () => (
  <svg viewBox="0 0 24 24" className="ev-card-icon" aria-hidden="true">
    <path d="M3 4h18v11H8l-4 3v-3H3V4z" />
    {/* Puntos de diálogo para aludir a charla de salud */}
    <circle cx="8.5" cy="9.2" r="1" />
    <circle cx="12" cy="9.2" r="1" />
    <circle cx="15.5" cy="9.2" r="1" />
  </svg>
);

const CommunityHospitalIcon = () => (
  <svg viewBox="0 0 24 24" className="ev-card-icon" aria-hidden="true">
    <path d="M3 20V9l9-5 9 5v11h-6v-5H9v5H3zm9-7h2v-2h2V9h-2V7h-2v2h-2v2h2v2z" />
  </svg>
);

/* === Datos de ejemplo (plug & play) === */
const seedEvents = [
  {
    id: "e1",
    tipo: "charla",
    titulo: "Encuentro de salud mental comunitaria",
    descripcion: "Conversatorio y atención primaria en salud mental.",
    lugar: "Casa de Cultura Don Bosco",
    fecha: "2025-09-18",
    horaInicio: "10:00",
    horaFin: "12:00",
    color: "#2ecc71",
  },
  {
    id: "e2",
    tipo: "vacunacion",
    titulo: "Jornada de vacunación multiesquema",
    descripcion: "Vacunas (COVID-19, Influenza) y actualización de cartillas.",
    lugar: "Centro de Salud Sócrates Flores",
    fecha: "2025-09-24",
    horaInicio: "10:00",
    horaFin: "12:00",
    color: "#4b68d1",
  },
  {
    id: "e3",
    tipo: "feria",
    titulo: "Servicios de vacunación y control prenatal",
    descripcion: "Servicios de vacunación y control prenatal.",
    lugar: "Casa materna",
    fecha: "2025-09-18",
    horaInicio: "10:00",
    horaFin: "12:00",
    color: "#2ecc71",
  },
];

const typeToIcon = {
  vacunacion: <SyringeIcon />,
  charla: <TalkIcon />,
  feria: <CommunityHospitalIcon />,
};

const typePillText = {
  vacunacion: "Vacunación",
  charla: "Charlas",
  feria: "Ferias",
};

const STORAGE_KEY = "novamed.events";
const REM_KEY = "novamed.reminders";

export default function EventsView() {
  const calRef = useRef(null);
  const calElRef = useRef(null);
  const [cardsIndex, setCardsIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(null);
  const [monthLabel, setMonthLabel] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const isMobile = window.matchMedia("(max-width: 600px)").matches;
  const jornadas = useEventosSalud();

  // Extraer tipos únicos de jornadas para los filtros
  const tiposJornadas = useMemo(() => {
    const tipos = new Set();
    jornadas.forEach(j => {
      if (j.tipo) tipos.add(j.tipo.toLowerCase());
    });
    return Array.from(tipos);
  }, [jornadas]);

  // Normaliza y filtra jornadas para mostrar en tarjetas y calendario
  const eventos = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jornadas
      .map(j => ({
        id: j.id,
        tipo: j.tipo ? j.tipo.toLowerCase() : "feria",
        titulo: j.titulo,
        descripcion: j.descripcion ?? j.lugar ?? "",
        lugar: j.lugar ?? "",
        fecha: j.fecha ? j.fecha.slice(0, 10) : "",
        horaInicio: j.hora_inicio ?? "",
        horaFin: j.hora_fin ?? "",
        color:
          j.tipo?.toLowerCase() === "vacunacion"
            ? "#4b68d1"
            : j.tipo?.toLowerCase() === "charla"
            ? "#2ecc71"
            : "#2ecc71",
      }))
      .filter(ev => {
        const matchQ =
          !q ||
          `${ev.titulo} ${ev.descripcion} ${ev.lugar}`.toLowerCase().includes(q);
        const matchF = !activeFilter || ev.tipo === activeFilter;
        return matchQ && matchF;
      });
  }, [jornadas, query, activeFilter]);

  // Paginación visual: 3 por vista
  const page = eventos.slice(cardsIndex, cardsIndex + 2);

  // Calendario
  useEffect(() => {
    if (!calElRef.current) return;
    if (!eventos.length) return;

    const calendar = new Calendar(calElRef.current, {
      plugins: [dayGridPlugin, interactionPlugin],
      initialView: "dayGridMonth",
      height: "100%",
      contentHeight: "100%",
      expandRows: true,
      handleWindowResize: true,
      headerToolbar: false,
      fixedWeekCount: false,
      showNonCurrentDates: true,
      nowIndicator: true,
      selectable: false,
      dayMaxEventRows: 2,
      dateClick: () => {},
      events: eventos.map(ev => ({
        id: ev.id,
        title: ev.titulo,
        start: `${ev.fecha}T${ev.horaInicio || "08:00"}:00-06:00`, // Fuerza zona de Nicaragua
        end: `${ev.fecha}T${ev.horaFin || "12:00"}:00-06:00`,
        backgroundColor: ev.color,
        borderColor: ev.color,
      })),
      datesSet: () => updateMonthLabel(),
    });

    calendar.render();
    calRef.current = calendar;

    eventos.forEach(scheduleReminderFor);
    markToday(calendar);
    updateMonthLabel();

    return () => calendar.destroy();
    // eslint-disable-next-line
  }, [eventos]);

  function updateMonthLabel() {
    const calendar = calRef.current;
    if (!calendar) return;
    const d = calendar.getDate();
    const mesesFull = [
      "enero","febrero","marzo","abril","mayo","junio",
      "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];
    setMonthLabel(`${mesesFull[d.getMonth()].slice(0,4) === 'sept' ? 'sept' : mesesFull[d.getMonth()].slice(0,3)} ${d.getFullYear()}`.replace('.', ''));
  }

  function markToday(calendar) {
    const today = startOfDay(new Date());
    const todayCell = calendar.el.querySelector(
      `.fc-daygrid-day[data-date="${format(today, "yyyy-MM-dd")}"]`
    );
    if (todayCell) todayCell.classList.add("ev-today");
  }

  async function ensurePermission() {
    if (!("Notification" in window)) return false;
    let perm = Notification.permission;
    if (perm === "default") perm = await Notification.requestPermission();
    return perm === "granted";
  }

  function scheduleReminderFor(ev) {
    // Validar fecha
    if (!ev.fecha) return;
    // Validar horaInicio (opcional, por defecto "08:00")
    const hora = ev.horaInicio && /^\d{2}:\d{2}$/.test(ev.horaInicio) ? ev.horaInicio : "08:00";
    const start = new Date(`${ev.fecha}T${hora}:00`);
    if (isNaN(start.getTime())) return; // Fecha inválida, no programar

    const trigger = subDays(start, 1);
    const ms = differenceInMilliseconds(trigger, new Date());

    const doNotify = () => {
      try {
        new Notification("Recordatorio de evento", {
          body: `${ev.titulo} — ${format(start, "dd/MM/yyyy HH:mm")} • ${ev.lugar}`,
          icon: "/icons/icon-192.png",
          tag: `ev-${ev.id}`,
        });
      } catch {}
    };

    if (ms <= 0) {
      if (ms > -3 * 60 * 60 * 1000) doNotify();
      return;
    }
    setTimeout(doNotify, ms);

    const scheduled = JSON.parse(localStorage.getItem(REM_KEY) || "[]");
    if (!scheduled.find((x) => x.id === ev.id)) {
      scheduled.push({ id: ev.id, at: trigger.toISOString() });
      localStorage.setItem(REM_KEY, JSON.stringify(scheduled));
    }
  }

  function addToCalendar(ev) {
    // Usa la fecha EXACTA de la BD, sin crear Date ni formatear
    const fechaStr = ev.fecha; // "YYYY-MM-DD" tal como viene de la BD
    const hora = ev.horaInicio && /^\d{2}:\d{2}$/.test(ev.horaInicio) ? ev.horaInicio : "08:00";

    // Marcar en calendario visual (en rojo)
    const calendar = calRef.current;
    if (calendar) {
      // Quitar marcas previas
      calendar.el.querySelectorAll('.ev-marked').forEach(el => el.classList.remove('ev-marked'));
      // Marcar la celda correspondiente
      const cell = calendar.el.querySelector(
        `.fc-daygrid-day[data-date="${fechaStr}"]`
      );
      if (cell) cell.classList.add('ev-marked');
      // Añadir el evento si no existe
      if (!calendar.getEventById(ev.id)) {
        calendar.addEvent({
          id: ev.id,
          title: ev.titulo,
          start: `${fechaStr}T${hora}:00`,
          end: `${fechaStr}T${ev.horaFin || "12:00"}:00`,
          backgroundColor: ev.color,
          borderColor: ev.color,
        });
      }
    }

    // Notificación 24h antes
    scheduleReminderFor({ ...ev, fecha: fechaStr });

    // Notificación inmediata visual
    if (window.Notification && Notification.permission === "granted") {
      new Notification("Evento añadido", {
        body: `El evento "${ev.titulo}" fue añadido para el ${format(new Date(`${fechaStr}T00:00:00-06:00`), "dd/MM/yyyy")} y se notificará un día antes.`,
        icon: "/icons/icon-192.png"
      });
    } else {
      alert(`El evento "${ev.titulo}" fue añadido para el ${format(new Date(`${fechaStr}T00:00:00-06:00`), "dd/MM/yyyy")} y se notificará un día antes.`);
    }

    // Guardar en localStorage si no existe
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!list.find((x) => x.id === ev.id)) {
      const updated = [...list, { ...ev, fecha: fechaStr }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  }

  const weekInitials = ["D", "L", "M", "M", "J", "V", "S"];
  const canPrev = cardsIndex > 0;
  const canNext = cardsIndex + 3 < eventos.length;
  const goPrev = () => { calRef.current?.prev(); updateMonthLabel(); };
  const goNext = () => { calRef.current?.next(); updateMonthLabel(); };

  return (
    <div className="ev-root">
      {/* HEADER */}
      <header className="ev-header">
        <button className="ev-iconbtn" aria-label="Inicio">
          <HomeIcon />
        </button>

        <div className="ev-brand">
          <span className="hm-logo-n">N</span>
          <img className="hm-logo-img" src="../icons/logo_novamed.png" alt="logo" />
          <span className="hm-logo-rest">vaMed</span>
        </div>

        <div className="ev-header-right">
          <button className="ev-iconbtn" title="Buscar lugares">
            <SearchLocationIcon />
          </button>

          <div className="ev-bell" title="Notificaciones">
            <BellIcon />
            <span className="ev-badge">5</span>
          </div>

          <button className="ev-iconbtn" title="Perfil">
            <UserIcon />
          </button>
        </div>
      </header>

      {/* TÍTULO + BUSCADOR */}
      <div className="ev-hero">
        <div>
          <h1 className="ev-title">Eventos de salud</h1>
          {/* NUEVO subtítulo más pequeño */}
          <p className="ev-submini">Próximas actividades de tu comunidad</p>
          <p className="ev-sub">¡Infórmate sobre las próximas actividades de tu comunidad!</p>
        </div>

        <div className="ev-search">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar ferias, jornadas, clínicas móviles"
            aria-label="Buscar"
          />
          <button className="ev-search-btn" aria-label="Buscar">
            🔎
          </button>
        </div>
      </div>

      {/* LAYOUT PRINCIPAL */}
      <div className="ev-main">
        {!isMobile && (
          <section className="ev-left">
            {/* Barra de mes con navegación */}
            <div className="ev-monthbar">
              <button className="ev-monthbtn prev" onClick={goPrev} aria-label="Mes anterior">‹</button>
              <span className="ev-monthlabel">{monthLabel || ""}</span>
              <button className="ev-monthbtn next" onClick={goNext} aria-label="Mes siguiente">›</button>
            </div>

            {/* Encabezado de días propio en español */}
            <div className="ev-weekhead">
              {weekInitials.map((d) => (
                <span key={d} className="ev-weekhead-cell">{d}</span>
              ))}
            </div>

            {/* Calendario */}
            <div className="ev-calendar" ref={calElRef} />
          </section>
        )}

        <section className="ev-right">
          <h2 className="ev-right-title">Servicios de salud</h2>

          <div className="ev-cards">
            {page.map((ev) => (
              <article
                key={ev.id}
                className="ev-card ev-in"
                style={{ borderLeftColor: ev.color }}
              >
                <div className="ev-card-iconwrap" data-tipo={ev.tipo}>
                  {typeToIcon[ev.tipo] || <CommunityHospitalIcon />}
                </div>

                <div className="ev-card-body">
                  <h3 className="ev-card-title">{ev.titulo}</h3>
                  <p className="ev-card-desc">{ev.descripcion}</p>

                  <div className="ev-meta">
                    <div className="ev-meta-row">
                      <strong>Hora:</strong> {ev.horaInicio}–{ev.horaFin}
                    </div>
                    <div className="ev-meta-row">
                      <strong>Fecha:</strong> {ev.fecha.split("-").reverse().join("-")}
                    </div>
                    <div className="ev-place">{ev.lugar}</div>
                  </div>
                </div>

                <button
                  className="ev-plus"
                  title="Agregar al calendario"
                  onClick={() => addToCalendar(ev)}
                >
                  +
                </button>
              </article>
            ))}
          </div>

          <div className="ev-card-nav">
            <button
              className="ev-navbtn"
              disabled={cardsIndex <= 0}
              onClick={() => setCardsIndex((v) => Math.max(0, v - 1))}
            >
              ←
            </button>
            <button
              className="ev-navbtn"
              disabled={cardsIndex + 3 >= eventos.length}
              onClick={() =>
                setCardsIndex((v) => Math.min(Math.max(0, eventos.length - 3), v + 1))
              }
            >
              →
            </button>
          </div>
        </section>
      </div>

      {/* Filtros dinámicos según tipos de jornadas */}
      <div className="ev-filters-out">
        {tiposJornadas.map((t) => (
          <button
            key={t}
            className={`ev-pill ${activeFilter === t ? "active" : ""}`}
            onClick={() => setActiveFilter(activeFilter === t ? null : t)}
          >
            {typePillText[t] || t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Modal calendario en móvil */}
      {isMobile && showCalendar && (
        <div className="ev-calendar-modal">
          <div className="ev-calendar-modal-bg" onClick={() => setShowCalendar(false)} />
          <div className="ev-calendar-modal-content">
            <div className="ev-calendar" ref={calElRef} />
            <button className="ev-calendar-close" onClick={() => setShowCalendar(false)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
