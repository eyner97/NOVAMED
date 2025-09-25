import { useState } from "react";
import "../styles/infosalud.css";

// Ejemplo de artículos con info real y foto
const articulos = [
  {
    id: 1,
    titulo: "Prevención de enfermedades respiratorias",
    resumen:
      "Descubre cómo protegerte de gripes, resfriados y otras infecciones respiratorias con hábitos sencillos y efectivos.",
    imagen:
      "https://th.bing.com/th/id/R.1fbf8c160415e130127df862b65a9797?rik=PLJ3ThhmdHOWrw&pid=ImgRaw&r=0",
    contenido: (
      <>
        <h2>¿Cómo prevenir enfermedades respiratorias?</h2>
        <ul>
          <li>
            <b>Lávate las manos</b> frecuentemente con agua y jabón, especialmente después de toser o estornudar.
          </li>
          <li>
            <b>Evita tocarte la cara</b> (ojos, nariz y boca) con las manos sin lavar.
          </li>
          <li>
            <b>Ventila los espacios</b> cerrados y mantén una buena higiene en el hogar.
          </li>
          <li>
            <b>Usa mascarilla</b> si tienes síntomas o estás en lugares concurridos.
          </li>
          <li>
            <b>Aliméntate bien</b> y mantente hidratado para fortalecer tu sistema inmune.
          </li>
        </ul>
        <img
          src="https://i.pinimg.com/originals/91/fe/96/91fe96016e30a82c6531a32e93d44c98.jpg"
          alt="Prevención de enfermedades respiratorias"
          style={{ width: "100%", borderRadius: "14px", margin: "18px 0" }}
        />
        <p style={{ color: "#204c9b" }}>
          Fuente: <a href="https://www.clinicabaviera.com/blog/prevencion-gripe/" target="_blank" rel="noopener noreferrer">Clínica Baviera</a>
        </p>
      </>
    ),
  },
  {
    id: 2,
    titulo: "Hábitos saludables para el corazón",
    resumen:
      "Conoce los mejores hábitos diarios para cuidar tu salud cardiovascular y prevenir enfermedades del corazón.",
    imagen:
      "https://tse2.mm.bing.net/th/id/OIP.V1EwIfiRfrJi4sJQ8_2NjwHaEo?rs=1&pid=ImgDetMain&o=7&rm=3",
    contenido: (
      <>
        <h2>Cuida tu corazón con estos hábitos</h2>
        <ul>
          <li>
            <b>Realiza actividad física</b> al menos 30 minutos al día.
          </li>
          <li>
            <b>Evita el tabaco</b> y limita el consumo de alcohol.
          </li>
          <li>
            <b>Incluye frutas y verduras</b> en tu dieta diaria.
          </li>
          <li>
            <b>Controla el estrés</b> con técnicas de relajación o meditación.
          </li>
          <li>
            <b>Realiza chequeos médicos</b> periódicamente.
          </li>
        </ul>
        <img
          src="https://www.launion.com.py/wp-content/uploads/2021/09/ops-corazon1.jpg"
          alt="Hábitos saludables para el corazón"
          style={{ width: "100%", borderRadius: "14px", margin: "18px 0" }}
        />
        <p style={{ color: "#204c9b" }}>
          Fuente: <a href="https://www.cun.es/enfermedades-tratamientos/habitos-saludables-corazon" target="_blank" rel="noopener noreferrer">Clínica Universidad de Navarra</a>
        </p>
      </>
    ),
  },
  {
    id: 3,
    titulo: "Importancia de la hidratación diaria",
    resumen:
      "Aprende por qué es fundamental beber suficiente agua cada día y cómo mantenerte hidratado.",
    imagen:
      "https://th.bing.com/th/id/R.50f4629fd0cd4b5af2486734b1b7c340?rik=qBABm3F1duGXBA&riu=http%3a%2f%2fmisaludltda.com%2fwp-content%2fuploads%2f2023%2f10%2fEl-agua-fuente-de-vida-y-salud-para-tu-corazon-Mi-Salud-Medicina-Prepagada-scaled.jpg&ehk=0rbETr7hBO%2fwONoKoveIo6VOZlRjqTw1wYuUAe3Rxk0%3d&risl=&pid=ImgRaw&r=0",
    contenido: (
      <>
        <h2>¿Por qué es importante la hidratación?</h2>
        <ul>
          <li>
            <b>Regula la temperatura corporal</b> y ayuda a la digestión.
          </li>
          <li>
            <b>Transporta nutrientes</b> y oxígeno a las células.
          </li>
          <li>
            <b>Elimina toxinas</b> a través de la orina y el sudor.
          </li>
          <li>
            <b>Previene dolores de cabeza</b> y fatiga.
          </li>
        </ul>
        <img
          src="https://th.bing.com/th/id/R.8fa84d5a683d314f32c2fcbebe93425a?rik=G0V%2fwhH8L27R3g&pid=ImgRaw&r=0"
          alt="Importancia de la hidratación"
          style={{ width: "100%", borderRadius: "14px", margin: "18px 0" }}
        />
        <p style={{ color: "#204c9b" }}>
          Fuente: <a href="https://www.cdc.gov/healthyweight/spanish/healthy_eating/water-and-healthier-drinks.html" target="_blank" rel="noopener noreferrer">CDC</a>
        </p>
      </>
    ),
  },
];

