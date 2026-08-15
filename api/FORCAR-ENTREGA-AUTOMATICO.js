/**
 * Script para FORÇAR entrega das duas skins automaticamente
 * Busca por transaction_id e força reprocessamento
 */

require('dotenv').config({ path: './vip-store-web/api/.env' });
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

async function forcarEntrega() {
  let pool = null;
  try {
    pool = mysql.createPool(DB);
    
    console.log('========================================');
    console.log('FORÇAR ENTREGA DAS DUAS SKINS');
    console.log('========================================\n');
    
    for (const skin of SKINS) {
      console.log(`\nProcessando: ${skin.nome} (${skin.transaction_id})...`);
      
      // Buscar todas as entregas com essa transaction_id
      const [entregas] = await pool.query(
        `SELECT id, license, account_id, delivered_at, created_at 
         FROM medellin_loja_pending 
         WHERE transaction_id = ? 
         ORDER BY id DESC`,
        [skin.transaction_id]
      );
      
      if (!entregas || entregas.length === 0) {
        console.log(`  ⚠ Nenhuma entrega encontrada para esta transação.`);
        console.log(`  → Será necessário inserir manualmente com o account_id correto.`);
        continue;
      }
      
      console.log(`  ✓ Encontradas ${entregas.length} entrega(s):`);
      
      for (const entrega of entregas) {
        console.log(`\n    ID: ${entrega.id}`);
        console.log(`    License: ${entrega.license || 'NULL'}`);
        console.log(`    Account ID: ${entrega.account_id || 'NULL'}`);
        console.log(`    Status: ${entrega.delivered_at ? 'ENTREGUE em ' + entrega.delivered_at : 'PENDENTE'}`);
        
        if (entrega.delivered_at) {
          // Já foi entregue - marcar como NÃO entregue para forçar reprocessamento
          console.log(`    → Marcando como NÃO ENTREGUE para reprocessamento...`);
          await pool.query(
            `UPDATE medellin_loja_pending 
             SET delivered_at = NULL 
             WHERE id = ?`,
            [entrega.id]
          );
          console.log(`    ✓ Marcado para reprocessamento!`);
        } else {
          // Já está pendente - garantir que tem license e account_id
          if (!entrega.license && entrega.account_id) {
            // Tentar resolver license pelo account_id
            const [accounts] = await pool.query(
              'SELECT license FROM player_accounts WHERE id = ? LIMIT 1',
              [entrega.account_id]
            );
            if (accounts && accounts.length > 0) {
              const license = accounts[0].license;
              console.log(`    → Atualizando license: ${license}`);
              await pool.query(
                `UPDATE medellin_loja_pending 
                 SET license = ? 
                 WHERE id = ?`,
                [license, entrega.id]
              );
              console.log(`    ✓ License atualizada!`);
            }
          }
          console.log(`    ✓ Já está pendente e pronta para entrega!`);
        }
      }
    }
    
    // Verificar entregas pendentes agora
    console.log('\n========================================');
    console.log('RESUMO - ENTREGAS PENDENTES AGORA:');
    console.log('========================================\n');
    
    const [pendentes] = await pool.query(
      `SELECT id, license, account_id, product_id, transaction_id 
       FROM medellin_loja_pending 
       WHERE transaction_id IN (?, ?) 
       AND delivered_at IS NULL 
       ORDER BY transaction_id, id DESC`,
      [SKINS[0].transaction_id, SKINS[1].transaction_id]
    );
    
    if (pendentes.length === 0) {
      console.log('⚠ Nenhuma entrega pendente encontrada.');
      console.log('\nIsso pode significar:');
      console.log('1. As skins já foram entregues');
      console.log('2. As entregas não foram inseridas na tabela');
      console.log('\nSolução: Execute ENTREGAR-SKINS-RAPIDO.bat com seu account_id');
    } else {
      console.log(`✓ Total: ${pendentes.length} entrega(s) pendente(s)\n`);
      for (const p of pendentes) {
        const skinNome = SKINS.find(s => s.transaction_id === p.transaction_id)?.nome || p.product_id;
        console.log(`- ${skinNome}`);
        console.log(`  ID: ${p.id} | License: ${p.license || 'NULL'} | Account ID: ${p.account_id || 'NULL'}`);
        console.log(`  Transaction: ${p.transaction_id}`);
      }
      
      console.log('\n========================================');
      console.log('PRÓXIMOS PASSOS:');
      console.log('========================================\n');
      console.log('1. Certifique-se de estar ONLINE no servidor FiveM');
      console.log('2. Execute no console do servidor:');
      console.log('   restart medellin-loja-entregas');
      console.log('3. As skins devem cair em até 1 segundo após o restart');
      console.log('\nOU');
      console.log('4. Saia e entre novamente no servidor');
      console.log('5. As skins devem cair ao logar (até 2 segundos)\n');
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

forcarEntrega().then(() => {
  console.log('\n✓ Processo concluído!');
  process.exit(0);
}).catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
