// PROPUESTO: titular y texto; secuencia de servicio pendiente de validación operativa y de Dirección Técnica.
export default function ExplainerVideo() {
  return (
    <section className="section light explainer-section" data-chapter="cotizar">
      <div className="container split split-even">
        <div>
          <h2>¿Cómo comienza tu fórmula?</h2>
          <p className="lead">Un recorrido breve desde la receta médica hasta la atención en tu sede.</p>
        </div>
        <video controls preload="none" playsInline poster="/media/og/cotizar.webp" width={960} height={540} aria-label="Video: cómo solicitar una cotización de receta magistral">
          <source src="/media/explainer.mp4" type="video/mp4" />
          <track kind="captions" src="/media/explainer.vtt" srcLang="es" label="Español" default />
          Tu navegador no puede reproducir este video.
        </video>
      </div>
    </section>
  );
}
