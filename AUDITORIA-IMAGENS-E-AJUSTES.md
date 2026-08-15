# Auditoria – Carregamento de imagens (primeiro hit e com cache) + lista do que ajustar

Auditoria do projeto **vip-store-web**: como as imagens são carregadas, primeiro acesso vs cache, e lista completa do que ainda precisa ser ajustado.

---

## 1. Fluxo atual (resumo)

- **Origem das imagens:** `config.js` define `window.IMAGE_BASE` (R2). Todas as URLs que começam com `assets/` são reescritas para `IMAGE_BASE + path` (ex.: `https://pub-89b867ec225e45518f185a48a96ed88e.r2.dev/assets/...`).
- **Quando:** `config.js` roda no `<head>` (síncrono). Faz: (1) reescrever `src`/`srcset` de todas as `<img>`, `<source>`, `<link>`, `<meta>`; (2) injetar CSS para `.banner::before` com a URL do hero no R2; (3) adicionar um único `<link rel="preload">` para o banner hero.
- **Primeiro hit:** HTML → config.js reescreve e injeta → browser descobre imagens já com URL R2; preload do hero compete com outras requisições iniciais. CSS carrega; em páginas com `.banner`, o CSS contém `url('assets/medellin-banner-hero.png')` (relativo ao site), o que gera uma requisição extra para o **mesmo domínio do site** (Pages), que **não serve** a pasta `assets/` → **404** em toda página que usa `.banner`.
- **Com cache:** HTML/CSS/JS podem vir do cache do Pages; imagens vêm do R2. Cache das imagens depende dos headers que o **R2** (ou o domínio que servir o R2) envia; o `_headers` do projeto só se aplica a arquivos servidos pelo Pages (HTML, CSS, JS), **não** às URLs do R2.

---

## 2. Inventário de imagens

| Fonte | Tipo | Quantidade (aprox.) | Observação |
|-------|------|---------------------|------------|
| **index.html** | `<img>` | 1 hero + 1 logo + 4 eager VIP + ~95 lazy (VIP, especial, rolygram, vouchers, outros, mochila, pets) | Todas com `width`/`height` e `loading` explícito |
| **checkout.html** | `<img>` | 2× logo (header + footer) | Mesma URL = 1 request (browser dedupe) |
| **Páginas de detalhe** (vip-*.html, mochila-*, etc.) | 1× logo + 1× footer logo + 1× imagem do produto/banner | 3 por página | Banner via `.banner::before` (CSS) |
| **salarios.html** | logo×2 + 6 imagens de salários | 8 | Todas com width/height e loading lazy |
| **armas-skins.html** | logo×2 + muitas `<img>` de armas + imagens de skins (geradas por JS) | 18+ | Skins usam `assets/armas/skins/` e placeholder; config reescreve |
| **promocoes.html, vips-temporadas.html, ano-novo.html** | logo + imagens por seção | Vários | Dependem de estrutura de cada uma |
| **style.css** | `.banner::before` | 1 URL | `url('assets/medellin-banner-hero.png')` → **gera 404** no domínio do site em todas as páginas com `.banner` |
| **config.js** | preload | 1 | Só hero (correto) |

---

## 3. Primeiro hit – o que acontece

1. **HTML** é baixado do Pages.
2. **config.js** roda (síncrono): reescreve todos os `assets/` para R2, injeta estilo do banner (R2) e adiciona preload do hero.
3. **CSS** (style.css) é carregado. Nele, `.banner::before` tem `background: url('assets/medellin-banner-hero.png')` → o browser pede essa URL **ao domínio do site** (ex.: `https://roleplaymedellin.pages.dev/assets/medellin-banner-hero.png`). O deploy **não** inclui a pasta `assets/` → **404**.
4. O estilo **injetado** por config (R2) sobrescreve o visual do banner, então a **imagem que o usuário vê** é a do R2; o 404 é requisição inútil e prejudica métricas (erro na rede, tempo perdido).
5. **Imagens em `<img>`**: já reescritas para R2 no parse; carregam do R2. Ordem: preload do hero + logo + primeiras imagens (eager/alta prioridade), depois lazy conforme viewport.
6. **Logo** em header e footer: mesma URL → uma única requisição (deduplicada pelo browser).

Conclusão primeiro hit: em **qualquer página que use a classe `.banner`** (todas as páginas de detalhe listadas abaixo) ocorre **1 requisição 404** para `assets/medellin-banner-hero.png` no domínio do site.

---

## 4. Com cache

- **HTML / CSS / JS:** cache conforme `_headers` no Pages (HTML revalidado, CSS/JS com `?v=` em cache longo).
- **Imagens:** servidas pelo **R2**; cache depende dos headers do **R2** (ou do domínio que expõe o bucket). O arquivo `_headers` do projeto **não** se aplica a essas URLs. Se o R2 não enviar `Cache-Control` adequado, o browser pode revalidar sempre ou não cachear bem.

---

## 5. Lista completa do que ainda tem que ser ajustado

### Crítico (corrigir logo)

| # | O quê | Onde | Detalhe |
|---|-------|------|---------|
| 1 | **Evitar 404 do banner em páginas com .banner** | `style.css` | O `.banner::before` usa `url('assets/medellin-banner-hero.png')`. No site em produção o HTML é servido pelo Pages e essa URL é relativa ao site → o browser pede ao domínio do site e recebe 404 (assets não estão no deploy). **Ajuste:** Remover a `background` (ou usar `background: transparent`) em `.banner::before` no `style.css`, e deixar apenas o estilo injetado pelo `config.js` (que já aponta para o R2). Assim nenhuma página dispara 404 para o hero. Em ambiente local sem R2, garantir que o config continue injetando a URL correta (local ou R2). |

