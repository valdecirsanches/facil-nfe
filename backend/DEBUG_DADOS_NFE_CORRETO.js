const Database = require('better-sqlite3');
console.log('🔍 DEBUGANDO DADOS DA NFE...\n');

// Abrir banco da empresa 1
const db = new Database('./empresa_1.db');

// Listar todas as tabelas
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('📋 Tabelas disponíveis:', tables.map(t => t.name).join(', '));

// Buscar última NFe
const nfe = db.prepare('SELECT * FROM nfes ORDER BY id DESC LIMIT 1').get();
console.log('\n📋 NFe:', JSON.stringify(nfe, null, 2));

// Tentar encontrar a tabela de itens
let itemsTableName = null;
if (tables.find(t => t.name === 'nfe_items')) {
  itemsTableName = 'nfe_items';
} else if (tables.find(t => t.name === 'nfe_itens')) {
  itemsTableName = 'nfe_itens';
} else if (tables.find(t => t.name === 'items')) {
  itemsTableName = 'items';
}
console.log(`\n📦 Tabela de itens: ${itemsTableName}`);
if (itemsTableName) {
  const items = db.prepare(`SELECT * FROM ${itemsTableName} WHERE nfe_id = ?`).all(nfe.id);
  console.log('\n📦 Items:', JSON.stringify(items, null, 2));
  if (items.length > 0) {
    console.log('\n🔍 ANÁLISE DO PRIMEIRO ITEM:');
    console.log(`   quantidade: ${items[0].quantidade} (tipo: ${typeof items[0].quantidade})`);
    console.log(`   valor_unitario: ${items[0].valor_unitario} (tipo: ${typeof items[0].valor_unitario})`);
    console.log(`   valor_total: ${items[0].valor_total} (tipo: ${typeof items[0].valor_total})`);
    console.log('\n🔧 CONVERSÕES:');
    console.log(`   parseFloat(${items[0].quantidade}).toFixed(4) = "${parseFloat(items[0].quantidade).toFixed(4)}"`);
    console.log(`   parseFloat(${items[0].valor_unitario}).toFixed(4) = "${parseFloat(items[0].valor_unitario).toFixed(4)}"`);
    console.log(`   parseFloat(${items[0].valor_total}).toFixed(2) = "${parseFloat(items[0].valor_total).toFixed(2)}"`);
  }
}

// Buscar empresa do banco PRINCIPAL
const dbPrincipal = new Database('./principal.db');
const empresa = dbPrincipal.prepare('SELECT * FROM empresas WHERE id = 1').get();
console.log('\n🏢 Empresa CEP:', empresa.cep, '(length:', empresa.cep?.length, ')');
dbPrincipal.close();

// Buscar cliente
const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(nfe.cliente_id);
console.log('👤 Cliente CEP:', cliente.cep, '(length:', cliente.cep?.length, ')');
console.log('\n🔍 ANÁLISE NFE:');
console.log(`   NFe valor_total: ${nfe.valor_total} (tipo: ${typeof nfe.valor_total})`);
console.log(`   parseFloat(${nfe.valor_total}).toFixed(2) = "${parseFloat(nfe.valor_total).toFixed(2)}"`);
db.close();
console.log('\n' + '='.repeat(70) + '\n');