const Database = require('better-sqlite3');
const fs = require('fs');
console.log('🔧 Criando tabela de configurações POR EMPRESA...\n');

// 1. Buscar todas as empresas
const mainDb = new Database('./principal.db');
const empresas = mainDb.prepare('SELECT id FROM empresas').all();
console.log(`📊 Encontradas ${empresas.length} empresas\n`);
if (empresas.length === 0) {
  console.log('⚠️  Nenhuma empresa encontrada!');
  console.log('💡 Crie uma empresa primeiro antes de configurar.');
  mainDb.close();
  process.exit(0);
}

// 2. Para cada empresa, criar tabela de configurações no seu banco
empresas.forEach(empresa => {
  const dbPath = `./empresa_${empresa.id}.db`;
  if (!fs.existsSync(dbPath)) {
    console.log(`⚠️  Banco empresa_${empresa.id}.db não existe, pulando...`);
    return;
  }
  console.log(`📦 Processando empresa ${empresa.id}...`);
  const db = new Database(dbPath);

  // Dropar tabela antiga se existir
  db.exec('DROP TABLE IF EXISTS configuracoes');

  // Criar tabela com colunas explícitas
  db.exec(`
    CREATE TABLE configuracoes (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      
      -- SEFAZ
      sefaz_ambiente INTEGER DEFAULT 2,
      sefaz_uf TEXT DEFAULT 'SP',
      
      -- Certificado Digital
      certificado_tipo TEXT DEFAULT 'A1',
      certificado_senha TEXT DEFAULT '',
      certificado_path TEXT DEFAULT '',
      
      -- NFe
      serie_nfe INTEGER DEFAULT 1,
      proximo_numero INTEGER DEFAULT 1,
      
      -- E-mail SMTP
      email_smtp_host TEXT DEFAULT '',
      email_smtp_port INTEGER DEFAULT 587,
      email_smtp_user TEXT DEFAULT '',
      email_smtp_pass TEXT DEFAULT '',
      
      -- Timestamps
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Inserir registro único (id = 1)
  db.exec(`INSERT INTO configuracoes (id) VALUES (1);`);
  console.log(`  ✅ Tabela configuracoes criada em empresa_${empresa.id}.db`);
  db.close();
});
console.log('\n✅ Pronto! Configurações criadas para todas as empresas.');
console.log('🔄 Agora atualize o server.js para buscar do banco da empresa.');
mainDb.close();