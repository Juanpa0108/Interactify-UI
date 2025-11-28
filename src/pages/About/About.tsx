import "./About.scss";

const About: React.FC = () => {
  return (
    <div className="about app-content">
      <h1>Sobre Interactify</h1>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <img src={'/logoInteractify.jpeg'} alt="Logo Interactify" style={{ height: 300, width: 300, objectFit: 'contain', borderRadius: 50 }} />
      </div>
      <p>
        Interactify es una empresa dedicada al desarrollo de soluciones innovadoras para comunicación digital. Su producto principal es una plataforma web de videoconferencias diseñada para ofrecer experiencias altamente interactivas y fluidas.
      </p>
    </div>
  );
};

export default About;
