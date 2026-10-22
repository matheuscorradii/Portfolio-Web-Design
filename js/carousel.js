import { Spring, Loop } from './spring.js';

export function initCarousels() {
  /* ---------- Carousels: native scroll-snap + spring drag/momentum ---------- */
  const project = (v, d = 0.998) => (v / 1000) * d / (1 - d);       // Apple's momentum projection
  document.querySelectorAll('.carousel').forEach(c => {
    const t = c.querySelector('.car-track');
    const prev = c.querySelector('.prev'), next = c.querySelector('.next');
    const bar = c.querySelector('.car-progress i');
    const sx = new Spring(0, { response: 0.55 });
    const a = { springs: [sx], render() { t.scrollLeft = sx.x; }, done() { t.style.scrollSnapType = ''; } };
    const stop = () => { if (Loop.set.delete(a)) t.style.scrollSnapType = ''; };
    const max = () => t.scrollWidth - t.clientWidth;
    const points = () => [...t.children].map(el => Math.min(el.offsetLeft, max()));
    const nearest = x => points().reduce((b, p) => Math.abs(p - x) < Math.abs(b - x) ? p : b, 0);
    function glide(x, v = 0) {
      x = Math.max(0, Math.min(max(), x));
      t.style.scrollSnapType = 'none';
      if (!Loop.set.has(a)) { sx.snap(t.scrollLeft); }
      sx.v = v; sx.to(x); Loop.add(a);
    }
    const page = dir => {
      const cur = Loop.set.has(a) ? sx.t : t.scrollLeft, w = t.clientWidth * 0.85, ps = points();
      const target = dir > 0 ? (ps.filter(p => p <= cur + w).pop() || 0) : (ps.find(p => p >= cur - w) ?? 0);
      glide(target === cur ? (dir > 0 ? ps.find(p => p > cur + 2) ?? max() : ps.filter(p => p < cur - 2).pop() ?? 0) : target);
    };
    prev.addEventListener('click', () => page(-1));
    next.addEventListener('click', () => page(1));
    const sync = () => {
      const m = max(), f = m > 0 ? t.scrollLeft / m : 1;
      bar.style.transform = `scaleX(${Math.max(0.04, (t.clientWidth / t.scrollWidth) + f * (1 - t.clientWidth / t.scrollWidth))})`;
      prev.disabled = t.scrollLeft < 4; next.disabled = t.scrollLeft > m - 4;
    };
    t.addEventListener('scroll', sync, { passive: true }); addEventListener('resize', sync); sync();
    t.addEventListener('wheel', stop, { passive: true });
    t.addEventListener('touchstart', stop, { passive: true });

    // mouse drag: 1:1 tracking, then momentum projected onto the nearest snap point
    let drag = null, moved = false;
    t.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      stop(); moved = false;
      drag = { x0: e.clientX, s0: t.scrollLeft, hist: [[e.timeStamp, e.clientX]] };
    });
    t.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x0;
      if (!moved && Math.abs(dx) < 6) return;                         // hysteresis before committing
      if (!moved) { moved = true; t.setPointerCapture(e.pointerId); t.classList.add('dragging'); t.style.scrollSnapType = 'none'; }
      t.scrollLeft = drag.s0 - dx;
      drag.hist.push([e.timeStamp, e.clientX]); if (drag.hist.length > 6) drag.hist.shift();
    });
    const end = e => {
      if (!drag) return;
      const h = drag.hist, [t0, x0] = h[0], [t1, x1] = h[h.length - 1];
      drag = null;
      if (!moved) return;
      t.classList.remove('dragging');
      const v = t1 > t0 ? -(x1 - x0) / (t1 - t0) * 1000 : 0;           // scroll velocity, px/s
      glide(nearest(t.scrollLeft + project(v, 0.996)), v);
    };
    t.addEventListener('pointerup', end); t.addEventListener('pointercancel', end);
    t.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
    t.addEventListener('dragstart', e => e.preventDefault());
  });
}
