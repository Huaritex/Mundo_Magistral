import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { formas } from '../content/data';

type Forma = (typeof formas)[number] & { imagen?: string };

/**
 * Formas farmacéuticas (antes forms-client.js). Emite mm:form-select como el script original: el Stage 3D cambia de objeto.
 * La "placa" de la derecha es el banner de producto (VERIFICADO) y solo se ve sin Stage 3D; con Stage conserva sus medidas
 * pero se vuelve hueco para que el objeto 3D viva detrás (sin salto de layout).
 */
export default function FormsExplorer({ children }: { children?: ReactNode }) {
  const [active, setActive] = useState(0);
  const items = formas as Forma[];
  const current = items[active];
  const select = (index: number) => {
    setActive(index);
    document.dispatchEvent(new CustomEvent('mm:form-select', { detail: { forma: items[index].figura } }));
  };
  return (
    <div className="forms-layout">
      <div className="forms-panel">
        {children}
        <div className="forms-tabs" role="group" aria-label="Elegir forma farmacéutica">
          {items.map((forma, index) => (
            <button key={forma.id} className={index === active ? 'form-tab active' : 'form-tab'} type="button" data-forma={forma.figura} data-imagen={forma.imagen} aria-pressed={index === active} onClick={() => select(index)}>{forma.nombre}</button>
          ))}
        </div>
        <div className="form-copy" aria-live="polite">
          <h3 id="selected-form">{current.nombre}</h3>
          <p>Consulta si esta forma corresponde a la receta indicada por tu profesional de salud.</p>
          <Link className="button button-primary" to="/cotizar">Cotizar con mi receta</Link>
        </div>
      </div>
      <div className="form-plate" aria-hidden="true">
        <img id="form-product" className="form-product" src={current.imagen} width={900} height={166} alt="" loading="lazy" decoding="async" hidden={!current.imagen} />
      </div>
    </div>
  );
}
