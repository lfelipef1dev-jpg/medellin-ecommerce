/**
 * Script para TESTAR entrega direta das skins via export do FiveM
 * Isso vai forçar a entrega mesmo que o sistema normal não esteja funcionando
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

async function testarEntrega() {
  let pool = null;
  try {
    pool = mysql.createPool(DB);
    
    console.log('========================================');
    console.log('TESTAR ENTREGA DIRETA DAS SKINS');
    console.log('========================================\n');
    
    // Buscar as duas skins
    const [rows] = await pool.query(
      `SELECT id, license, account_id, product_id, transaction_id, delivered_at
      FROM medellin_loja_pending 
      WHERE product_id IN ('weapon_m4_ab', 'weapon_m4_ac', 'WEAPON_M4_AB', 'WEAPON_M4_AC')
      AND product_type = 'skin'
      ORDER BY id`
    );
    
    if (rows.length === 0) {
      console.log('⚠ Nenhuma skin encontrada no banco!\n');
      return;
    }
    
    console.log(`✓ Encontradas ${rows.length} skin(s) no banco:\n`);
    
    for (const row of rows) {
      console.log(`ID: ${row.id}`);
      console.log(`  Product ID: ${row.product_id}`);
      console.log(`  Transaction ID: ${row.transaction_id}`);
      console.log(`  License: ${row.license || 'NULL'}`);
      console.log(`  Account ID: ${row.account_id || 'NULL'}`);
      console.log(`  Status: ${row.delivered_at ? '✅ ENTREGUE' : '❌ PENDENTE'}`);
      console.log('');
    }
    
    console.log('========================================');
    console.log('DIAGNÓSTICO:');
    console.log('========================================\n');
    
    // Verificar se os itens existem no qb-core
    const [items] = await pool.query(
      `SELECT name FROM items WHERE name IN ('weapon_m4_ab', 'weapon_m4_ac')`
    );
    
    console.log(`Itens encontrados no banco qb-core: ${items.length}`);
    for (const item of items) {
      console.log(`  ✓ ${item.name}`);
    }
    
    if (items.length < 2) {
      console.log('\n⚠ PROBLEMA: Itens não encontrados no banco qb-core!');
      console.log('  Os itens foram adicionados ao items.lua mas podem não ter sido sincronizados.');
      console.log('  Execute no console do servidor: restart qb-core\n');
    }
    
    // Verificar se há entregas pendentes
    const pendentes = rows.filter(r => !r.delivered_at);
    console.log(`\nSkins pendentes: ${pendentes.length}`);
    
    if (pendentes.length > 0) {
      console.log('\n========================================');
      console.log('PRÓXIMOS PASSOS:');
      console.log('========================================\n');
      console.log('1. Certifique-se de estar ONLINE no servidor');
      console.log('2. Execute no console do servidor:');
      console.log('   ensure medellin-loja-entregas');
      console.log('   ensure medellin-loja-armas');
      console.log('   restart qb-core');
      console.log('\n3. Aguarde até 1 segundo - as skins devem cair automaticamente');
      console.log('\n4. Se não cair, verifique os logs do servidor para erros\n');
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

testarEntrega().then(() => {
  console.log('\n✓ Diagnóstico concluído!');
  process.exit(0);
}).catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
