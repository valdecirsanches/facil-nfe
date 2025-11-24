const Database = require('better-sqlite3');
console.log('🧪 Testando configurações por empresa...\n');

// 1. Verificar empresas
const mainDb = new Database('./principal.db');
const empresas = mainDb.prepare('SELECT id, razao_social FROM empresas').all();
console.log(`📊 Empresas encontradas: ${empresas.length}\n`);
empresas.forEach(empresa => {
  console.log(`\n📦 Empresa ${empresa.id}: ${empresa.razao_social}`);
  console.log('─'.repeat(50));
  try {
    const db = new Database(`./empresa_${empresa.id}.db`);

    // Verificar se tabela existe
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='configuracoes'
    `).get();
    if (!tableExists) {
      console.log('  ❌ Tabela configuracoes NÃO EXISTE');
      db.close();
      return;
    }
    console.log('  ✅ Tabela configuracoes existe');

    // Buscar configurações
    const config = db.prepare('SELECT * FROM configuracoes WHERE id = 1').get();
    if (!config) {
      console.log('  ⚠️  Nenhum registro encontrado (id = 1)');
    } else {
      console.log('  📊 Configurações atuais:');
      console.log(`     sefaz_ambiente: ${config.sefaz_ambiente}`);
      console.log(`     sefaz_uf: ${config.sefaz_uf}`);
      console.log(`     certificado_senha: "${config.certificado_senha}"`);
      console.log(`     certificado_path: "${config.certificado_path}"`);
      console.log(`     email_smtp_host: "${config.email_smtp_host}"`);
    }
    db.close();
  } catch (error) {
    console.log(`  ❌ Erro: ${error.message}`);
  }
});
console.log('\n✅ Teste concluído!');
console.log('\n💡 Para testar salvamento:');
console.log('1. Acesse Config. Sistema');
console.log('2. Preencha "Senha do Certificado" com: teste123');
console.log('3. Clique em Salvar');
console.log('4. Execute: node test_config_empresa.js');
console.log('5. Verifique se certificado_senha = "teste123"');
mainDb.close();