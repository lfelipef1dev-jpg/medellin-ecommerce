/**
 * Script para verificar se as skins foram entregues
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

async function verificarEntregas() {
  let pool = null;
  try {
    pool = mysql.createPool(DB);
    
    console.log('========================================');
    console.log('VERIFICAR ENTREGA DAS SKINS');
    console.log('========================================\n');
    
    // Buscar as duas skins específicas
    const [rows] = await pool.query(
      `SELECT 
        id, 
        license, 
        account_id,
        product_id, 
        product_type,
        transaction_id,
        delivered_at,
        created_at
      FROM medellin_loja_pending 
      WHERE product_id IN ('weapon_m4_ab', 'weapon_m4_ac', 'WEAPON_M4_AB', 'WEAPON_M4_AC')
      ORDER BY id DESC
      LIMIT 10`
    );
    
    if (rows.length === 0) {
      console.log('⚠ Nenhuma entrada encontrada para as skins M4 Batalha e M4 Sangue\n');
      return;
    }
    
    console.log(`✓ Encontradas ${rows.length} entrada(s) relacionadas às skins:\n`);
    
    for (const row of rows) {
      const status = row.delivered_at ? '✅ ENTREGUE' : '❌ PENDENTE';
      const dataEntrega = row.delivered_at ? new Date(row.delivered_at).toLocaleString('pt-BR') : 'N/A';
      const dataCriacao = row.created_at ? new Date(row.created_at).toLocaleString('pt-BR') : 'N/A';
      
      console.log(`ID: ${row.id}`);
      console.log(`  Product ID: ${row.product_id}`);
      console.log(`  Transaction ID: ${row.transaction_id}`);
      console.log(`  License: ${row.license || 'NULL'}`);
      console.log(`  Account ID: ${row.account_id || 'NULL'}`);
      console.log(`  Status: ${status}`);
      console.log(`  Criado em: ${dataCriacao}`);
      console.log(`  Entregue em: ${dataEntrega}`);
      console.log('');
    }
    
    // Verificar se há entregas pendentes
    const [pendentes] = await pool.query(
      `SELECT COUNT(*) as total 
      FROM medellin_loja_pending 
      WHERE product_type = 'skin' 
      AND delivered_at IS NULL`
    );
    
    console.log('========================================');
    console.log('RESUMO');
    console.log('========================================');
    console.log(`Total de skins pendentes: ${pendentes[0].total}\n`);
    
    if (pendentes[0].total > 0) {
      console.log('⚠ Há skins pendentes de entrega!');
      console.log('  O sistema deve processar automaticamente quando você estiver online.\n');
    }
    
  } catch (error) {
    console.error('ERRO:', error.message);
    console.error(error.stack);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

verificarEntregas().then(() => {
  console.log('\n✓ Verificação concluída!');
  process.exit(0);
}).catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
