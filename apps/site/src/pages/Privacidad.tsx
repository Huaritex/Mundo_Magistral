import { Seo } from '../components/Seo';
import { retentionDays, uploadEnabled } from '../lib/site';

export function Component() {
  return (
    <>
      <Seo page="privacidad" title="Privacidad de las solicitudes" description="Información sobre el tratamiento de datos y recetas enviados para cotización a MundoMagistral." />
      {/* PROPUESTO: texto legal operativo. Revisión y aprobación del cliente/asesoría legal antes del lanzamiento. */}
      <section className="page-hero light" data-chapter="faq"><div className="container"><h1>¿Qué pasa con los datos de tu receta?</h1><p className="lead">Tu receta contiene información de salud. Aquí explicamos cómo se usará al solicitar una cotización.</p></div></section>
      <section className="section white"><div className="container narrow privacy-prose"><h2>¿Qué recibimos?</h2><p>Al enviar el formulario recibimos tu nombre, número de contacto, sede elegida, observaciones y el archivo de tu receta. Usamos estos datos para revisar y responder tu solicitud de cotización.</p><h2>¿Quién accede?</h2><p>El acceso a la receta debe quedar limitado al personal autorizado de MundoMagistral que atiende tu solicitud. La receta no se publica en este sitio.</p><h2>¿Cuánto tiempo la conservamos?</h2><p>{uploadEnabled ? `Conservamos los datos y el archivo de tu solicitud durante ${retentionDays} días. Después de ese plazo dejan de estar disponibles para el personal y se eliminan del almacenamiento privado según la regla de retención configurada.` : 'MundoMagistral informará el plazo de conservación antes de habilitar el envío de recetas desde este sitio.'}</p><h2>¿Y si continúo por WhatsApp?</h2><p>Si eliges continuar por WhatsApp, el archivo se adjunta manualmente en el chat y queda sujeto también a las condiciones de ese servicio. El enlace de esta página no adjunta tu receta de forma automática.</p><h2>¿Cómo hago una consulta?</h2><p>Para consultar sobre una solicitud o pedir información sobre el tratamiento de tus datos, comunícate con la línea central indicada en el pie del sitio.</p></div></section>
    </>
  );
}
