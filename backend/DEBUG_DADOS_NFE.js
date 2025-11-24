const Database = require('better-sqlite3');
console.log('🔍 DEBUGANDO DADOS DA NFE...\n');

// Abrir banco da empresa 1
const db = new Database('./empresa_1.db');

// Buscar última NFe
const nfe = db.prepare('SELECT * FROM nfes ORDER BY id DESC LIMIT 1').get();
console.log('📋 NFe:', JSON.stringify(nfe, null, 2));

// Buscar itens da NFe
const items = db.prepare('SELECT * FROM nfe_items WHERE nfe_id = ?').all(nfe.id);
console.log('\n📦 Items:', JSON.stringify(items, null, 2));

// Buscar empresa
const empresa = db.prepare('SELECT * FROM empresas WHERE id = 1').get();
console.log('\n🏢 Empresa CEP:', empresa.cep, '(length:', empresa.cep?.length, ')');

// Buscar cliente
const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(nfe.cliente_id);
console.log('👤 Cliente CEP:', cliente.cep, '(length:', cliente.cep?.length, ')');
console.log('\n' + '='.repeat(70));
console.log('\n🔍 ANÁLISE:');
console.log(`   Item quantidade: ${items[0].quantidade} (tipo: ${typeof items[0].quantidade})`);
console.log(`   Item valor_unitario: ${items[0].valor_unitario} (tipo: ${typeof items[0].valor_unitario})`);
console.log(`   Item valor_total: ${items[0].valor_total} (tipo: ${typeof items[0].valor_total})`);
console.log(`   NFe valor_total: ${nfe.valor_total} (tipo: ${typeof nfe.valor_total})`);
console.log('\n🔧 CONVERSÕES:');
console.log(`   parseFloat(${items[0].quantidade}).toFixed(4) = ${parseFloat(items[0].quantidade).toFixed(4)}`);
console.log(`   parseFloat(${items[0].valor_unitario}).toFixed(4) = ${parseFloat(items[0].valor_unitario).toFixed(4)}`);
console.log(`   parseFloat(${items[0].valor_total}).toFixed(2) = ${parseFloat(items[0].valor_total).toFixed(2)}`);
console.log(`   parseFloat(${nfe.valor_total}).toFixed(2) = ${parseFloat(nfe.valor_total).toFixed(2)}`);
db.close();
console.log('\n' + '='.repeat(70) + '\n');