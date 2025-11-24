const Database = require('better-sqlite3');
console.log('🔧 CORRIGINDO PREÇOS DOS PRODUTOS\n');
console.log('═'.repeat(70));

// Buscar empresas
const mainDb = new Database('./principal.db');
const empresas = mainDb.prepare('SELECT id FROM empresas').all();
mainDb.close();
empresas.forEach(empresa => {
  const dbPath = `./empresa_${empresa.id}.db`;
  const db = new Database(dbPath);
  console.log(`\n📦 Empresa ${empresa.id}:\n`);

  // Verificar estrutura da tabela produtos
  const tableInfo = db.prepare("PRAGMA table_info(produtos)").all();
  const colunas = tableInfo.map(col => col.name);
  console.log('📋 Colunas da tabela produtos:');
  colunas.forEach(col => console.log(`   - ${col}`));

  // Buscar produtos
  const produtos = db.prepare('SELECT * FROM produtos').all();
  console.log(`\n📊 Total de produtos: ${produtos.length}\n`);
  if (produtos.length === 0) {
    console.log('⚠️  Nenhum produto cadastrado!\n');
    db.close();
    return;
  }

  // Verificar e corrigir cada produto
  produtos.forEach(produto => {
    console.log(`📦 Produto ${produto.id}: ${produto.descricao}`);

    // Verificar qual coluna de preço existe
    let precoAtual = null;
    let colunaPreco = null;
    if ('preco_venda' in produto) {
      precoAtual = produto.preco_venda;
      colunaPreco = 'preco_venda';
    } else if ('preco' in produto) {
      precoAtual = produto.preco;
      colunaPreco = 'preco';
    } else if ('valor_unitario' in produto) {
      precoAtual = produto.valor_unitario;
      colunaPreco = 'valor_unitario';
    }
    console.log(`   Coluna de preço: ${colunaPreco || '(não encontrada)'}`);
    console.log(`   Preço atual: ${precoAtual || '(não definido)'}`);

    // Se não tem preço ou está null/undefined, definir um padrão
    if (!precoAtual || precoAtual === null || precoAtual === undefined) {
      console.log(`   ⚠️  Produto sem preço! Definindo R$ 47.00`);
      if (colunaPreco) {
        db.prepare(`UPDATE produtos SET ${colunaPreco} = ? WHERE id = ?`).run(47.00, produto.id);
        console.log(`   ✅ Preço atualizado para R$ 47.00\n`);
      } else {
        console.log(`   ❌ Não foi possível atualizar (coluna não encontrada)\n`);
      }
    } else {
      console.log(`   ✅ Preço OK: R$ ${parseFloat(precoAtual).toFixed(2)}\n`);
    }
  });
  db.close();
});
console.log('═'.repeat(70));
console.log('\n✅ Correção concluída!\n');
console.log('💡 Próximos passos:');
console.log('   1. Execute: node validar_xml_gerado.js');
console.log('   2. Verifique se ainda há valores NaN');
console.log('   3. Tente emitir a NFe novamente\n');