/**
 * Script para FORÇAR entrega das skins agora (marcar como não entregues para reprocessamento)
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

async function forcarEntrega() {
  let pool = null;
  try {
    pool = mysql.createPool(DB);
    
    console.log('========================================');
    console.log('FORÇAR ENTREGA DAS SKINS');
    console.log('========================================\n');
    
    // Marcar como não entregues para reprocessamento
    const [result] = await pool.query(
      `UPDATE medellin_loja_pending 
       SET delivered_at = NULL 
       WHERE product_id IN ('weapon_m4_ab', 'weapon_m4_ac', 'WEAPON_M4_AB', 'WEAPON_M4_AC')
       AND product_type = 'skin'`
    );
    
    console.log(`✓ ${result.affectedRows} entrada(s) marcada(s) para reprocessamento\n`);
    
    // Verificar status atual
    const [rows] = await pool.query(
      `SELECT id, product_id, license, account_id, delivered_at
       FROM medellin_loja_pending 
       WHERE product_id IN ('weapon_m4_ab', 'weapon_m4_ac', 'WEAPON_M4_AB', 'WEAPON_M4_AC')
       ORDER BY id`
    );
    
    console.log('Status atual das skins:');
    for (const row of rows) {
      const status = row.delivered_at ? '✅ ENTREGUE' : '⏳ PENDENTE';
      console.log(`  ${row.product_id}: ${status} (License: ${row.license ? 'OK' : 'NULL'})`);
    }
    
    console.log('\n========================================');
    console.log('PRÓXIMOS PASSOS:');
    console.log('========================================\n');
    console.log('1. Certifique-se de estar ONLINE no servidor');
    console.log('2. Execute no console do servidor:');
    console.log('   ensure medellin-loja-entregas');
    console.log('   ensure medellin-loja-armas');
    console.log('3. As skins devem cair em até 1 segundo!\n');
    console.log('Se não cair, verifique os logs do servidor para erros.\n');
    
  } catch (error) {
    console.error('ERRO:', error.message);
    console.error(error.stack);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

forcarEntrega().then(() => {
  console.log('\n✓ Processo concluído!');
  process.exit(0);
}).catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
