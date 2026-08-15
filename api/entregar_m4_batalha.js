/**
 * Entrega manual da skin M4 Batalha (compra aprovada mas não caiu no inventário).
 * Transação 145916111610 – product_id: WEAPON_M4_AB
 *
 * Uso (na pasta api, com .env configurado):
 *   node entregar_m4_batalha.js                    → só mostra como usar
 *   node entregar_m4_batalha.js SUA_LICENSE       → insere entrega para essa license
 *   node entregar_m4_batalha.js account_id 12345 → insere entrega para esse account_id (ID do painel)
 *
 * No jogo: saia e entre de novo no servidor, ou espere o resource processar; a skin cai no inventário.
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

const PRODUCT_ID = 'weapon_m4_ab'; // M4 Batalha (lowercase na pending)
const TRANSACTION_ID = '145916111610';

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
    console.log('  node entregar_m4_batalha.js SUA_LICENSE');
    console.log('  node entregar_m4_batalha.js account_id 12345');
    console.log('\nSua license: no jogo (F8) ou o dono do servidor vê no banco/console.');
    console.log('ID da conta: número que você colocou no checkout (painel da loja).');
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
      console.error('Informe sua license (ex: license:abc123...) ou: node entregar_m4_batalha.js account_id 12345');
      process.exit(1);
    }
  }

  await pool.query(
    `INSERT INTO medellin_loja_pending (license, account_id, product_type, product_id, product_tipo, transaction_id)
     VALUES (?, ?, 'skin', ?, 'permanente', ?)`,
    [license || null, accountId || null, PRODUCT_ID, TRANSACTION_ID]
  );

  console.log('\n[OK] Entrega da M4 Batalha inserida na fila.');
  if (license) console.log('     License:', license);
  if (accountId) console.log('     Account ID:', accountId);
  console.log('     No jogo: saia e entre no servidor (ou espere alguns segundos se já estiver online) para receber a skin no inventário.');
  await pool.end();
}

main().catch(e => {
  console.error(e.message || e);
  process.exit(1);
});
