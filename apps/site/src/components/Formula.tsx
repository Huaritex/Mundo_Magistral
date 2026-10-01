import type { ReactNode } from 'react';
import { verifiedCopy } from '../content/data';

// VERIFICADO: la frase ancla y el texto de filosofía salen de verifiedCopy.philosophy (se parte en la primera frase; no se reescribe).
// PROPUESTO: las tres "cantidades" (en cada fórmula / con cada paciente / en cada preparación) reutilizan palabras del mismo
// texto verificado; requieren aprobación del cliente.
const [anchor, ...rest] = verifiedCopy.philosophy.split('. ');
const elaboration = rest.join('. ');

const terms = [
  { term: 'Rigor científico', amount: 'en cada fórmula' },
  { term: 'Empatía', amount: 'con cada paciente' },
  { term: 'Compromiso', amount: 'en cada preparación' },
];

/**
 * La fórmula de la filosofía: Rigor científico + Empatía + Compromiso = "Cada fórmula es única, como cada paciente."
 * Único momento memorable del sitio (home y /nosotros). Capítulo 'formula' del Stage (mortero), que pasa a la pose
 * 'filosofia' cuando aparece el resultado (motion-reveals, escena "formula"). Sin JS / tier 1 / ?rm=1 todo es visible.
 * `children` = llamada a la acción bajo el texto.
 */
export default function Formula({ children }: { children?: ReactNode }) {
  return (
    <section className="section formula light" data-chapter="formula" data-pin="" aria-labelledby="formula-title">
      <div className="container formula-grid">
        <p className="formula-rp" aria-hidden="true">Rp/</p>
        <dl className="leaders formula-terms">
          {terms.map(({ term, amount }) => (
            <div key={term}><dt>{term}</dt><dd>{amount}</dd></div>
          ))}
        </dl>
        <div className="formula-result">
          <span className="formula-equals" aria-hidden="true">=</span>
          <h2 id="formula-title">{`${anchor}.`}</h2>
        </div>
        <div className="formula-foot">
          <p>{elaboration}</p>
          {children}
        </div>
      </div>
    </section>
  );
}
