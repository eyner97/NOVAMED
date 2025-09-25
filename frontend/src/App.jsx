import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Mapa from "./pages/Mapa";
import EventsView from "./pages/Eventos";
import InfoSalud from "./pages/InfoSalud"; // <-- Agregado
import NovaMedFit from "./pages/Muro";

function App() {
  return (
    <Router>
      <Routes>
        {/* Página principal */}
        <Route path="/" element={<Home />} />

        {/* Página del mapa */}
        <Route path="/mapa" element={<Mapa />} />

        {/* Página de eventos */}
        <Route path="/eventos" element={<EventsView />} />

        {/* Página de información de salud */}
        <Route path="/info_salud" element={<InfoSalud />} /> {/* <-- Agregado */}

        {/* Página del muro */}
        <Route path="/muro" element={<NovaMedFit />} />
      </Routes>
    </Router>
  );
}

export default App;
