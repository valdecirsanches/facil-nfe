const Database = require('better-sqlite3');
console.log('🔍 TESTE COMPLETO DE SALVAMENTO\n');
const empresaId = 1;
const dbPath = `./empresa_${empresaId}.db`;
console.log(`📦 Testando empresa ${empresaId}`);
console.log(`📁 Banco: ${dbPath}\n`);
const db = new Database(dbPath);

// 1. Verificar estrutura
console.log('1️⃣ ESTRUTURA DA TABELA:');
const columns = db.prepare('PRAGMA table_info(configuracoes)').all();
console.log('Colunas encontradas:');
columns.forEach(col => {
  console.log(`   ✓ ${col.name} (${col.type})`);
});

// 2. Estado ANTES
console.log('\n2️⃣ ESTADO ANTES DO UPDATE:');
const antes = db.prepare('SELECT * FROM configuracoes WHERE id = 1').get();
console.log('Dados atuais:');
console.log(`   certificado_senha: "${antes.certificado_senha || ''}"`);
console.log(`   email_smtp_host: "${antes.email_smtp_host || ''}"`);
console.log(`   sefaz_ambiente: ${antes.sefaz_ambiente}`);

// 3. Executar UPDATE (simulando o que o frontend faz)
console.log('\n3️⃣ EXECUTANDO UPDATE:');
const dadosTeste = {
  sefaz_ambiente: 2,
  sefaz_uf: 'SP',
  certificado_tipo: 'A1',
  certificado_senha: 'SENHA_TESTE_123',
  certificado_path: '',
  serie_nfe: 1,
  proximo_numero: 1,
  email_smtp_host: 'smtp.teste.com',
  email_smtp_port: 587,
  email_smtp_user: 'teste@email.com',
  email_smtp_pass: 'senha123'
};
console.log('Dados a salvar:');
console.log(`   certificado_senha: "${dadosTeste.certificado_senha}"`);
console.log(`   email_smtp_host: "${dadosTeste.email_smtp_host}"`);
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
`).run(dadosTeste.sefaz_ambiente, dadosTeste.sefaz_uf, dadosTeste.certificado_tipo, dadosTeste.certificado_senha, dadosTeste.certificado_path, dadosTeste.serie_nfe, dadosTeste.proximo_numero, dadosTeste.email_smtp_host, dadosTeste.email_smtp_port, dadosTeste.email_smtp_user, dadosTeste.email_smtp_pass);
console.log(`\nResultado do UPDATE: ${result.changes} linha(s) modificada(s)`);

// 4. Estado DEPOIS
console.log('\n4️⃣ ESTADO DEPOIS DO UPDATE:');
const depois = db.prepare('SELECT * FROM configuracoes WHERE id = 1').get();
console.log('Dados salvos:');
console.log(`   certificado_senha: "${depois.certificado_senha || ''}"`);
console.log(`   email_smtp_host: "${depois.email_smtp_host || ''}"`);
console.log(`   sefaz_ambiente: ${depois.sefaz_ambiente}`);

// 5. Verificação
console.log('\n5️⃣ VERIFICAÇÃO:');
let tudoCerto = true;
if (depois.certificado_senha === dadosTeste.certificado_senha) {
  console.log('   ✅ certificado_senha SALVO CORRETAMENTE');
} else {
  console.log('   ❌ certificado_senha NÃO FOI SALVO');
  console.log(`      Esperado: "${dadosTeste.certificado_senha}"`);
  console.log(`      Obtido: "${depois.certificado_senha}"`);
  tudoCerto = false;
}
if (depois.email_smtp_host === dadosTeste.email_smtp_host) {
  console.log('   ✅ email_smtp_host SALVO CORRETAMENTE');
} else {
  console.log('   ❌ email_smtp_host NÃO FOI SALVO');
  console.log(`      Esperado: "${dadosTeste.email_smtp_host}"`);
  console.log(`      Obtido: "${depois.email_smtp_host}"`);
  tudoCerto = false;
}

// 6. Limpar
console.log('\n6️⃣ LIMPANDO DADOS DE TESTE:');
db.prepare(`
  UPDATE configuracoes 
  SET certificado_senha = '', email_smtp_host = '', email_smtp_user = '', email_smtp_pass = ''
  WHERE id = 1
`).run();
console.log('   ✅ Dados limpos');
db.close();
console.log('\n' + '='.repeat(60));
if (tudoCerto) {
  console.log('✅ TESTE PASSOU! O banco está funcionando corretamente.');
  console.log('   O problema deve estar na API do backend.');
} else {
  console.log('❌ TESTE FALHOU! Há problema no banco de dados.');
}
console.log('='.repeat(60) + '\n');