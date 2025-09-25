import { useEffect, useMemo, useState } from "react";
import "../styles/muro.css";

export default function NovaMedFit() {
  const [tab, setTab] = useState("rutinas"); // "rutinas" | "dietas"
  const [xp, setXp] = useState(120);
  const [streak, setStreak] = useState(5);
  const [goalProgress, setGoalProgress] = useState(62); // % de meta diaria
  const [hydration, setHydration] = useState(1.5); // litros

  // Ejemplo de micro-feedback al cambiar pestañas
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("nm-flash");
    const t = setTimeout(() => root.classList.remove("nm-flash"), 300);
    return () => clearTimeout(t);
  }, [tab]);

  const today = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "short" });
  }, []);

  const handleQuickStart = () => {
    setXp((x) => x + 10);
    setGoalProgress((p) => Math.min(100, p + 8));
    pulseToast("¡+10 XP por iniciar!");
  };

  const handleCompleteBlock = (inc = 12) => {
    setXp((x) => x + 20);
    setStreak((s) => s + 1);
    setGoalProgress((p) => Math.min(100, p + inc));
    pulseToast("¡Bloque completado! 🔥");
  };

  const handleDrink = () => {
    setHydration((h) => Math.min(3.0, +(h + 0.25).toFixed(2)));
    pulseToast("Agregado +250 ml 💧");
  };

  const pulseToast = (msg) => {
    const el = document.querySelector(".nm-toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("show");
    // force reflow
    void el.offsetWidth;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 1200);
  };

  return (
    <div className="nm-app">
      {/* Toast feedback */}
      <div className="nm-toast" aria-live="polite" />

      {/* Header / AppBar */}
      <header className="nm-header">
        <div className="nm-brand" aria-label="NovaMed">
          <span className="nm-n">N</span>
          <span
            className="nm-o-hole"
            title="Logo NovaMed"
            style={{
              background: 'url("/icons/logo_novamed.png") center center / contain no-repeat, rgba(255,255,255,.2)'
            }}
          />
          <span className="nm-vamed">vaMed</span>
        </div>

        <div className="nm-top-actions">
          <button className="nm-ico-btn" aria-label="Notificaciones">
            <BellIcon />
          </button>
          <button className="nm-ico-btn" aria-label="Perfil">
            <UserIcon />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="nm-tabs" role="tablist" aria-label="Selector de módulo">
        <button
          role="tab"
          aria-selected={tab === "rutinas"}
          className={`nm-tab ${tab === "rutinas" ? "active" : ""}`}
          onClick={() => setTab("rutinas")}
        >
          <DumbbellIcon />
          Rutinas
        </button>
        <button
          role="tab"
          aria-selected={tab === "dietas"}
          className={`nm-tab ${tab === "dietas" ? "active" : ""}`}
          onClick={() => setTab("dietas")}
        >
          <MealIcon />
          Dietas
        </button>
      </nav>

      {/* Stats strip */}
      <section className="nm-stats">
        <div className="nm-stat-card">
          <div className="nm-stat-label">XP</div>
          <div className="nm-stat-value">{xp}</div>
          <div className="nm-stat-sub">Progreso de hoy</div>
          <ProgressRing value={goalProgress} />
        </div>

        <div className="nm-stat-card">
          <div className="nm-stat-label">Racha</div>
          <div className="nm-stat-value">
            {streak}
            <span className="nm-fire">🔥</span>
          </div>
          <div className="nm-stat-sub">{today}</div>
          <button className="nm-cta-mini" onClick={() => handleCompleteBlock(6)}>
            Sumar racha
          </button>
        </div>

        <div className="nm-stat-card">
          <div className="nm-stat-label">Hidratación</div>
          <div className="nm-stat-value">{hydration.toFixed(2)} L</div>
          <div className="nm-stat-sub">Meta 3.0 L</div>
          <button className="nm-cta-mini" onClick={handleDrink}>
            +250 ml
          </button>
        </div>
      </section>

      {/* Contenido cambiante */}
      <main className="nm-main">
        {tab === "rutinas" ? (
          <section className="nm-panel" aria-labelledby="rutinas-title">
            <h2 id="rutinas-title" className="nm-panel-title">
              Tu plan de hoy
            </h2>

            <article className="nm-hero-card">
              <div className="nm-hero-text">
                <h3>Full Body Express (18 min)</h3>
                <p>Calentamiento, circuito de fuerza y core. Nivel adaptable.</p>
                <ul className="nm-steps">
                  <li>Calentamiento 3’ — movilidad y activación</li>
                  <li>3 rondas × 4 ejercicios — 35” ON / 15” OFF</li>
                  <li>Core 4’ — planchas y hollow hold</li>
                  <li>Enfriamiento 2’ — respiración</li>
                </ul>
                <div className="nm-hero-actions">
                  <button className="nm-cta" onClick={handleQuickStart}>
                    Iniciar ahora
                  </button>
                  <button className="nm-ghost">Ver detalles</button>
                </div>
              </div>
              <div className="nm-hero-visual" aria-hidden="true">
                <RunnerIcon />
              </div>
            </article>

            <div className="nm-grid">
              <CardRoutine
                title="HIIT suave"
                minutes={12}
                kcal={120}
                points={12}
                onComplete={handleCompleteBlock}
              />
              <CardRoutine
                title="Fuerza superior"
                minutes={16}
                kcal={150}
                points={15}
                onComplete={handleCompleteBlock}
              />
              <CardRoutine
                title="Piernas & Glúteos"
                minutes={14}
                kcal={140}
                points={14}
                onComplete={handleCompleteBlock}
              />
              <CardRoutine
                title="Yoga de recuperación"
                minutes={20}
                kcal={90}
                points={10}
                onComplete={handleCompleteBlock}
              />
            </div>
          </section>
        ) : (
          <section className="nm-panel" aria-labelledby="dietas-title">
            <h2 id="dietas-title" className="nm-panel-title">
              Tu guía de hoy
            </h2>

            <article className="nm-hero-card nm-hero-diet">
              <div className="nm-hero-text">
                <h3>Plan Balanceado (≈ 1,900 kcal)</h3>
                <p>Distribución: 40% carb · 30% prot · 30% grasas.</p>

                <div className="nm-macros">
                  <MacroBar label="Carbohidratos" value={40} />
                  <MacroBar label="Proteínas" value={30} />
                  <MacroBar label="Grasas" value={30} />
                </div>

                <div className="nm-hero-actions">
                  <button className="nm-cta" onClick={() => pulseToast("Plan guardado")}>
                    Guardar plan
                  </button>
                  <button className="nm-ghost">Cambiar objetivo</button>
                </div>
              </div>
              <div className="nm-hero-visual" aria-hidden="true">
                <BowlIcon />
              </div>
            </article>

            <div className="nm-grid">
              <MealCard
                title="Desayuno"
                items={["Avena con fruta", "Yogur natural", "Nueces (pequeña porción)"]}
                kcal={480}
              />
              <MealCard
                title="Almuerzo"
                items={["Pollo a la plancha", "Arroz integral", "Ensalada verde"]}
                kcal={650}
              />
              <MealCard
                title="Cena"
                items={["Pescado al horno", "Puré de camote", "Brócoli al vapor"]}
                kcal={560}
              />
              <MealCard
                title="Snacks"
                items={["Manzana", "Hummus + zanahorias", "Batido de proteína (opcional)"]}
                kcal={220}
              />
            </div>
          </section>
        )}
      </main>

      {/* Bottom bar estilo PWA */}
      <footer className="nm-footer">
        <button className="nm-nav-btn active">
          <HomeIcon />
          Inicio
        </button>
        <button className="nm-nav-btn">
          <TargetIcon />
          Metas
        </button>
        <button className="nm-nav-btn">
          <CalendarIcon />
          Agenda
        </button>
        <button className="nm-nav-btn">
          <ChatIcon />
          Chat
        </button>
      </footer>
    </div>
  );
}

