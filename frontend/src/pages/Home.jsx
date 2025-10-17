import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { askChat, registerPhone, loginPhone } from "../services/api";
import "../styles/home.css";

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState("login"); // 'login' | 'register'
  const [authMethod, setAuthMethod] = useState("phone"); // 'phone' | 'email' | 'google'

  // === Chat state ===
  const [chatActive, setChatActive] = useState(false);
  const [messages, setMessages] = useState([]); // {id, role: 'user'|'assistant', content}
  const [isReplying, setIsReplying] = useState(false); // Para saber si la IA está "escribiendo"
  const chatRef = useRef(null);

  const navigate = useNavigate();
  const sintomas = ["Dolor de cabeza", "Fiebre", "Vómito", "Sarpullido"];

  // Estado para la ubicación
  const [ubicacion, setUbicacion] = useState("Cargando ubicación...");
  const [departamento, setDepartamento] = useState(null);

  // Estado para el reconocimiento de voz
  const [listening, setListening] = useState(false);
  const [lastUsedDictation, setLastUsedDictation] = useState(false);
  const recognitionRef = useRef(null);

  // === Speech Synthesis (lectura de respuestas) ===
  const [speakingId, setSpeakingId] = useState(null); // id del mensaje que se está leyendo
  const synthRef = useRef(window.speechSynthesis);
  const utterRef = useRef(null);

  const handleSintomaClick = (s) => setInputValue(v => (v.trim() ? v.trim() + " " + s : s));

  // Función para leer texto con Speech Synthesis
  const speakText = (text, msgId) => {
    if (!window.speechSynthesis) return;
    if (utterRef.current) {
      window.speechSynthesis.cancel();
      utterRef.current = null;
    }
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.lang = "es-ES";
    utter.rate = 0.98; // Más natural
    utter.pitch = 1.08; // Más natural
    utter.volume = 1;
    // Selecciona una voz más natural si está disponible
    const voices = window.speechSynthesis.getVoices();
    const esVoices = voices.filter(v => v.lang && v.lang.startsWith("es"));
    if (esVoices.length > 0) {
      // Busca una voz femenina si existe
      const female = esVoices.find(v => v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("mujer"));
      utter.voice = female || esVoices[0];
    }
    utter.onend = () => {
      setSpeakingId(null);
      utterRef.current = null;
    };
    utter.onerror = () => {
      setSpeakingId(null);
      utterRef.current = null;
    };
    utterRef.current = utter;
    setSpeakingId(msgId);
    window.speechSynthesis.speak(utter);
  };

  // Función para pausar/cancelar lectura
  const handlePauseSpeak = () => {
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      utterRef.current = null;
    }
  };

  // Inicializa SpeechRecognition solo una vez
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      recognitionRef.current = null;
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      if (speakingId !== null) {
        recognition.stop();
        setListening(false);
        return;
      }
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setInputValue(final + interim);
      setLastUsedDictation(true);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
  }, [speakingId]); // <-- depende de speakingId

  // Función para manejar el botón micrófono como interruptor
  const handleMicClick = () => {
    if (!recognitionRef.current) {
      alert("Tu navegador no soporta reconocimiento de voz.");
      return;
    }
    // Si está leyendo, no permitir activar el micrófono
    if (speakingId !== null) {
      if (listening) {
        recognitionRef.current.stop();
        setListening(false);
      }
      return;
    }
    if (!listening) {
      try {
        recognitionRef.current.start();
        setListening(true);
        setLastUsedDictation(false); // Resetea al iniciar dictado
      } catch (e) {
        // Puede lanzar si ya está activo
      }
    } else {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  // Modifica handleSend para leer la respuesta si el último mensaje fue dictado
  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isReplying) return;

    const userMsg = { id: Date.now(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    if (!chatActive) setChatActive(true);
    setIsReplying(true);

    const tempAssistantId = Date.now() + 1;
    setMessages((prev) => [
      ...prev,
      { id: tempAssistantId, role: "assistant", content: "..." },
    ]);

    try {
      // Pasa el departamento como argumento extra
      const { response } = await askChat(text, departamento);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempAssistantId ? { ...msg, content: response } : msg
        )
      );
      if (lastUsedDictation) {
        speakText(response, tempAssistantId);
        setLastUsedDictation(false);
      }
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempAssistantId
            ? { ...msg, content: `Error: ${error.message}` }
            : msg
        )
      );
    } finally {
      setIsReplying(false);
    }
  };

  // Si el usuario cierra el chat o cambia de mensaje, cancela lectura
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  // Auto-scroll al final cuando llegan mensajes
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, chatActive]);

  // === Geolocalización al abrir (SIEMPRE pide permiso) ===
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setUbicacion("Geolocalización no soportada");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          setUbicacion(
            data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              data.address?.state ||
              data.display_name ||
              "Ubicación desconocida"
          );
          // Extrae el departamento (en Nicaragua suele estar en state o county)
          setDepartamento(
            data.address?.state ||
            data.address?.county ||
            data.address?.region ||
            null
          );
        } catch {
          setUbicacion("No se pudo obtener la ciudad");
          setDepartamento(null);
        }
      },
      (err) => {
        setUbicacion("Activa tu ubicación");
        setDepartamento(null);
        if (err.code === 1) {
          setUbicacion("Permiso de ubicación denegado. Actívalo en la configuración del navegador.");
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, []);

  // Reutilizamos la misma barra de entrada para arriba/abajo
  const ChatInput = useMemo(
    () => (
      <div className="hm-input-wrap" role="search">
        <input
          type="text"
          className="hm-input"
          placeholder="conversa con tu asistente de salud, inteligente!"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          aria-label="Escribe tu mensaje"
        />
        {/* Micrófono botón */}
        <button
          type="button"
          className="hm-mic-btn"
          style={{
            marginRight: "10px",
            background: listening ? "#eaf7f0" : "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            padding: 0,
            color: listening ? "#22a45d" : "inherit"
          }}
          aria-label={listening ? "Detener dictado" : "Hablar"}
          onClick={handleMicClick}
          disabled={speakingId !== null} // Desactiva el botón si está leyendo
        >
          {/* Micrófono SVG más realista y en negro */}
          <svg viewBox="0 0 24 24" width="26" height="26" fill="#111" aria-hidden>
            <rect x="9" y="2" width="6" height="12" rx="3"/>
            <path d="M5 10a7 7 0 0 0 14 0" fill="none" stroke="#111" strokeWidth="2"/>
            <rect x="11" y="18" width="2" height="3" rx="1" fill="#111"/>
            <rect x="7" y="21" width="10" height="1.5" rx="0.75" fill="#111"/>
          </svg>
        </button>
        <button
          className="hm-send"
          onClick={handleSend}
          aria-label="Enviar"
          disabled={!inputValue.trim() || isReplying}
        >
          <svg viewBox="0 0 24 24" className="hm-send-icon" aria-hidden>
            <path fill="currentColor" d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
          </svg>
        </button>
      </div>
    ),
    [inputValue, isReplying, listening, speakingId]
  );

  const [usuario, setUsuario] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("usuario")) || null;
    } catch {
      return null;
    }
  });

  // Al cargar, intenta restaurar sesión
  useEffect(() => {
    const u = localStorage.getItem("usuario");
    if (u) setUsuario(JSON.parse(u));
  }, []);

  // Maneja el envío del formulario de autenticación
  async function handleAuthSubmit(e) {
    e.preventDefault();

    if (authMethod === "phone" && authTab === "login") {
      const telefono = e.target["hm-phone"].value;
      const password = e.target["hm-phone-pass"].value;

      try {
        const data = await loginPhone(telefono, password); // Llama al endpoint
        setUsuario(data.usuario); // Guarda el usuario en el estado
        localStorage.setItem("usuario", JSON.stringify(data.usuario)); // Guarda en localStorage
        setShowAuth(false); // Cierra el modal de autenticación
      } catch (err) {
        alert(err.message); // Muestra el error si las credenciales son incorrectas
      }
    }
  }

  // Cerrar sesión
  function handleLogout() {
    setUsuario(null);
    localStorage.removeItem("usuario");
  }

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
      </header>

      <main className={`hm-main ${chatActive ? "is-chat" : ""}`}>
        <div className={`hm-hero ${chatActive ? "is-chat" : ""}`}>
          {!chatActive && (
            <>
              <h2 className="hm-hero-sub">¡Estoy aquí para cuidarte!</h2>
              <h1 className="hm-hero-title">Cuéntame como te sientes.</h1>
              {ChatInput}
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
            </>
          )}
        </div>

        {chatActive && (
          <>
            <div className="hm-chat-shell">
              <button
                className="hm-chat-close"
                onClick={() => {
                  setChatActive(false);
                  handlePauseSpeak();
                }}
                aria-label="Cerrar chat"
              >
                ×
              </button>
              <div
                className="hm-chat"
                ref={chatRef}
                role="log"
                aria-live="polite"
                aria-label="Mensajes del chat"
              >
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`hm-bubble ${m.role === "user" ? "is-user" : "is-assistant"}`}
                    style={{ position: "relative" }}
                  >
                    {m.content}
                    {/* Botón de pausa solo en la respuesta que se está leyendo */}
                    {m.role === "assistant" && speakingId === m.id && (
                      <button
                        onClick={handlePauseSpeak}
                        aria-label="Pausar lectura"
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          background: "#fff",
                          border: "none",
                          borderRadius: "50%",
                          width: 28,
                          height: 28,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                          cursor: "pointer",
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#1d4a8a">
                          <rect x="6" y="5" width="4" height="14" rx="2"/>
                          <rect x="14" y="5" width="4" height="14" rx="2"/>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="hm-chat-dock">
              {ChatInput}
            </div>
          </>
        )}

        {!chatActive && (
          <div className="hm-cards hm-cards-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            <button
              className="hm-card hm-card-white"
              onClick={() => navigate("/info_salud")}
            >
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
              <span className="hm-card-text">Unidades de salud</span>
            </button>

            <button
              className="hm-card hm-card-green"
              onClick={() => navigate("/eventos")}
            >
              <span className="hm-card-icon">
                <svg viewBox="0 0 24 24" className="hm-svg">
                  <path fill="#fff" d="M7 10h5v5H7z" />
                  <path
                    fill="#fff"
                    d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM19 18H5V9h14v9z"
                  />
                </svg>
              </span>
              <span className="hm-card-text">Eventos</span>
            </button>

            <button
              className="hm-card hm-card-white"
              onClick={() => navigate("/muro")}
            >
              <span className="hm-card-icon">
                {/* Ícono de salud: corazón con cruz */}
                <svg viewBox="0 0 24 24" className="hm-svg">
                  <path
                    fill="#22a45d"
                    d="M12 21s-5.05-4.36-7.07-6.39C2.07 12.14 2 9.28 4.12 7.36 5.5 6.09 7.7 6.09 9.07 7.36L12 10.13l2.93-2.77c1.37-1.27 3.57-1.27 4.95.01 2.12 1.92 2.05 4.78-.81 7.25C17.05 16.64 12 21 12 21z"
                  />
                  <rect x="10.5" y="11" width="3" height="6" rx="1" fill="#fff"/>
                  <rect x="9" y="13.5" width="6" height="3" rx="1" fill="#fff"/>
                </svg>
              </span>
              <span className="hm-card-text">Mi Muro</span>
            </button>
          </div>
        )}
      </main>

      <footer className="hm-footer">
  <div className="hm-footer-left">
    <svg viewBox="0 0 24 24" className="hm-footer-pin" aria-hidden>
      <path
        fill="#1d64c2"
        d="M12 2C8.1 2 5 5.1 5 9c0 5.3 7 13 7 13s7-7.7 7-13c0-3.9-3.1-7-7-7zM12 11.5A2.5 2.5 0 1 1 12 6.5 2.5 2.5 0 0 1 12 11.5z"
      />
    </svg>
    <span className="hm-location">{ubicacion}</span>
  </div>

  <div className="hm-footer-right">
    <div
      className="hm-user-info"
      role="button"
      tabIndex={0}
      onClick={() => (usuario ? handleLogout() : setShowAuth(true))}
      onKeyDown={(e) =>
        (e.key === "Enter" || e.key === " ") &&
        (usuario ? handleLogout() : setShowAuth(true))
      }
      aria-label={usuario ? "Cerrar sesión" : "Abrir autenticación"}
      title={usuario ? "Cerrar sesión" : "Iniciar sesión"}
    >
      {usuario && (
        <span className="hm-user-name">{usuario.nombre}</span>
      )}
      <div className="hm-user-circle">
        <svg viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#fff"
            d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z"
          />
        </svg>
      </div>
    </div>
  </div>
</footer>

      {/* ===== MODAL AUTH (GLASS) ===== */}
      {showAuth && (
        <div
          className="hm-auth-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hm-auth-title"
        >
          <div className="hm-auth-card">
            {/* Animación luminosa alrededor */}
            <button
              className="hm-auth-close"
              aria-label="Cerrar"
              onClick={() => setShowAuth(false)}
            >
              ×
            </button>

            {/* Marca: N [img] vaMed (la “O” va como imagen) */}
            <div className="hm-auth-brand" id="hm-auth-title">
              <span className="hm-auth-n">N</span>
              <img
                className="hm-auth-o"
                src="/icons/logo_novamed.png"
                alt="O de NovaMed"
              />
              <span className="hm-auth-rest">vaMed</span>
            </div>

            {/* Tabs */}
            <div className="hm-auth-tabs" role="tablist" aria-label="Opciones de acceso">
              <button
                role="tab"
                aria-selected={authTab === "login"}
                className={`hm-auth-tab ${authTab === "login" ? "is-active" : ""}`}
                onClick={() => setAuthTab("login")}
              >
                Iniciar sesión
              </button>
              <button
                role="tab"
                aria-selected={authTab === "register"}
                className={`hm-auth-tab ${authTab === "register" ? "is-active" : ""}`}
                onClick={() => setAuthTab("register")}
              >
                Registrarse
              </button>
            </div>

            {/* Métodos */}
            <div className="hm-auth-methods">
              <button
                className={`hm-auth-method ${authMethod === "phone" ? "is-selected" : ""}`}
                onClick={() => setAuthMethod("phone")}
                aria-pressed={authMethod === "phone"}
              >
                <svg viewBox="0 0 24 24" className="hm-auth-icon" aria-hidden>
                  <path d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm5 19a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5z" />
                </svg>
                Celular
              </button>
              <button
                className={`hm-auth-method ${authMethod === "email" ? "is-selected" : ""}`}
                onClick={() => setAuthMethod("email")}
                aria-pressed={authMethod === "email"}
              >
                <svg viewBox="0 0 24 24" className="hm-auth-icon" aria-hidden>
                  <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5L4 8V6l8 5 8-5v2z" />
                </svg>
                Correo
              </button>
              <button
                className={`hm-auth-method ${authMethod === "google" ? "is-selected" : ""}`}
                onClick={() => setAuthMethod("google")}
                aria-pressed={authMethod === "google"}
              >
                {/* Logo de Google */}
                <svg className="hm-auth-icon" viewBox="0 0 24 24" aria-hidden>
                  <path d="M21.35 11.1h-9.6v2.9h5.56c-.24 1.44-1.68 4.22-5.56 4.22a6.52 6.52 0 1 1 0-13.04 5.9 5.9 0 0 1 4.17 1.63l1.99-1.99A8.8 8.8 0 0 0 11.75 3 9.75 9.75 0 1 0 21.5 12c0-.58-.06-1.02-.15-1.4z" />
                </svg>
                Google
              </button>
            </div>

            {/* Formulario */}
            <form
              className="hm-auth-form"
              onSubmit={handleAuthSubmit}
            >
              {authMethod === "phone" && (
                <>
                  {authTab === "register" && (
                    <>
                      <label className="hm-auth-label" htmlFor="hm-name">
                        Nombre completo
                      </label>
                      <input
                        id="hm-name"
                        type="text"
                        className="hm-auth-input"
                        placeholder="Tu nombre completo"
                        required
                      />
                    </>
                  )}
                  <label className="hm-auth-label" htmlFor="hm-phone">
                    Número de celular
                  </label>
                  <input
                    id="hm-phone"
                    type="tel"
                    inputMode="tel"
                    className="hm-auth-input"
                    placeholder="+505 8888 8888"
                    required
                  />
                  <label className="hm-auth-label" htmlFor="hm-phone-pass">
                    Contraseña
                  </label>
                  <input
                    id="hm-phone-pass"
                    type="password"
                    className="hm-auth-input"
                    placeholder="••••••••"
                    required
                  />
                </>
              )}

              {authMethod === "email" && (
                <>
                  <label className="hm-auth-label" htmlFor="hm-email">
                    Correo electrónico
                  </label>
                  <input
                    id="hm-email"
                    type="email"
                    className="hm-auth-input"
                    placeholder="tucorreo@dominio.com"
                    required
                  />
                  {authTab === "login" && (
                    <>
                      <label className="hm-auth-label" htmlFor="hm-pass">
                        Contraseña
                      </label>
                      <input
                        id="hm-pass"
                        type="password"
                        className="hm-auth-input"
                        placeholder="••••••••"
                        required
                      />
                    </>
                  )}
                  {authTab === "register" && (
                    <>
                      <label className="hm-auth-label" htmlFor="hm-pass2">
                        Crea una contraseña
                      </label>
                      <input
                        id="hm-pass2"
                        type="password"
                        className="hm-auth-input"
                        placeholder="Mínimo 8 caracteres"
                        required
                      />
                    </>
                  )}
                </>
              )}

              {authMethod === "google" && (
                <div className="hm-auth-google-hint">
                  Usaremos tu cuenta de Google para{" "}
                  {authTab === "login" ? "iniciar sesión" : "crear tu cuenta"}.
                </div>
              )}

              <button type="submit" className="hm-auth-submit">
                {authTab === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </button>

              {authTab === "login" && (
                <button
                  type="button"
                  className="hm-auth-link"
                  onClick={() => alert("Recuperación de contraseña")}
                >
                  Olvidé mi contraseña
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
