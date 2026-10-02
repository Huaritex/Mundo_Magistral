import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';
import PageHero from '../components/PageHero';
import LocationSelector from '../components/LocationSelector';
import { centralPhone, centralTel, centralWhatsapp } from '../content/data';

const centralEmail = 'info@mundomagistral.com';

export function Component() {
  return <>
    <Seo page="contacto" title="Contacto" description="Comunícate con MundoMagistral y encuentra tu sede en Bolivia: teléfonos, direcciones, correos y horarios de atención." />
    <PageHero eyebrow="Contacto / Estamos cerca" title="Estamos para ayudarte." description="Puedes escribirnos, llamarnos o encontrar la sede de MundoMagistral más cercana." image="/media/internal/contacto.webp" imageAlt="Atención personal en un mostrador de farmacia" chapter="contacto" variant="wide" actions={<><a className="button button-primary" href={centralWhatsapp} target="_blank" rel="noopener noreferrer">Contactar por WhatsApp <span aria-hidden="true">↗</span></a><a className="button button-outline-dark" href="#sucursales">Ver sucursales</a></>} />
    <section className="section white" data-chapter="contacto"><div className="container"><div className="internal-section-head"><p className="internal-eyebrow">Canales de atención</p><h2>Hablemos directamente.</h2></div><div className="internal-contact-methods"><article><span>01 / Teléfono</span><h3><a href={`tel:${centralTel}`}>{centralPhone}</a></h3><p>Atención central</p></article><article><span>02 / Correo</span><h3><a href={`mailto:${centralEmail}`}>{centralEmail}</a></h3><p>Escríbenos tu consulta</p></article><article><span>03 / WhatsApp</span><h3><a href={centralWhatsapp} target="_blank" rel="noopener noreferrer">Iniciar conversación ↗</a></h3><p>Usa nuestro canal de contacto directo</p></article></div></div></section>
    <section className="section light" id="sucursales" data-chapter="sedes"><div className="container"><div className="internal-section-head"><p className="internal-eyebrow">Nuestras sedes</p><h2>Encuentra tu punto de atención.</h2><p>Selecciona una ciudad para ver direcciones, horarios y canales de cada sede.</p></div><LocationSelector /><p className="internal-location-note">Los horarios pueden variar. Te recomendamos confirmar la atención antes de trasladarte.</p></div></section>
    <section className="section white" data-chapter="contacto"><div className="container internal-contact-end"><div><p className="internal-eyebrow">¿Ya tienes una receta?</p><h2>Podemos ayudarte a cotizarla.</h2></div><Link className="button button-primary" to="/cotizar">Cotizar receta <span aria-hidden="true">↗</span></Link></div></section>
  </>;
}
