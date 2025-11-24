const Database = require('better-sqlite3');
const mainDb = new Database('./principal.db');
console.log('🔍 Testando configurações...\n');

// Listar todas as configurações
const configs = mainDb.prepare('SELECT * FROM configuracoes').all();
console.log(`📊 Total de configurações: ${configs.length}\n`);
configs.forEach(config => {
  console.log(`${config.chave}: ${config.valor}`);
});
console.log('\n✅ Teste concluído!');
console.log('\n💡 Para testar salvamento:');
console.log('1. Acesse Config. Sistema');
console.log('2. Configure o certificado');
console.log('3. Clique em Salvar');
console.log('4. Execute: node test_config.js');
console.log('5. Verifique se o valor foi salvo');
mainDb.close();