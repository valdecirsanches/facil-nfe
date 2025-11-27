const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const dbDir = path.join(__dirname, './');

// Verificar se diretório existe
if (!fs.existsSync(dbDir)) {
  console.log('❌ Diretório databases não encontrado!');
  process.exit(1);
}

// Listar todos os bancos de dados de empresas
const files = fs.readdirSync(dbDir).filter(f => f.startsWith('empresa_') && f.endsWith('.db'));
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' + dbDir);
console.log(`\n🔍 Encontrados ${files.length} bancos de dados de empresas\n`);
if (files.length === 0) {
  console.log('⚠️  Nenhum banco de dados de empresa encontrado!');
  console.log('   Execute o sistema primeiro para criar os bancos de dados.\n');
  process.exit(0);
}
let sucessos = 0;
let erros = 0;
for (const file of files) {
  const dbPath = path.join(dbDir, file);
  console.log(`📦 Processando: ${file}`);
  try {
    const db = new Database(dbPath);

    // Criar tabelas de pedidos
    db.exec(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero TEXT NOT NULL UNIQUE,
        cliente_id INTEGER NOT NULL,
        data_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
        data_entrega TEXT,
        valor_total REAL NOT NULL DEFAULT 0,
        desconto REAL DEFAULT 0,
        valor_final REAL NOT NULL DEFAULT 0,
        status TEXT DEFAULT 'pendente',
        observacoes TEXT,
        aprovado_por INTEGER,
        aprovado_em DATETIME,
        rejeitado_por INTEGER,
        rejeitado_em DATETIME,
        motivo_rejeicao TEXT,
        nfe_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
        FOREIGN KEY (nfe_id) REFERENCES nfes(id)
      );
      
      CREATE TABLE IF NOT EXISTS pedido_itens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pedido_id INTEGER NOT NULL,
        produto_id INTEGER NOT NULL,
        descricao TEXT NOT NULL,
        quantidade REAL NOT NULL,
        valor_unitario REAL NOT NULL,
        desconto REAL DEFAULT 0,
        valor_total REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
        FOREIGN KEY (produto_id) REFERENCES produtos(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
      CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
      CREATE INDEX IF NOT EXISTS idx_pedidos_data ON pedidos(data_pedido);
      CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido ON pedido_itens(pedido_id);
    `);
    console.log(`   ✅ Tabelas criadas com sucesso\n`);
    sucessos++;
    db.close();
  } catch (error) {
    console.error(`   ❌ Erro: ${error.message}\n`);
    erros++;
  }
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`\n📊 Resumo da Migração:`);
console.log(`   ✅ Sucessos: ${sucessos}`);
console.log(`   ❌ Erros: ${erros}`);
console.log(`   📁 Total: ${files.length}\n`);
if (sucessos > 0) {
  console.log('🎉 Migração concluída com sucesso!');
  console.log('   As tabelas de pedidos foram criadas.\n');
} else {
  console.log('⚠️  Nenhuma tabela foi criada.');
  console.log('   Verifique os erros acima.\n');
}