/**
 * Script para REPROCESSAR as duas skins (marcar como não entregues)
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

async function reprocessarSkins() {
  let pool = null;
  try {
    pool = mysql.createPool(DB);
    
    console.log('========================================');
    console.log('REPROCESSAR SKINS (M4 Batalha + M4 Sangue)');
    console.log('========================================\n');
    
    for (const skin of SKINS) {
      console.log(`Processando: ${skin.nome} (${skin.transaction_id})...`);
      
      // Marcar como NÃO entregue para reprocessamento
      const [result] = await pool.query(
        `UPDATE medellin_loja_pending 
         SET delivered_at = NULL 
         WHERE transaction_id = ? 
         AND product_type = 'skin'`,
        [skin.transaction_id]
      );
      
      if (result.affectedRows > 0) {
        console.log(`  ✓ Marcado para reprocessamento (${result.affectedRows} linha(s))`);
      } else {
        console.log(`  ⚠ Nenhuma linha encontrada para atualizar`);
      }
    }
    
    console.log('\n========================================');
    console.log('PRÓXIMOS PASSOS:');
    console.log('========================================\n');
    console.log('1. Certifique-se de estar ONLINE no servidor');
    console.log('2. Execute no console do servidor:');
    console.log('   restart qb-core');
    console.log('   restart medellin-loja-armas');
    console.log('   restart medellin-loja-entregas');
    console.log('3. As skins devem cair em até 1 segundo!\n');
    
  } catch (error) {
    console.error('ERRO:', error.message);
    console.error(error.stack);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

reprocessarSkins().then(() => {
  console.log('\n✓ Processo concluído!');
  process.exit(0);
}).catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
