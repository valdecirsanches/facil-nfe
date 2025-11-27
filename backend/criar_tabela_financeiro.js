const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
console.log('🔧 Criando tabela financeiro...\n');
const empresaId = 1;
const dbPath = path.join(__dirname, `empresa_${empresaId}.db`);
if (!fs.existsSync(dbPath)) {
  console.error('❌ Banco de dados não encontrado:', dbPath);
  process.exit(1);
}
const db = new Database(dbPath);
try {
  // Verificar se tabela já existe
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='financeiro'
  `).get();
  if (tableExists) {
    console.log('⚠️  Tabela financeiro já existe');

    // Verificar estrutura
    const columns = db.prepare('PRAGMA table_info(financeiro)').all();
    console.log('\n📋 Estrutura atual:');
    columns.forEach(col => {
      console.log(`   - ${col.name} (${col.type})`);
    });
  } else {
    // Criar tabela
    db.exec(`
      CREATE TABLE IF NOT EXISTS financeiro (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT NOT NULL CHECK(tipo IN ('receber', 'pagar')),
        descricao TEXT NOT NULL,
        cliente_fornecedor TEXT NOT NULL,
        valor REAL NOT NULL,
        data_vencimento TEXT NOT NULL,
        data_pagamento TEXT,
        status TEXT NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente', 'pago', 'vencido', 'cancelado')),
        forma_pagamento TEXT,
        observacoes TEXT,
        pedido_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
      )
    `);
    console.log('✅ Tabela financeiro criada com sucesso!');

    // Mostrar estrutura
    const columns = db.prepare('PRAGMA table_info(financeiro)').all();
    console.log('\n📋 Estrutura da tabela:');
    columns.forEach(col => {
      console.log(`   - ${col.name} (${col.type})`);
    });
  }

  // Criar índices
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_financeiro_tipo ON financeiro(tipo);
    CREATE INDEX IF NOT EXISTS idx_financeiro_status ON financeiro(status);
    CREATE INDEX IF NOT EXISTS idx_financeiro_pedido ON financeiro(pedido_id);
    CREATE INDEX IF NOT EXISTS idx_financeiro_vencimento ON financeiro(data_vencimento);
  `);
  console.log('\n✅ Índices criados');
  db.close();
  console.log('\n🎉 Tabela financeiro pronta para uso!');
  console.log('\n📝 Próximos passos:');
  console.log('   1. Execute: node adicionar_rotas_faturamento.js');
  console.log('   2. Reinicie o backend: npm start');
  console.log('   3. Teste faturar um pedido aprovado');
} catch (error) {
  console.error('\n❌ Erro:', error.message);
  db.close();
  process.exit(1);
}