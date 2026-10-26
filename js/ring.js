import { RM, Spring, anim } from './spring.js';

/* Ring 3D: posts num anel que gira com arraste (momentum + snap), setas e swipe horizontal do trackpad.
   O anel tem SLOTS posições; os posts passam por elas (troca a imagem enquanto o slot está de costas),
   assim o raio fica pequeno o bastante pra curva aparecer mesmo com 52 posts. */
export function initRing() {
  const project = (v, d = 0.996) => (v / 1000) * d / (1 - d);
  document.querySelectorAll('[data-ring]').forEach(wrap => {
    const ring = wrap.querySelector('.ring'), spin = ring.querySelector('.ring-spin');
    const all = [...spin.querySelectorAll('.gi')];
    const posts = all.map(el => { const i = el.querySelector('img'); return [i.getAttribute('src'), i.alt]; });
    const SLOTS = Math.min(24, all.length), items = all.slice(0, SLOTS), n = SLOTS, step = 360 / n;
    all.slice(SLOTS).forEach(el => el.remove());
    const shown = items.map((el, k) => k);
    let R = 0, degPerPx = 0;
    const a = new Spring(0, { response: 0.7 });
    const render = () => {
      spin.style.transform = `rotateX(-5deg) translateZ(${-R}px) rotateY(${a.x}deg)`;
      const f = a.x / step;                                             // índice (contínuo) do post de frente
      items.forEach((el, k) => {
        const idx = k + n * Math.round((f - k) / n);                   // volta do anel em que esse slot está
        const post = ((idx % posts.length) + posts.length) % posts.length;
        if (shown[k] !== post) { shown[k] = post; const im = el.firstElementChild; im.src = posts[post][0]; im.alt = posts[post][1]; }
        const c = Math.cos((a.x - k * step) * Math.PI / 180);         // 1 = de frente, 0 = de lado
        el.style.opacity = c < 0.05 ? 0 : (0.25 + 0.75 * c).toFixed(3);
        el.style.pointerEvents = c > 0.7 ? '' : 'none';
      });
    };
    const kick = anim([a], render);
    function size() {
      const cw = items[0].offsetWidth, gap = cw * 0.1;
      R = n * (cw + gap) / (2 * Math.PI);
      degPerPx = 360 / (2 * Math.PI * R);
      items.forEach((el, k) => { el.style.transform = `rotateY(${-k * step}deg) translateZ(${R}px)`; });
      render();
    }
    const snapTo = (deg, v = 0) => { a.v = v; a.to(Math.round(deg / step) * step); kick(); };
    wrap.querySelector('.next').addEventListener('click', () => snapTo(a.t + step));
    wrap.querySelector('.prev').addEventListener('click', () => snapTo(a.t - step));

    let d = null, moved = false;
    ring.addEventListener('pointerdown', e => {
      if (e.button) return;
      d = { x0: e.clientX, a0: a.x, h: [[e.timeStamp, e.clientX]] }; moved = false;
    });
    ring.addEventListener('pointermove', e => {
      if (!d) return;
      const dx = e.clientX - d.x0;
      if (!moved && Math.abs(dx) < 6) return;
      if (!moved) { moved = true; ring.setPointerCapture(e.pointerId); ring.classList.add('dragging'); }
      a.snap(d.a0 + dx * degPerPx); render();                         // 1:1 com o dedo no card da frente
      d.h.push([e.timeStamp, e.clientX]); if (d.h.length > 6) d.h.shift();
    });
    const end = () => {
      if (!d) return;
      const h = d.h; d = null;
      if (!moved) return;
      ring.classList.remove('dragging');
      const [t0, x0] = h[0], [t1, x1] = h[h.length - 1];
      const v = t1 > t0 ? (x1 - x0) / (t1 - t0) * 1000 * degPerPx : 0;   // deg/s
      snapTo(a.x + (RM ? 0 : project(v)), v);
    };
    ring.addEventListener('pointerup', end); ring.addEventListener('pointercancel', end);
    ring.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
    ring.addEventListener('dragstart', e => e.preventDefault());
    let wt;
    ring.addEventListener('wheel', e => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;            // só swipe horizontal; scroll vertical passa
      e.preventDefault();
      a.snap(a.x - e.deltaX * degPerPx); render();
      clearTimeout(wt); wt = setTimeout(() => snapTo(a.x), 120);
    }, { passive: false });
    addEventListener('resize', size);
    size();
  });
}
