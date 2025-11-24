const Database = require('better-sqlite3');
console.log('🔍 TESTE ESPECÍFICO: SENHA DO CERTIFICADO\n');
const empresaId = 1;
const db = new Database(`./empresa_${empresaId}.db`);

// 1. Estado atual
console.log('1️⃣ ESTADO ATUAL:');
const antes = db.prepare('SELECT certificado_senha, email_smtp_host FROM configuracoes WHERE id = 1').get();
console.log(`   certificado_senha: "${antes.certificado_senha || '(vazio)'}"`);
console.log(`   email_smtp_host: "${antes.email_smtp_host || '(vazio)'}"`);

// 2. Testar UPDATE só da senha
console.log('\n2️⃣ TESTANDO UPDATE DA SENHA:');
const senhaTeste = 'SENHA_TESTE_123';
console.log(`   Salvando: "${senhaTeste}"`);
const result = db.prepare(`
  UPDATE configuracoes 
  SET certificado_senha = ?
  WHERE id = 1
`).run(senhaTeste);
console.log(`   Linhas modificadas: ${result.changes}`);

// 3. Verificar se salvou
console.log('\n3️⃣ VERIFICANDO SE SALVOU:');
const depois = db.prepare('SELECT certificado_senha FROM configuracoes WHERE id = 1').get();
console.log(`   certificado_senha: "${depois.certificado_senha || '(vazio)'}"`);
if (depois.certificado_senha === senhaTeste) {
  console.log('   ✅ SENHA SALVA CORRETAMENTE!');
} else {
  console.log('   ❌ SENHA NÃO FOI SALVA!');
  console.log(`   Esperado: "${senhaTeste}"`);
  console.log(`   Obtido: "${depois.certificado_senha}"`);
}

// 4. Verificar estrutura da coluna
console.log('\n4️⃣ ESTRUTURA DA COLUNA:');
const colInfo = db.prepare(`PRAGMA table_info(configuracoes)`).all();
const senhaCol = colInfo.find(c => c.name === 'certificado_senha');
if (senhaCol) {
  console.log('   Coluna encontrada:');
  console.log(`   - Nome: ${senhaCol.name}`);
  console.log(`   - Tipo: ${senhaCol.type}`);
  console.log(`   - Default: ${senhaCol.dflt_value || '(nenhum)'}`);
} else {
  console.log('   ❌ Coluna certificado_senha NÃO EXISTE!');
}

// 5. Limpar
console.log('\n5️⃣ LIMPANDO:');
db.prepare(`UPDATE configuracoes SET certificado_senha = '' WHERE id = 1`).run();
console.log('   ✅ Dados limpos\n');
db.close();