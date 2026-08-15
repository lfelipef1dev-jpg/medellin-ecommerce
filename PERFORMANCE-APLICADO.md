# Performance – alterações aplicadas (2026-02-10)

Resumo do que foi implementado conforme o **PLANO-RESOLUCAO-PERFORMANCE-COMPLETO.md**.

---

## 1. config.js

- **Preload:** mantido apenas o banner hero (`assets/medellin-banner-hero.png`). Removidos preloads de logo, 4 imagens VIP e do CSS do Google Fonts (evita competição por banda e melhora LCP).
- **MutationObserver:** nós reescritos passam a receber `data-medellin-rewritten="1"` e são ignorados em reprocessamento; callback usa `for` em vez de `forEach` para menor custo.

---

## 2. Script duplicado (app.js)

- **checkout.html:** removida a segunda tag `<script src="app.js">` que estava antes do script inline de steps.
- **Demais páginas:** em todas as que tinham `app.js` só no final do body, o script foi movido para o `<head>` com `defer` e a tag do rodapé foi removida. Cada página carrega `app.js` **uma única vez**.

---

## 3. CSS não bloqueante (index e checkout)

- **index.html** e **checkout.html:** o `<link rel="stylesheet" href="style.css">` foi trocado por:
  - `rel="preload" as="style"` + `onload="this.onload=null;this.rel='stylesheet'"` para carregar o CSS sem bloquear a primeira pintura.
  - `<noscript><link rel="stylesheet" href="style.css?v=20260210-perf"></noscript>` para quem não tem JS.
- Versão do CSS nessas páginas: `?v=20260210-perf`.

---

## 4. Cache (_headers)

- Criado **`_headers`** na raiz do projeto para Cloudflare Pages:
  - `*.html`: `Cache-Control: public, max-age=0, must-revalidate`
  - `*.css` e `*.js`: `Cache-Control: public, max-age=31536000, immutable`
- Garante cache longo para CSS/JS (com versionamento na URL) e revalidação para HTML.

---

## 5. Páginas de detalhe (dns-prefetch, preconnect, app.js, style version)

- Em todas as páginas de produto/detalhe (vip-*.html, promocoes, vips-temporadas, rolygram-*, mochila-*, outros-*, salario-detalhe, pet-detalhe, voucher-detalhe, especial-detalhe, armas-detalhe, oferta-*, super-combo-*, painel, armas-skins, blindados-voadores, veiculos, etc.):
  - Adicionados **dns-prefetch** e **preconnect** para o origin do R2 (`https://pub-89b867ec225e45518f185a48a96ed88e.r2.dev`).
  - **app.js** no `<head>` com `defer` e versão adequada (`?v=20260210-perf` ou a que a página já usava).
  - **style.css** com query string de versão onde faltava (`?v=20260210-perf` ou a existente).

---

## 6. Versões

- **index e checkout:** `style.css?v=20260210-perf` e `app.js?v=20260210-perf`.
- Outras páginas mantêm ou usam `?v=20260210-perf` conforme o caso.

---

## O que não foi feito (opcional)

- **Minificação (CSS/JS):** não foi adicionado passo de build para gerar .min; pode ser feito depois no script de deploy (ex.: npx terser, cssnano).
- **Critical CSS inline:** não foi extraído critical CSS; o uso de preload+onload já reduz o bloqueio de renderização.
- **WebP/AVIF:** não foram geradas versões alternativas das imagens; pode ser feito em etapa futura.

---

## Como validar

1. **Network (DevTools):** em qualquer página, filtrar por `app.js` → deve haver **uma única** requisição.
2. **Network:** no carregamento do index, deve haver **um** preload de imagem (hero) e o CSS como preload que vira stylesheet.
3. **Lighthouse:** rodar em index/checkout e verificar “Eliminate render-blocking resources” e LCP.
4. **Deploy:** incluir o arquivo **`_headers`** na pasta de output do deploy para o Cloudflare Pages aplicar os headers de cache.

---

*Alterações aplicadas em 10/02/2026.*
