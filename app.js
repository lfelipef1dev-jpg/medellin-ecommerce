/**
 * Medellin VIP Store – UX: filtros, categorias, busca, scroll, feedback
 * Mantém integração com carrinho/checkout/autenticação existentes.
 */
(function () {
    'use strict';

    var productGrid = document.getElementById('productGrid');
    var searchInput = document.getElementById('searchInput');
    var filterTier = document.getElementById('filterTier');
    var filterCategory = document.getElementById('filterCategory');
    var filterType = document.getElementById('filterType');
    var filterPrice = document.getElementById('filterPrice');
    var filterDestaque = document.getElementById('filterDestaque');
    var noResults = document.getElementById('noResults');
    var cartCountEl = document.getElementById('cartCount');

    var activeCategory = null;
    var orgsFacsLanding = document.getElementById('orgsFacsLanding');
    var activeOrgsFacsSubCategory = 'vip-faccao'; // default: abrir VIP FAC
    var defaultNoResultsText = noResults ? (noResults.textContent || '') : '';

    var STORE_CATEGORIES = [
        { id: 'vips-temporadas', label: 'Vips Temporadas', type: 'link', href: 'vips-temporadas.html', icon: 'gift' },
        { id: 'promocoes', label: 'Promoções', type: 'link', href: 'promocoes.html', icon: 'tag' },
        { id: 'vips', label: 'Vips', type: 'filter', category: 'vip', icon: 'crown' },
        { id: 'pets', label: 'Pets', type: 'filter', category: 'pets', icon: 'paw' },
        { id: 'vouchers', label: 'Vouchers', type: 'filter', category: 'vouchers', icon: 'ticket' },
        { id: 'salarios', label: 'Salários', type: 'link', href: 'salarios.html', icon: 'coins' },
        { id: 'armas-skins', label: 'Armas e Skins', type: 'link', href: 'armas-skins.html', icon: 'target' },
        { id: 'veiculos', label: 'Veículos', type: 'link', href: 'veiculos.html', icon: 'car' },
        { id: 'blindados-voadores', label: 'Blindados e Voadores', type: 'link', href: 'blindados-voadores.html', icon: 'shield' },
        { id: 'modificacoes', label: 'Modificações', type: 'filter', category: 'mods', icon: 'wrench' },
        { id: 'penthouse', label: 'Penthouse', type: 'filter', category: 'penthouse', icon: 'home' },
        { id: 'aeronaves', label: 'Aeronaves', type: 'link', href: 'aeronaves.html', icon: 'plane' },
        /* Grandes Baús: link direto para a página (sem subcategorias no menu; a página tem abas Caminhões e Veículos) */
        { id: 'grandes-baus', label: 'Grandes Baús', type: 'link', href: 'grandes-baus.html', icon: 'box' },
        { id: 'especial', label: 'Especial', type: 'filter', category: 'especial', icon: 'spark' },
        { id: 'orgs-facs', label: 'Orgs/Facs', type: 'filter', category: 'orgs-facs', icon: 'users' },
        { id: 'rolygram', label: 'Rolygram', type: 'filter', category: 'rolygram', icon: 'camera' },
        { id: 'mochila', label: 'Mochila', type: 'filter', category: 'mochila', icon: 'backpack' },
        { id: 'outros', label: 'Outros', type: 'filter', category: 'outros', icon: 'grid' }
    ];

    function getCards() {
        if (!productGrid) return [];
        return Array.from(productGrid.querySelectorAll('.card'));
    }

    function getQueryParam(name) {
        try {
            return new URLSearchParams(window.location.search).get(name);
        } catch (_) {
            return null;
        }
    }

    function setQueryParam(name, value) {
        try {
            var url = new URL(window.location.href);
            if (!value) url.searchParams.delete(name);
            else url.searchParams.set(name, value);
            window.history.replaceState({}, '', url.toString());
        } catch (_) {}
    }

    function getPriceRange(value) {
        if (!value) return null;
        var parts = value.split('-').map(Number);
        return { min: parts[0], max: parts[1] };
    }

    function matchesSearch(card, q) {
        if (!q) return true;
        q = q.trim().toLowerCase();
        var titleEl = card.querySelector('.card-title, .product-card__name');
        var typeEl = card.querySelector('.card-type, .product-card__type');
        var title = titleEl ? titleEl.textContent : '';
        var type = typeEl ? typeEl.textContent : '';
        return (title + ' ' + type).toLowerCase().indexOf(q) !== -1;
    }

    function matchesFilters(card) {
        var tier = filterTier && filterTier.value;
        var category = activeCategory || (filterCategory && filterCategory.value);
        // ORGS/FACS é uma "landing" com subcategorias internas
        if (category === 'orgs-facs') category = activeOrgsFacsSubCategory || 'vip-faccao';
        var type = filterType && filterType.value;
        var priceRange = filterPrice && getPriceRange(filterPrice.value);
        var destaque = filterDestaque && filterDestaque.value;

        if (tier && card.getAttribute('data-vip-tier') !== tier) return false;
        if (category && card.getAttribute('data-category') !== category) return false;
        if (type && card.getAttribute('data-type') !== type) return false;
        if (priceRange) {
            var price = parseFloat(card.getAttribute('data-price')) || 0;
            if (price < priceRange.min || price > priceRange.max) return false;
        }
        if (destaque && card.getAttribute('data-destaque') !== destaque) return false;
        return true;
    }

    function applyFilters() {
        var q = searchInput ? searchInput.value : '';
        var cards = getCards();
        var visible = 0;

        var isOrgsFacs = (activeCategory === 'orgs-facs' && !!orgsFacsLanding);
        if (isOrgsFacs) {
            // Sempre abrir VIP FAC por padrão ao entrar em ORGS/FACS
            if (!activeOrgsFacsSubCategory) activeOrgsFacsSubCategory = 'vip-faccao';
            orgsFacsLanding.classList.remove('hidden');
            orgsFacsLanding.querySelectorAll('button[data-orgs-cat]').forEach(function (btn) {
                var cat = btn.getAttribute('data-orgs-cat');
                btn.classList.toggle('is-active', cat && cat === activeOrgsFacsSubCategory);
            });
        } else {
            if (orgsFacsLanding) orgsFacsLanding.classList.add('hidden');
        }

        // Resetar texto padrão do "sem resultados"
        if (noResults && defaultNoResultsText) noResults.textContent = defaultNoResultsText;

        var visibleCards = [];
        cards.forEach(function (card) {
            var show = matchesSearch(card, q) && matchesFilters(card);
            card.classList.toggle('card--hidden', !show);
            if (show) {
                visible++;
                visibleCards.push(card);
            }
        });

        if (visibleCards.length > 1 && productGrid) {
            visibleCards.sort(function (a, b) {
                var pa = parseFloat(a.getAttribute('data-price')) || 0;
                var pb = parseFloat(b.getAttribute('data-price')) || 0;
                return pb - pa;
            });
            var fragment = document.createDocumentFragment();
            visibleCards.forEach(function (card) { fragment.appendChild(card); });
            productGrid.appendChild(fragment);
        }

        if (noResults) {
            // Quando clicar em FARM (em breve), mostrar mensagem amigável
            if (isOrgsFacs && activeOrgsFacsSubCategory === 'orgs-farm') {
                noResults.textContent = 'FARM: itens/benefícios em breve.';
            }
            noResults.classList.toggle('hidden', visible > 0);
        }
    }

    function scheduleApplyFilters() {
        if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(applyFilters);
        else applyFilters();
    }

    function bindFilters() {
        [searchInput, filterTier, filterCategory, filterType, filterPrice, filterDestaque].forEach(function (el) {
            if (!el) return;
            if (el.type === 'search') {
                el.addEventListener('input', scheduleApplyFilters);
            } else {
                el.addEventListener('change', scheduleApplyFilters);
            }
        });
    }

    function iconSvg(name) {
        // Ícones leves (inline) – evita dependência externa
        var common = 'width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
        switch (name) {
            case 'gift':
                return '<svg ' + common + '><path d="M20 12v10H4V12"/><path d="M2 7h20v5H2z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z"/></svg>';
            case 'tag':
                return '<svg ' + common + '><path d="M20.59 13.41 11 3H4v7l9.59 9.59a2 2 0 0 0 2.82 0l4.18-4.18a2 2 0 0 0 0-2.82Z"/><path d="M7 7h.01"/></svg>';
            case 'crown':
                return '<svg ' + common + '><path d="M3 7l4 4 5-8 5 8 4-4"/><path d="M5 21h14l-1-10H6z"/></svg>';
            case 'paw':
                return '<svg ' + common + '><path d="M5.5 12.5c1.5 0 2.5-1.2 2.5-2.6S7 7.4 5.5 7.4 3 8.6 3 9.9s1 2.6 2.5 2.6Z"/><path d="M18.5 12.5c1.5 0 2.5-1.2 2.5-2.6s-1-2.5-2.5-2.5S16 8.6 16 9.9s1 2.6 2.5 2.6Z"/><path d="M9 9.2c1.3 0 2.2-1.1 2.2-2.4S10.3 4.4 9 4.4 6.8 5.5 6.8 6.8 7.7 9.2 9 9.2Z"/><path d="M15 9.2c1.3 0 2.2-1.1 2.2-2.4S16.3 4.4 15 4.4s-2.2 1.1-2.2 2.4S13.7 9.2 15 9.2Z"/><path d="M12 14c-3.5 0-6 2.1-6 4.2S8.6 22 12 22s6-1.7 6-3.8S15.5 14 12 14Z"/></svg>';
            case 'ticket':
                return '<svg ' + common + '><path d="M3 9a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v6a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2Z"/><path d="M13 7v10"/></svg>';
            case 'coins':
                return '<svg ' + common + '><path d="M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3Z"/><path d="M20 6v6c0 1.7-3.6 3-8 3s-8-1.3-8-3V6"/><path d="M20 12v6c0 1.7-3.6 3-8 3s-8-1.3-8-3v-6"/></svg>';
            case 'target':
                return '<svg ' + common + '><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M22 12h-3"/><path d="M5 12H2"/></svg>';
            case 'car':
                return '<svg ' + common + '><path d="M3 16l1-4 2-4h12l2 4 1 4"/><path d="M5 16h14"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/></svg>';
            case 'shield':
                return '<svg ' + common + '><path d="M12 2l8 4v6c0 5-3.5 9.4-8 10-4.5-.6-8-5-8-10V6l8-4Z"/></svg>';
            case 'wrench':
                return '<svg ' + common + '><path d="M14.7 6.3a4 4 0 0 0-5.6 5.6L3 18l3 3 6.1-6.1a4 4 0 0 0 5.6-5.6l-2 2-2-2 2-2Z"/></svg>';
            case 'home':
                return '<svg ' + common + '><path d="M3 11l9-8 9 8"/><path d="M9 22V12h6v10"/></svg>';
            case 'plane':
                return '<svg ' + common + '><path d="M22 16l-10-4-10 4 10-14 10 14Z"/><path d="M12 12v10"/></svg>';
            case 'box':
                return '<svg ' + common + '><path d="M21 8l-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>';
            case 'spark':
                return '<svg ' + common + '><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z"/></svg>';
            case 'users':
                return '<svg ' + common + '><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
            case 'camera':
                return '<svg ' + common + '><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3l2-2h8l2 2h3a2 2 0 0 1 2 2Z"/><circle cx="12" cy="13" r="4"/></svg>';
            case 'backpack':
                return '<svg ' + common + '><path d="M7 7a5 5 0 0 1 10 0"/><path d="M6 21V10a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v11"/><path d="M6 13h12"/><path d="M9 17h6"/></svg>';
            case 'grid':
                return '<svg ' + common + '><path d="M4 4h7v7H4z"/><path d="M13 4h7v7h-7z"/><path d="M4 13h7v7H4z"/><path d="M13 13h7v7h-7z"/></svg>';
            case 'bolt':
                return '<svg ' + common + '><path d="M13 2 3 14h7l-1 8 10-12h-7z"/></svg>';
            default:
                return '<svg ' + common + '><circle cx="12" cy="12" r="9"/></svg>';
        }
    }

    function createMenuItemLink(item, isSub) {
        var a = document.createElement('a');
        a.className = isSub ? 'cat-menu__sublink' : 'cat-menu__link';
        a.href = item.href || ('index.html?cat=' + encodeURIComponent(item.category || item.id) + '#planos');
        if (item.type === 'filter') a.setAttribute('data-cat', item.category || item.id);
        a.innerHTML =
            '<span class="cat-menu__icon" aria-hidden="true">' + iconSvg(item.icon) + '</span>' +
            '<span class="cat-menu__label">' + item.label + '</span>';
        return a;
    }

    function createPlaceholder() {
        var li = document.createElement('li');
        var span = document.createElement('span');
        span.className = 'cat-menu__sublink';
        span.style.cursor = 'default';
        span.style.opacity = '0.7';
        span.textContent = 'Subcategorias em breve';
        li.appendChild(span);
        return li;
    }

    function renderCategoryMenu(container) {
        if (!container) return;
        container.innerHTML = '';

        var ul = document.createElement('ul');
        ul.className = 'cat-menu__list';

        STORE_CATEGORIES.forEach(function (item) {
            var li = document.createElement('li');
            li.className = 'cat-menu__item';

            if (item.type === 'group') {
                li.classList.add('cat-menu__item--group');
                li.setAttribute('data-group', item.id);

                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'cat-menu__toggle';
                btn.setAttribute('aria-expanded', 'false');
                btn.innerHTML =
                    '<span class="cat-menu__icon" aria-hidden="true">' + iconSvg(item.icon) + '</span>' +
                    '<span class="cat-menu__label">' + item.label + '</span>' +
                    '<span class="cat-menu__chev" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></span>';

                var sub = document.createElement('ul');
                sub.className = 'cat-menu__sublist';
                sub.hidden = true;

                if (item.children && item.children.length) {
                    item.children.forEach(function (child) {
                        var subLi = document.createElement('li');
                        subLi.appendChild(createMenuItemLink(child, true));
                        sub.appendChild(subLi);
                    });
                }

                btn.addEventListener('click', function () {
                    var open = sub.hidden;
                    sub.hidden = !open;
                    li.classList.toggle('cat-menu__item--open', open);
                    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
                });

                li.appendChild(btn);
                li.appendChild(sub);
            } else {
                li.appendChild(createMenuItemLink(item, false));
            }

            ul.appendChild(li);
        });

        container.appendChild(ul);
    }

    function setActiveCategory(cat, opts) {
        opts = opts || {};
        activeCategory = cat || null;

        // Aeronaves e Grandes Baús têm página própria – redirecionar em vez de filtrar na index (evita "nenhum produto")
        if (productGrid && (activeCategory === 'aeronaves' || activeCategory === 'grandes-baus')) {
            var redirect = activeCategory === 'aeronaves' ? 'aeronaves.html' : 'grandes-baus.html';
            try { window.location.replace(redirect); } catch (_) { window.location.href = redirect; }
            return;
        }

        // ORGS/FACS: ao entrar, abrir VIP FAC automaticamente (sem tela vazia)
        if (activeCategory === 'orgs-facs') {
            activeOrgsFacsSubCategory = 'vip-faccao';
        }

        // Atualiza URL sem recarregar (só quando estamos no index/listagem)
        if (!opts.skipUrl && productGrid) setQueryParam('cat', activeCategory || '');

        // Sincroniza select (se existir)
        if (filterCategory) {
            try { filterCategory.value = activeCategory || ''; } catch (_) {}
        }

        // Marca ativo no menu
        document.querySelectorAll('[data-cat]').forEach(function (a) {
            a.classList.toggle('is-active', activeCategory && a.getAttribute('data-cat') === activeCategory);
        });

        // Se ativo está dentro de um grupo, abre o grupo e marca o toggle
        document.querySelectorAll('.cat-menu__item--group').forEach(function (group) {
            var anyActive = false;
            group.querySelectorAll('[data-cat]').forEach(function (a) {
                if (activeCategory && a.getAttribute('data-cat') === activeCategory) anyActive = true;
            });
            var toggle = group.querySelector('.cat-menu__toggle');
            var sub = group.querySelector('.cat-menu__sublist');
            if (toggle) toggle.classList.toggle('is-active', anyActive);
            if (anyActive && sub) {
                sub.hidden = false;
                group.classList.add('cat-menu__item--open');
                if (toggle) toggle.setAttribute('aria-expanded', 'true');
            }
        });

        requestAnimationFrame(function () { applyFilters(); });
    }

    function initHeaderNavToggle() {
        var toggle = document.getElementById('menuToggle');
        var nav = document.getElementById('headerNav');
        if (!toggle || !nav) return;

        toggle.addEventListener('click', function () {
            var open = nav.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
        });
    }

    function initStoreSidebar() {
        var sidebar = document.getElementById('storeSidebar');
        var toggle = document.getElementById('catsToggle');
        var close = document.getElementById('catsClose');
        var backdrop = document.getElementById('catsBackdrop');

        if (!sidebar || !toggle || !backdrop) return;

        function openCats() {
            sidebar.classList.add('is-open');
            backdrop.hidden = false;
            toggle.setAttribute('aria-expanded', 'true');
        }
        function closeCats() {
            sidebar.classList.remove('is-open');
            backdrop.hidden = true;
            toggle.setAttribute('aria-expanded', 'false');
        }

        toggle.addEventListener('click', function () {
            if (sidebar.classList.contains('is-open')) closeCats();
            else openCats();
        });

        if (close) close.addEventListener('click', closeCats);
        backdrop.addEventListener('click', closeCats);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeCats();
        });

        // Fecha ao clicar em qualquer link do menu (categoria filtro ou link para outra página, ex.: Grandes Baús)
        sidebar.addEventListener('click', function (e) {
            var link = e.target && e.target.closest && e.target.closest('a.cat-menu__link, a.cat-menu__sublink');
            if (link) closeCats();
        });
    }

    function initOrgsFacsLanding() {
        if (!orgsFacsLanding) return;
        orgsFacsLanding.addEventListener('click', function (e) {
            var btn = e.target && e.target.closest && e.target.closest('button[data-orgs-cat]');
            if (!btn) return;
            var cat = btn.getAttribute('data-orgs-cat');
            if (!cat) return;
            activeOrgsFacsSubCategory = cat;
            applyFilters();
        });
    }

    function initCategoryMenu() {
        var container = document.querySelector('[data-category-menu]');
        if (!container) return;

        renderCategoryMenu(container);

        // Clique: só interceptar links de FILTRO (data-cat); links para outras páginas (Aeronaves, Grandes Baús, etc.) devem navegar
        container.addEventListener('click', function (e) {
            var a = e.target && e.target.closest && e.target.closest('a.cat-menu__link, a.cat-menu__sublink');
            if (!a) return;
            var cat = a.getAttribute('data-cat');
            if (cat && productGrid) {
                e.preventDefault();
                setActiveCategory(cat);
                return;
            }
            // Link para outra página (grandes-baus.html, aeronaves.html, etc.) – não fazer nada, deixar o link abrir
        });

        // Categoria inicial: URL ?cat=... ou padrão VIP (idle para evitar reflow forçado no carregamento)
        var urlCat = getQueryParam('cat');
        if (productGrid && (urlCat === 'aeronaves' || urlCat === 'grandes-baus')) {
            var redirect = urlCat === 'aeronaves' ? 'aeronaves.html' : 'grandes-baus.html';
            try { window.location.replace(redirect); } catch (_) { window.location.href = redirect; }
            return;
        }
        function runInitialCategory() {
            setActiveCategory(urlCat || 'vip', { skipUrl: true });
        }
        if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(runInitialCategory, { timeout: 120 });
        } else {
            requestAnimationFrame(function () {
                requestAnimationFrame(runInitialCategory);
            });
        }
    }

    function smoothScrollAnchors() {
        document.querySelectorAll('a[href^="#"]').forEach(function (a) {
            var id = a.getAttribute('href');
            if (id === '#') return;
            var target = document.querySelector(id);
            if (!target) return;
            a.addEventListener('click', function (e) {
                e.preventDefault();
                var el = target;
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        requestAnimationFrame(function () {
                            var top = el.getBoundingClientRect().top + (window.scrollY || window.pageYOffset);
                            window.scrollTo({ top: top, behavior: 'smooth' });
                        });
                    });
                });
            });
        });
    }

    function getCart() {
        try {
            var raw = localStorage.getItem('medellin_cart');
            if (!raw) return [];
            var arr = JSON.parse(raw);
            return Array.isArray(arr) ? arr : [];
        } catch (_) { return []; }
    }

    function setCart(arr) {
        try {
            localStorage.setItem('medellin_cart', JSON.stringify(arr));
        } catch (_) {}
    }

    function updateCartCountDisplay() {
        var count = getCart().length;
        var el = document.getElementById('cartCount');
        if (el) el.textContent = count;
        document.querySelectorAll('.btn-cart__count').forEach(function (el) { el.textContent = count; });
    }

    function cartCount() {
        updateCartCountDisplay();
    }

    var PRODUCT_TYPE_LABELS = { vip: 'VIP', skin: 'Skin', arma: 'Arma', municao: 'Munição', veiculo: 'Veículo', farm: 'Farm', salario: 'Salário', voucher: 'Voucher', pet: 'Pet', promo: 'Promoção', outros: 'Outros', rolygram: 'Rolygram', mochila: 'Mochila', penthouse: 'Penthouse' };

    function addToCart(item) {
        var cart = getCart();
        var productId = (item.productId || '').toString();
        if (productId && cart.some(function (it) { return (it.productId || '').toString() === productId; })) {
            updateCartCountDisplay();
            return;
        }
        var benefits = item.benefits || item.beneficios;
        if (benefits && !Array.isArray(benefits)) benefits = [benefits];
        cart.push({
            id: Date.now() + '-' + Math.random().toString(36).slice(2),
            name: item.name || 'Produto',
            price: typeof item.price === 'number' ? item.price : 0,
            image: item.image || '',
            productId: item.productId || '',
            productType: item.productType || '',
            description: item.description || item.descricao || '',
            benefits: benefits || []
        });
        setCart(cart);
        updateCartCountDisplay();
    }
    window.medellinAddToCart = addToCart;
    window.medellinGetCart = getCart;
    window.medellinSetCart = setCart;
    window.medellinUpdateCartCount = updateCartCountDisplay;

    function formatBRL(value) {
        var n = Number(value);
        if (!isFinite(n)) n = 0;
        try {
            return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        } catch (_) {
            return 'R$ ' + n.toFixed(2).replace('.', ',');
        }
    }

    function initCheckoutCart() {
        var cartItemsEl = document.getElementById('cartItems');
        var cartEmptyEl = document.getElementById('cartEmpty');
        var cartContentEl = document.getElementById('cartContent');
        var cartTotalEl = document.getElementById('cartTotal');
        var btnGoConfirmation = document.getElementById('btnGoConfirmation');

        if (!cartItemsEl || !cartEmptyEl || !cartContentEl || !cartTotalEl) return;

        function render() {
            var cart = getCart();

            if (!cart.length) {
                cartEmptyEl.classList.remove('hidden');
                cartContentEl.classList.add('hidden');
                cartItemsEl.innerHTML = '';
                cartTotalEl.textContent = 'R$ 0,00';
                if (btnGoConfirmation) btnGoConfirmation.disabled = true;
                return;
            }

            cartEmptyEl.classList.add('hidden');
            cartContentEl.classList.remove('hidden');

            cartItemsEl.innerHTML = '';
            var total = 0;

            cart.forEach(function (item) {
                var priceNum = Number(item && item.price);
                if (!isFinite(priceNum)) priceNum = 0;
                total += priceNum;

                var li = document.createElement('li');
                li.className = 'cart-item';

                var left = document.createElement('div');
                left.className = 'cart-item__left';
                var img = document.createElement('img');
                img.className = 'cart-item__image';
                img.width = 160;
                img.height = 160;
                img.loading = 'lazy';
                img.decoding = 'async';
                img.alt = (item && item.name) ? item.name : 'Produto';
                if (item && item.image) img.src = item.image;
                else img.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2272%22 height=%2272%22 viewBox=%220 0 72 72%22%3E%3Crect width=%2272%22 height=%2272%22 rx=%2210%22 fill=%22%23111114%22/%3E%3Cpath d=%22M22 48h28l-3-14H25l-3 14zm8-20h12l2 6H28l2-6z%22 fill=%22%2300FF88%22 opacity=%220.65%22/%3E%3C/svg%3E';
                left.appendChild(img);

                var right = document.createElement('div');
                right.className = 'cart-item__right';

                var typeLabel = (item && item.productType && PRODUCT_TYPE_LABELS[item.productType]) ? PRODUCT_TYPE_LABELS[item.productType] : (item.productType || '');
                if (typeLabel) {
                    var typeBadge = document.createElement('span');
                    typeBadge.className = 'cart-item__type';
                    typeBadge.textContent = typeLabel;
                    right.appendChild(typeBadge);
                }

                var name = document.createElement('div');
                name.className = 'cart-item__name';
                name.textContent = (item && item.name) ? item.name : 'Produto';
                right.appendChild(name);

                if (item && item.description) {
                    var desc = document.createElement('p');
                    desc.className = 'cart-item__desc';
                    desc.textContent = item.description;
                    right.appendChild(desc);
                }

                var benefits = item && item.benefits && Array.isArray(item.benefits) ? item.benefits : [];
                if (benefits.length) {
                    var ul = document.createElement('ul');
                    ul.className = 'cart-item__benefits';
                    benefits.forEach(function (b) {
                        var liB = document.createElement('li');
                        liB.textContent = b;
                        ul.appendChild(liB);
                    });
                    right.appendChild(ul);
                }

                var footer = document.createElement('div');
                footer.className = 'cart-item__footer';
                var price = document.createElement('div');
                price.className = 'cart-item__price';
                price.textContent = formatBRL(priceNum);
                var remove = document.createElement('button');
                remove.type = 'button';
                remove.className = 'cart-item__remove';
                remove.textContent = 'Remover';
                if (item && item.id) remove.setAttribute('data-id', item.id);
                footer.appendChild(price);
                footer.appendChild(remove);
                right.appendChild(footer);

                li.appendChild(left);
                li.appendChild(right);
                cartItemsEl.appendChild(li);
            });

            cartTotalEl.textContent = formatBRL(total);
            if (btnGoConfirmation) btnGoConfirmation.disabled = false;
        }

        cartItemsEl.addEventListener('click', function (e) {
            var btn = e.target && e.target.closest && e.target.closest('.cart-item__remove');
            if (!btn) return;
            var id = btn.getAttribute('data-id');
            if (!id) return;
            var cart = getCart();
            var next = cart.filter(function (it) { return it && it.id !== id; });
            setCart(next);
            cartCount();
            render();
        });

        if (btnGoConfirmation) {
            btnGoConfirmation.addEventListener('click', function () {
                var step2 = document.querySelector('.checkout-step[data-step="2"]');
                if (step2) step2.click();
            });
        }

        render();
    }

    function parsePriceFromText(text) {
        if (!text || typeof text !== 'string') return 0;
        var match = text.replace(/\s/g, '').match(/[\d.,]+/);
        if (!match) return 0;
        var num = parseFloat(match[0].replace(/\./g, '').replace(',', '.')) || 0;
        if (!isFinite(num)) return 0;
        return num;
    }

    function bindCartButtons() {
        document.addEventListener('click', function (e) {
            var btn = e.target && e.target.closest && e.target.closest('.product-card__btn, .card-btn, .vip-btn');
            if (!btn || btn.disabled) return;

            e.preventDefault();
            e.stopPropagation();

            try {
                var card = btn.closest('.product-card') || btn.closest('.card[data-product-id]');
                var detailCard = btn.closest('.vip-detail-card');
                if (!detailCard) detailCard = document.querySelector('.vip-detail-card');
                var name = '';
                var price = 0;
                var image = '';
                var productId = btn.getAttribute('data-product-id') || '';
                var productType = '';
                if (btn.hasAttribute('data-price')) price = parseFloat(btn.getAttribute('data-price')) || 0;
                if (card) {
                    if (!productId) productId = card.getAttribute('data-product-id') || '';
                    productType = card.getAttribute('data-type') || '';
                    var nameEl = card.querySelector('.product-card__name, .card-title');
                    var priceAttr = card.getAttribute('data-price');
                    var priceEl = card.querySelector('.product-card__price');
                    var imgEl = card.querySelector('.product-card__image');
                    name = nameEl ? nameEl.textContent.trim() : '';
                    if (price === 0 && priceAttr) price = parseFloat(priceAttr) || 0;
                    if (price === 0 && priceEl) price = parsePriceFromText(priceEl.textContent);
                    if (imgEl && imgEl.src) image = imgEl.src;
                } else if (detailCard && detailCard.contains(btn)) {
                    if (!productId) productId = detailCard.getAttribute('data-product-id') || '';
                    productType = detailCard.getAttribute('data-type') || '';
                    var titleEl = document.querySelector('.banner-title');
                    var priceEl = detailCard.querySelector('.vip-detail-price');
                    var priceAttrDetail = detailCard.getAttribute('data-price');
                    var imgEl = detailCard.querySelector('.vip-detail-card__image');
                    name = titleEl ? titleEl.textContent.trim() : (document.title || '').replace(' – Medellin RP', '').trim();
                    if (price === 0 && priceAttrDetail) price = parseFloat(priceAttrDetail) || 0;
                    if (price === 0 && priceEl) price = parsePriceFromText(priceEl.textContent);
                    if (imgEl && imgEl.src) image = imgEl.src;
                }
                addToCart({ name: name || 'Produto', price: price, image: image, productId: productId, productType: productType });
                btn.textContent = 'Adicionado ✓';
                btn.disabled = true;
                setTimeout(function () {
                    if (btn.dataset.btnLabel) btn.textContent = btn.dataset.btnLabel;
                    else if (btn.classList.contains('vip-btn-subscribe')) btn.textContent = 'Assinar plano mensal';
                    else if (btn.classList.contains('product-card__btn')) btn.textContent = 'Comprar';
                    else btn.textContent = 'Adicionar ao carrinho';
                    btn.disabled = false;
                }, 1500);
            } catch (err) {
                if (typeof console !== 'undefined' && console.error) console.error('Carrinho:', err);
            }
        });
    }

    function initPetDetailLinks() {
        if (!productGrid) return;
        productGrid.querySelectorAll('.product-card[data-category="pets"]').forEach(function (card) {
            var link = card.querySelector('a.product-card__link');
            var id = card.getAttribute('data-product-id');
            if (link && id) {
                link.href = 'pet-detalhe.html?id=' + encodeURIComponent(id);
            }
        });
    }

    function initEspecialDetailLinks() {
        if (!productGrid) return;
        productGrid.querySelectorAll('.product-card[data-category="especial"]').forEach(function (card) {
            var link = card.querySelector('a.product-card__link');
            var id = card.getAttribute('data-product-id');
            if (link && id) {
                link.href = 'especial-detalhe.html?id=' + encodeURIComponent(id);
            }
        });
    }

    /** Boas práticas imagens: garante decoding=async em todas (páginas novas herdam) */
    function normalizeImages() {
        document.querySelectorAll('img[src]').forEach(function (img) {
            if (!img.getAttribute('decoding')) img.setAttribute('decoding', 'async');
        });
    }

    function init() {
        normalizeImages();
        bindFilters();
        initHeaderNavToggle();
        initStoreSidebar();
        initCategoryMenu();
        initOrgsFacsLanding();
        smoothScrollAnchors();
        cartCount();
        initCheckoutCart();
        bindCartButtons();
        initPetDetailLinks();
        initEspecialDetailLinks();
        if (!document.querySelector('[data-category-menu]')) applyFilters();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
