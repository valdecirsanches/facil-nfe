const Database = require('better-sqlite3');
const fs = require('fs');
console.log('🔧 Adicionando coluna CSOSN_PADRAO nas configurações...\n');

// Buscar todas as empresas
const mainDb = new Database('./principal.db');
const empresas = mainDb.prepare('SELECT id FROM empresas').all();
console.log(`📊 Encontradas ${empresas.length} empresas\n`);
if (empresas.length === 0) {
  console.log('⚠️  Nenhuma empresa encontrada!');
  mainDb.close();
  process.exit(0);
}

// Para cada empresa, adicionar coluna CSOSN
empresas.forEach(empresa => {
  const dbPath = `./empresa_${empresa.id}.db`;
  if (!fs.existsSync(dbPath)) {
    console.log(`⚠️  Banco empresa_${empresa.id}.db não existe, pulando...`);
    return;
  }
  console.log(`📦 Processando empresa ${empresa.id}...`);
  const db = new Database(dbPath);
  try {
    // Verificar se coluna já existe
    const tableInfo = db.prepare("PRAGMA table_info(configuracoes)").all();
    const hasCsosn = tableInfo.some(col => col.name === 'csosn_padrao');
    if (hasCsosn) {
      console.log(`  ✅ Coluna csosn_padrao já existe`);
    } else {
      // Adicionar coluna CSOSN
      db.exec(`ALTER TABLE configuracoes ADD COLUMN csosn_padrao TEXT DEFAULT '102';`);
      console.log(`  ✅ Coluna csosn_padrao adicionada`);

      // Atualizar para 102 (padrão mais comum)
      db.exec(`UPDATE configuracoes SET csosn_padrao = '102' WHERE id = 1;`);
      console.log(`  ✅ CSOSN padrão configurado como 102`);
    }

    // Mostrar configuração atual
    const config = db.prepare('SELECT csosn_padrao FROM configuracoes WHERE id = 1').get();
    console.log(`  📊 CSOSN atual: ${config?.csosn_padrao || '(não definido)'}\n`);
  } catch (error) {
    console.error(`  ❌ Erro: ${error.message}\n`);
  } finally {
    db.close();
  }
});
mainDb.close();
console.log('═'.repeat(60));
console.log('✅ PRONTO!\n');
console.log('📋 O que foi feito:');
console.log('   - Coluna csosn_padrao adicionada em todas as empresas');
console.log('   - Valor padrão: 102 (Tributada sem permissão de crédito)\n');
console.log('🔄 Próximos passos:');
console.log('   1. Reinicie o backend (npm start)');
console.log('   2. Acesse Config. Sistema');
console.log('   3. Configure o CSOSN se necessário');
console.log('   4. Teste a emissão de NFe\n');