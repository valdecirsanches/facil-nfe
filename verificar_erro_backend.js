const Database = require('better-sqlite3');
const path = require('path');
console.log('🔍 VERIFICANDO ERRO NO BACKEND...\n');
const empresaId = 1;
const dbPath = path.join(__dirname, `empresa_${empresaId}.db`);
const db = new Database(dbPath);

// Verificar se tabela financeiro existe
console.log('1️⃣  Verificando tabela financeiro...');
const tableExists = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name='financeiro'
`).get();
if (!tableExists) {
  console.log('❌ Tabela financeiro NÃO existe!');
  console.log('   Execute: node criar_tabela_financeiro.js\n');
  process.exit(1);
}
console.log('✅ Tabela financeiro existe\n');

// Verificar estrutura da tabela
console.log('2️⃣  Verificando estrutura da tabela...');
const columns = db.prepare('PRAGMA table_info(financeiro)').all();
const columnNames = columns.map(c => c.name);
console.log('   Colunas:', columnNames.join(', '));
const requiredColumns = ['id', 'tipo', 'descricao', 'cliente_fornecedor', 'valor', 'data_vencimento', 'status', 'pedido_id'];
const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
if (missingColumns.length > 0) {
  console.log('❌ Colunas faltando:', missingColumns.join(', '));
  console.log('   Execute: node criar_tabela_financeiro.js\n');
  process.exit(1);
}
console.log('✅ Todas as colunas necessárias existem\n');

// Testar INSERT
console.log('3️⃣  Testando INSERT na tabela financeiro...');
try {
  const testInsert = db.prepare(`
    INSERT INTO financeiro (
      tipo, descricao, cliente_fornecedor, valor,
      data_vencimento, status, forma_pagamento, pedido_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = testInsert.run('receber', 'Teste', 'Cliente Teste', 100.00, '2024-12-31', 'pendente', 'PIX', 999);
  console.log('✅ INSERT funcionou! ID:', result.lastInsertRowid);

  // Remover teste
  db.prepare('DELETE FROM financeiro WHERE id = ?').run(result.lastInsertRowid);
  console.log('✅ Teste removido\n');
} catch (error) {
  console.log('❌ Erro no INSERT:', error.message);
  console.log('   Detalhes:', error);
  process.exit(1);
}

// Verificar pedidos
console.log('4️⃣  Verificando pedidos...');
const pedidos = db.prepare('SELECT id, numero, status FROM pedidos LIMIT 5').all();
console.log(`   Total de pedidos: ${pedidos.length}`);
if (pedidos.length > 0) {
  console.log('   Exemplos:');
  pedidos.forEach(p => {
    console.log(`     - Pedido ${p.numero} (ID: ${p.id}) - Status: ${p.status}`);
  });
}
db.close();
console.log('\n' + '='.repeat(60));
console.log('\n✅ BACKEND ESTÁ OK!');
console.log('\nO problema deve estar no frontend (Orders.tsx linha 208)');
console.log('\nVerifique se a função handleInvoice está correta.');
console.log('Ela deve ter Content-Type: application/json nos headers.');