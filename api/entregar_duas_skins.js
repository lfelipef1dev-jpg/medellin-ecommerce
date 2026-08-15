/**
 * Entrega manual das 2 skins já compradas e aprovadas que não caíram no inventário:
 * - M4 Batalha  (transação 145916111610) – WEAPON_M4_AB
 * - M4 Sangue  (transação 144781174509) – WEAPON_M4_AC
 *
 * Uso (na pasta api, com .env configurado):
 *   node entregar_duas_skins.js SUA_LICENSE
 *   node entregar_duas_skins.js account_id 12345
 *
 * No jogo: saia e entre de novo no servidor (ou espere ~45s se já estiver online).
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

const ENTREGAS = [
  { product_id: 'weapon_m4_ab', transaction_id: '145916111610' }, // M4 Batalha
  { product_id: 'weapon_m4_ac', transaction_id: '144781174509' },   // M4 Sangue
];

function normalizeLicense(value) {
  if (!value || typeof value !== 'string') return null;
  const v = value.trim();
  return v.toLowerCase().startsWith('license:') ? v : 'license:' + v;
}

async function main() {
  const arg1 = process.argv[2];
  const arg2 = process.argv[3];
  const pool = mysql.createPool(DB);

  if (!arg1) {
    console.log('\nUso:');
    console.log('  node entregar_duas_skins.js SUA_LICENSE');
    console.log('  node entregar_duas_skins.js account_id 12345');
    console.log('\nIsso insere as 2 entregas (M4 Batalha + M4 Sangue) na fila.');
    await pool.end();
    return;
  }

  let license = null;
  let accountId = null;
  if (arg1.toLowerCase() === 'account_id' && arg2) {
    accountId = parseInt(arg2, 10);
    if (!accountId) {
      console.error('account_id deve ser um número.');
      process.exit(1);
    }
  } else {
    license = normalizeLicense(arg1);
    if (!license) {
      console.error('Informe sua license ou: node entregar_duas_skins.js account_id 12345');
      process.exit(1);
    }
  }

  for (const e of ENTREGAS) {
    await pool.query(
      `INSERT INTO medellin_loja_pending (license, account_id, product_type, product_id, product_tipo, transaction_id)
       VALUES (?, ?, 'skin', ?, 'permanente', ?)`,
      [license || null, accountId || null, e.product_id, e.transaction_id]
    );
  }

  console.log('\n[OK] 2 entregas inseridas na fila: M4 Batalha + M4 Sangue.');
  if (license) console.log('     License:', license);
  if (accountId) console.log('     Account ID:', accountId);
  console.log('     No jogo: saia e entre no servidor (ou espere alguns segundos se já estiver online).');
  await pool.end();
}

main().catch(e => {
  console.error(e.message || e);
  process.exit(1);
});
