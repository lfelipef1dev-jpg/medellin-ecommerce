/**
 * Base URL das imagens da loja.
 * - file:// ou localhost: carrega de assets/ na pasta (index na pasta raiz funciona).
 * - Produção: R2 para imagens.
 */
(function () {
    var isLocal = typeof window !== 'undefined' && (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    window.IMAGE_BASE = isLocal ? '' : 'https://pub-89b867ec225e45518f185a48a96ed88e.r2.dev/';
})();

/** Usado por páginas que montam URLs de imagem em JS (aeronaves, veículos, etc.). Retorna URL completa R2 + .webp. */
window.resolveAssetUrl = function (path) {
    if (!path || typeof path !== 'string') return path;
    var base = window.IMAGE_BASE;
    if (!base || typeof base !== 'string') return path;
    base = base.trim().replace(/\/?$/, '/');
    var p = (path.indexOf('assets/') === 0) ? path : ('assets/' + path.replace(/^\/+/, ''));
    if (p.indexOf('.png') !== -1) p = p.replace(/\.png(\?|$)/, '.webp$1');
    return base + p;
};

/**
 * Quando IMAGE_BASE está definido, reescreve automaticamente URLs começando com "assets/"
 * para apontarem para o servidor/R2.
 *
 * Faz isso cedo (config.js carrega no <head>) + com MutationObserver para reduzir "piscar"
 * de imagens quebradas durante o carregamento.
 */
(function applyImageBaseEarly() {
    var base = window.IMAGE_BASE;
    if (!base || typeof base !== 'string') return;
    base = base.trim();
    if (!base) return;
    base = base.replace(/\/?$/, '/');

    // preconnect já está no HTML da index; evita duplicata. Preload do LCP (banner hero).
    try {
        var origin = base.replace(/\/+$/, '');
        if (origin && document.head) {
            var hasPreconnect = document.querySelector('link[rel="preconnect"][href="' + origin + '"], link[rel="preconnect"][href="' + origin + '/"]');
            if (!hasPreconnect) {
                var preconnect = document.createElement('link');
                preconnect.rel = 'preconnect';
                preconnect.href = origin;
                preconnect.crossOrigin = '';
                document.head.appendChild(preconnect);
            }
            // Preload apenas o LCP (banner hero) – versão responsiva 1200w para menor download
            var preloads = ['assets/medellin-banner-hero-1200.webp'];
            preloads.forEach(function (path) {
                var p = path.indexOf('.png') !== -1 ? path.replace(/\.png(\?|$)/, '.webp$1') : path;
                var link = document.createElement('link');
                link.rel = 'preload';
                link.href = base + p;
                link.as = 'image';
                document.head.appendChild(link);
            });
        }
    } catch (_) {}

    function isAssetsPath(url) {
        if (!url || typeof url !== 'string') return false;
        return url.indexOf('assets/') === 0 || url.indexOf('/assets/') === 0;
    }
    function withBase(url) {
        if (!url || typeof url !== 'string') return url;
        var path = url.indexOf('assets/') === 0 ? url : (url.indexOf('/assets/') === 0 ? url.substring(1) : null);
        if (!path) return url;
        if (path.indexOf('.png') !== -1) path = path.replace(/\.png(\?|$)/, '.webp$1');
        return base + path;
    }

    function rewriteSrcsetValue(srcset) {
        if (!srcset || typeof srcset !== 'string') return srcset;
        return srcset
            .split(',')
            .map(function (part) {
                var p = (part || '').trim();
                if (!p) return '';
                var pieces = p.split(/\s+/);
                if (pieces[0] && isAssetsPath(pieces[0])) pieces[0] = withBase(pieces[0]);
                return pieces.join(' ');
            })
            .filter(Boolean)
            .join(', ');
    }

    var REWRITTEN = 'data-medellin-rewritten';

    function rewriteEl(el) {
        if (!el || el.nodeType !== 1) return;
        if (el.getAttribute && el.getAttribute(REWRITTEN) === '1') return;

        // IMG: reescreve src/srcset para R2 (assets/ ou /assets/), lazy/decoding, width/height para CLS
        if (el.tagName === 'IMG') {
            var s = el.getAttribute('src');
            if (s && isAssetsPath(s)) {
                el.setAttribute('src', withBase(s));
                if (!el.getAttribute('loading') && el.getAttribute('fetchpriority') !== 'high') el.setAttribute('loading', 'lazy');
                var highPriority = el.getAttribute('fetchpriority') === 'high' || (el.className && String(el.className).indexOf('hero__img') !== -1);
                if (highPriority) el.setAttribute('decoding', 'sync');
                else if (!el.getAttribute('decoding')) el.setAttribute('decoding', 'async');
                if (!el.getAttribute('width') && !el.getAttribute('height')) { el.setAttribute('width', '200'); el.setAttribute('height', '200'); }
            }
            var ss = el.getAttribute('srcset');
            if (ss && (ss.indexOf('assets/') !== -1 || ss.indexOf('/assets/') !== -1)) el.setAttribute('srcset', rewriteSrcsetValue(ss));
            el.setAttribute(REWRITTEN, '1');
            return;
        }

        // SOURCE (srcset)
        if (el.tagName === 'SOURCE') {
            var srcset = el.getAttribute('srcset');
            if (srcset && (srcset.indexOf('assets/') !== -1 || srcset.indexOf('/assets/') !== -1)) { el.setAttribute('srcset', rewriteSrcsetValue(srcset)); el.setAttribute(REWRITTEN, '1'); }
            return;
        }

        // LINK (favicon/preload/etc)
        if (el.tagName === 'LINK') {
            var href = el.getAttribute('href');
            if (href && isAssetsPath(href)) { el.setAttribute('href', withBase(href)); el.setAttribute(REWRITTEN, '1'); }
            return;
        }

        // META (og:image etc)
        if (el.tagName === 'META') {
            var content = el.getAttribute('content');
            if (content && isAssetsPath(content)) { el.setAttribute('content', withBase(content)); el.setAttribute(REWRITTEN, '1'); }
            return;
        }
    }

    function rewriteTree(root) {
        if (!root) return;
        var sel = 'img[src], img[srcset], source[srcset], link[href], meta[content]';
        if (root.querySelectorAll) root.querySelectorAll(sel).forEach(rewriteEl);
        if (root.nodeType === 1) rewriteEl(root);
    }

    function injectCssOverrides() {
        // Corrige o banner que usa background url('assets/...') no CSS
        try {
            if (!document || !document.head) return;
            var style = document.createElement('style');
            style.setAttribute('data-image-base', 'true');
            style.textContent =
                ".banner::before{background:url('" + (base + "assets/medellin-banner-hero.webp") + "') center center / cover no-repeat;}";
            document.head.appendChild(style);
        } catch (_) {}
    }

    function runRewrite() {
        try { rewriteTree(document); } catch (_) {}
        injectCssOverrides();
    }

    // Adia reescrita para o próximo frame para evitar reflow no primeiro layout
    if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(function () { runRewrite(); });
    } else {
        runRewrite();
    }

    function runWhenReady() {
        try { rewriteTree(document); } catch (_) {}
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            requestAnimationFrame(runWhenReady);
        });
    } else {
        requestAnimationFrame(runWhenReady);
    }

    // 3) Observa nós que entrarem depois das reescritas iniciais (evita reflow ao não processar as próprias mutações)
    try {
        var obsOptions = { subtree: true, childList: true, attributes: true, attributeFilter: ['src', 'srcset', 'href', 'content'] };
        var obs = new MutationObserver(function (mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var m = mutations[i];
                if (!m) continue;
                if (m.type === 'attributes') { rewriteEl(m.target); continue; }
                if (m.type === 'childList' && m.addedNodes && m.addedNodes.length) {
                    for (var j = 0; j < m.addedNodes.length; j++) {
                        var n = m.addedNodes[j];
                        if (n && n.nodeType === 1) rewriteTree(n);
                    }
                }
            }
        });
        function startObserving() {
            if (document.documentElement && !obs._started) {
                obs._started = true;
                obs.observe(document.documentElement, obsOptions);
            }
        }
        requestAnimationFrame(function () {
            requestAnimationFrame(startObserving);
        });
    } catch (_) {}
})();
