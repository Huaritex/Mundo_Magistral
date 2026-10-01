import { ViteReactSSG } from 'vite-react-ssg';
import { routes } from './routes';
import { installNavigation } from './motion/navigation';
import './styles/tokens.css';
import './styles/global.css';
import './styles/pages.css';
import './styles/nav.css';
import './styles/scroll-motion.css';
import './styles/transitions.css';
import '@mm/brand/tokens.css';

// installNavigation (solo cliente): View Transitions nativas en toda navegación entre páginas + eventos de navegación.
export const createRoot = ViteReactSSG({ routes }, ({ router, isClient }) => {
  if (isClient && router) installNavigation(router);
});
