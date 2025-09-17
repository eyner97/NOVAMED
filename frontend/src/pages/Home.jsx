// src/pages/Home.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/home.css";

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const navigate = useNavigate();
  const sintomas = ["Dolor de cabeza", "Fiebre", "Vómito", "Sarpullido"];

  const handleSintomaClick = (s) => setInputValue(s);
  const handleSend = () => {
    console.log("Enviar:", inputValue);
  };

  return (
    <div className="hm-root">
      <header className="hm-header">
        <div className="hm-header-left">
          <div className="hm-logo">
            <span className="hm-logo-n">N</span>
            {/* Logo sin fondo sustituyendo la “O” */}
            <img
              className="hm-logo-img"
              src="/icons/logo_novamed.png"
              alt="NovaMed"
            />
            <span className="hm-logo-rest">vaMed</span>
          </div>
          <div className="hm-slogan">La nueva era de tu bienestar</div>
        </div>

        <div className="hm-header-right">
          <div className="hm-avatar-wrap">
            <img src="/avatar.png" alt="Avatar" className="hm-avatar" />
          </div>
        </div>
      </header>

      <main className="hm-main">
        <div className="hm-hero">
          <h2 className="hm-hero-sub">¡Estoy aquí para cuidarte!</h2>
          <h1 className="hm-hero-title">Cuéntame como te sientes.</h1>

          <div className="hm-input-wrap">
            <input
              type="text"
              className="hm-input"
              placeholder="conversa con tu asistente de salud, inteligente!"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button className="hm-send" onClick={handleSend} aria-label="Enviar">
              <svg viewBox="0 0 24 24" className="hm-send-icon" aria-hidden>
                <path fill="currentColor" d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
              </svg>
            </button>
          </div>

          <div className="hm-sintomas">
            {sintomas.map((s) => (
              <button
                key={s}
                className="hm-sintoma-link"
                onClick={() => handleSintomaClick(s)}
                type="button"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Tres tarjetas equilibradas en una fila (grid) */}
        <div className="hm-cards hm-cards-3">
          <button className="hm-card hm-card-white">
            <span className="hm-card-icon">
              <svg viewBox="0 0 24 24" className="hm-svg">
                <path fill="#22a45d" d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" />
              </svg>
            </span>
            <span className="hm-card-text">Info. Salud</span>
          </button>

          <button
            className="hm-card hm-card-green"
            onClick={() => navigate("/mapa")}
          >
            <span className="hm-card-icon">
              <svg viewBox="0 0 24 24" className="hm-svg">
                <path
                  fill="#fff"
                  d="M12 2C8.1 2 5 5.1 5 9c0 5.3 7 13 7 13s7-7.7 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5 2.5 2.5 0 0 1 12 11.5z"
                />
              </svg>
            </span>
            <span className="hm-card-text">Ubicaciones</span>
          </button>

          <button className="hm-card hm-card-white">
            <span className="hm-card-icon">
              <svg viewBox="0 0 24 24" className="hm-svg">
                <path fill="#22a45d" d="M7 10h5v5H7z" />
                <path
                  fill="#22a45d"
                  d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM19 18H5V9h14v9z"
                />
              </svg>
            </span>
            <span className="hm-card-text">Eventos</span>
          </button>
        </div>
      </main>

      <footer className="hm-footer">
        <div className="hm-footer-left">
          <svg viewBox="0 0 24 24" className="hm-footer-pin">
            <path
              fill="#1d64c2"
              d="M12 2C8.1 2 5 5.1 5 9c0 5.3 7 13 7 13s7-7.7 7-13c0-3.9-3.1-7-7-7zM12 11.5A2.5 2.5 0 1 1 12 6.5 2.5 2.5 0 0 1 12 11.5z"
            />
          </svg>
          <span className="hm-location">El Rama</span>
        </div>

        <div className="hm-footer-right">
          <div className="hm-user-circle">
            <svg viewBox="0 0 24 24">
              <path
                fill="#fff"
                d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z"
              />
            </svg>
          </div>
        </div>
      </footer>
    </div>
  );
}
