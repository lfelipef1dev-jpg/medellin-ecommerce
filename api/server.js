/**
 * API Loja VIP – Mercado Pago
 * POST /api/create-preference → cria preferência e devolve link do checkout
 * POST /api/webhook/mp → recebe notificação do MP e insere em medellin_loja_pending
 */
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const mysql = require('mysql2/promise');
const { validateAndCalculateCart, getProduct } = require('./products');
const crypto = require('crypto');
const fs = require('fs');
const { getProductImageUrl } = require('./product-images');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy: requisições vêm do Worker (Cloudflare) ou Ngrok; rate-limit usa X-Forwarded-For corretamente
app.set('trust proxy', 1);

// Seguranca: headers HTTP (CSP, X-Content-Type-Options, etc)
app.use(helmet({
  contentSecurityPolicy: false, // Desabilita CSP para permitir assets inline da loja
  crossOriginEmbedderPolicy: false
}));

// Rate limiting: protecao contra brute-force e abuso
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // max 100 requests por IP por janela
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limit mais restrito para criacao de pagamento
const createPaymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // max 10 tentativas por minuto
  message: { error: 'Muitas tentativas de pagamento. Aguarde um momento.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Aplicar rate limit em todas as rotas /api
app.use('/api', apiLimiter);

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const FRONT_URL = (process.env.FRONT_URL || '').replace(/\/$/, '');
const DB = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'qbcore',
  charset: 'utf8mb4'
};

let pool = null;
function getPool() {
  if (!pool) pool = mysql.createPool(DB);
  return pool;
}

function normalizeLicense(value) {
  if (!value || typeof value !== 'string') return null;
  const v = value.trim();
  if (!v) return null;
  return v.toLowerCase().startsWith('license:') ? v : 'license:' + v;
}

