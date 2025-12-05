import "./About.scss";

const About: React.FC = () => {
  return (
    <div className="about">
      <div className="about__hero app-content">
        <h1 className="about__title">Sobre Interactify</h1>
        
        <div className="about__logo-container">
          <div className="about__logo-wrapper">
            <img 
              src="/logoInteractify.jpeg" 
              alt="Logo Interactify" 
              className="about__logo"
            />
          </div>
        </div>

        <p className="about__intro">
          Interactify es una empresa dedicada al desarrollo de soluciones innovadoras 
          para comunicación digital. Su producto principal es una plataforma web de 
          videoconferencias diseñada para ofrecer experiencias altamente interactivas 
          y fluidas.
        </p>
      </div>

      <div className="about__content app-content">
        <section className="about__section">
          <h2 className="about__section-title">Nuestra Misión</h2>
          <p className="about__section-text">
            Facilitar la comunicación en tiempo real entre equipos de trabajo, 
            estudiantes y profesionales, ofreciendo una plataforma simple, 
            accesible y de alta calidad que conecte a las personas sin importar 
            la distancia.
          </p>
        </section>

        <section className="about__section">
          <h2 className="about__section-title">¿Qué nos hace diferentes?</h2>
          <div className="about__features">
            <div className="about__feature">
              <div className="about__feature-icon">⚡</div>
              <h3>Rápido y Simple</h3>
              <p>Crea reuniones en segundos sin complicaciones ni configuraciones complejas.</p>
            </div>

            <div className="about__feature">
              <div className="about__feature-icon">🎯</div>
              <h3>Enfocado en Equipos</h3>
              <p>Diseñado específicamente para equipos de 2 a 10 personas que necesitan colaborar efectivamente.</p>
            </div>

            <div className="about__feature">
              <div className="about__feature-icon">🚀</div>
              <h3>En Constante Evolución</h3>
              <p>Agregamos nuevas funcionalidades continuamente basadas en las necesidades de nuestros usuarios.</p>
            </div>
          </div>
        </section>

        <section className="about__section about__section--highlight">
          <h2 className="about__section-title">Tecnología de Vanguardia</h2>
          <p className="about__section-text">
            Utilizamos las últimas tecnologías web para garantizar una experiencia 
            fluida y confiable. Nuestra plataforma está construida con React, 
            WebRTC y Firebase, asegurando comunicación en tiempo real de alta 
            calidad.
          </p>
        </section>
      </div>
    </div>
  );
};

export default About;