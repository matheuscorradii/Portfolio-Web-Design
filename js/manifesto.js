import { clamp01 } from './spring.js';

/* Manifesto: o card cresce até tela cheia com o scroll e a frase entra em foco palavra a palavra.
   Em modo leve (celular / reduced motion, classe mac-lite) fica tudo estático e visível. */
export function initManifesto() {
  const box = document.querySelector('.mf');
  if (!box) return;
  const card = box.querySelector('.mf-card'), title = box.querySelector('.mf-title'),
        hint = box.querySelector('.mf-hint'), steps = box.querySelector('.mf-steps'), text = box.querySelector('.mf-text');

  // quebra a frase em palavras sem perder o <em>
  const words = [];
  (function split(n) {
    [...n.childNodes].forEach(c => {
      if (c.nodeType === 1) return split(c);
      const frag = document.createDocumentFragment();
      c.textContent.split(/(\s+)/).forEach(t => {
        if (!t.trim()) return frag.append(t);
        const w = document.createElement('span'); w.className = 'w'; w.textContent = t; words.push(w); frag.append(w);
      });
      c.replaceWith(frag);
    });
  })(text);

  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const seg = (p, a, b) => clamp01((p - a) / (b - a));
  const set = (el, o, blur = 0) => { el.style.opacity = o; el.style.filter = blur ? `blur(${blur}px)` : ''; };

  function render() {
    if (document.documentElement.classList.contains('mac-lite')) {
      [card, title, hint, steps, ...words].forEach(el => { el.style.cssText = ''; });
      return;
    }
    const b = box.getBoundingClientRect(), p = clamp01(-b.top / Math.max(1, b.height - innerHeight));
    const e = ease(seg(p, 0, 0.42)), narrow = innerWidth < 900;
    card.style.setProperty('--iy', (1 - e) * 22 + '%');
    card.style.setProperty('--ix', (1 - e) * (narrow ? 10 : 30) + '%');
    card.style.setProperty('--r', (1 - e) * 18 + 'px');
    card.style.setProperty('--p', e.toFixed(3));
    set(title, 1 - seg(p, 0.22, 0.4));
    set(hint, 1 - seg(p, 0, 0.08));
    const n = words.length;
    words.forEach((w, k) => { const t = seg(p, 0.42 + k / n * 0.32, 0.5 + k / n * 0.32); set(w, 0.12 + 0.88 * t, (1 - t) * 8); });
    set(steps, seg(p, 0.8, 0.92));
  }
  let tick = false;
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(() => { tick = false; render(); }); } }, { passive: true });
  addEventListener('resize', render);
  render();
}
