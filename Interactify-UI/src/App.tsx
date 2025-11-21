import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";

import Home from "./pages/Home/Home";
import About from "./pages/About/About";
import Meeting from "./pages/Meeting/Meeting";
import CreateMeeting from "./pages/Meeting/CreateMeeting";
import Login from "./pages/Login";
import Register from "./pages/Register";

const App: React.FC = () => {
  return (
    <div className="app-container">
      {/* Skip link para WCAG 2.4.1 Bypass Blocks */}
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>

      <Navbar />

      {/* Main con id para recibir el foco del skip link */}
      <main id="main-content" className="app-main" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/create" element={<CreateMeeting />} />
          <Route path="/meeting/:id" element={<Meeting />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
};

export default App;
