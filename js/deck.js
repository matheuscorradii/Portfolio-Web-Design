import { RM } from './spring.js';

/* Flick deck: o card do topo segue o arraste; solto com força ou longe o bastante
   ele voa e vai pro fundo do baralho, senão volta com mola. Clique sem arrastar abre o lightbox. */
export function initDeck() {
  document.querySelectorAll('[data-deck]').forEach(wrap => {
    const deck = wrap.querySelector('.deck');
    const cards = [...deck.querySelectorAll('.gi')];
    const count = wrap.querySelector('.car-count');
    const n = cards.length;
    let top = 0, busy = false;
    const TILT = [0, -3, 2.5, -1.5];

    function layout() {
      cards.forEach((el, k) => {
        const pos = (k - top + n) % n;
        el.style.setProperty('--s', Math.min(pos, 3));
        el.style.setProperty('--rot', (TILT[pos] ?? 0) + 'deg');
        el.style.zIndex = n - pos;
        el.toggleAttribute('data-top', pos === 0);
        el.toggleAttribute('data-hide', pos > 3);
      });
      count.textContent = `${String(top + 1).padStart(2, '0')} / ${n}`;
    }
    function fly(dir, vx = 0) {
      if (busy) return; busy = true;
      const el = cards[top], w = deck.offsetWidth;
      el.classList.remove('drag'); el.classList.add('fly');
      el.style.setProperty('--dx', dir * w * 1.6 + vx * 0.12 + 'px');
      el.style.setProperty('--rot', dir * 18 + 'deg');
      setTimeout(() => {
        el.classList.remove('fly'); el.style.transition = 'none';
        el.style.removeProperty('--dx'); el.style.removeProperty('--dy');
        top = (top + 1) % n; layout();
        void el.offsetWidth; el.style.transition = '';
        busy = false;
      }, RM ? 0 : 420);
    }
    function back() {                                                  // traz o último card de volta ao topo
      if (busy) return;
      top = (top - 1 + n) % n; layout();
    }
    wrap.querySelector('.next').addEventListener('click', () => fly(1));
    wrap.querySelector('.prev').addEventListener('click', back);

    let d = null, moved = false;
    deck.addEventListener('pointerdown', e => {
      const el = e.target.closest('.gi[data-top]');
      if (!el || busy || e.button) return;
      d = { el, x0: e.clientX, y0: e.clientY, h: [[e.timeStamp, e.clientX]] }; moved = false;
    });
    deck.addEventListener('pointermove', e => {
      if (!d) return;
      const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
      if (!moved && Math.hypot(dx, dy) < 6) return;
      if (!moved) { moved = true; d.el.setPointerCapture(e.pointerId); d.el.classList.add('drag'); }
      d.el.style.setProperty('--dx', dx + 'px');
      d.el.style.setProperty('--dy', dy * 0.4 + 'px');
      d.el.style.setProperty('--rot', dx * 0.06 + 'deg');
      d.h.push([e.timeStamp, e.clientX]); if (d.h.length > 6) d.h.shift();
    });
    const end = e => {
      if (!d) return;
      const { el, h, x0 } = d; d = null;
      if (!moved) return;
      const [t0, a] = h[0], [t1, b] = h[h.length - 1];
      const vx = t1 > t0 ? (b - a) / (t1 - t0) * 1000 : 0, dx = e.clientX - x0;
      if (Math.abs(dx) > deck.offsetWidth * 0.3 || Math.abs(vx) > 650) fly(Math.sign(dx || vx), vx);
      else { el.classList.remove('drag'); el.style.removeProperty('--dx'); el.style.removeProperty('--dy'); layout(); }
    };
    deck.addEventListener('pointerup', end); deck.addEventListener('pointercancel', end);
    deck.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
    deck.addEventListener('dragstart', e => e.preventDefault());
    deck.tabIndex = 0;
    deck.setAttribute('aria-label', 'Baralho de cards — setas para navegar');
    deck.addEventListener('keydown', e => { if (e.key === 'ArrowRight') fly(1); if (e.key === 'ArrowLeft') back(); });
    layout();
  });
}
