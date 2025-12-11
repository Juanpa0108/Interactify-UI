import { Link } from "react-router-dom";
import "./Footer.scss";

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__container app-content">
        <div className="footer__top">
          <div className="footer__brand-block">
            <span className="footer__brand">Interactify</span>
            <p className="footer__description">
              Videoconferencias simples, claras y en tiempo real.
            </p>
          </div>

          <nav className="footer__sitemap" aria-label="Mapa del sitio">
            <h2 className="footer__sitemap-title">Mapa del sitio</h2>
            <ul className="footer__sitemap-list">
              <li>
                <Link to="/" className="footer__sitemap-link">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/login" className="footer__sitemap-link">
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link to="/about" className="footer__sitemap-link">
                  Sobre nosotros
                </Link>
              </li>
              <li>
                <Link to="/edit-profile" className="footer__sitemap-link">
                  Editar perfil
                </Link>
              </li>
              <li>
                <Link to="/create" className="footer__sitemap-link">
                  Crear reunión
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="footer__bottom">
          <p className="footer__copy">
            © {year} Interactify. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;