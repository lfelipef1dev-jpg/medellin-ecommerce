# Plano de resolução – Performance VIP Store Medellin (completo e detalhado)

Plano baseado em **pesquisa nas melhores práticas atuais** (web.dev, Google Lighthouse, Chrome DevTools, Cloudflare, 2024/2025) para resolver os pontos de performance do site. Use este documento como roteiro completo de execução.

---

## Índice

1. [Fase 0 – Diagnóstico e métricas](#fase-0--diagnóstico-e-métricas)
2. [Fase 1 – Quick wins (script duplicado e preloads)](#fase-1--quick-wins)
3. [Fase 2 – Recursos que bloqueiam renderização (CSS)](#fase-2--css-render-blocking)
4. [Fase 3 – LCP e imagem hero](#fase-3--lcp-e-imagem-hero)
5. [Fase 4 – Cache e headers HTTP](#fase-4--cache-e-headers-http)
6. [Fase 5 – Minificação e compressão](#fase-5--minificação-e-compressão)
7. [Fase 6 – Imagens (formato, tamanho, lazy)](#fase-6--imagens)
8. [Fase 7 – JavaScript (execução e DOM)](#fase-7--javascript-e-dom)
9. [Fase 8 – Fontes e third-party](#fase-8--fontes-e-third-party)
10. [Fase 9 – Monitoramento contínuo](#fase-9--monitoramento)
11. [Referências e fontes](#referências-e-fontes)

---

## Fase 0 – Diagnóstico e métricas

**Objetivo:** Estabelecer linha de base e priorizar com dados reais.

### 0.1 Ferramentas a usar

| Ferramenta | Uso |
|------------|-----|
| **PageSpeed Insights** (pagespeed.web.dev) | CrUX (dados reais de usuários), LCP/FCP/CLS por URL e por origem |
| **Chrome DevTools** → Performance, Coverage, Network | Lab: waterfall, CSS/JS não usado, prioridade de recursos |
| **Lighthouse** (DevTools ou CLI) | Auditoria “Eliminate render-blocking”, “Reduce unused CSS”, LCP element |
| **WebPageTest** (webpagetest.org) | Teste em diferentes redes/locais, filmstrip |

### 0.2 Métricas alvo (Core Web Vitals)

- **LCP:** ≤ 2,5 s para ≥ 75% das visitas (web.dev, Google).
- **INP/FID:** ≤ 100 ms.
- **CLS:** ≤ 0,1.
- **TTFB:** o mais baixo possível; alto TTFB torna LCP ≤ 2,5 s difícil (web.dev/optimize-lcp).

### 0.3 Ações

1. Rodar PageSpeed Insights na **URL do index** e na **origem**; anotar LCP/FCP/CLS (mobile e desktop).
2. No Lighthouse, filtrar por “LCP” e anotar o **LCP element** (geralmente o banner hero).
3. Em Network (DevTools), verificar se o **recurso LCP** começa a carregar junto com o primeiro recurso; se começar depois, há “resource load delay” (web.dev).
4. Documentar o estado atual em um arquivo ou planilha (ex.: `metricas-antes.txt`) para comparar após cada fase.

---

## Fase 1 – Quick wins (script duplicado e preloads)

**Base em:** Calendar.perfplanet (duplicate scripts), web.dev (preload only LCP), Fetch Priority API.

### 1.1 Remover carregamento duplo de app.js

**Problema:** Script duplicado é **executado duas vezes** (cache não evita reexecução). Causa mais tempo de execução na main thread e possível dupla inicialização (event listeners, estado).

**O que fazer:**

1. Em **cada** página que hoje tem duas tags para `app.js`:
   - Manter **uma única** referência a `app.js`.
   - Recomendação: manter no `<head>` com `defer`: `<script src="app.js?v=XXXX" defer></script>` e **remover** a segunda tag antes do `</body>`.
2. Ordem recomendada (web.dev, MDN): scripts no `<head>` com `defer` para o browser começar o download cedo, execução após o parse do HTML, em ordem.
3. **Não** usar `async` e `defer` no mesmo script (comportamento inconsistente entre browsers).

**Arquivos a editar (remover a segunda tag `<script src="app.js">`):**  
checkout.html, vips-temporadas.html, promocoes.html, vip-policia.html, vip-black.html, ano-novo.html, armas-skins.html, rolygram-500.html, rolygram-1000.html, rolygram-2000.html, rolygram-verificado.html, vip-faccao-prata.html, vip-faccao-premium.html, vip-faccao-ouro.html, vip-platinum.html, painel.html, vip-ouro.html, salarios.html, vip-prata.html, voucher-detalhe.html, vip-carnaval.html, vip-ano-novo.html, super-combo-carnaval.html, super-combo-ano-novo.html, salario-detalhe.html, pet-detalhe.html, outros-troca-nome.html, outros-slot-personagem.html, outros-reset-aparencia.html, outros-placa-personalizada.html, mochila-10kg.html até mochila-400kg.html, especial-detalhe.html, armas-detalhe.html, oferta-carnaval.html, oferta-ano-novo.html.

**Verificação:** Após a alteração, abrir uma dessas páginas, DevTools → Network → filtrar por “app.js”; deve aparecer **uma única** requisição.

### 1.2 Reduzir preloads no config.js

**Base:** web.dev – preload apenas recursos **críticos** para o primeiro frame; “if everything is prioritized then nothing is”. Fetch Priority API: `fetchpriority="high"` em no máximo 1–2 imagens (LCP e talvez logo).

**O que fazer:**

1. Abrir `config.js`.
2. Na lista `preloads` (imagens), deixar **apenas** a imagem do LCP. No site atual é o banner hero:
   - Manter: `'assets/medellin-banner-hero.png'`.
   - Remover: `'assets/logo.png'`, `'assets/vips/vip-black-assinatura.png?v=20260207-img2'`, `'assets/vips/vip-black.png'`, `'assets/vips/vip-platinum-assinatura.png?v=20260207-img2'`, `'assets/vips/vip-platinum.png'`.
3. Remover o bloco que adiciona **preload do CSS do Google Fonts** (fontPreload). O HTML já tem `<link rel="preload" href="...fonts...">` para o CSS; preload duplicado compete por banda sem benefício.
4. Manter apenas: `dns-prefetch` e `preconnect` para o origin do R2 (e, no HTML, para fonts.googleapis.com e fonts.gstatic.com).

**Trecho esperado (exemplo):**

```javascript
var preloads = [
    'assets/medellin-banner-hero.png'
];
preloads.forEach(function (path) {
    var link = document.createElement('link');
    link.rel = 'preload';
    link.href = base + path;
    link.as = 'image';
    document.head.appendChild(link);
});
// Remover o preload do fontCss (fontPreload).
```

**Verificação:** Network → no carregamento do index, deve haver **um** preload de imagem (hero); não deve haver vários preloads de imagens nem preload duplicado de CSS de fonte.

---

## Fase 2 – CSS render-blocking

**Base:** web.dev “Extract critical CSS”, Google “Optimize CSS Delivery”, Chrome “Eliminate render-blocking resources”. Critical CSS: estilos above-the-fold inline; resto assíncrono. Manter critical **&lt; 14 KB comprimido** (primeiro RTT TCP).

### 2.1 Opção A – Deferir CSS não crítico (mais simples)

**Ideia:** Não bloquear a primeira pintura com o CSS inteiro.

1. No **index.html** (e depois nas outras páginas principais):
   - Trocar o `<link rel="stylesheet" href="style.css?v=...">` do `<head>` por:
     ```html
     <link rel="preload" href="style.css?v=XXXX" as="style" onload="this.onload=null;this.rel='stylesheet'">
     <noscript><link rel="stylesheet" href="style.css?v=XXXX"></noscript>
     ```
   - Isso faz o CSS ser carregado em paralelo sem bloquear o render; quando terminar, vira stylesheet.
2. **Atenção:** Em conexões muito lentas, a página pode piscar sem estilo (FOUC). Testar em 3G throttling; se for inaceitável, usar a Opção B.

### 2.2 Opção B – Critical CSS inline (melhor resultado, mais trabalho)

**Ideia:** Inline só o necessário para o “above-the-fold” (&lt; 14 KB comprimido); o resto em arquivo externo carregado de forma não bloqueante.

**Passos:**

1. **Extrair critical CSS:**
   - Ferramentas sugeridas (web.dev): **Critical** (npm), **Penthouse**, **criticalcss** (npm), ou gerador online (ex.: criticalcssgenerator.com).
   - Para o VIP Store: incluir estilos de: reset/base, header, hero, trust-bar, seção vantagens, primeiros 4–6 cards do grid, botões e tipografia básica.
2. **Incluir no HTML:**
   - Colar o CSS extraído (minificado) dentro de `<style id="critical-css">...</style>` no `<head>`, **antes** de qualquer link externo.
   - Garantir que o tamanho do bloco (após compressão gzip/Brotli) fique **abaixo de 14 KB**.
3. **Carregar o resto do CSS:**
   - Manter `style.css` com **todos** os estilos (incluindo os do critical, para não quebrar especificidade).
   - Carregar com: `<link rel="preload" href="style.css?v=XXX" as="style" onload="this.onload=null;this.rel='stylesheet'">` + `<noscript><link rel="stylesheet" href="style.css?v=XXX"></noscript>`.
4. **Remover CSS não usado:** Usar Chrome DevTools → Coverage para identificar regras não usadas na primeira carga; remover ou mover para um CSS “late” carregado sob demanda (se houver).

**Verificação:** Lighthouse → “Eliminate render-blocking resources” deve melhorar ou desaparecer; FCP/LCP não devem piorar.

---

## Fase 3 – LCP e imagem hero

**Base:** web.dev “Optimize LCP”, breakdown em TTFB, resource load delay, resource load duration, element render delay. Meta: LCP ≤ 2,5 s.

### 3.1 Garantir que o LCP começa cedo (resource load delay ≈ 0)

- O elemento LCP (hero) deve ser **descoberto no HTML** (não injetado por JS).
- **Um único preload** para a imagem hero (já feito na Fase 1.2).
- Na tag da imagem hero: `fetchpriority="high"` e **sem** `loading="lazy"`. Nunca lazy-load o LCP (web.dev).
- Exemplo no index:
  ```html
  <img src="assets/medellin-banner-hero.png" alt="" class="hero__img" width="1920" height="480" fetchpriority="high" decoding="async">
  ```
  (Não usar `loading="lazy"` no hero.)

### 3.2 Reduzir “element render delay”

- O LCP não pode ficar escondido atrás de JS ou CSS que demora. Garantir:
  - Nenhum script síncrono no `<head>` que atrase o render.
  - CSS crítico pequeno ou carregamento não bloqueante (Fase 2), para a folha não demorar mais que a imagem e atrasar o paint do hero.

### 3.3 Reduzir “resource load duration” (tamanho da imagem)

- Comprimir a imagem hero (TinyPNG, Squoosh, ou script de build).
- Considerar **WebP ou AVIF** com fallback PNG (Lighthouse “Serve images in modern formats”). Exemplo:
  ```html
  <picture>
    <source srcset="assets/medellin-banner-hero.avif" type="image/avif">
    <source srcset="assets/medellin-banner-hero.webp" type="image/webp">
    <img src="assets/medellin-banner-hero.png" alt="" class="hero__img" width="1920" height="480" fetchpriority="high" decoding="async">
  </picture>
  ```
- Se o hero for servido do R2, manter preconnect/dns-prefetch para o origin do R2 (já existe no index/checkout); replicar nas páginas de detalhe (Fase 8 resumida abaixo).

### 3.4 LCP em páginas de detalhe

- Nas páginas de produto (vip-black.html, etc.), o LCP pode ser o banner ou a imagem do produto. Aplicar a mesma lógica: uma imagem LCP com `fetchpriority="high"`, sem lazy; preload só se for realmente o LCP e não estiver no `<img>` no topo do body.

---

## Fase 4 – Cache e headers HTTP

**Base:** Chrome “Serve static assets with an efficient cache policy”, KeyCDN/Mozilla Cache-Control, Cloudflare Pages `_headers`.

### 4.1 Estratégia de cache

| Tipo de recurso | Cache-Control sugerido | Motivo |
|-----------------|------------------------|--------|
| CSS/JS com query string de versão (ex.: `?v=20260207`) | `public, max-age=31536000, immutable` | Conteúdo imutável por URL; 1 ano (Google, KeyCDN). |
| HTML (index, checkout, etc.) | `public, max-age=0, must-revalidate` ou `max-age=300` | Sempre atualizado ou revalidação curta. |
| Imagens com versão na URL | `public, max-age=31536000, immutable` | Idem CSS/JS. |

**Importante:** Só usar `max-age=31536000, immutable` em URLs que **mudam quando o conteúdo muda** (query string ou hash no nome do arquivo). Caso contrário o usuário fica com versão antiga.

### 4.2 Cloudflare Pages – arquivo _headers

**Fonte:** developers.cloudflare.com/pages/configuration/headers/

1. Criar na **pasta de build/output** do projeto (raiz do que é deployado) um arquivo chamado **`_headers`** (sem extensão).
2. Conteúdo de exemplo:

```http
# HTML: revalidar sempre (ou cache curto)
/*.html
  Cache-Control: public, max-age=0, must-revalidate

/index.html
  Cache-Control: public, max-age=0, must-revalidate

# CSS e JS com query string – cache longo (ajustar path se usar subpasta)
/*.css
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Cache-Control: public, max-age=31536000, immutable
```

**Nota:** Na prática, o Cloudflare Pages pode aplicar cache próprio. Se usar apenas query string (ex.: `style.css?v=20260207`), a combinação URL + `immutable` permite cache agressivo; ao mudar o conteúdo, mudar o `?v=...` em todas as referências.

### 4.3 Garantir versioning em todas as páginas

- Todas as referências a `style.css` e `app.js` devem incluir `?v=XXXX` (ex.: `style.css?v=20260207-5`). Assim, ao alterar o arquivo, basta mudar o valor para invalidar cache.
- Incluir nas páginas de detalhe que ainda usam `style.css` sem query string.

---

## Fase 5 – Minificação e compressão

**Base:** Google “Minify Resources”, web.dev “Reduce network payloads using text compression”.

### 5.1 Minificar CSS

- Ferramentas: **cssnano**, **clean-css**, **csso** (via npm ou script).
- Gerar `style.min.css` a partir de `style.css` e referenciar `style.min.css?v=XXX` nas páginas em produção.
- Manter `style.css` para desenvolvimento.

### 5.2 Minificar JavaScript

- Ferramentas: **Terser**, **esbuild** (minify), **Closure Compiler**.
- Gerar `app.min.js` e `config.min.js` (ou só app.min.js se config for pequeno e inline em algumas páginas); referenciar os .min na produção.
- Remover comentários e código morto; não quebrar a lógica (testar carrinho, filtros, checkout).

### 5.3 Integrar ao deploy

- No script de deploy (ex.: `DEPLOY-AUTO.ps1` ou pipeline):
  1. Rodar minificação (CSS e JS).
  2. Copiar para a pasta de output os arquivos .min e os HTML já apontando para .min.
- Cloudflare já aplica Brotli/gzip; garantir que o servidor está enviando conteúdo comprimido (geralmente automático no Pages).

### 5.4 Tamanho alvo

- Manter o critical CSS (se usado) &lt; 14 KB comprimido.
- Reduzir tempo de execução de JS (Lighthouse alerta se &gt; 2 s; falha se &gt; 3,5 s). Minificação ajuda no parse/transfer; evite scripts duplicados (Fase 1).

---

## Fase 6 – Imagens

**Base:** web.dev “Image performance”, Lighthouse “Serve images in modern formats”, uso de `loading="lazy"` e `fetchpriority`.

### 6.1 Lazy loading

- **Acima da dobra (viewport):** até 2–4 imagens com `loading="eager"` e `fetchpriority="high"` (LCP + eventualmente logo e 1–2 cards).
- **Restante:** `loading="lazy"` **sem** `fetchpriority="high"`.
- No index atual já está correto (4 primeiros cards eager+high, resto lazy). Em novas páginas ou novos cards, repetir esse padrão.

### 6.2 Formatos modernos

- Oferecer **WebP** e, onde suportado, **AVIF**, com fallback PNG/JPEG via `<picture>`.
- Gerar versões WebP/AVIF do banner hero e das imagens mais acessadas (vips, logo); referenciar no HTML. Ferramentas: Squoosh, sharp (Node), scripts de build.

### 6.3 Dimensões e srcset

- Usar `width` e `height` em todas as `<img>` para evitar CLS (já feito no projeto).
- Para imagens que mudam de tamanho em diferentes viewports, usar `srcset` e `sizes` para carregar tamanho adequado e economizar bytes (web.dev, CSS-Tricks responsive images).

### 6.4 CDN/origin

- Imagens no R2 com domínio público já estão “servidas de CDN”. Manter **apenas um preload** para o LCP (hero); dns-prefetch/preconnect para o origin do R2 em todas as páginas que usam imagens do R2.

---

## Fase 7 – JavaScript e DOM

**Base:** Chrome “Reduce JavaScript execution time”, web.dev “Optimize JavaScript execution”, “Avoid an excessive DOM size”.

### 7.1 Evitar execução duplicada

- Já coberto na Fase 1 (remover segunda tag de app.js).

### 7.2 MutationObserver no config.js

- **Problema:** Observer em todo o `documentElement` com `subtree: true` pode gerar muitos callbacks em páginas com muito DOM.
- **Práticas (Stack Overflow, boas práticas MutationObserver):**
  - Evitar reprocessar o mesmo nó: ao reescrever `src`/`srcset`, marcar o elemento (ex.: `el.setAttribute('data-rewritten','1')`) e no callback ignorar nós que já têm esse atributo.
  - Processar em lote: acumular mutações e processar em `requestAnimationFrame` ou `setTimeout(fn, 0)` em vez de fazer trabalho pesado em todo callback.
  - Se o observer for só para conteúdo injetado no carregamento inicial, considerar desconectar após o primeiro `DOMContentLoaded` e rodar uma única vez `rewriteTree(document)`.

### 7.3 Tamanho do DOM (index)

- **Referência:** Lighthouse “Avoid an excessive DOM size” – bom &lt; 1.100 nós; atenção 800–1.400; ruim &gt; 1.400.
- **Causa no VIP Store:** index com dezenas de cards em uma única página.
- **Opcional (médio prazo):**
  - Mostrar só os primeiros N cards (ex.: 12–24) no HTML; carregar o restante ao scroll (“load more”) ou via paginação.
  - Ou gerar o grid por JS a partir de um JSON, carregando apenas a primeira “página” de itens.
- Reduzir profundidade de aninhamento e remover nós desnecessários onde possível.

---

## Fase 8 – Fontes e third-party

### 8.1 Google Fonts

- Já em uso: `display=swap`, preconnect para fonts.googleapis.com e fonts.gstatic.com.
- Remover preload duplicado do CSS da fonte no config.js (Fase 1.2).
- Opcional: self-host dos .woff2 da Inter (1–2 pesos), com preload apenas da variante mais usada e `font-display: swap`, para reduzir dependência de terceiros e melhorar FCP.

### 8.2 Páginas de detalhe – recursos críticos

- Replicar nas páginas de detalhe (vip-*.html, promocoes.html, etc.):
  - `<link rel="dns-prefetch" href="https://pub-89b867ec225e45518f185a48a96ed88e.r2.dev">`
  - `<link rel="preconnect" href="https://pub-89b867ec225e45518f185a48a96ed88e.r2.dev" crossorigin>`
  - Preconnect para Google Fonts se a página usar a mesma fonte.
- Garantir `style.css?v=XXX` em todas.

### 8.3 Scripts de terceiros

- Se no futuro forem adicionados (analytics, chat, etc.): carregar com `defer` ou `async`, e preferencialmente após o primeiro paint (ex.: após `window.load` ou `requestIdleCallback`), para não bloquear LCP nem a main thread.

---

## Fase 9 – Monitoramento

### 9.1 Antes e depois

- Repetir as medições da Fase 0 após cada fase (ou ao menos após Fases 1, 2, 3 e 5).
- Comparar LCP, FCP, CLS e, se possível, TTFB.

### 9.2 Ferramentas contínuas

- **PageSpeed Insights** ou **CrUX** no Search Console para acompanhar Core Web Vitals por URL/origem.
- **Chrome User Experience Report (CrUX):** dados reais de usuários; preferir a lab data do Lighthouse para decisões (web.dev/optimize-lcp).

### 9.3 Checklist pós-deploy

- [ ] Nenhuma página carrega app.js duas vezes.
- [ ] Apenas uma imagem (hero) em preload no config.js.
- [ ] CSS crítico &lt; 14 KB comprimido (se inline) ou carregamento não bloqueante.
- [ ] LCP image com fetchpriority="high", sem loading="lazy".
- [ ] Cache longa para .css/.js versionados; HTML com revalidação.
- [ ] CSS e JS minificados em produção.
- [ ] Todas as páginas com dns-prefetch/preconnect para R2 (e fonts onde aplicável).

---

## Ordem sugerida de execução

| Ordem | Fase | Esforço | Impacto esperado |
|-------|------|---------|-------------------|
| 1 | Fase 0 – Diagnóstico | Baixo | Base para priorização |
| 2 | Fase 1 – Script duplicado + preloads | Baixo | Redução de execução JS e melhora de LCP |
| 3 | Fase 4 – Cache (_headers + versioning) | Baixo | Melhor repeat visit |
| 4 | Fase 3 – LCP (revisar hero, não lazy) | Baixo | Melhora direta de LCP |
| 5 | Fase 2 – CSS (defer ou critical) | Médio | Redução de render-blocking, FCP/LCP |
| 6 | Fase 5 – Minificação | Médio | Menor transfer e parse |
| 7 | Fase 8 – Preconnect/dns em todas as páginas | Baixo | Menor latency em imagens |
| 8 | Fase 7 – MutationObserver + DOM (opcional) | Médio | Main thread e memória |
| 9 | Fase 6 – WebP/AVIF (opcional) | Médio | Menor resource load duration |
| 10 | Fase 9 – Monitoramento | Contínuo | Validar e regredir |

---

## Referências e fontes

- **web.dev**
  - [Optimize LCP](https://web.dev/articles/optimize-lcp)
  - [Extract critical CSS](https://web.dev/articles/extract-critical-css)
  - [Eliminate render-blocking resources](https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources)
  - [Fetch Priority API](https://web.dev/articles/fetch-priority)
  - [Image performance](https://web.dev/learn/performance/image-performance)
  - [Optimize JavaScript execution](https://web.dev/articles/optimize-javascript-execution)
- **Google**
  - [Optimize CSS Delivery](https://developers.google.com/speed/docs/insights/OptimizeCSSDelivery)
  - [Minify Resources](https://developers.google.com/speed/docs/insights/MinifyResources)
- **Chrome**
  - [Serve static assets with efficient cache policy](https://developer.chrome.com/docs/lighthouse/performance/uses-long-cache-ttl)
  - [Avoid excessive DOM size](https://developer.chrome.com/docs/lighthouse/performance/dom-size)
  - [Reduce JavaScript execution time](https://developer.chrome.com/docs/lighthouse/performance/bootup-time)
- **Cloudflare**
  - [Pages – Headers](https://developers.cloudflare.com/pages/configuration/headers/)
- **Outros**
  - KeyCDN: Cache-Control immutable
  - DebugBear: Resource hints (preload, preconnect, prefetch)
  - Perfplanet: The Pain of Duplicate Scripts
  - Stack Overflow: MutationObserver performance (debounce, disconnect, batch)

---

*Documento gerado para guiar a resolução completa de performance do site Medellin VIP Store com base em melhores práticas pesquisadas na internet (2024/2025).*
