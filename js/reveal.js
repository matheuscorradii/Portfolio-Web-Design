import { RM, Spring, anim, clamp01 } from './spring.js';

export function initReveal() {
  /* ---------- Scroll reveal: varied depth ---------- */
  const DEPTHS = [180, 90, 260, 130];
  document.querySelectorAll('.reveal').forEach((el, i) => {
    const d = +el.dataset.depth || DEPTHS[i % DEPTHS.length];
    const p = new Spring(0, { response: 0.6 + d / 600 });          // farther = slower to arrive
    const kick = anim([p], () => {
      const q = 1 - p.x;
      el.style.opacity = clamp01(p.x * 1.3);
      if (!RM) el.style.transform = `perspective(1200px) translate3d(0, ${q * (20 + d * 0.12)}px, ${-d * q}px)`;
    }, () => { el.style.transform = ''; el.classList.add('in'); });
    el._reveal = () => { p.to(1); kick(); };
  });

  /* ---------- Galleries: 3D tilt + depth zoom + staggered entrance ---------- */
  const GI_DEPTHS = [240, 120, 190, 80];
  document.querySelectorAll('.car-track').forEach(g => {
    const items = [...g.querySelectorAll('.gi')];
    items.forEach((gi, i) => {
      const img = gi.querySelector('img');
      const glare = document.createElement('span'); glare.className = 'glare'; gi.appendChild(glare);
      const depth = GI_DEPTHS[i % GI_DEPTHS.length];
      const enter = new Spring(0, { response: 0.7 + depth / 700 });
      const rx = new Spring(0, { response: 0.45 }), ry = new Spring(0, { response: 0.45 });
      const mx = new Spring(0.5, { response: 0.35 }), my = new Spring(0.5, { response: 0.35 });
      const lift = new Spring(0, { response: 0.45 }), hov = new Spring(0, { response: 0.4 });
      const kick = anim([enter, rx, ry, mx, my, lift, hov], () => {
        const e = enter.x, q = 1 - e;
        gi.style.opacity = clamp01(e * 1.3);
        if (RM) return;
        gi.style.transform =
          `perspective(1000px) translate3d(0, ${q * 36}px, ${lift.x - depth * q}px) rotateX(${rx.x}deg) rotateY(${ry.x}deg)`;
        const h = hov.x;
        img.style.transform = `translate3d(${(0.5 - mx.x) * 14 * h}px, ${(0.5 - my.x) * 14 * h}px, 0) scale(${1 + 0.06 * h})`;
        glare.style.opacity = h * 0.9;
        glare.style.background = `radial-gradient(circle at ${mx.x * 100}% ${my.x * 100}%, rgba(255,255,255,.55), transparent 60%)`;
      }, () => {
        if (hov.t === 0 && enter.x === 1) { gi.style.transform = ''; img.style.transform = ''; gi.style.zIndex = ''; gi.classList.remove('lit'); }
      });
      gi._enter = () => { enter.to(1); kick(); };
      if (RM) return;
      gi.addEventListener('pointermove', ev => {
        if (ev.pointerType !== 'mouse') return;
        const r = gi.getBoundingClientRect();
        const px = clamp01((ev.clientX - r.left) / r.width), py = clamp01((ev.clientY - r.top) / r.height);
        ry.to((px - 0.5) * 12); rx.to((0.5 - py) * 10);
        mx.to(px); my.to(py); lift.to(48); hov.to(1);
        gi.style.zIndex = 2; gi.classList.add('lit');
        kick();
      });
      gi.addEventListener('pointerleave', () => {
        rx.to(0); ry.to(0); mx.to(0.5); my.to(0.5); lift.to(0); hov.to(0); kick();
      });
    });
    g._stagger = () => items.forEach((gi, i) => setTimeout(gi._enter, 120 + Math.min(i, 8) * 85));
  });

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const t = e.target;
      (t._reveal || t._stagger || (() => t.classList.add('in')))();
      io.unobserve(t);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal, .car-track, .pages').forEach(el => io.observe(el));
}
