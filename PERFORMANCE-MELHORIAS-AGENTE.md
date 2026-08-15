# Medellin VIP Store – Performance: análise e o que a agente deve fazer

Análise do site **vip-store-web** (index, checkout, páginas de detalhe, assets) com base em boas práticas atuais (Core Web Vitals, web.dev, Google, 2024/2025). Este arquivo serve como guia para a **agente** (ou para você) aplicar as melhorias.

---

## Resumo do que foi analisado

- **index.html**: ~145k caracteres, ~113 imagens, dezenas de cards de produto inline; hero + grid.
- **checkout.html**, **vip-*.html**, **promocoes.html**, etc.: estrutura similar, header/footer repetidos.
- **style.css**: ~68 KB (não minificado).
- **app.js**: ~30 KB (não minificado).
- **config.js**: ~7,4 KB; aplica IMAGE_BASE (R2), preloads, MutationObserver para reescrever `src`/`srcset`.
- **Assets**: imagens em R2 (pub-89b867ec...); muitas PNGs (vips, armas, especial, pets, etc.).
- **Deploy**: Cloudflare Pages (wrangler.toml); HTML/CSS/JS estáticos.

---

## Pontos que a agente pode melhorar (por prioridade)

### 1. **Evitar carregar app.js duas vezes**

**Problema:** Em **checkout.html**, **vips-temporadas.html**, **promocoes.html**, **vip-black.html** e várias outras páginas, o `app.js` é referenciado duas vezes: no `<head>` com `defer` e de novo antes do `</body>` (sem defer). Isso faz o navegador baixar e executar o mesmo script duas vezes.

**O que a agente deve fazer:**
- Em cada página, manter **apenas uma** tag `<script src="app.js">` (de preferência no final do `<body>` com `defer` ou sem defer, conforme a necessidade da página).
- Remover a duplicata (geralmente a do final do body, já que o head com defer já garante execução após o DOM).

**Arquivos afetados:** checkout.html, vips-temporadas.html, promocoes.html, vip-policia.html, vip-black.html, ano-novo.html, armas-skins.html, rolygram-*.html, vip-faccao-*.html, vip-platinum.html, painel.html, vip-ouro.html, salarios.html, vip-prata.html, voucher-detalhe.html, vip-carnaval.html, vip-ano-novo.html, super-combo-*.html, salario-detalhe.html, pet-detalhe.html, outros-*.html, mochila-*.html, especial-detalhe.html, armas-detalhe.html, oferta-*.html.

---

### 2. **Reduzir preloads de imagem no config.js**

**Problema:** `config.js` adiciona **6 preloads de imagem** (hero, logo, 4 imagens de VIP) + 1 preload do CSS do Google Fonts. Muitos preloads competem pela banda no primeiro momento e podem atrasar o LCP (Largest Contentful Paint).

**Recomendação (web.dev / Core Web Vitals):** Preload apenas o recurso do **LCP** (geralmente o banner hero).

**O que a agente deve fazer:**
- Em `config.js`, na lista `preloads`, manter apenas o banner hero, por exemplo: `'assets/medellin-banner-hero.png'`.
- Remover da lista: logo.png e as 4 imagens de VIP (vip-black-assinatura, vip-black, vip-platinum-assinatura, vip-platinum).
- Manter **um único** preload de imagem (o hero). O logo e os cards VIP carregam rápido o suficiente sem preload.
- Opcional: não adicionar preload do CSS do Google Fonts no config (a página já tem `<link rel="preload" ... as="style">` no HTML para a font); evitar duplicar.

---

### 3. **CSS render-blocking e Critical CSS**

**Problema:** O `style.css` (~68 KB) é carregado no `<head>` sem `media` nem carregamento assíncrono. Tudo que está no CSS bloqueia a primeira renderização até o arquivo ser baixado e parseado.

**Recomendação (web.dev):** Extrair o “critical CSS” (estilos necessários para o conteúdo above-the-fold) e inline no `<head>`; carregar o resto de forma assíncrona.

**O que a agente deve fazer:**
- **Opção A (mais simples):** Colocar o `<link rel="stylesheet">` do `style.css` no final do `<body>` ou usar `media="print" onload="this.media='all'"` + `<noscript>` para carregar o CSS sem bloquear a primeira pintura (com cuidado para não piorar FCP em conexões lentas).
- **Opção B (melhor resultado):** Usar ferramenta (ex.: Critical, critters, ou análise manual no Coverage do Chrome) para extrair o critical CSS (header, hero, trust-bar, primeiros cards) e colar em um `<style>` no `<head>`; depois carregar `style.css` com `rel="preload" as="style"` e `onload` trocando para stylesheet. Manter o critical inline pequeno (idealmente &lt; 14 KB comprimido).

