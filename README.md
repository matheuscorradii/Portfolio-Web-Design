# Matheus Corradi — Portfólio

**A arte de vender com os olhos.**

Portfólio pessoal de [Matheus Corradi](https://linkedin.com/in/matheus-corradi), designer digital e web specialist com 4+ anos de experiência em páginas de lançamento, venda e captura, anúncios (Meta Ads, Google Ads) e social media.

<!-- 🔗 **[Ver o site no ar](https://portfolio-matheuscorradii.vercel.app)** -->

---

## Sobre este projeto

Todo profissional de design acumula trabalho — mas poucos conseguem mostrá-lo de um jeito que realmente convence alguém a contratar. Um portfólio bom não é uma lista de projetos: é a prova de que um trabalho funciona, contado através do próprio trabalho.

Foi essa a ideia aqui. Em vez de uma "carta comercial" cheia de texto institucional, o site funciona como uma galeria: pouca leitura, os cases falando por si — números reais, clientes reais, resultado real. Quem visita deve sair com uma impressão simples: **confiança**.

### Por que ter um portfólio importa

- **Substitui a indicação** — quando alguém pede "me mostra algo que você já fez", o link resolve em segundos, sem depender de prints perdidos no WhatsApp.
- **Filtra o cliente certo** — mostrar o tipo de trabalho que você quer fazer atrai o tipo de cliente que você quer atender.
- **É prova, não promessa** — qualquer um pode dizer que é bom; um portfólio mostra.
- **Fica no ar o tempo todo** — trabalha por você mesmo quando você não está respondendo mensagem.

## O que tem no site

- **Método** — como o processo de trabalho funciona, fase a fase (briefing → design/construção → entrega)
- **5 cases reais**, com contexto e números:
  - Campanha eleitoral 2024 — 25+ candidatos, sozinho, em 2 meses
  - Lançamento "Geriatria na Prática" — curso de 6 dígitos, ciclo completo de design
  - 300+ páginas de venda em nichos variados
  - E-commerce Serafine — loja de cerâmica refeita do zero
  - Social media — Bergamin Sociedade de Advogados e outros clientes
- **Sobre** — trajetória (Sistemas de Informação → design) e forma de trabalhar
- **Contato** — e-mail direto

## Stack

Site estático — HTML, CSS e JavaScript puro (ES modules), sem build. A única dependência é o [Three.js](https://threejs.org), carregado via CDN para o notebook 3D. Hospedado na [Vercel](https://vercel.com), com deploy automático a cada push na branch `main`.

## Estrutura

```
├── index.html          # página única: só a marcação
├── css/
│   ├── base.css        # tokens de cor/tema, reset, tipografia, movimento reduzido
│   ├── layout.css      # nav, hero, seções, sobre, contato, rodapé
│   ├── components.css  # botões, galerias, carrosséis, visualizador, lightbox
│   └── notebook.css    # notebook da galeria, "mundo branco" e barra estilo macOS
├── js/
│   ├── main.js         # inicialização
│   ├── spring.js       # motor de animação por spring
│   ├── reveal.js       # entradas no scroll + galerias
│   ├── lightbox.js
│   ├── carousel.js
│   ├── pages.js        # páginas de venda + "ver mais"
│   ├── viewer.js       # visualizador de várias páginas
│   ├── press.js        # feedback de toque nos botões
│   ├── notebook.js     # abertura/fechamento do notebook no scroll
│   └── notebook3d.js   # notebook em 3D (Three.js)
└── assets/
    └── img/            # imagens dos cases, organizadas por projeto
```

Para rodar localmente, use um servidor (ES modules não carregam via `file://`):

```
npx serve .
```

## Contato

📧 [contatomatheuscorradi@gmail.com](mailto:contatomatheuscorradi@gmail.com)
💼 [linkedin.com/in/matheus-corradi](https://linkedin.com/in/matheus-corradi)
🎨 [behance.net/matheuscorradi](https://behance.net/matheuscorradi)"# portfolio" 
