const Database = require('better-sqlite3');
console.log('🔧 ADICIONANDO COLUNA codigo_municipio E bairro NA TABELA empresas\n');
console.log('═'.repeat(70));
const db = new Database('./principal.db');
try {
  // Verificar se coluna codigo_municipio existe
  const colunas = db.prepare("PRAGMA table_info(empresas)").all();
  const temCodigoMunicipio = colunas.some(col => col.name === 'codigo_municipio');
  const temBairro = colunas.some(col => col.name === 'bairro');
  console.log('\n📋 COLUNAS ATUAIS:');
  colunas.forEach(col => {
    console.log(`   - ${col.name} (${col.type})`);
  });
  if (!temCodigoMunicipio) {
    console.log('\n➕ Adicionando coluna codigo_municipio...');
    db.exec('ALTER TABLE empresas ADD COLUMN codigo_municipio TEXT');
    console.log('✅ Coluna codigo_municipio adicionada!');
  } else {
    console.log('\n✅ Coluna codigo_municipio já existe');
  }
  if (!temBairro) {
    console.log('\n➕ Adicionando coluna bairro...');
    db.exec('ALTER TABLE empresas ADD COLUMN bairro TEXT');
    console.log('✅ Coluna bairro adicionada!');
  } else {
    console.log('\n✅ Coluna bairro já existe');
  }
  console.log('\n📋 COLUNAS APÓS ALTERAÇÃO:');
  const colunasAtualizadas = db.prepare("PRAGMA table_info(empresas)").all();
  colunasAtualizadas.forEach(col => {
    console.log(`   - ${col.name} (${col.type})`);
  });
  console.log('\n═'.repeat(70));
  console.log('✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
  console.log('\n💡 PRÓXIMOS PASSOS:');
  console.log('   1. Reinicie o backend: pkill -9 node && npm start');
  console.log('   2. Edite a empresa e salve o código IBGE');
  console.log('   3. O código será salvo corretamente agora!\n');
  console.log('═'.repeat(70));
} catch (error) {
  console.error('❌ ERRO:', error.message);
} finally {
  db.close();
}