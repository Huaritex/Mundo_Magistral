import { Composition, Still } from 'remotion';
import { HeroLoop, HeroBackdrop, HeroPoster, Explainer, Reel, OgCard, SceneTour, TOUR_SEGMENT } from './compositions';
import { MenuBackdrop } from './menu-backdrop';
import sedes from '../../site/src/content/sedes.json';
import especialidades from '../../site/src/content/especialidades.json';
import formas from '../../site/src/content/formas.json';

const ogPages = [
  { id: 'OgHome', title: 'Del mundo a tu fórmula', subtitle: 'Cada fórmula es única, como cada paciente.' },
  { id: 'OgNosotros', title: 'Nuestra historia', subtitle: 'Farmacia MundoMagistral desde 2019.' },
  { id: 'OgEspecialidades', title: 'Especialidades', subtitle: 'Ocho áreas de atención magistral.' },
  { id: 'OgFormas', title: 'Formas farmacéuticas', subtitle: 'Preparados según prescripción médica.' },
  { id: 'OgSucursales', title: 'Ocho sedes en Bolivia', subtitle: 'Encuentra la sede más cercana.' },
  { id: 'OgCotizar', title: 'Cotiza tu receta', subtitle: 'Tu fórmula comienza aquí.' },
  { id: 'OgMedicos', title: 'Para profesionales médicos', subtitle: 'Asesoramiento técnico continuo.' },
  { id: 'OgFaq', title: 'Preguntas frecuentes', subtitle: 'Conoce la formulación magistral.' },
];

export function Root() {
  return <>
    <Composition id="HeroLoop" component={HeroLoop} durationInFrames={240} fps={30} width={1920} height={1080} />
    <Composition id="HeroLoopVertical" component={HeroLoop} durationInFrames={240} fps={30} width={1080} height={1920} />
    <Composition id="HeroBackdrop" component={HeroBackdrop} durationInFrames={240} fps={30} width={1920} height={1080} />
    <Composition id="HeroBackdropVertical" component={HeroBackdrop} durationInFrames={240} fps={30} width={1080} height={1920} />
    <Still id="HeroPoster" component={HeroPoster} width={1800} height={810} />
    <Still id="HeroPosterPortrait" component={HeroPoster} width={900} height={1600} />
    <Composition id="MenuBackdrop" component={MenuBackdrop} durationInFrames={180} fps={30} width={1280} height={720} />
    <Composition id="MenuBackdropVertical" component={MenuBackdrop} durationInFrames={180} fps={30} width={720} height={1280} />
    <Composition id="Explainer" component={Explainer} durationInFrames={1080} fps={30} width={1920} height={1080} />
    <Composition id="SceneTour" component={SceneTour} durationInFrames={TOUR_SEGMENT * 6} fps={30} width={1080} height={1920} />
    {especialidades.map((item) => <Composition key={item.id} id={`ReelEspecialidad-${item.id}`} component={Reel} durationInFrames={450} fps={30} width={1080} height={1920} defaultProps={{ title: item.nombre, subtitle: 'Cada fórmula es única, como cada paciente.' }} />)}
    {formas.slice(0, 8).map((item) => <Composition key={item.id} id={`ReelForma-${item.id}`} component={Reel} durationInFrames={450} fps={30} width={1080} height={1920} defaultProps={{ title: item.nombre, subtitle: 'Según prescripción médica.' }} />)}
    {ogPages.map((page) => <Still key={page.id} id={page.id} component={OgCard} width={1200} height={630} defaultProps={{ title: page.title, subtitle: page.subtitle }} />)}
    {sedes.map((sede) => <Still key={sede.id} id={`OgSede-${sede.id}`} component={OgCard} width={1200} height={630} defaultProps={{ title: `MundoMagistral en ${sede.ciudad}`, subtitle: sede.direccion }} />)}
    {especialidades.map((item) => <Still key={item.id} id={`OgEspecialidad-${item.id}`} component={OgCard} width={1200} height={630} defaultProps={{ title: item.nombre, subtitle: 'Farmacia MundoMagistral' }} />)}
  </>;
}
