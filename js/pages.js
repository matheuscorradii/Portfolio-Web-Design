import { RM, Spring, Loop, clamp01 } from './spring.js';

export function initPages() {
  /* ---------- Sales pages: scrollable widgets + "ver mais" ---------- */
  const pagesGrid = document.getElementById('pages');
  const pgEnter = el => {
    const p = new Spring(0, { response: 0.75 });
    Loop.add({ springs: [p], render() {
      el.style.opacity = clamp01(p.x * 1.3);
      if (!RM) el.style.transform = `perspective(1000px) translate3d(0, ${(1 - p.x) * 40}px, ${-(1 - p.x) * 160}px)`;
    }, done() { el.style.transform = ''; } });
    p.to(1);
  };
  pagesGrid._stagger = () => [...pagesGrid.querySelectorAll('.pg:not(.more)')].forEach((el, i) => setTimeout(() => pgEnter(el), 100 + i * 80));
  pagesGrid.querySelectorAll('.pg-scroll').forEach(sc =>
    sc.addEventListener('scroll', () => sc.parentElement.classList.add('scrolled'), { passive: true, once: true }));
  const moreBtn = document.getElementById('pagesMore');
  moreBtn.addEventListener('click', () => {
    pagesGrid.classList.add('expanded');
    pagesGrid.querySelectorAll('.pg.more').forEach((el, i) => setTimeout(() => pgEnter(el), i * 70));
    moreBtn.parentElement.remove();
  });
}
