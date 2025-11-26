const Database = require('better-sqlite3');
console.log('\n🔧 SOLUÇÃO FINAL SIMPLES - CORRIGIR CLIENTE AGORA\n');
console.log('═'.repeat(70));

// 1. Corrigir o cliente no banco AGORA
const db = new Database('./empresa_1.db');
console.log('\n📊 CLIENTES NO BANCO:\n');
const clientes = db.prepare('SELECT id, razao_social, cidade, uf, codigo_municipio FROM clientes').all();
clientes.forEach(c => {
  console.log(`${c.id}. ${c.razao_social}`);
  console.log(`   Cidade: ${c.cidade} / ${c.uf}`);
  console.log(`   Código IBGE: ${c.codigo_municipio}`);
  console.log('');
});
console.log('─'.repeat(70));

// Corrigir TODOS os clientes com código de Osasco para Carapicuíba
const result = db.prepare(`
  UPDATE clientes 
  SET cidade = 'Carapicuíba', 
      uf = 'SP', 
      codigo_municipio = '3510609'
  WHERE codigo_municipio = '3534401'
`).run();
console.log(`\n✅ ${result.changes} cliente(s) corrigido(s) de Osasco para Carapicuíba\n`);
db.close();
console.log('═'.repeat(70));
console.log('\n✅ PRONTO! Cliente corrigido no banco.');
console.log('\n💡 Agora recarregue a página do navegador (F5)\n');
console.log('═'.repeat(70) + '\n');