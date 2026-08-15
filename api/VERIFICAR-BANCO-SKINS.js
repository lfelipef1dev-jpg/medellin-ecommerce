/**
 * Script para VERIFICAR status das skins no banco de dados
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

const SKINS = [
  { transaction_id: '145916111610', product_id: 'weapon_m4_ab', nome: 'M4 Batalha' },
  { transaction_id: '144781174509', product_id: 'weapon_m4_ac', nome: 'M4 Sangue' }
];

async function verificarBanco() {
  let pool = null;
  try {
    pool = mysql.createPool(DB);
    
    console.log('========================================');
    console.log('VERIFICAÇÃO COMPLETA DO BANCO DE DADOS');
    console.log('========================================\n');
    
    // 1. Verificar entregas pendentes
    console.log('1. ENTREGAS PENDENTES (medellin_loja_pending):');
    console.log('========================================\n');
    
    const [pendentes] = await pool.query(
      `SELECT id, license, account_id, product_type, product_id, transaction_id, 
       created_at, delivered_at 
       FROM medellin_loja_pending 
       WHERE product_type = 'skin' 
       AND transaction_id IN (?, ?)
       ORDER BY id DESC`,
      [SKINS[0].transaction_id, SKINS[1].transaction_id]
    );
    
    if (!pendentes || pendentes.length === 0) {
      console.log('⚠ NENHUMA entrega encontrada para essas transações!\n');
    } else {
      console.log(`✓ Encontradas ${pendentes.length} entrega(s):\n`);
      for (const p of pendentes) {
        const skinNome = SKINS.find(s => s.transaction_id === p.transaction_id)?.nome || p.product_id;
        console.log(`ID: ${p.id} | ${skinNome}`);
        console.log(`  License: ${p.license || 'NULL ⚠️'}`);
        console.log(`  Account ID: ${p.account_id || 'NULL ⚠️'}`);
        console.log(`  Product ID: ${p.product_id}`);
        console.log(`  Transaction: ${p.transaction_id}`);
        console.log(`  Criado em: ${p.created_at}`);
        console.log(`  Status: ${p.delivered_at ? '✅ ENTREGUE em ' + p.delivered_at : '⏳ PENDENTE'}`);
        console.log('');
      }
    }
    
    // 2. Verificar todas as skins pendentes
    console.log('\n2. TODAS AS SKINS PENDENTES:');
    console.log('========================================\n');
    
    const [todasPendentes] = await pool.query(
      `SELECT id, license, account_id, product_id, transaction_id, created_at 
       FROM medellin_loja_pending 
       WHERE product_type = 'skin' 
       AND delivered_at IS NULL 
       ORDER BY created_at DESC 
       LIMIT 20`
    );
    
    if (!todasPendentes || todasPendentes.length === 0) {
      console.log('✓ Nenhuma skin pendente no banco.\n');
    } else {
      console.log(`⚠ Total de skins pendentes: ${todasPendentes.length}\n`);
      for (const p of todasPendentes) {
        console.log(`ID: ${p.id} | Product: ${p.product_id}`);
        console.log(`  License: ${p.license || 'NULL'} | Account ID: ${p.account_id || 'NULL'}`);
        console.log(`  Transaction: ${p.transaction_id} | Criado: ${p.created_at}`);
        console.log('');
      }
    }
    
    // 3. Verificar account_id 1 (do usuário)
    console.log('\n3. VERIFICAR ACCOUNT_ID 1:');
    console.log('========================================\n');
    
    const [account] = await pool.query(
      'SELECT id, license FROM player_accounts WHERE id = 1 LIMIT 1'
    );
    
    if (account && account.length > 0) {
      console.log(`✓ Account ID 1 encontrado:`);
      console.log(`  License: ${account[0].license}\n`);
      
      // Verificar entregas deste account_id
      const [entregasAccount] = await pool.query(
        `SELECT id, license, account_id, product_type, product_id, transaction_id, delivered_at 
         FROM medellin_loja_pending 
         WHERE account_id = 1 
         AND product_type = 'skin' 
         ORDER BY id DESC`
      );
      
      if (entregasAccount && entregasAccount.length > 0) {
        console.log(`  Entregas deste account_id: ${entregasAccount.length}\n`);
        for (const e of entregasAccount) {
          const skinNome = SKINS.find(s => s.transaction_id === e.transaction_id)?.nome || e.product_id;
          console.log(`  - ${skinNome} (${e.transaction_id})`);
          console.log(`    License: ${e.license || 'NULL'} | Status: ${e.delivered_at ? 'ENTREGUE' : 'PENDENTE'}`);
        }
      }
    } else {
      console.log('⚠ Account ID 1 não encontrado!\n');
    }
    
    // 4. Verificar license do usuário
    console.log('\n4. VERIFICAR LICENSE: license:82ffcae10e8fae38d5b530e72e610539774ee9ae');
    console.log('========================================\n');
    
    const [entregasLicense] = await pool.query(
      `SELECT id, license, account_id, product_type, product_id, transaction_id, delivered_at 
       FROM medellin_loja_pending 
       WHERE license = ? 
       AND product_type = 'skin' 
       ORDER BY id DESC`,
      ['license:82ffcae10e8fae38d5b530e72e610539774ee9ae']
    );
    
    if (entregasLicense && entregasLicense.length > 0) {
      console.log(`✓ Encontradas ${entregasLicense.length} entrega(s) para esta license:\n`);
      for (const e of entregasLicense) {
        const skinNome = SKINS.find(s => s.transaction_id === e.transaction_id)?.nome || e.product_id;
        console.log(`  - ${skinNome} (${e.transaction_id})`);
        console.log(`    Account ID: ${e.account_id || 'NULL'} | Status: ${e.delivered_at ? 'ENTREGUE' : 'PENDENTE'}`);
      }
    } else {
      console.log('⚠ Nenhuma entrega encontrada para esta license.\n');
    }
    
    // 5. Diagnóstico
    console.log('\n========================================');
    console.log('DIAGNÓSTICO:');
    console.log('========================================\n');
    
    const [problemas] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM medellin_loja_pending 
       WHERE product_type = 'skin' 
       AND delivered_at IS NULL 
       AND (license IS NULL OR account_id IS NULL)`
    );
    
    if (problemas && problemas[0].total > 0) {
      console.log(`⚠ PROBLEMA: ${problemas[0].total} skin(s) sem license E sem account_id!`);
      console.log('   Essas entregas não podem ser processadas.\n');
    }
    
    const [semLicense] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM medellin_loja_pending 
       WHERE product_type = 'skin' 
       AND delivered_at IS NULL 
       AND license IS NULL 
       AND account_id IS NOT NULL`
    );
    
    if (semLicense && semLicense[0].total > 0) {
      console.log(`⚠ ATENÇÃO: ${semLicense[0].total} skin(s) sem license mas COM account_id.`);
      console.log('   O sistema deve resolver via medellin-whitelist.\n');
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

verificarBanco().then(() => {
  console.log('\n✓ Verificação concluída!');
  process.exit(0);
}).catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
