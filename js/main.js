/* Inicialização — mesma ordem do antigo <script> inline do index.html. */
import { initReveal } from './reveal.js';
import { initLightbox } from './lightbox.js';
import { initCarousels } from './carousel.js';
import { initPages } from './pages.js';
import { initViewer } from './viewer.js';
import { initPress } from './press.js';
import { initNotebook } from './notebook.js';

initReveal();
initLightbox();
initCarousels();
initPages();
initViewer();
initPress();
initNotebook();

// Notebook 3D carregado à parte: se o CDN do Three.js falhar, o resto do site
// segue funcionando e o notebook em CSS fica como fallback.
import('./notebook3d.js').catch(err => console.warn('Notebook 3D indisponível, usando a versão CSS.', err));
