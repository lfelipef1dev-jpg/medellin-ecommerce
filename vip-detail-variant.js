(function () {
    var path = window.location.pathname;
    var page = path.slice(path.lastIndexOf('/') + 1) || path;
    var params = new URLSearchParams(window.location.search);
    var tipo = params.get('tipo');
    if (!tipo) return;

    var config = {
        'vip-black.html': {
            assinatura: { img: 'assets/vips/vip-black-assinatura.png?v=20260207-img2', price: 'R$ 318,08 <small>(Assinatura mensal)</small>', priceAlt: 'ou R$ 409,21 à vista' },
            permanente: { img: 'assets/vips/vip-black.png', price: 'R$ 409,21', priceAlt: 'Permanente (à vista)' }
        },
        'vip-platinum.html': {
            assinatura: { img: 'assets/vips/vip-platinum-assinatura.png?v=20260207-img2', price: 'R$ 72,58 <small>(Assinatura mensal)</small>', priceAlt: 'ou R$ 113,76 à vista' },
            permanente: { img: 'assets/vips/vip-platinum.png', price: 'R$ 113,76', priceAlt: 'Permanente (à vista)' }
        },
        'vip-ouro.html': {
            assinatura: { img: 'assets/vips/vip-ouro-assinatura.png?v=20260207-ouro1', price: 'R$ 38,42 <small>(Assinatura)</small>', priceAlt: 'ou R$ 68,33 à vista' },
            permanente: { img: 'assets/vips/vip-ouro-permanente.png?v=20260207-ouro1', price: 'R$ 68,33', priceAlt: 'Permanente (à vista)' }
        },
        'vip-prata.html': {
            assinatura: { img: 'assets/vips/vip-prata-assinatura.png?v=20260207-img2', price: 'R$ 23,48 <small>(Assinatura)</small>', priceAlt: 'ou R$ 31,91 à vista' },
            permanente: { img: 'assets/vips/vip-prata.png', price: 'R$ 31,91', priceAlt: 'Permanente (à vista)' }
        },
        'vip-policia.html': {
            assinatura: { img: 'assets/vips/vip-policia-assinatura.png?v=20260207-img2', price: 'R$ 23,48 <small>(Assinatura)</small>', priceAlt: 'ou R$ 31,91 à vista' },
            permanente: { img: 'assets/vips/vip-policia.png', price: 'R$ 31,91', priceAlt: 'Permanente (à vista)' }
        }
    };

    var variant = config[page] && config[page][tipo];
    if (!variant) return;

    var img = document.querySelector('.vip-detail-card__image');
    var priceEl = document.querySelector('.vip-detail-price');
    var priceAltEl = document.querySelector('.vip-detail-price-alt');
    var subscribeBtn = document.querySelector('.vip-detail-card .vip-btn-subscribe');
    if (img) img.src = variant.img;
    if (priceEl) priceEl.innerHTML = variant.price;
    if (priceAltEl) priceAltEl.textContent = variant.priceAlt;

    // Permanente não é assinatura: esconde o botão de assinatura.
    if (subscribeBtn) subscribeBtn.classList.toggle('hidden', tipo === 'permanente');
})();
