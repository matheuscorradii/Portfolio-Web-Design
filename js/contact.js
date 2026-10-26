/* Formulário de contato: valida e abre o app de e-mail do visitante já preenchido.
   shortcut: sem servidor, o envio depende do app de e-mail do visitante; pra receber direto
   na caixa de entrada, troque por um serviço de formulário (ex.: Formspree) no action do <form>. */
const TO = 'contatomatheuscorradi@gmail.com';

export function initContact() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const note = form.querySelector('.c-note');
  form.addEventListener('input', e => e.target.removeAttribute('aria-invalid'));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const bad = [...form.elements].filter(el => el.willValidate && !el.checkValidity());
    bad.forEach(el => el.setAttribute('aria-invalid', 'true'));
    if (bad.length) { note.textContent = 'Preencha nome, um e-mail válido e a mensagem.'; bad[0].focus(); return; }
    const f = Object.fromEntries(new FormData(form));
    const subject = `Contato pelo portfólio — ${f.nome}`;
    const body = `${f.mensagem}\n\n— ${f.nome} (${f.email})`;
    location.href = `mailto:${TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    note.textContent = 'Abrindo seu app de e-mail com a mensagem pronta…';
  });
}
