/**
 * Verifica se a compra "M4 Sangue" foi registrada no banco e, se quiser, insere
 * a entrega manualmente para você receber a skin no próximo login.
 *
 * Uso:
 *   node check_compra_m4_sangue.js                    → só consulta (últimos pedidos e fila de entrega)
 *   node check_compra_m4_sangue.js SUA_LICENSE        → consulta e INSERE entrega da skin M4 Sangue
 *
 * Sua license: no jogo pode aparecer no F8 ou o dono do servidor vê no banco (players) / console.
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const DB = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'qbcore',
  charset: 'utf8mb4'
};

function normalizeLicense(value) {
  if (!value || typeof value !== 'string') return null;
  const v = value.trim();
  return v.toLowerCase().startsWith('license:') ? v : 'license:' + v;
}

async function main() {
  const licenseArg = process.argv[2];
  const pool = mysql.createPool(DB);

  console.log('\n=== Últimos pedidos (medellin_loja_orders) ===');
  const [orders] = await pool.query(
    `SELECT order_id, identifier_type, identifier_value, items, total, status, created_at
     FROM medellin_loja_orders ORDER BY created_at DESC LIMIT 10`
  );
  if (orders.length === 0) {
    console.log('Nenhum pedido encontrado.');
  } else {
    orders.forEach(o => {
      const items = typeof o.items === 'string' ? o.items : JSON.stringify(o.items);
      console.log(`  ${o.order_id} | ${o.status} | R$ ${o.total} | ${o.identifier_value} | ${o.created_at}`);
      console.log(`    items: ${items.substring(0, 120)}...`);
    });
  }

  console.log('\n=== Fila de entrega (medellin_loja_pending, não entregues) ===');
  const [pending] = await pool.query(
    `SELECT id, license, product_type, product_id, transaction_id, created_at
     FROM medellin_loja_pending WHERE delivered_at IS NULL ORDER BY id DESC LIMIT 15`
  );
  if (pending.length === 0) {
    console.log('Nenhuma entrega pendente. Se você pagou e não recebeu, o webhook provavelmente não chegou na API.');
  } else {
    pending.forEach(p => {
      console.log(`  id=${p.id} | ${p.license || 'N/A'} | ${p.product_type} | ${p.product_id} | ${p.created_at}`);
    });
  }

  if (licenseArg) {
    const license = normalizeLicense(licenseArg);
    if (!license) {
      console.log('\nErro: passe sua license. Ex: node check_compra_m4_sangue.js license:abc123...');
      process.exit(1);
    }
    const transactionId = 'manual_m4_sangue_' + Date.now();
    await pool.query(
      `INSERT INTO medellin_loja_pending (license, account_id, product_type, product_id, product_tipo, transaction_id)
       VALUES (?, NULL, 'skin', 'WEAPON_M4_AC', 'permanente', ?)`,
      [license, transactionId]
    );
    console.log('\n[OK] Inserida 1 entrega para skin M4 Sangue (WEAPON_M4_AC) para license:', license);
    console.log('     Na próxima vez que você logar no servidor (ou já estando online), o recurso medellin-loja-entregas vai entregar a skin no inventário.');
  } else {
    console.log('\nPara receber a skin M4 Sangue manualmente, rode:');
    console.log('  node check_compra_m4_sangue.js SUA_LICENSE');
    console.log('(Substitua SUA_LICENSE pela sua license do FiveM.)');
  }

  await pool.end();
}

main().catch(e => {
  console.error(e.message || e);
  process.exit(1);
});
