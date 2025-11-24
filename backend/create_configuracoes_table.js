const Database = require('better-sqlite3');
console.log('🔧 Criando tabela de configurações...\n');
const db = new Database('./principal.db');

// 1. Criar tabela se não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS configuracoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chave TEXT UNIQUE NOT NULL,
    valor TEXT,
    descricao TEXT,
    tipo TEXT DEFAULT 'string',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
console.log('✅ Tabela configuracoes criada/verificada');

// 2. Verificar se já existem configurações
const count = db.prepare('SELECT COUNT(*) as total FROM configuracoes').get();
console.log(`📊 Configurações existentes: ${count.total}\n`);
if (count.total === 0) {
  console.log('➕ Inserindo configurações padrão...\n');
  const configs = [{
    chave: 'sefaz_ambiente',
    valor: '2',
    descricao: 'Ambiente SEFAZ (1=Produção, 2=Homologação)',
    tipo: 'number'
  }, {
    chave: 'sefaz_uf',
    valor: 'SP',
    descricao: 'UF da SEFAZ',
    tipo: 'string'
  }, {
    chave: 'certificado_tipo',
    valor: 'A1',
    descricao: 'Tipo de certificado (A1 ou A3)',
    tipo: 'string'
  }, {
    chave: 'certificado_senha',
    valor: '',
    descricao: 'Senha do certificado',
    tipo: 'password'
  }, {
    chave: 'certificado_path',
    valor: '',
    descricao: 'Caminho do arquivo .pfx',
    tipo: 'string'
  }, {
    chave: 'serie_nfe',
    valor: '1',
    descricao: 'Série padrão da NFe',
    tipo: 'number'
  }, {
    chave: 'proximo_numero',
    valor: '1',
    descricao: 'Próximo número de NFe',
    tipo: 'number'
  }, {
    chave: 'email_smtp_host',
    valor: '',
    descricao: 'Servidor SMTP',
    tipo: 'string'
  }, {
    chave: 'email_smtp_port',
    valor: '587',
    descricao: 'Porta SMTP',
    tipo: 'number'
  }, {
    chave: 'email_smtp_user',
    valor: '',
    descricao: 'Usuário SMTP',
    tipo: 'string'
  }, {
    chave: 'email_smtp_pass',
    valor: '',
    descricao: 'Senha SMTP',
    tipo: 'password'
  }];
  const insert = db.prepare(`
    INSERT INTO configuracoes (chave, valor, descricao, tipo)
    VALUES (?, ?, ?, ?)
  `);
  for (const config of configs) {
    insert.run(config.chave, config.valor, config.descricao, config.tipo);
    console.log(`  ✅ ${config.chave}: "${config.valor}"`);
  }
  console.log('\n✅ Configurações padrão inseridas!');
} else {
  console.log('ℹ️  Configurações já existem, pulando inserção.');
}

// 3. Mostrar todas as configurações
console.log('\n📊 Configurações atuais:\n');
const allConfigs = db.prepare('SELECT * FROM configuracoes ORDER BY chave').all();
allConfigs.forEach(c => {
  console.log(`  ${c.chave}: "${c.valor}"`);
});
console.log('\n✅ Pronto! Tabela de configurações criada e populada.');
console.log('🔄 Reinicie o backend (npm start) e teste novamente.');
db.close();