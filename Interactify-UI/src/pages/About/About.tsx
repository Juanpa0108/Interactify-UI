import "./About.scss";

const About: React.FC = () => {
  return (
    <div className="about app-content">
      <h1>Sobre Interactify</h1>
      <p>
        Interactify es una plataforma de videoconferencias pensada como proyecto
        integrador. En cada sprint se irá añadiendo funcionalidad: gestión de
        usuarios, chat en tiempo real, audio y video.
      </p>
      <p>
        Esta página forma parte del Sprint 1 y sirve como sección informativa
        básica para que el usuario entienda el propósito del proyecto.
      </p>
    </div>
  );
};

export default About;
