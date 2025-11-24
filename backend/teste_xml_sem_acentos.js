const fs = require('fs');
const path = require('path');
console.log('🔍 TESTE: XML SEM ACENTOS\n');
console.log('═'.repeat(70));

// Buscar XML mais recente
const logsDir = path.join(__dirname, 'Arqs', 'empresa_1', 'logs');
const arquivos = fs.readdirSync(logsDir).filter(f => f.startsWith('debug_xml_')).sort().reverse();
const xmlPath = path.join(logsDir, arquivos[0]);
const xml = fs.readFileSync(xmlPath, 'utf8');
console.log(`\n📄 Arquivo: ${arquivos[0]}\n`);

// Verificar se ainda tem acentos
const acentos = xml.match(/[áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/g);
if (acentos) {
  console.log('❌ ERRO: XML ainda contém acentos!\n');
  console.log('Acentos encontrados:', [...new Set(acentos)].join(', '));

  // Encontrar onde estão os acentos
  const linhas = xml.split(/(?=<)/);
  linhas.forEach((linha, i) => {
    if (/[áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/.test(linha)) {
      console.log(`\nLinha ${i + 1}:`);
      console.log(linha.substring(0, 200));
    }
  });
  console.log('\n💡 A função removeAcentos() não está sendo aplicada corretamente!');
  console.log('   Verifique se o backend foi reiniciado após a alteração.\n');
} else {
  console.log('✅ XML sem acentos!\n');
  console.log('O erro 225 deve ter outra causa. Vou verificar outros problemas...\n');

  // Verificar outros problemas possíveis
  console.log('🔍 OUTRAS VERIFICAÇÕES:\n');

  // 1. Verificar se tem namespace duplicado no envelope
  const envelopeMatch = xml.match(/<enviNFe[^>]*>/);
  if (envelopeMatch) {
    console.log('1. Envelope <enviNFe>:');
    console.log(`   ${envelopeMatch[0]}`);
    if (envelopeMatch[0].includes('xmlns=') && xml.match(/<NFe[^>]*xmlns=/)) {
      console.log('   ⚠️  Namespace declarado em <enviNFe> E em <NFe>');
      console.log('   Isso pode causar problema no schema!');
    }
  }

  // 2. Verificar estrutura do envelope
  console.log('\n2. Estrutura do envelope:');
  const temEnviNFe = xml.includes('<enviNFe');
  const temNFe = xml.includes('<NFe');
  const temSignature = xml.includes('<Signature');
  console.log(`   <enviNFe>: ${temEnviNFe ? '✅' : '❌'}`);
  console.log(`   <NFe>: ${temNFe ? '✅' : '❌'}`);
  console.log(`   <Signature>: ${temSignature ? '✅' : '❌'}`);
}
console.log('\n═'.repeat(70));
console.log('\n💡 PRÓXIMA AÇÃO:\n');
console.log('Se o XML está sem acentos mas o erro persiste,');
console.log('o problema pode estar no ENVELOPE SOAP ou na ASSINATURA.\n');
console.log('Vou criar um script para testar com XML mínimo válido...\n');