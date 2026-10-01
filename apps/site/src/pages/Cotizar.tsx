import { Seo } from '../components/Seo';
import RecetaForm from '../components/RecetaForm';
import ExplainerVideo from '../components/ExplainerVideo';
// PROPUESTO: titular e instrucciones del formulario; validar el flujo comercial y la política de datos antes de publicar.

export function Component() {
  return (
    <>
      <Seo page="cotizar" title="Cotizar receta magistral" description="Solicita una cotización de preparados magistrales en MundoMagistral. Elige tu sede y envía tu receta de forma segura." ogImage="/media/og/cotizar.webp" />
      <section className="page-hero quote-hero light" data-chapter="cotizar">
        <div className="container">
          <h1>Cotiza tu receta en tres pasos.</h1>
          <p className="lead">Elige una sede, adjunta tu receta y envía tu solicitud. Si el envío seguro todavía no está habilitado, podrás continuar por WhatsApp y adjuntar el archivo allí.</p>
        </div>
      </section>
      <section className="quote-section light" data-chapter="cotizar"><div className="container"><RecetaForm /></div></section>
      <ExplainerVideo />
    </>
  );
}