### Importante (performance / boas práticas)

| # | O quê | Onde | Detalhe |
|---|-------|------|---------|
| 2 | **Reduzir `fetchpriority="high"` no index** | `index.html` | Hoje há **5** imagens com `fetchpriority="high"` (hero + 4 cards VIP). Recomendação (web.dev): usar em no máximo **1–2** (ex.: só hero, ou hero + primeiro card). Nos outros 3 cards, remover `fetchpriority="high"` e manter `loading="eager"` se quiser que carreguem cedo, ou deixar só `loading="lazy"`. |
| 3 | **Cache de imagens no R2** | R2 / Cloudflare | As imagens são servidas pelo R2. O `_headers` do projeto não afeta o R2. **Ajuste:** Configurar no bucket R2 (ou na camada que expõe o bucket, ex.: domínio público R2 ou Workers) headers `Cache-Control: public, max-age=31536000, immutable` para URLs de imagem (e usar `?v=...` ou path versionado quando mudar uma imagem). |
| 4 | **preview-municao.html – width/height** | `preview-municao.html` | As 4 `<img>` não têm `width` nem `height` → risco de CLS. O `config.js` adiciona 200×200 quando faltam; mesmo assim, **ajustar:** colocar `width` e `height` explícitos no HTML (ex.: 200x200) para evitar qualquer shift. |

### Verificação / consistência

| # | O quê | Onde | Detalhe |
|---|-------|------|---------|
| 5 | **Versões de query string (mochila)** | `index.html` | 10kg e 80kg usam `?v=20260207-moch2`; 20, 120, 150, 200, 400 kg usam `?v=20260207-moch1`. Confirmar se é intencional (ex.: moch2 = versão diferente da imagem). Se for typo, unificar. |
| 6 | **Páginas sem preconnect/dns-prefetch para R2** | Várias .html | Já foram adicionados dns-prefetch e preconnect para o R2 na maioria das páginas. **Verificar** se **todas** as páginas que exibem imagens `assets/` (incl. preview-municao, painel, vip-bronze, vip-pvp) têm no `<head>` os links para o origin do R2. |
| 7 | **Banner em páginas de detalhe (LCP)** | Páginas com `.banner` | O LCP em muitas delas é o banner (imagem de fundo). O preload do hero é adicionado pelo config em todas; a imagem usada é a mesma. Garantir que o preload seja aplicado também quando a página tem só `.banner` (sem `<img>` hero). Hoje o config adiciona 1 preload do hero em todas as páginas em que IMAGE_BASE está definido – OK. |

### Opcional (melhorias futuras)

| # | O quê | Onde | Detalhe |
|---|-------|------|---------|
| 8 | **Formatos modernos (WebP/AVIF)** | Todas as imagens | Oferecer WebP/AVIF com fallback (ex.: `<picture>`) para reduzir peso e melhorar LCP/banda, principalmente hero e logos. |
| 9 | **Dimensões reais nas imagens** | HTML / build | Várias imagens usam `width="200" height="200"` genéricos; se as proporções forem outras, pode haver letterbox. Opcional: gerar dimensões reais (ou srcset) no build. |
| 10 | **Hero no index – preload no HTML** | `index.html` | O preload do hero hoje é injetado por JS (config). Para descoberta o mais cedo possível, poderia existir um `<link rel="preload" as="image" href="...R2.../assets/medellin-banner-hero.png">` já no HTML (ex.: gerado no build com a URL do R2). Opcional. |

---

## 6. Resumo por prioridade

- **Fazer já:** (1) Remover/neutralizar `url('assets/medellin-banner-hero.png')` em `.banner::before` no `style.css` para acabar com o 404 em todas as páginas com `.banner`.
- **Fazer em seguida:** (2) Reduzir `fetchpriority="high"` no index; (3) Configurar cache longo para imagens no R2; (4) Adicionar width/height em `preview-municao.html`.
- **Conferir:** (5) Versões moch1/moch2; (6) preconnect/dns-prefetch em todas as páginas com imagens; (7) LCP/preload em páginas só com `.banner`.
- **Depois (opcional):** (8) WebP/AVIF; (9) Dimensões reais; (10) Preload do hero no HTML.

---

## 7. Páginas que usam `.banner` (e hoje sofrem o 404)

Todas estas carregam `style.css` e têm um elemento com classe `banner`; portanto todas disparam a requisição 404 para `assets/medellin-banner-hero.png` no domínio do site até o ajuste no CSS:

- vip-black, vip-bronze, vip-pvp, vip-platinum, vip-prata, vip-ouro, vip-policia  
- vip-faccao-prata, vip-faccao-premium, vip-faccao-ouro  
- vip-carnaval, vip-ano-novo, oferta-carnaval, oferta-ano-novo  
- super-combo-carnaval, super-combo-ano-novo  
- rolygram-500, rolygram-1000, rolygram-2000, rolygram-verificado  
- mochila-10kg, 20kg, 80kg, 120kg, 150kg, 200kg, 400kg  
- outros-troca-nome, outros-slot-personagem, outros-reset-aparencia, outros-placa-personalizada  
- pet-detalhe, salario-detalhe, voucher-detalhe, especial-detalhe, armas-detalhe, armas-skins  
- veiculos, blindados-voadores  

---

*Auditoria feita em 10/02/2026. Após aplicar o item 1, validar em produção (Network) que não há mais 404 para `medellin-banner-hero.png` no domínio do site.*
