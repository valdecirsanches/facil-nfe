const fs = require('fs');
const path = require('path');

// Ler o último XML gerado
const logsDir = path.join(__dirname, 'Arqs', 'empresa_1', 'logs');
const xmlFiles = fs.readdirSync(logsDir).filter(f => f.startsWith('debug_xml_')).sort().reverse();
const xmlPath = path.join(logsDir, xmlFiles[0]);
const xml = fs.readFileSync(xmlPath, 'utf8');
console.log('🔍 PROCURANDO SignedInfo NO XML\n');
console.log('═'.repeat(60));

// Procurar por SignedInfo
const signedInfoIndex = xml.indexOf('<SignedInfo');
const signatureIndex = xml.indexOf('<Signature');
console.log(`\n📍 Posição <Signature>: ${signatureIndex}`);
console.log(`📍 Posição <SignedInfo>: ${signedInfoIndex}`);
if (signatureIndex >= 0) {
  console.log('\n✅ Tag <Signature> encontrada');

  // Extrair 500 chars após <Signature>
  const sigStart = xml.substring(signatureIndex, signatureIndex + 500);
  console.log('\n📄 Primeiros 500 chars após <Signature>:\n');
  console.log(sigStart);
  if (signedInfoIndex < 0) {
    console.log('\n❌ PROBLEMA: <SignedInfo> NÃO ESTÁ NO XML!');
    console.log('🔍 O que está sendo inserido no lugar?\n');
  }
} else {
  console.log('\n❌ Tag <Signature> NÃO encontrada!');
}

// Verificar se tem CanonicalizationMethod (parte do SignedInfo)
if (xml.includes('CanonicalizationMethod')) {
  console.log('\n✅ CanonicalizationMethod encontrado (SignedInfo pode estar sem tag)');
} else {
  console.log('\n❌ CanonicalizationMethod NÃO encontrado');
}
console.log('\n═'.repeat(60));