---

### 4. **Fontes (Google Fonts)**

**Situação atual:** Já existe `display=swap` na URL do Google Fonts e preconnect para fonts.googleapis.com e fonts.gstatic.com. Isso é bom.

**O que a agente pode fazer (opcional):**
- Garantir que **só uma** tag carrega o CSS da fonte (evitar preload duplicado do mesmo CSS no config.js, como citado no item 2).
- Para ir além: considerar self-host dos arquivos .woff2 da Inter (1–2 pesos) e preload apenas o mais usado (ex.: `rel="preload" as="font" href="..." crossorigin`), reduzindo dependência de terceiros e melhorando FCP.

---

### 5. **Lazy loading de imagens (index)**

**Situação atual:** No `index.html`, as primeiras imagens do grid têm `loading="eager"` e `fetchpriority="high"` (4 cards) e o restante já tem `loading="lazy"`. Isso está alinhado com a recomendação “eager no viewport, lazy no restante”.

**O que a agente deve fazer:**
- Manter como está. Apenas garantir que **nenhum** card abaixo da dobra use `fetchpriority="high"` (no máximo os 2–4 primeiros).
- Se no futuro forem adicionados novos cards no topo, manter só 2–4 imagens com eager + high; o resto `loading="lazy"` sem `fetchpriority`.

---

### 6. **Tamanho do HTML (index) e DOM**

**Problema:** O `index.html` é muito grande (centenas de cards em uma única página). Isso aumenta tempo de download, parse e uso de memória no dispositivo.

**Recomendação (escalável):** Reduzir a quantidade de nós no carregamento inicial (paginação ou “carregar mais”) ou gerar o grid via JS a partir de dados (JSON) carregados sob demanda.

**O que a agente pode fazer (médio prazo):**
- Não é obrigatório mudar de imediato. Se quiser melhorar: exibir apenas os primeiros N cards (ex.: 12–24) no HTML e carregar o restante via JS (scroll ou botão “Ver mais”), ou dividir em páginas (ex.: ?page=2).
- Manter `width` e `height` em todas as imagens para evitar CLS.

---

### 7. **Minificação de CSS e JavaScript**

**Problema:** `style.css` e `app.js` não estão minificados (comentários e formatação intactos). Isso aumenta bytes pela rede.

**O que a agente deve fazer:**
- Em **build de produção** (ou antes do deploy), minificar CSS (ex.: cssnano, clean-css) e JS (ex.: Terser, esbuild).
- Se o deploy for manual (ex.: upload de pasta), adicionar um passo no script de deploy (ex.: DEPLOY-AUTO.ps1) que gera `style.min.css` e `app.min.js` e que as páginas referenciem os .min.
- Manter os originais para desenvolvimento.

---

### 8. **Cache e headers (Cloudflare Pages)**

**Situação:** O projeto usa Cloudflare Pages. A Cloudflare já aplica compressão (Brotli/gzip) e pode servir cache. Não há configuração explícita de headers no repositório.

**O que a agente pode fazer:**
- Em Cloudflare Pages, configurar headers de cache (via Dashboard ou `_headers` na raiz do build):
  - Para `*.css` e `*.js` com query string de versão (ex.: `?v=20260207`): `Cache-Control: public, max-age=31536000, immutable`.
  - Para `index.html` e outras HTML: `Cache-Control: public, max-age=0, must-revalidate` ou curto (ex.: 5 minutos), para não travar atualizações.
- Garantir que todos os links para CSS/JS usem query string de versão (ex.: `style.css?v=20260207-4`) para invalidação quando houver mudança.

---

### 9. **Páginas de detalhe (vip-black, etc.)**

**Problemas observados:**
- Várias páginas de detalhe **não** têm `dns-prefetch` / `preconnect` para o domínio do R2 (onde estão as imagens). O index e o checkout têm.
- Algumas usam `style.css` sem query string de versão (ex.: vip-black.html), o que pode atrapalhar invalidação de cache.

