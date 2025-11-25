const fs = require('fs');
const path = require('path');
console.log('🔧 CORRIGINDO NAMESPACE DOS XMLs PENDENTES\n');
console.log('═'.repeat(70));

/**
 * O erro "No matching global declaration available for the validation root"
 * significa que o XML não tem o namespace correto da NFe.
 * 
 * O XML deve começar com:
 * <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
 */

function corrigirNamespace(xmlString) {
  // Verificar se já tem o namespace correto
  if (xmlString.includes('xmlns="http://www.portalfiscal.inf.br/nfe"')) {
    console.log('   ✅ XML já possui namespace correto');
    return xmlString;
  }

  // Adicionar namespace na tag NFe
  const xmlCorrigido = xmlString.replace(/<NFe([^>]*)>/, '<NFe xmlns="http://www.portalfiscal.inf.br/nfe"$1>');
  if (xmlCorrigido !== xmlString) {
    console.log('   ✅ Namespace adicionado');
    return xmlCorrigido;
  }
  console.log('   ⚠️  Tag NFe não encontrada');
  return xmlString;
}

// Procurar XMLs pendentes
const arqsPath = path.join(__dirname, 'Arqs');
if (!fs.existsSync(arqsPath)) {
  console.log('❌ Pasta Arqs não encontrada');
  process.exit(1);
}
const empresas = fs.readdirSync(arqsPath).filter(f => f.startsWith('empresa_'));
let totalCorrigidos = 0;
empresas.forEach(empresa => {
  const pendentesPath = path.join(arqsPath, empresa, 'pendentes');
  if (!fs.existsSync(pendentesPath)) {
    return;
  }
  const arquivos = fs.readdirSync(pendentesPath).filter(f => f.endsWith('.xml'));
  if (arquivos.length === 0) {
    return;
  }
  console.log(`\n📁 ${empresa}:`);
  console.log(`   Encontrados ${arquivos.length} XML(s) pendente(s)\n`);
  arquivos.forEach(arquivo => {
    const xmlPath = path.join(pendentesPath, arquivo);
    console.log(`📄 ${arquivo}`);
    try {
      // Ler XML
      const xmlOriginal = fs.readFileSync(xmlPath, 'utf8');

      // Corrigir namespace
      const xmlCorrigido = corrigirNamespace(xmlOriginal);

      // Salvar se foi modificado
      if (xmlCorrigido !== xmlOriginal) {
        // Fazer backup
        const backupPath = xmlPath + '.backup';
        fs.writeFileSync(backupPath, xmlOriginal, 'utf8');
        console.log(`   💾 Backup criado: ${arquivo}.backup`);

        // Salvar XML corrigido
        fs.writeFileSync(xmlPath, xmlCorrigido, 'utf8');
        console.log(`   ✅ XML corrigido e salvo`);
        totalCorrigidos++;
      }
      console.log('');
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}\n`);
    }
  });
});
console.log('═'.repeat(70));
console.log(`\n✅ Total de XMLs corrigidos: ${totalCorrigidos}\n`);
if (totalCorrigidos > 0) {
  console.log('💡 Próximo passo:');
  console.log('   node validador_xsd_xmllint.js\n');
} else {
  console.log('ℹ️  Nenhum XML precisou ser corrigido\n');
}