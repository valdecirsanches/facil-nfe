const Database = require('better-sqlite3');
console.log('🔧 Criando tabela de configurações CORRETA...\n');
const db = new Database('./principal.db');

// 1. Dropar tabela antiga se existir
db.exec('DROP TABLE IF EXISTS configuracoes');
console.log('🗑️  Tabela antiga removida (se existia)');

// 2. Criar tabela com COLUNAS EXPLÍCITAS
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
console.log('✅ Tabela configuracoes criada com colunas explícitas\n');

// 3. Inserir registro único (id = 1)
db.exec(`
  INSERT INTO configuracoes (id) VALUES (1);
`);
console.log('✅ Registro único criado (id = 1)\n');

// 4. Mostrar estrutura
console.log('📊 Estrutura da tabela:\n');
const structure = db.prepare("PRAGMA table_info(configuracoes)").all();
structure.forEach(col => {
  console.log(`  ${col.name}: ${col.type} ${col.dflt_value ? `(padrão: ${col.dflt_value})` : ''}`);
});

// 5. Mostrar dados
console.log('\n📊 Dados atuais:\n');
const config = db.prepare('SELECT * FROM configuracoes WHERE id = 1').get();
console.log(config);
console.log('\n✅ Pronto! Tabela de configurações criada corretamente.');
console.log('🔄 Agora atualize o server.js para usar esta estrutura.');
db.close();