// Criar tabelas de pedidos, pagamentos processados e fila de entregas (idempotência)
async function ensureTables() {
  const p = getPool();
  await p.query(`
    CREATE TABLE IF NOT EXISTS medellin_loja_orders (
      order_id VARCHAR(64) PRIMARY KEY,
      identifier_type ENUM('license','account_id') NOT NULL,
      identifier_value VARCHAR(255) NOT NULL,
      items JSON NOT NULL,
      total DECIMAL(10,2) NOT NULL,
      status ENUM('pending','paid','delivered','cancelled') DEFAULT 'pending',
      mp_payment_id VARCHAR(64) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_status (status),
      INDEX idx_mp_payment (mp_payment_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await p.query(`
    CREATE TABLE IF NOT EXISTS medellin_loja_processed_payments (
      mp_payment_id VARCHAR(64) PRIMARY KEY,
      order_id VARCHAR(64) NOT NULL,
      processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await p.query(`
    CREATE TABLE IF NOT EXISTS medellin_loja_pending (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      license VARCHAR(255) NULL,
      account_id INT UNSIGNED NULL,
      product_type VARCHAR(32) NOT NULL,
      product_id VARCHAR(128) NOT NULL,
      product_tipo VARCHAR(32) NULL,
      transaction_id VARCHAR(128) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      delivered_at TIMESTAMP NULL DEFAULT NULL,
      PRIMARY KEY (id),
      INDEX idx_pending (delivered_at, product_type),
      INDEX idx_license (license(191)),
      INDEX idx_transaction (transaction_id(64))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function ensureScriptTables() {
  const p = getPool();
  await p.query(`
    CREATE TABLE IF NOT EXISTS script_orders (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      order_id VARCHAR(64) NOT NULL UNIQUE,
      product_id VARCHAR(64) NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      license_key VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      token VARCHAR(64) NOT NULL UNIQUE,
      downloads_left INT DEFAULT 3,
      expires_at DATETIME NOT NULL,
      status ENUM('pending','paid','cancelled') DEFAULT 'pending',
      mp_payment_id VARCHAR(64) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_token (token),
      INDEX idx_order_id (order_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

// POST /api/register-order – só grava o pedido no banco (sem criar preferência MP).
// Usado pelo Worker no fallback: registra o pedido antes de criar o link de pagamento,
// para o webhook encontrar o pedido e inserir em medellin_loja_pending.
// Body: mesmo de create-preference: { identifierType, identifierValue, items }
app.post('/api/register-order', createPaymentLimiter, async (req, res) => {
  try {
    const { identifierType, identifierValue, items } = req.body || {};
    const cartResult = validateAndCalculateCart(items);
    if (!cartResult.valid) {
      return res.status(400).json({ error: cartResult.error || 'Carrinho inválido' });
    }
    if (!identifierValue || typeof identifierValue !== 'string' || !identifierValue.trim()) {
      return res.status(400).json({ error: 'Informe o identificador (license ou ID da conta)' });
    }
    const idType = (identifierType || 'license').toLowerCase() === 'account_id' ? 'account_id' : 'license';
    const idValue = idType === 'license' ? normalizeLicense(identifierValue) || identifierValue.trim() : String(identifierValue).trim();
    const total = cartResult.total;
    if (total <= 0) return res.status(400).json({ error: 'Total inválido' });

    const orderId = 'mp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
    const pool = getPool();
    await pool.query(
      `INSERT INTO medellin_loja_orders (order_id, identifier_type, identifier_value, items, total, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [orderId, idType, idValue, JSON.stringify(cartResult.items), total]
    );
    console.log('[register-order] Pedido registrado:', orderId);
    return res.json({ order_id: orderId });
  } catch (e) {
    console.error('[register-order]', e.message || e);
    return res.status(500).json({ error: e.message || 'Erro ao registrar pedido' });
  }
});

// POST /api/create-preference
// Body: { identifierType: 'license'|'account_id', identifierValue: string, items: [{ productId, quantity }] }
// SEGURANCA: precos vem do catalogo server-side (products.js), NAO do cliente
app.post('/api/create-preference', createPaymentLimiter, async (req, res) => {
  console.log('[create-preference] Requisição recebida');
  try {
    if (!MP_ACCESS_TOKEN) {
      return res.status(503).json({ error: 'Mercado Pago não configurado (MP_ACCESS_TOKEN)' });
    }
    const { identifierType, identifierValue, items } = req.body || {};
    
    // Validar e calcular carrinho usando catalogo server-side
    const cartResult = validateAndCalculateCart(items);
    if (!cartResult.valid) {
      return res.status(400).json({ error: cartResult.error || 'Carrinho inválido' });
    }
    
    if (!identifierValue || typeof identifierValue !== 'string' || !identifierValue.trim()) {
      return res.status(400).json({ error: 'Informe o identificador (license ou ID da conta)' });
    }
    const idType = (identifierType || 'license').toLowerCase() === 'account_id' ? 'account_id' : 'license';
    const idValue = idType === 'license' ? normalizeLicense(identifierValue) || identifierValue.trim() : String(identifierValue).trim();

    // Usar precos do catalogo (server-side)
    const total = cartResult.total;
    const mpItems = cartResult.items.map((it) => {
      const item = {
        id: it.productId,
        title: it.name.substring(0, 256),
        quantity: it.quantity,
        unit_price: Math.round(it.price * 100) / 100,
        currency_id: 'BRL'
      };
      // Adicionar imagem se disponível (Mercado Pago suporta picture_url)
      const imageUrl = getProductImageUrl(it.productId, it.productType);
      if (imageUrl) {
        item.picture_url = imageUrl;
      }
      return item;
    });
    
    if (total <= 0) return res.status(400).json({ error: 'Total inválido' });

    const orderId = 'mp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
    const pool = getPool();
    await pool.query(
      `INSERT INTO medellin_loja_orders (order_id, identifier_type, identifier_value, items, total, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [orderId, idType, idValue, JSON.stringify(cartResult.items), total]
    );

    const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
    const preference = new Preference(client);
    const backSuccess = FRONT_URL ? `${FRONT_URL}/checkout.html?success=1` : undefined;
    const backFailure = FRONT_URL ? `${FRONT_URL}/checkout.html?success=0` : undefined;
    const backPending = FRONT_URL ? `${FRONT_URL}/checkout.html?success=pending` : undefined;

    const pref = await preference.create({
      body: {
        items: mpItems,
        external_reference: orderId,
        metadata: {
          identifier_type: idType,
          identifier_value: idValue,
          items: JSON.stringify(cartResult.items)
        },
        back_urls: backSuccess ? { success: backSuccess, failure: backFailure, pending: backPending } : undefined,
        auto_return: 'approved',
        notification_url: process.env.WEBHOOK_URL || undefined
      }
    });

    const initPoint = pref.init_point || pref.sandbox_init_point;
    if (!initPoint) return res.status(500).json({ error: 'Mercado Pago não retornou link de pagamento' });
    return res.json({ init_point: initPoint, order_id: orderId });
  } catch (e) {
    console.error('[create-preference]', e.message || e);
    return res.status(500).json({ error: e.message || 'Erro ao criar pagamento' });
  }
});

// POST /api/webhook/mp – notificação do Mercado Pago (payment ou merchant_order)
// MP pode enviar JSON ou form-urlencoded (data.id ou data[id])
app.post('/api/webhook/mp', async (req, res) => {
  res.status(200).send('OK');
  const body = req.body || {};
  const type = body.type || body['type'];
  const dataObj = body.data || body['data'];
  const id = (dataObj && (dataObj.id != null ? dataObj.id : dataObj)) || body['data.id'] || body.data_id;

  if (!id) return;

  try {
    if (type === 'payment') {
      const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
      const paymentApi = new Payment(client);
      const result = await paymentApi.get({ id });
      const payment = result && result.body ? result.body : result;
      const status = payment.status;
      const externalRef = payment.external_reference;
      const mpPaymentId = String(payment.id || id);

      if (status !== 'approved') return;

      const pool = getPool();

      // Pedidos de script (prefix scr_) – fluxo separado
      if (externalRef && externalRef.startsWith('scr_')) {
        const [alreadyDone] = await pool.query(
          'SELECT 1 FROM medellin_loja_processed_payments WHERE mp_payment_id = ?',
          [mpPaymentId]
        );
        if (alreadyDone && alreadyDone.length > 0) return;

        const [scriptRows] = await pool.query(
          "SELECT order_id, product_id FROM script_orders WHERE order_id = ? AND status = 'pending'",
          [externalRef]
        );
        if (scriptRows && scriptRows.length > 0) {
          await pool.query(
            "UPDATE script_orders SET status = 'paid', mp_payment_id = ? WHERE order_id = ?",
            [mpPaymentId, externalRef]
          );
          await pool.query(
            'INSERT IGNORE INTO medellin_loja_processed_payments (mp_payment_id, order_id) VALUES (?, ?)',
            [mpPaymentId, externalRef]
          );
          console.log('[webhook/mp] Script pago:', externalRef, '| produto:', scriptRows[0].product_id);
        }
        return;
      }

      const [rows] = await pool.query(
        'SELECT 1 FROM medellin_loja_processed_payments WHERE mp_payment_id = ?',
        [mpPaymentId]
      );
      if (rows && rows.length > 0) return;

      const [orders] = await pool.query(
        'SELECT order_id, identifier_type, identifier_value, items FROM medellin_loja_orders WHERE order_id = ? AND status = ?',
        [externalRef, 'pending']
      );

      let orderItems;
      let license = null;
      let accountId = null;

      if (orders && orders.length > 0) {
        const order = orders[0];
        orderItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        if (Array.isArray(orderItems)) {
          license = order.identifier_type === 'license' ? order.identifier_value : null;
          const accountIdRaw = order.identifier_type === 'account_id' ? order.identifier_value : null;
          accountId = accountIdRaw != null ? (parseInt(accountIdRaw, 10) || null) : null;
        }
      }

      if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
        if (externalRef && MP_ACCESS_TOKEN) {
          try {
            const prefClient = new Preference(new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN }));
            const searchRes = await prefClient.search({ options: { external_reference: externalRef } });
            const searchBody = searchRes && searchRes.body;
            const results = searchBody && searchBody.results;
            if (results && results.length > 0 && results[0].metadata) {
              const meta = results[0].metadata;
              const idType = (meta.identifier_type || 'license').toString();
              const idVal = (meta.identifier_value || '').toString().trim();
              if (idVal) {
                license = idType === 'account_id' ? null : (idVal.toLowerCase().startsWith('license:') ? idVal : 'license:' + idVal);
                accountId = idType === 'account_id' ? (parseInt(idVal, 10) || null) : null;
                try {
                  orderItems = typeof meta.items === 'string' ? JSON.parse(meta.items) : meta.items;
                } catch (_) { orderItems = null; }
              }
            }
          } catch (err) {
            console.error('[webhook/mp] Fallback metadata:', err.message || err);
          }
        }
      }

      if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) return;
      if (!license && accountId == null) return;

      const insertedItems = [];
      for (const it of orderItems) {
        const productType = (it.productType || it.product_type || '').toLowerCase();
        let productId = String(it.productId || it.product_id || '').trim();
        if (!productType || !productId) continue;
        const productIdForPending = (it.vehicleModel && productType === 'veiculo') ? String(it.vehicleModel).toLowerCase() : String(productId).toLowerCase();
        const productTipo = (it.productTipo || it.product_tipo || 'permanente').toLowerCase();
        const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
        for (let i = 0; i < qty; i++) {
          const txId = qty > 1 ? `${mpPaymentId}_${i}` : mpPaymentId;
          await pool.query(
            `INSERT INTO medellin_loja_pending (license, account_id, product_type, product_id, product_tipo, transaction_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [license, accountId, productType, productIdForPending, productTipo === 'assinatura' ? 'assinatura' : 'permanente', txId]
          );
          insertedItems.push({ license, accountId, productType, productId: productIdForPending, productTipo, txId });
        }
      }

      await pool.query(
        'INSERT IGNORE INTO medellin_loja_processed_payments (mp_payment_id, order_id) VALUES (?, ?)',
        [mpPaymentId, externalRef || null]
      );
      if (orders && orders.length > 0) {
        await pool.query(
          "UPDATE medellin_loja_orders SET status = 'paid', mp_payment_id = ? WHERE order_id = ?",
          [mpPaymentId, orders[0].order_id]
        );
      }
      console.log('[webhook/mp] Pagamento', mpPaymentId, '– entregas inseridas em medellin_loja_pending.');

      // Tentar entregar IMEDIATAMENTE se jogador estiver online
      // O loop rápido do FiveM (2s) já processa automaticamente, mas podemos tentar chamar endpoint HTTP se configurado
      // Se não configurado ou falhar, o loop rápido do FiveM processará em até 2 segundos
      if (insertedItems.length > 0 && (license || accountId != null)) {
        try {
          const fivemEndpoint = process.env.FIVEM_DELIVERY_ENDPOINT || null;
          if (fivemEndpoint) {
            const http = require('http');
            const https = require('https');
            const payload = JSON.stringify({ license, account_id: accountId });
            const url = new URL(fivemEndpoint);
            const isHttps = url.protocol === 'https:';
            const client = isHttps ? https : http;
            const options = {
              hostname: url.hostname,
              port: url.port || (isHttps ? 443 : 80),
              path: url.pathname,
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
              },
              timeout: 3000
            };
            const req = client.request(options, (res) => {
              if (res.statusCode === 200) {
                console.log('[webhook/mp] Entrega imediata solicitada ao FiveM para', license || `account_id ${accountId}`);
              }
            });
            req.on('error', () => { /* Silencioso - loop rápido do FiveM processará em até 2s */ });
            req.on('timeout', () => { req.destroy(); });
            req.write(payload);
            req.end();
          }
        } catch (e) {
          // Se falhar, o loop rápido do FiveM processará em até 2 segundos
        }
      }
    }
  } catch (e) {
    console.error('[webhook/mp]', e.message || e);
  }
});

// ============================================================
// SCRIPTS FIVEM – fluxo separado da loja VIP
// ============================================================

// POST /api/scripts/create-preference
// Body: { productId, email, licenseKey }
app.post('/api/scripts/create-preference', createPaymentLimiter, async (req, res) => {
  try {
    if (!MP_ACCESS_TOKEN) {
      return res.status(503).json({ error: 'Mercado Pago não configurado' });
    }
    const { productId, email, licenseKey } = req.body || {};

    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ error: 'Produto inválido' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'E-mail inválido' });
    }
    if (!licenseKey || typeof licenseKey !== 'string' || !licenseKey.trim()) {
      return res.status(400).json({ error: 'sv_licenseKey é obrigatório' });
    }

    const product = getProduct(productId);
    if (!product || product.type !== 'script') {
      return res.status(400).json({ error: 'Script não encontrado: ' + productId });
    }

    const orderId = 'scr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

    const pool = getPool();
    await pool.query(
      `INSERT INTO script_orders (order_id, product_id, product_name, license_key, email, token, expires_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [orderId, productId, product.name, licenseKey.trim(), email.trim().toLowerCase(), token, expiresAt]
    );

    const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
    const preference = new Preference(client);

    const pref = await preference.create({
      body: {
        items: [{
          id: productId,
          title: product.name,
          quantity: 1,
          unit_price: Math.round(product.price * 100) / 100,
          currency_id: 'BRL'
        }],
        external_reference: orderId,
        payer: { email: email.trim() },
        back_urls: {
          success: `${FRONT_URL}/download-scripts.html?token=${token}`,
          failure: `${FRONT_URL}/recursos-fivem.html?erro=pagamento`,
          pending: `${FRONT_URL}/download-scripts.html?token=${token}`
        },
        auto_return: 'approved',
        notification_url: process.env.WEBHOOK_URL || undefined
      }
    });

    const initPoint = pref.init_point || pref.sandbox_init_point;
    if (!initPoint) return res.status(500).json({ error: 'MP não retornou link de pagamento' });

    console.log('[scripts/create-preference] Pedido criado:', orderId, '| produto:', productId, '| email:', email.trim());
    return res.json({ init_point: initPoint, token });
  } catch (e) {
    console.error('[scripts/create-preference]', e.message || e);
    return res.status(500).json({ error: e.message || 'Erro ao criar pagamento' });
  }
});

// GET /api/scripts/status/:token – polling da página de download
app.get('/api/scripts/status/:token', async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ error: 'Token inválido' });

    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT status, product_name, downloads_left, expires_at FROM script_orders WHERE token = ?',
      [token]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Token não encontrado' });
    }
    const order = rows[0];
    return res.json({
      paid: order.status === 'paid',
      product_name: order.product_name,
      downloads_left: order.downloads_left,
      expires_at: order.expires_at
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Erro' });
  }
});

// GET /api/scripts/download/:token – serve o ZIP do script
app.get('/api/scripts/download/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT * FROM script_orders WHERE token = ?',
      [token]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).send('Token inválido ou expirado.');
    }
    const order = rows[0];
    if (order.status !== 'paid') {
      return res.status(402).send('Pagamento pendente ou não confirmado. Aguarde alguns segundos e tente novamente.');
    }
    if (order.downloads_left <= 0) {
      return res.status(410).send('Limite de downloads atingido (3/3). Entre em contato com o suporte se precisar de mais.');
    }
    if (new Date() > new Date(order.expires_at)) {
      return res.status(410).send('Link de download expirado (7 dias). Entre em contato com o suporte.');
    }

    const zipName = order.product_id.replace('script_', '') + '.zip';
    const zipPath = path.join(__dirname, 'downloads', zipName);

    if (!fs.existsSync(zipPath)) {
      console.error('[scripts/download] ZIP não encontrado:', zipPath);
      return res.status(503).send('Arquivo temporariamente indisponível. Entre em contato com o suporte: discord.gg/medellin');
    }

    await pool.query(
      'UPDATE script_orders SET downloads_left = downloads_left - 1 WHERE token = ?',
      [token]
    );

    console.log('[scripts/download] Download:', order.product_id, '| token:', token, '| restam:', order.downloads_left - 1);
    res.download(zipPath, zipName);
  } catch (e) {
    console.error('[scripts/download]', e.message || e);
    res.status(500).send('Erro ao processar download.');
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'medellin-vip-store-api' });
});