export default function InfoSalud() {
  const [articuloActivo, setArticuloActivo] = useState(null);

  return (
    <div className="is-root">
      {/* HERO */}
      <section className="is-hero">
        {/* Imagen principal superior */}
        <div
          className="is-hero-photo img-ph"
          aria-label="Imagen de actividad comunitaria"
          style={{
            backgroundImage: "url('https://www.el19digital.com/files/articulos/309855.jpg')",
            backgroundSize: "contain",
            backgroundPosition: "center",
            minHeight: "80px",
          }}
        />
        <div className="is-hero-copy">
          <h1 className="is-title">InfoSalud</h1>
          <p className="is-subtitle">
            Lee consejos, guías y recomendaciones para cuidar tu salud
          </p>
        </div>
      </section>

      {/* MAIN */}
      <section className="is-main">
        {/* IZQUIERDA: categorías + artículos */}
        <div className="is-left">
          {/* Carrusel (sin desplazamiento; 4 tarjetas visibles) */}
          <div className="is-categories">
            <button className="is-nav is-prev" aria-label="Anterior">‹</button>

            <div className="is-cat-card is-cat--active">
              <div className="is-cat-title">Nutrición</div>
              <div
                className="is-cat-img img-ph"
                style={{ backgroundImage: "url(/imgs/cat-nutricion.png)" }}
              />
            </div>

            <div className="is-cat-card">
              <div className="is-cat-title">Prevención</div>
              <div
                className="is-cat-img img-ph"
                style={{ backgroundImage: "url(imgs/cat-prevencion.png)" }}
              />
            </div>

            <div className="is-cat-card">
              <div className="is-cat-title">Ejercicio</div>
              <div
                className="is-cat-img img-ph"
                style={{ backgroundImage: "url(imgs/ejercicio.png)" }}
              />
            </div>

            <div className="is-cat-card">
              <div className="is-cat-title">Salud mental</div>
              <div
                className="is-cat-img img-ph"
                style={{ backgroundImage: "url(/imgs/cat-mental.png)" }}
              />
            </div>

            <button className="is-nav is-next" aria-label="Siguiente">›</button>
          </div>

          {/* Lista de artículos */}
          <div className="is-articles">
            {articulos.map((art) => (
              <article key={art.id} className="is-article">
                <div
                  className="is-article-thumb img-ph"
                  style={{
                    backgroundImage: `url('${art.imagen}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div className="is-article-body">
                  <h3 className="is-article-title">{art.titulo}</h3>
                  <p style={{ color: "#355", fontSize: "1rem", margin: "0 0 8px 0" }}>
                    {art.resumen}
                  </p>
                  <div className="is-article-actions">
                    <button
                      className="is-btn is-btn--primary"
                      onClick={() => setArticuloActivo(art)}
                    >
                      Leer más
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* DERECHA: Tip del día */}
        <aside className="is-tip">
          <h2 className="is-tip-title">Tip del día</h2>
          <div className="is-tip-oval">
            {/* Imagen con tip */}
            <div
              className="is-tip-graphic img-ph"
              style={{
                backgroundImage:
                  "url('https://i.pinimg.com/736x/bd/b2/09/bdb20946a2580f58bcc7bce19ca144b2.jpg')",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                minHeight: "120px",
              }}
              aria-label="Tip: Bebe suficiente agua cada día para mantenerte hidratado"
            />
          </div>
        </aside>
      </section>

      {/* PLANTILLA MODAL DE ARTÍCULO */}
      {articuloActivo && (
        <div
          style={{
            position: "fixed",
            zIndex: 1000,
            left: 0,
            top: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(32,76,155,0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
          onClick={() => setArticuloActivo(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "20px",
              maxWidth: 540,
              width: "100%",
              padding: "32px 24px",
              boxShadow: "0 12px 40px rgba(32,76,155,0.18)",
              color: "#1b2b43",
              position: "relative",
              maxHeight: "90vh",         // <-- Limita la altura máxima
              overflowY: "auto",         // <-- Habilita scroll vertical
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setArticuloActivo(null)}
              style={{
                position: "absolute",
                top: 18,
                right: 18,
                background: "#204c9b",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 36,
                height: 36,
                fontSize: 22,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(32,76,155,0.10)",
              }}
              aria-label="Cerrar"
            >
              ×
            </button>
            <h2 style={{ color: "#204c9b", marginTop: 0 }}>{articuloActivo.titulo}</h2>
            <div>{articuloActivo.contenido}</div>
          </div>
        </div>
      )}
    </div>
  );
}