/* ========= Subcomponentes ========= */

function ProgressRing({ value = 0 }) {
  const style = {
    background: `conic-gradient(var(--green) ${value * 3.6}deg, var(--muted) 0)`,
  };
  return (
    <div className="nm-ring" title={`${value}% de meta`}>
      <div className="nm-ring-fill" style={style} />
      <div className="nm-ring-center">{value}%</div>
    </div>
  );
}

function CardRoutine({ title, minutes, kcal, points, onComplete }) {
  return (
    <article className="nm-card">
      <div className="nm-card-head">
        <DumbbellIcon />
        <h3>{title}</h3>
      </div>
      <p className="nm-card-meta">
        {minutes} min · {kcal} kcal
      </p>
      <div className="nm-card-actions">
        <button className="nm-cta-mini" onClick={() => onComplete(points)}>
          Completar (+{points} XP)
        </button>
        <button className="nm-ghost-mini">Ver</button>
      </div>
    </article>
  );
}

function MacroBar({ label, value }) {
  return (
    <div className="nm-macro">
      <div className="nm-macro-top">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="nm-macro-bar" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <div className="nm-macro-fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function MealCard({ title, items = [], kcal }) {
  return (
    <article className="nm-card nm-card-meal">
      <div className="nm-card-head">
        <MealIcon />
        <h3>{title}</h3>
      </div>
      <ul className="nm-meal-list">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
      <p className="nm-card-meta">{kcal} kcal aprox.</p>
      <div className="nm-card-actions">
        <button className="nm-cta-mini">Reemplazar</button>
        <button className="nm-ghost-mini">Detalles</button>
      </div>
    </article>
  );
}

/* ========= Íconos (SVG inline) ========= */
function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="nm-ico" aria-hidden="true">
      <path d="M12 3a6 6 0 0 0-6 6v3.3l-1.6 2.7A1 1 0 0 0 5.2 17h13.6a1 1 0 0 0 .8-1.6L18 12.3V9a6 6 0 0 0-6-6zm0 18a3 3 0 0 0 3-3H9a3 3 0 0 0 3 3z" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="nm-ico" aria-hidden="true">
      <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-5 0-9 2.7-9 6v1h18v-1c0-3.3-4-6-9-6z" />
    </svg>
  );
}
function DumbbellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="nm-ico" aria-hidden="true">
      <path d="M1 9h3v6H1zM4 10h2v4H4zM18 10h2v4h-2zM20 9h3v6h-3zM7 11h10v2H7z" />
    </svg>
  );
}
function MealIcon() {
  return (
    <svg viewBox="0 0 24 24" className="nm-ico" aria-hidden="true">
      <path d="M3 3h2v7a2 2 0 0 0 4 0V3h2v7a4 4 0 0 1-8 0zm11 0h2v7h-2zM20 3h1v7a3 3 0 0 1-6 0V3h1v4h1V3h1v4h1z" />
    </svg>
  );
}
function RunnerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="nm-hero-ico" aria-hidden="true">
      <path d="M13.5 5.5a2.5 2.5 0 1 0-2.5-2.5 2.5 2.5 0 0 0 2.5 2.5zM9 12l2-2 2 1 2-2 1 1-2 2-2-1-1 2 3 2v3h-2v-2l-3-2-2 2-1-1z" />
    </svg>
  );
}
function BowlIcon() {
  return (
    <svg viewBox="0 0 24 24" className="nm-hero-ico" aria-hidden="true">
      <path d="M4 13a8 8 0 0 0 16 0H4zm-1-2h18a1 1 0 0 0 0-2H3a1 1 0 0 0 0 2z" />
    </svg>
  );
}
function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="nm-ico" aria-hidden="true">
      <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}
function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="nm-ico" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 10 10h-2A8 8 0 1 1 12 4zM12 7a5 5 0 1 0 5 5h-2a3 3 0 1 1-3-3z" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="nm-ico" aria-hidden="true">
      <path d="M7 2h2v2h6V2h2v2h3a1 1 0 0 1 1 1v15a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1h3zM3 9h18v11H3z" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="nm-ico" aria-hidden="true">
      <path d="M3 4h18v12H7l-4 4z" />
    </svg>
  );
}
