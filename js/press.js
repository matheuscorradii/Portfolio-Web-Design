import { RM, Spring, anim } from './spring.js';

export function initPress() {
  /* ---------- Press feedback: buttons + nav ---------- */
  if (!RM) document.querySelectorAll('.btn, nav.links a, .brand, .car-btn, .vw-btn, .pg-open').forEach(el => {
    const sc = new Spring(1), y = new Spring(0, { response: 0.4 });
    const isBtn = el.classList.contains('btn');
    if (!isBtn && getComputedStyle(el).display === 'inline') el.style.display = 'inline-block';
    const kick = anim([sc, y], () => { el.style.transform = `translate3d(0, ${y.x}px, 0) scale(${sc.x})`; },
      () => { if (sc.x === 1 && y.x === 0) el.style.transform = ''; });
    const release = () => { sc.to(1, { damping: 0.55, response: 0.42 }); kick(); };
    el.addEventListener('pointerdown', () => { sc.to(isBtn ? 0.94 : 0.9, { damping: 1, response: 0.1 }); kick(); });
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('pointerenter', e => { if (isBtn && e.pointerType === 'mouse') { y.to(-2); kick(); } });
    el.addEventListener('pointerleave', () => { y.to(0); release(); });
  });
}
