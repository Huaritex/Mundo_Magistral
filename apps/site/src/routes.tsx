import type { RouteRecord } from 'vite-react-ssg';
import Layout from './Layout';

// Cada página es un módulo lazy con `export const Component` (las dinámicas exportan además getStaticPaths).
// URLs idénticas a apps/web (trailingSlash: never). '404' genera 404.html; '*' cubre URLs desconocidas en cliente.
export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, lazy: () => import('./pages/Home') },
      { path: 'nosotros', lazy: () => import('./pages/Nosotros') },
      { path: 'quienes-somos', lazy: () => import('./pages/Nosotros') },
      { path: 'equipo', lazy: () => import('./pages/Equipo') },
      { path: 'servicios', lazy: () => import('./pages/Servicios') },
      { path: 'noticias', lazy: () => import('./pages/Noticias') },
      { path: 'contacto', lazy: () => import('./pages/Contacto') },
      { path: 'especialidades', lazy: () => import('./pages/Especialidades') },
      { path: 'especialidades/:slug', lazy: () => import('./pages/EspecialidadDetalle') },
      { path: 'formas-farmaceuticas', lazy: () => import('./pages/FormasFarmaceuticas') },
      { path: 'sucursales', lazy: () => import('./pages/Sucursales') },
      { path: 'sucursales/:slug', lazy: () => import('./pages/SucursalDetalle') },
      { path: 'medicos', lazy: () => import('./pages/Medicos') },
      { path: 'cotizar', lazy: () => import('./pages/Cotizar') },
      { path: 'preguntas-frecuentes', lazy: () => import('./pages/PreguntasFrecuentes') },
      { path: 'privacidad', lazy: () => import('./pages/Privacidad') },
      { path: '404', lazy: () => import('./pages/NotFound') },
      { path: '*', lazy: () => import('./pages/NotFound') },
    ],
  },
];
