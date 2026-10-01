import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';
import { faq } from '../content/data';
// PROPUESTO: titulares de página. Cada respuesta declara su estado de fuente en faq.json.
const schema = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((item) => ({ '@type': 'Question', name: item.pregunta, acceptedAnswer: { '@type': 'Answer', text: item.respuesta } })) };

export function Component() {
  return (
    <>
      <Seo page="faq" title="Preguntas frecuentes" description="Respuestas sobre preparados magistrales, cotización de recetas, sucursales y atención a profesionales en MundoMagistral." schema={schema} ogImage="/media/og/faq.webp" />
      <section className="page-hero light" data-chapter="faq">
        <div className="container">
          <h1>Preguntas frecuentes</h1>
          <p className="lead">Respuestas directas para entender el servicio y encontrar tu siguiente paso.</p>
        </div>
      </section>
      <section className="section white" data-chapter="faq">
        <div className="container narrow faq-list">
          {faq.map((item) => <details key={item.id}><summary>{item.pregunta}</summary><p>{item.respuesta}</p></details>)}
          <div className="faq-contact"><h2>¿Tienes una receta?</h2><Link className="button button-primary" to="/cotizar">Cotizar receta</Link></div>
        </div>
      </section>
    </>
  );
}