// POST /api/entregar-duas-skins – entrega manual M4 Batalha + M4 Sangue (compras já aprovadas que não caíram).
// Body: { token: string (opcional se ENTREGA_MANUAL_TOKEN não estiver definido), license: string } ou { token, account_id: number }
const ENTREGAS_DUAS_SKINS = [
  { product_id: 'weapon_m4_ab', transaction_id: '145916111610' },
  { product_id: 'weapon_m4_ac', transaction_id: '144781174509' },
];
app.post('/api/entregar-duas-skins', async (req, res) => {
  try {
    const secret = process.env.ENTREGA_MANUAL_TOKEN;
    if (secret && secret !== (req.body && req.body.token)) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    const licenseRaw = req.body && req.body.license;
    const accountId = req.body && req.body.account_id != null ? parseInt(req.body.account_id, 10) : null;
    let license = null;
    if (licenseRaw && typeof licenseRaw === 'string' && licenseRaw.trim()) {
      license = licenseRaw.trim().toLowerCase().startsWith('license:') ? licenseRaw.trim() : 'license:' + licenseRaw.trim();
    }
    if (!license && !accountId) {
      return res.status(400).json({ error: 'Envie license ou account_id no body' });
    }
    const pool = getPool();
    for (const e of ENTREGAS_DUAS_SKINS) {
      await pool.query(
        `INSERT INTO medellin_loja_pending (license, account_id, product_type, product_id, product_tipo, transaction_id)
         VALUES (?, ?, 'skin', ?, 'permanente', ?)`,
        [license || null, accountId || null, e.product_id, e.transaction_id]
      );
    }
    console.log('[entregar-duas-skins] 2 entregas inseridas para', license || 'account_id ' + accountId);
    return res.json({ ok: true, message: '2 skins na fila. Saia e entre no servidor para receber.' });
  } catch (e) {
    console.error('[entregar-duas-skins]', e.message || e);
    return res.status(500).json({ error: e.message || 'Erro' });
  }
});