**O que a agente deve fazer:**
- Replicar no `<head>` das páginas de detalhe os mesmos `<link rel="dns-prefetch">` e `<link rel="preconnect">` para o domínio do R2 e para `fonts.googleapis.com` / `fonts.gstatic.com` (como no index/checkout).
- Usar `style.css?v=...` em todas as páginas que ainda usam só `style.css`.

---

### 10. **MutationObserver no config.js**

**Situação:** O `config.js` usa um `MutationObserver` em `document.documentElement` com `subtree: true` e `attributeFilter: ['src','srcset','href','content']` para reescrever URLs para o R2. Em páginas com muito DOM (ex.: index com muitos cards), isso pode gerar muitos callbacks.

**O que a agente pode fazer (opcional):**
- Manter o observer, mas evitar processar nós que já foram processados (ex.: marcar elemento com `data-rewritten="1"` e ignorar no observer).
- Ou processar apenas nós que estão em `body` e que são `img`, `source`, `link`, `meta`, em vez de reescrever “toda a árvore” repetidamente.

---

### 11. **Third-party e scripts inline**

**Situação:** Não há scripts de analytics ou third-party pesados visíveis no código analisado. O único script inline relevante é o do checkout (URL da API e steps do checkout), o que é aceitável.

**O que a agente deve fazer:** Se no futuro forem adicionados scripts de terceiros (ex.: analytics, chat), carregá-los com `defer` ou `async` e, se possível, após o primeiro paint (ex.: após `requestIdleCallback` ou `window.load`).

---

### 12. **Acessibilidade e SEO (já ok em grande parte)**

- Uso de `alt` em imagens, `aria-label`, `sr-only` onde faz sentido.
- Meta description, canonical, Open Graph no index/checkout.

**O que a agente pode fazer:** Garantir que todas as páginas importantes tenham `<title>` e `meta name="description"` únicos e que imagens decorativas tenham `alt=""`.

---

## Checklist resumido para a agente

| # | Ação | Prioridade | Onde |
|---|------|------------|------|
| 1 | Remover segunda tag `<script src="app.js">` em todas as páginas que carregam app.js duas vezes | Alta | checkout.html e ~30 outras .html |
| 2 | Reduzir preloads em config.js para só o banner hero (e remover preload duplicado de font se houver) | Alta | config.js |
| 3 | Critical CSS: inline do above-the-fold OU carregar style.css de forma não bloqueante | Alta | index.html (+ style.css se usar async) |
| 4 | Garantir apenas 2–4 imagens com eager+high no index; resto lazy | Média | index.html (já está ok; só conferir em mudanças futuras) |
| 5 | Adicionar dns-prefetch/preconnect para R2 (e fonts) nas páginas de detalhe | Média | vip-*.html, promocoes.html, etc. |
| 6 | Usar style.css?v=... em todas as páginas | Média | Todas as .html que usam style.css |
| 7 | Minificar CSS e JS no deploy (style.min.css, app.min.js) | Média | Script de deploy (ex.: DEPLOY-AUTO.ps1) |
| 8 | Configurar cache headers (longo para .css/.js versionados, curto para .html) | Média | Cloudflare Pages (_headers ou Dashboard) |
| 9 | Opcional: marcar nós já reescritos no config.js para o MutationObserver não reprocessar | Baixa | config.js |
| 10 | Opcional: paginação ou “carregar mais” no index para reduzir DOM | Baixa | index.html + app.js |

---

## Referências (recomendações recentes)

- **Core Web Vitals:** LCP, FID/INP, CLS – [web.dev/vitals](https://web.dev/vitals)
- **Lazy loading:** Só eager nas imagens do viewport; lazy no restante – [web.dev/lazy-loading-images](https://web.dev/articles/lazy-loading-images)
- **Critical CSS / render-blocking:** [web.dev/extract-critical-css](https://web.dev/articles/extract-critical-css), [Eliminate render-blocking resources](https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources)
- **Preload:** Usar com moderação; priorizar apenas o recurso do LCP – [web.dev/preload-critical-assets](https://web.dev/articles/preload-critical-assets)
- **Fontes:** font-display: swap; preload apenas 1–2 fontes – [web.dev/optimize-web-fonts](https://web.dev/learn/performance/optimize-web-fonts)
- **Minificação:** [Minify Resources (Google)](https://developers.google.com/speed/docs/insights/MinifyResources)

---

*Documento gerado para guiar a agente (ou o desenvolvedor) nas melhorias de performance do site Medellin VIP Store.*
