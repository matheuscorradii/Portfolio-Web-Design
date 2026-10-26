import { RM, clamp01 } from './spring.js';

/* Hero: a entrada é CSS (foto e textos). Aqui só a saída ligada ao scroll:
   a foto encolhe pra um card e escurece, o nome sobe e some, abrindo a próxima tela. */
export function initHero() {
  const hero = document.querySelector('.hero');
  const media = hero && hero.querySelector('.hero-media');
  if (!media || RM) return;                 // sem o hero com foto, não faz nada (não derruba o resto)
  const img = media.querySelector('img');
  const name = hero.querySelector('.h-name'), small = [...hero.querySelectorAll('.h-in')];
  const ease = t => 1 - Math.pow(1 - t, 3);

  // depois da animação de entrada, a imagem passa a obedecer só às variáveis do scroll
  img.addEventListener('animationend', () => { img.style.animation = 'none'; }, { once: true });
  small.forEach(el => el.addEventListener('animationend', () => {
    el.style.animation = 'none'; el.style.transform = 'none'; el.dataset.entered = '';
    el.style.opacity = 1 - clamp01(scrollP() / 0.35);
  }, { once: true }));

  const scrollP = () => { const b = hero.getBoundingClientRect(); return clamp01(-b.top / Math.max(1, b.height - innerHeight)); };
  function render() {
    const p = scrollP(), e = ease(p);
    media.style.setProperty('--ct', e * 7 + '%');
    media.style.setProperty('--cx', e * 9 + '%');
    media.style.setProperty('--cb', e * 16 + '%');
    media.style.setProperty('--cr', e * 28 + 'px');
    img.style.setProperty('--zs', 1 + e * 0.08);
    img.style.setProperty('--zb', (0.82 - e * 0.5).toFixed(3));
    name.style.transform = `translate3d(0, ${-e * 22}vh, 0)`;
    name.style.opacity = 1 - clamp01((p - 0.25) / 0.5);
    // (o Chrome devolve style.animation por extenso, então a marca é um data-attribute)
    small.forEach(el => { if ('entered' in el.dataset) el.style.opacity = 1 - clamp01(p / 0.35); });
  }
  let tick = false;
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(() => { tick = false; render(); }); } }, { passive: true });
  addEventListener('resize', render);
}