// Servir o site da loja (vip-store-web) – index em / e imagens em /assets/*
const siteDir = path.join(__dirname, '..');
app.use(express.static(siteDir, {
  index: 'index.html',
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  setHeaders: (res, filePath) => {
    if (/\.(png|jpg|jpeg|gif|webp|ico|svg)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// Qualquer erro não tratado (middleware, body parser, etc.) vira JSON para o Worker/checkout não quebrar
app.use((err, req, res, next) => {
  console.error('[API erro]', err.message || err);
  if (!res.headersSent) {
    res.status(500).json({ error: err.message || 'Erro interno da API' });
  }
});

(async () => {
  try {
    await ensureTables();
    await ensureScriptTables();
    app.listen(PORT, '0.0.0.0', () => {
      console.log('Medellin VIP Store API rodando na porta', PORT);
      console.log('Site da loja: http://localhost:' + PORT + ' (abrir no navegador)');
      if (!MP_ACCESS_TOKEN) console.warn('AVISO: MP_ACCESS_TOKEN não definido. Defina em .env');
    });
  } catch (e) {
    const msg = e.message || String(e);
    console.error('Erro ao iniciar:', msg);
    if (msg.includes('auth_gssapi_client') || msg.includes('unknown plugin')) {
      console.error('');
      console.error('--- CORRECAO BANCO (autenticacao) ---');
      console.error('O usuario do banco esta usando um plugin que o Node nao suporta.');
      const u = process.env.DB_USER || 'root';
      console.error('No HeidiSQL/MySQL/MariaDB rode:');
      console.error('  MariaDB: ALTER USER \'' + u + '\'@\'localhost\' IDENTIFIED BY \'sua_senha\';');
      console.error('  MySQL 8:  ALTER USER \'' + u + '\'@\'localhost\' IDENTIFIED WITH mysql_native_password BY \'sua_senha\';');
      console.error('  FLUSH PRIVILEGES;');
      console.error('Substitua sua_senha pela senha do DB_PASSWORD no .env.');
      console.error('------------------------------------');
    }
    process.exit(1);
  }
})();
