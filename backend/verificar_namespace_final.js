const fs = require('fs');
const path = require('path');
console.log('🔍 VERIFICAÇÃO FINAL DE NAMESPACE\n');
console.log('═'.repeat(70));
const logsDir = path.join(__dirname, 'Arqs', 'empresa_1', 'logs');
const arquivos = fs.readdirSync(logsDir).filter(f => f.startsWith('debug_envelope_')).sort().reverse();
const envelopePath = path.join(logsDir, arquivos[0]);
const envelope = fs.readFileSync(envelopePath, 'utf8');
console.log(`\n📄 Arquivo: ${arquivos[0]}\n`);

// Extrair tag NFe
const nfeMatch = envelope.match(/<NFe[^>]*>/);
console.log('🔍 TAG <NFe>:\n');
console.log(nfeMatch[0]);
console.log('\n');
if (nfeMatch[0].includes('xmlns=')) {
  console.log('❌ ERRO: Tag <NFe> AINDA TEM NAMESPACE!');
  console.log('\n💡 O código não foi atualizado corretamente.');
  console.log('   Verifique se o backend foi reiniciado após a alteração.\n');
} else {
  console.log('✅ Tag <NFe> SEM namespace (correto!)');
  console.log('\n🤔 Se o erro persiste, pode ser outro problema...\n');

  // Verificar se tem algum outro problema
  console.log('🔍 OUTRAS VERIFICAÇÕES:\n');

  // Verificar se infNFe tem namespace
  const infNFeMatch = envelope.match(/<infNFe[^>]*>/);
  if (infNFeMatch) {
    console.log('Tag <infNFe>:');
    console.log(infNFeMatch[0]);
    if (infNFeMatch[0].includes('xmlns=')) {
      console.log('❌ PROBLEMA: <infNFe> tem namespace (não deveria ter)');
    } else {
      console.log('✅ <infNFe> sem namespace extra');
    }
  }

  // Verificar estrutura geral
  console.log('\n📋 ESTRUTURA DO ENVELOPE:\n');
  const estrutura = [{
    tag: 'enviNFe',
    tem: envelope.includes('<enviNFe')
  }, {
    tag: 'enviNFe com xmlns',
    tem: envelope.match(/<enviNFe[^>]*xmlns="http:\/\/www\.portalfiscal\.inf\.br\/nfe"/)
  }, {
    tag: 'NFe',
    tem: envelope.includes('<NFe>')
  }, {
    tag: 'NFe com xmlns',
    tem: envelope.match(/<NFe[^>]*xmlns=/)
  }, {
    tag: 'infNFe',
    tem: envelope.includes('<infNFe')
  }, {
    tag: 'Signature',
    tem: envelope.includes('<Signature')
  }];
  estrutura.forEach(item => {
    console.log(`   ${item.tem ? '✅' : '❌'} ${item.tag}`);
  });
}
console.log('\n═'.repeat(70));