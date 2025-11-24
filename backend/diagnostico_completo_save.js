const Database = require('better-sqlite3');
console.log('🔍 DIAGNÓSTICO COMPLETO DE SALVAMENTO\n');
console.log('═'.repeat(60));
const empresaId = 1; // Altere se necessário

console.log(`\n📦 Testando empresa ${empresaId}\n`);

// 1. Verificar se banco existe
const dbPath = `./empresa_${empresaId}.db`;
const fs = require('fs');
if (!fs.existsSync(dbPath)) {
  console.log(`❌ ERRO: Banco ${dbPath} não existe!`);
  process.exit(1);
}
console.log(`✅ Banco ${dbPath} existe`);
const db = new Database(dbPath);

// 2. Verificar se tabela existe
console.log('\n📊 Verificando tabela configuracoes...');
const tableExists = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name='configuracoes'
`).get();
if (!tableExists) {
  console.log('❌ ERRO: Tabela configuracoes não existe!');
  console.log('\n💡 Execute: node limpar_e_recriar.js');
  db.close();
  process.exit(1);
}
console.log('✅ Tabela configuracoes existe');

// 3. Verificar estrutura da tabela
console.log('\n📋 Estrutura da tabela:');
const columns = db.prepare('PRAGMA table_info(configuracoes)').all();
columns.forEach(col => {
  console.log(`   - ${col.name} (${col.type})`);
});

// 4. Verificar se registro id=1 existe
console.log('\n📊 Verificando registro id=1...');
const record = db.prepare('SELECT * FROM configuracoes WHERE id = 1').get();
if (!record) {
  console.log('❌ ERRO: Registro id=1 não existe!');
  console.log('\n💡 Criando registro...');
  db.prepare('INSERT INTO configuracoes (id) VALUES (1)').run();
  console.log('✅ Registro criado');
} else {
  console.log('✅ Registro id=1 existe');
}

// 5. Testar UPDATE
console.log('\n🧪 TESTE DE UPDATE:');
console.log('\n📊 ANTES:');
const antes = db.prepare('SELECT * FROM configuracoes WHERE id = 1').get();
console.log('   certificado_senha:', antes.certificado_senha || '(vazio)');
console.log('   email_smtp_host:', antes.email_smtp_host || '(vazio)');
console.log('   sefaz_ambiente:', antes.sefaz_ambiente);
console.log('\n🔄 Executando UPDATE...');
const testData = {
  certificado_senha: 'TESTE_SENHA_123',
  email_smtp_host: 'smtp.teste.com',
  sefaz_ambiente: 2,
  sefaz_uf: 'SP',
  certificado_tipo: 'A1',
  certificado_path: '',
  serie_nfe: 1,
  proximo_numero: 1,
  email_smtp_port: 587,
  email_smtp_user: 'teste@teste.com',
  email_smtp_pass: 'senha123'
};
const result = db.prepare(`
  UPDATE configuracoes 
  SET 
    sefaz_ambiente = ?,
    sefaz_uf = ?,
    certificado_tipo = ?,
    certificado_senha = ?,
    certificado_path = ?,
    serie_nfe = ?,
    proximo_numero = ?,
    email_smtp_host = ?,
    email_smtp_port = ?,
    email_smtp_user = ?,
    email_smtp_pass = ?,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = 1
`).run(testData.sefaz_ambiente, testData.sefaz_uf, testData.certificado_tipo, testData.certificado_senha, testData.certificado_path, testData.serie_nfe, testData.proximo_numero, testData.email_smtp_host, testData.email_smtp_port, testData.email_smtp_user, testData.email_smtp_pass);
console.log('📊 Resultado:', {
  changes: result.changes,
  lastInsertRowid: result.lastInsertRowid
});
if (result.changes === 0) {
  console.log('❌ ERRO: UPDATE não modificou nenhuma linha!');
} else {
  console.log('✅ UPDATE executado com sucesso');
}
console.log('\n📊 DEPOIS:');
const depois = db.prepare('SELECT * FROM configuracoes WHERE id = 1').get();
console.log('   certificado_senha:', depois.certificado_senha || '(vazio)');
console.log('   email_smtp_host:', depois.email_smtp_host || '(vazio)');
console.log('   sefaz_ambiente:', depois.sefaz_ambiente);

// 6. Verificar se dados foram salvos
console.log('\n🔍 VERIFICAÇÃO FINAL:');
if (depois.certificado_senha === testData.certificado_senha) {
  console.log('✅ certificado_senha foi salvo corretamente');
} else {
  console.log('❌ certificado_senha NÃO foi salvo');
  console.log('   Esperado:', testData.certificado_senha);
  console.log('   Obtido:', depois.certificado_senha);
}
if (depois.email_smtp_host === testData.email_smtp_host) {
  console.log('✅ email_smtp_host foi salvo corretamente');
} else {
  console.log('❌ email_smtp_host NÃO foi salvo');
  console.log('   Esperado:', testData.email_smtp_host);
  console.log('   Obtido:', depois.email_smtp_host);
}

// 7. Limpar dados de teste
console.log('\n🧹 Limpando dados de teste...');
db.prepare(`
  UPDATE configuracoes 
  SET certificado_senha = '', email_smtp_host = '', email_smtp_user = '', email_smtp_pass = ''
  WHERE id = 1
`).run();
console.log('✅ Dados limpos');
db.close();
console.log('\n' + '═'.repeat(60));
console.log('\n💡 CONCLUSÃO:');
console.log('   Se todos os testes passaram, o problema está na API.');
console.log('   Se algum teste falhou, o problema está no banco de dados.');
console.log('\n');