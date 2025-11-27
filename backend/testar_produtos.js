const Database = require('better-sqlite3');
const path = require('path');
const empresaId = 1;
const dbPath = path.join(__dirname, `empresa_${empresaId}.db`);
console.log('🔍 Testando produtos...\n');
console.log('📁 Banco:', dbPath);
console.log('─'.repeat(50));
try {
  const db = new Database(dbPath);

  // Verificar se tabela existe
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='produtos'").all();
  console.log('\n✓ Tabela produtos existe?', tables.length > 0 ? '✅ SIM' : '❌ NÃO');
  if (tables.length === 0) {
    console.log('\n⚠️  ERRO: Tabela produtos não existe!');
    console.log('   Execute as migrações do banco de dados.');
    db.close();
    process.exit(1);
  }

  // Descobrir estrutura da tabela
  console.log('\n📋 Estrutura da tabela produtos:');
  const columns = db.prepare("PRAGMA table_info(produtos)").all();
  columns.forEach(col => {
    console.log(`   - ${col.name} (${col.type})`);
  });

  // Tentar listar produtos com SELECT *
  console.log('\n📦 Buscando produtos...');
  const produtos = db.prepare('SELECT * FROM produtos').all();
  console.log('✓ Total de produtos:', produtos.length);
  if (produtos.length > 0) {
    console.log('\n📦 Produtos cadastrados:');
    console.log('─'.repeat(50));
    produtos.forEach((p, i) => {
      console.log(`\n${i + 1}. Produto ID ${p.id}:`);
      Object.keys(p).forEach(key => {
        console.log(`   ${key}: ${p[key]}`);
      });
    });
    console.log('─'.repeat(50));
    console.log('\n✅ PRODUTOS ENCONTRADOS!');
    console.log('   Os produtos devem aparecer no dropdown.');
  } else {
    console.log('\n⚠️  NENHUM PRODUTO CADASTRADO!');
    console.log('\n📝 Como resolver:');
    console.log('   1. Acesse o sistema');
    console.log('   2. Vá em "Produtos" no menu');
    console.log('   3. Clique em "Novo Produto"');
    console.log('   4. Cadastre pelo menos 1 produto');
    console.log('   5. Volte em "Pedidos" e teste novamente');
  }
  db.close();
  console.log('\n✓ Teste concluído!\n');
} catch (error) {
  console.error('\n❌ ERRO:', error.message);
  console.log('\n📝 Possíveis causas:');
  console.log('   - Banco de dados não existe');
  console.log('   - Caminho incorreto');
  console.log('   - Estrutura da tabela diferente do esperado');
  console.log('\n');
}