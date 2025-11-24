const Database = require('better-sqlite3');
console.log('🔧 CORRIGINDO SÉRIE DA NFe\n');
console.log('═'.repeat(70));

// Buscar empresas
const mainDb = new Database('./principal.db');
const empresas = mainDb.prepare('SELECT id FROM empresas').all();
mainDb.close();
empresas.forEach(empresa => {
  const dbPath = `./empresa_${empresa.id}.db`;
  const db = new Database(dbPath);
  console.log(`\n⚙️  Empresa ${empresa.id}:\n`);
  const config = db.prepare('SELECT * FROM configuracoes WHERE id = 1').get();
  if (!config) {
    console.log('❌ Configurações não encontradas!\n');
    db.close();
    return;
  }
  console.log(`📋 Configuração atual:`);
  console.log(`   Série NFe: ${config.serie_nfe}`);
  console.log(`   Próximo número: ${config.proximo_numero}`);

  // Verificar se série está incorreta
  if (config.serie_nfe > 999) {
    console.log(`\n⚠️  ERRO: Série ${config.serie_nfe} é inválida!`);
    console.log(`   A série deve ser entre 1 e 999.`);
    console.log(`   Você provavelmente confundiu com o modelo (55).`);
    console.log(`\n   Corrigindo para série 1...`);
    db.prepare('UPDATE configuracoes SET serie_nfe = 1 WHERE id = 1').run();
    console.log(`   ✅ Série corrigida para 1\n`);
  } else if (config.serie_nfe === 55) {
    console.log(`\n⚠️  ATENÇÃO: Série 55 detectada!`);
    console.log(`   Isso pode ser confusão com o modelo da NFe.`);
    console.log(`   O modelo é sempre 55 (NFe).`);
    console.log(`   A série é um número sequencial (geralmente 1, 2, 3...).`);
    console.log(`\n   Deseja corrigir para série 1? (Recomendado)`);
    console.log(`   Corrigindo automaticamente...`);
    db.prepare('UPDATE configuracoes SET serie_nfe = 1 WHERE id = 1').run();
    console.log(`   ✅ Série corrigida para 1\n`);
  } else {
    console.log(`\n   ✅ Série OK (${config.serie_nfe})\n`);
  }

  // Mostrar configuração final
  const configFinal = db.prepare('SELECT * FROM configuracoes WHERE id = 1').get();
  console.log(`📋 Configuração final:`);
  console.log(`   Série NFe: ${configFinal.serie_nfe}`);
  console.log(`   Próximo número: ${configFinal.proximo_numero}\n`);
  db.close();
});
console.log('═'.repeat(70));
console.log('\n✅ Correção concluída!\n');
console.log('💡 Lembre-se:');
console.log('   - Modelo da NFe: sempre 55');
console.log('   - Série: número sequencial (1, 2, 3...)');
console.log('   - Número: número da nota dentro da série\n');