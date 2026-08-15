/**
 * Worker: api.roleplaymedellin.com.br
 * 1) Tenta fazer proxy para API_UPSTREAM_URL (sua API Node).
 * 2) Se falhar, cria a preferência no Mercado Pago direto (redirect para pagamento funciona).
 * Para entregas no jogo: a API Node precisa estar no ar para receber o webhook.
 */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, ngrok-skip-browser-warning',
  'Access-Control-Max-Age': '86400',
};

const MP_PREFERENCES_URL = 'https://api.mercadopago.com/checkout/preferences';

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

/**
 * Cria preferência no Mercado Pago (fallback quando a API Node não está acessível).
 * Antes, tenta registrar o pedido na API (POST /api/register-order) para o webhook encontrar
 * o pedido e entregar os itens automaticamente.
 * Body: { identifierType, identifierValue, items: [{ name, price, productId, productType, quantity }] }
 */
async function createPreferenceInWorker(body, env) {
  const token = env.MP_ACCESS_TOKEN;
  if (!token || typeof token !== 'string' || token.startsWith('http')) return null;
  const items = body.items;
  if (!Array.isArray(items) || items.length === 0) return null;
  const identifierValue = (body.identifierValue || '').toString().trim();
  if (!identifierValue) return null;

  const frontUrl = (env.FRONT_URL || 'https://roleplaymedellin.com.br').replace(/\/+$/, '');
  const apiOrigin = 'https://api.roleplaymedellin.com.br';
  let orderId = 'mp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);

  const base = (env.API_UPSTREAM_URL || '').toString().replace(/\/+$/, '');
  if (base && base.startsWith('http')) {
    try {
      const regRes = await fetch(base + '/api/register-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifierType: body.identifierType || 'license',
          identifierValue: body.identifierValue,
          items: body.items,
        }),
      });
      if (regRes.ok) {
        const data = await regRes.json().catch(() => ({}));
        if (data && data.order_id) {
          orderId = data.order_id;
        }
      }
    } catch (_) {}
  }

  // Função helper para obter URL da imagem
  const getImageUrl = (productId, productType) => {
    if (!productId) return null;
    const id = String(productId).toLowerCase().trim();
    if (productType === 'skin' || id.startsWith('weapon_')) return `${frontUrl}/assets/logo.webp`;
    if (id.startsWith('vip_')) {
      if (id.includes('bronze')) return `${frontUrl}/assets/vips/vip-bronze.webp`;
      if (id.includes('prata')) return `${frontUrl}/assets/vips/vip-prata.webp`;
      if (id.includes('ouro')) return `${frontUrl}/assets/vips/vip-ouro-permanente.webp`;
      if (id.includes('platinum')) return `${frontUrl}/assets/vips/vip-platinum.webp`;
      if (id.includes('black')) return `${frontUrl}/assets/vips/vip-black.webp`;
      return `${frontUrl}/assets/vips/vip-bronze.webp`;
    }
    if (id.startsWith('pets_')) {
      const petName = id.replace('pets_', '').replace(/_/g, '-');
      return `${frontUrl}/assets/pets/${petName}.png`;
    }
    return `${frontUrl}/assets/logo.webp`;
  };
  
  const mpItems = items.map((it) => {
    const item = {
      id: (it.productId || it.id || 'item').toString().substring(0, 256),
      title: (it.name || 'Produto').toString().substring(0, 256),
      quantity: Math.max(1, parseInt(it.quantity, 10) || 1),
      currency_id: 'BRL',
      unit_price: Math.round((Number(it.price) || 0) * 100) / 100,
    };
    // Adicionar imagem se disponível
    const imageUrl = getImageUrl(it.productId, it.productType);
    if (imageUrl) {
      item.picture_url = imageUrl;
    }
    return item;
  });

  const total = mpItems.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  if (total <= 0) return null;

  const mpBody = {
    items: mpItems,
    external_reference: orderId,
    metadata: {
      identifier_type: (body.identifierType || 'license').toString(),
      identifier_value: (body.identifierValue || '').toString(),
      items: JSON.stringify(body.items || []),
    },
    back_urls: {
      success: frontUrl + '/checkout.html?success=1',
      failure: frontUrl + '/checkout.html?success=0',
      pending: frontUrl + '/checkout.html?success=pending',
    },
    auto_return: 'approved',
    notification_url: apiOrigin + '/api/webhook/mp',
  };

  const res = await fetch(MP_PREFERENCES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    },
    body: JSON.stringify(mpBody),
  });

  const data = await res.json().catch(() => ({}));
  const initPoint = data.init_point || data.sandbox_init_point;
  if (!initPoint) return jsonResponse({ error: data.message || 'Mercado Pago não retornou link' }, res.status || 500);
  return jsonResponse({ init_point: initPoint, order_id: orderId });
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    const url = new URL(request.url);
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/api/health' || url.pathname === '/api/health/')) {
      return jsonResponse({ ok: true, service: 'medellin-api-worker', message: 'Worker ativo. Use POST /api/create-preference para pagamento.' });
    }

    const isCreatePreference = request.method === 'POST' && (url.pathname === '/api/create-preference' || url.pathname === '/api/create-preference/');

    const base = (env.API_UPSTREAM_URL || '').toString().replace(/\/+$/, '');
    const hasUpstream = base && base.startsWith('http');

    if (isCreatePreference && hasUpstream) {
      const upstreamUrl = base + url.pathname + url.search;
      const headers = new Headers(request.headers);
      headers.delete('cf-connecting-ip');
      headers.delete('cf-ray');
      headers.delete('cf-ipcountry');
      const requestClone = request.clone();
      const UPSTREAM_TIMEOUT_MS = 8000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
      try {
        const res = await fetch(upstreamUrl, {
          method: request.method,
          headers,
          body: request.body,
          redirect: 'follow',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const contentType = (res.headers.get('Content-Type') || '').toLowerCase();
        const isJson = contentType.indexOf('application/json') >= 0;
        const resHeaders = new Headers(res.headers);
        Object.entries(CORS).forEach(([k, v]) => resHeaders.set(k, v));
        resHeaders.delete('connection');
        if (!isJson && res.status >= 400) {
          const body = await requestClone.json().catch(() => ({}));
          const fallback = await createPreferenceInWorker(body, env);
          if (fallback) return fallback;
          return jsonResponse({ error: 'Resposta inválida da API. Confira se a API Node está rodando.' }, 502);
        }
        return new Response(res.body, { status: res.status, statusText: res.statusText, headers: resHeaders });
      } catch (err) {
        clearTimeout(timeoutId);
        const body = await requestClone.json().catch(() => ({}));
        const fallback = await createPreferenceInWorker(body, env);
        if (fallback) return fallback;
        return jsonResponse(
          { error: 'API indisponível. Configure MP_ACCESS_TOKEN no Worker para criar pagamento direto.' },
          503
        );
      }
    }

    if (isCreatePreference && !hasUpstream) {
      const token = env.MP_ACCESS_TOKEN;
      if (!token) {
        return jsonResponse(
          { error: 'Configure o secret MP_ACCESS_TOKEN no Worker (token do Mercado Pago).' },
          503
        );
      }
      const body = await request.json().catch(() => ({}));
      return createPreferenceInWorker(body, env) || jsonResponse({ error: 'Dados inválidos' }, 400);
    }

    if (hasUpstream) {
      const upstreamUrl = base + url.pathname + url.search;
      const headers = new Headers(request.headers);
      headers.delete('cf-connecting-ip');
      headers.delete('cf-ray');
      headers.delete('cf-ipcountry');
      try {
        const res = await fetch(upstreamUrl, {
          method: request.method,
          headers,
          body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
          redirect: 'follow',
        });
        const resHeaders = new Headers(res.headers);
        Object.entries(CORS).forEach(([k, v]) => resHeaders.set(k, v));
        resHeaders.delete('connection');
        return new Response(res.body, { status: res.status, statusText: res.statusText, headers: resHeaders });
      } catch (err) {
        return jsonResponse(
          { error: 'API indisponível. Verifique API_UPSTREAM_URL ou configure MP_ACCESS_TOKEN.' },
          503
        );
      }
    }

    return jsonResponse({ error: 'Configure API_UPSTREAM_URL ou MP_ACCESS_TOKEN no Worker.' }, 503);
  },
};
