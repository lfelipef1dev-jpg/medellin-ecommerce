/**
 * Cria no MySQL (usando .env) as tabelas da loja VIP + player_accounts.
 * Rode UMA VEZ na pasta api: node criar_tabelas_loja.js
 * Usa o mesmo banco (DB_NAME) que a API e o FiveM.
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

async function main() {
  if (!DB.password) {
    console.error('Defina DB_PASSWORD no .env (mesma senha do MySQL do FiveM).');
    process.exit(1);
  }
  let pool;
  try {
    pool = await mysql.createPool(DB);
    console.log('Conectado ao MySQL:', DB.host, DB.database);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS player_accounts (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        license VARCHAR(255) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY license (license(191))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('player_accounts OK');

    await pool.query(`
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
    console.log('medellin_loja_orders OK');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS medellin_loja_processed_payments (
        mp_payment_id VARCHAR(64) PRIMARY KEY,
        order_id VARCHAR(64) NOT NULL,
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('medellin_loja_processed_payments OK');

    await pool.query(`
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
    console.log('medellin_loja_pending OK');

    console.log('\nTabelas da loja prontas. Pode subir a API (node server.js).');
  } catch (e) {
    console.error('Erro:', e.message || e);
    if (e.message && (e.message.includes('auth_gssapi_client') || e.message.includes('unknown plugin'))) {
      console.error('\nMySQL 8: use mysql_native_password. Rode no MySQL:');
      console.error('  ALTER USER \'' + (DB.user || 'root') + '\'@\'localhost\' IDENTIFIED WITH mysql_native_password BY \'sua_senha\';');
      console.error('  FLUSH PRIVILEGES;');
    }
    process.exit(1);
  } finally {
    if (pool) await pool.end();
  }
}

main();
