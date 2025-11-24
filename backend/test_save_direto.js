const Database = require('better-sqlite3');
console.log('🧪 Teste de salvamento DIRETO no banco...\n');
const empresaId = 1; // Altere se necessário
const db = new Database(`./empresa_${empresaId}.db`);
console.log(`📦 Testando empresa ${empresaId}\n`);

// 1. Ver dados ANTES
console.log('📊 ANTES do UPDATE:');
const antes = db.prepare('SELECT * FROM configuracoes WHERE id = 1').get();
console.log('  certificado_senha:', antes.certificado_senha || '(vazio)');
console.log('  email_smtp_host:', antes.email_smtp_host || '(vazio)');

// 2. Fazer UPDATE
console.log('\n🔄 Executando UPDATE...');
const result = db.prepare(`
  UPDATE configuracoes 
  SET 
    certificado_senha = ?,
    email_smtp_host = ?,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = 1
`).run('TESTE_SENHA_123', 'smtp.teste.com');
console.log('📊 Resultado:', {
  changes: result.changes,
  lastInsertRowid: result.lastInsertRowid
});

// 3. Ver dados DEPOIS
console.log('\n📊 DEPOIS do UPDATE:');
const depois = db.prepare('SELECT * FROM configuracoes WHERE id = 1').get();
console.log('  certificado_senha:', depois.certificado_senha || '(vazio)');
console.log('  email_smtp_host:', depois.email_smtp_host || '(vazio)');

// 4. Limpar (voltar ao vazio)
console.log('\n🧹 Limpando...');
db.prepare(`
  UPDATE configuracoes 
  SET certificado_senha = '', email_smtp_host = ''
  WHERE id = 1
`).run();
console.log('✅ Teste concluído!');
console.log('\n💡 Se o UPDATE funcionou aqui, o problema está na API.');
console.log('💡 Se não funcionou, o problema está na estrutura do banco.');
db.close();