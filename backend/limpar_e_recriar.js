const Database = require('better-sqlite3');
const fs = require('fs');
console.log('🧹 LIMPEZA E RECRIAÇÃO SIMPLES\n');
console.log('═'.repeat(50));

// 1. LIMPAR principal.db (remover tabela configuracoes se existir)
console.log('\n📦 1. Limpando principal.db...');
const mainDb = new Database('./principal.db');
try {
  mainDb.exec('DROP TABLE IF EXISTS configuracoes');
  console.log('   ✅ Tabela configuracoes removida de principal.db');
} catch (error) {
  console.log('   ℹ️  Tabela não existia');
}

// 2. CRIAR configuracoes em cada empresa_X.db
console.log('\n📦 2. Criando configurações por empresa...');
const empresas = mainDb.prepare('SELECT id, razao_social FROM empresas').all();
console.log(`   📊 Encontradas ${empresas.length} empresas\n`);
if (empresas.length === 0) {
  console.log('   ⚠️  Nenhuma empresa encontrada!');
  mainDb.close();
  process.exit(0);
}
empresas.forEach(empresa => {
  const dbPath = `./empresa_${empresa.id}.db`;
  if (!fs.existsSync(dbPath)) {
    console.log(`   ⚠️  ${dbPath} não existe, pulando...`);
    return;
  }
  console.log(`   📁 Empresa ${empresa.id}: ${empresa.razao_social}`);
  const db = new Database(dbPath);

  // Dropar tabela antiga
  db.exec('DROP TABLE IF EXISTS configuracoes');

  // Criar tabela nova
  db.exec(`
    CREATE TABLE configuracoes (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      sefaz_ambiente INTEGER DEFAULT 2,
      sefaz_uf TEXT DEFAULT 'SP',
      certificado_tipo TEXT DEFAULT 'A1',
      certificado_senha TEXT DEFAULT '',
      certificado_path TEXT DEFAULT '',
      serie_nfe INTEGER DEFAULT 1,
      proximo_numero INTEGER DEFAULT 1,
      email_smtp_host TEXT DEFAULT '',
      email_smtp_port INTEGER DEFAULT 587,
      email_smtp_user TEXT DEFAULT '',
      email_smtp_pass TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Inserir registro único
  db.exec('INSERT INTO configuracoes (id) VALUES (1)');
  console.log('      ✅ Tabela criada e registro inserido');
  db.close();
});
mainDb.close();
console.log('\n' + '═'.repeat(50));
console.log('✅ PRONTO!\n');
console.log('📋 Próximos passos:');
console.log('   1. Reinicie o backend (npm start)');
console.log('   2. Acesse Config. Sistema');
console.log('   3. Preencha e salve');
console.log('   4. Recarregue (F5)');
console.log('   5. ✅ Deve funcionar!\n');