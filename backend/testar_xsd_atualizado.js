const {
  execSync
} = require('child_process');
const fs = require('fs');
const path = require('path');
console.log('🧪 TESTANDO VALIDAÇÃO XSD COM SCHEMAS ATUALIZADOS\n');
console.log('═'.repeat(70));

// Verificar schemas
const schemasPath = path.join(__dirname, 'schemas');
if (!fs.existsSync(schemasPath)) {
  console.log('❌ Pasta schemas não encontrada');
  process.exit(1);
}
console.log('\n📂 Schemas encontrados:\n');
const schemas = fs.readdirSync(schemasPath).filter(f => f.endsWith('.xsd'));
schemas.forEach(schema => {
  const stats = fs.statSync(path.join(schemasPath, schema));
  const dataModificacao = stats.mtime.toLocaleString('pt-BR');
  console.log(`✅ ${schema}`);
  console.log(`   Modificado: ${dataModificacao}`);
  console.log(`   Tamanho: ${(stats.size / 1024).toFixed(2)} KB\n`);
});

// Procurar XML para testar
const arqsPath = path.join(__dirname, 'Arqs');
let xmlPath = null;
let xmlNome = null;
if (fs.existsSync(arqsPath)) {
  const empresas = fs.readdirSync(arqsPath).filter(f => f.startsWith('empresa_'));
  for (const empresa of empresas) {
    const pendentesPath = path.join(arqsPath, empresa, 'pendentes');
    if (fs.existsSync(pendentesPath)) {
      const arquivos = fs.readdirSync(pendentesPath).filter(f => f.endsWith('.xml'));
      if (arquivos.length > 0) {
        xmlPath = path.join(pendentesPath, arquivos[0]);
        xmlNome = arquivos[0];
        break;
      }
    }
  }
}
if (!xmlPath) {
  console.log('⚠️  Nenhum XML encontrado para testar');
  console.log('   Emita uma NFe primeiro\n');
  process.exit(0);
}
console.log('═'.repeat(70));
console.log(`\n📄 Testando validação: ${xmlNome}\n`);

// Executar validador
const ValidadorXSD = require('./validador_xsd_xmllint');
try {
  const validador = new ValidadorXSD();
  const xmlString = fs.readFileSync(xmlPath, 'utf8');
  console.log('🔍 Validando contra schemas XSD atualizados...\n');
  const resultado = validador.validar(xmlString, {
    verbose: false
  });
  validador.gerarRelatorio(resultado);
  if (resultado.valido) {
    console.log('🎉 SUCESSO! Os schemas atualizados estão funcionando!\n');
    console.log('✅ Próximos passos:');
    console.log('   1. Integrar validador no nfe_service.js');
    console.log('   2. Validar antes de enviar para SEFAZ');
    console.log('   3. Reduzir rejeições\n');
  } else {
    console.log('⚠️  XML ainda tem erros. Analise o relatório acima.\n');
    if (resultado.erros.some(e => e.mensagem.includes('sha1') || e.mensagem.includes('sha256'))) {
      console.log('💡 NOTA: Se os erros são sobre SHA1 vs SHA256:');
      console.log('   - Isso significa que o XSD ainda está desatualizado');
      console.log('   - Use o validador_nfe_receita.js ao invés deste');
      console.log('   - O XML está correto, o XSD que está errado\n');
    }
  }
} catch (error) {
  console.error('❌ Erro ao validar:', error.message);
  if (error.message.includes('xmllint não instalado')) {
    console.log('\n💡 Instale o xmllint:');
    console.log('   sudo apt-get install libxml2-utils\n');
  }
}
console.log('═'.repeat(70) + '\n');