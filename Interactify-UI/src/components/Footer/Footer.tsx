import { Link } from "react-router-dom";
import "./Footer.scss";

/**
 * Global footer component.
 * Displays project brand information and a simple sitemap.
 */
const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__top app-content">
        <div className="footer__brand-block">
          <span className="footer__brand">Interactify</span>
          <p className="footer__description">
            Videoconferencias simples, claras y en tiempo real.
          </p>
        </div>

        <nav
          className="footer__sitemap"
          aria-label="Site map"
        >
          <h2 className="footer__sitemap-title">Mapa del sitio</h2>
          <ul className="footer__sitemap-list">
            <li>
              <Link to="/" className="footer__sitemap-link">
                Inicio
              </Link>
            </li>
            <li>
              <Link to="/about" className="footer__sitemap-link">
                Sobre nosotros
              </Link>
            </li>
            <li>
              <Link to="/create" className="footer__sitemap-link">
                Crear reunión
              </Link>
            </li>
            {/* Si más adelante tienen Login / Profile / Help, se agregan aquí */}
          </ul>
        </nav>
      </div>

      <div className="footer__bottom app-content">
        <p className="footer__copy">
          © {year} Interactify. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
