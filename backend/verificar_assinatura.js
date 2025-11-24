const fs = require('fs');
const path = require('path');
const logsDir = path.join(__dirname, 'Arqs', 'empresa_1', 'logs');
const xmlFiles = fs.readdirSync(logsDir).filter(f => f.startsWith('debug_xml_')).sort().reverse();
const xmlPath = path.join(logsDir, xmlFiles[0]);
const xml = fs.readFileSync(xmlPath, 'utf8');
console.log('🔍 VERIFICANDO ASSINATURA NO XML\n');
console.log('═'.repeat(60));
console.log(`\n📄 Arquivo: ${xmlFiles[0]}\n`);

// Verificar se tem assinatura
if (xml.includes('<Signature')) {
  console.log('✅ Tag <Signature> ENCONTRADA!\n');

  // Extrair assinatura
  const sigMatch = xml.match(/<Signature[^>]*>(.*?)<\/Signature>/s);
  if (sigMatch) {
    const signature = sigMatch[0];
    console.log('📋 Estrutura da assinatura:\n');
    if (signature.includes('<SignedInfo>')) {
      console.log('   ✅ SignedInfo presente');
    } else {
      console.log('   ❌ SignedInfo AUSENTE');
    }
    if (signature.includes('<SignatureValue>')) {
      console.log('   ✅ SignatureValue presente');
    } else {
      console.log('   ❌ SignatureValue AUSENTE');
    }
    if (signature.includes('<KeyInfo>')) {
      console.log('   ✅ KeyInfo presente');
    } else {
      console.log('   ❌ KeyInfo AUSENTE');
    }
    if (signature.includes('<X509Certificate>')) {
      console.log('   ✅ X509Certificate presente');
    } else {
      console.log('   ❌ X509Certificate AUSENTE');
    }
    console.log('\n📄 Assinatura completa (primeiros 500 chars):\n');
    console.log(signature.substring(0, 500));
  }
} else {
  console.log('❌ Tag <Signature> NÃO ENCONTRADA!\n');
  console.log('⚠️  O XML NÃO FOI ASSINADO!\n');
  console.log('📋 Possíveis causas:');
  console.log('   1. Erro ao carregar certificado');
  console.log('   2. Senha do certificado incorreta');
  console.log('   3. Erro na função assinarXML()');
  console.log('   4. Certificado em formato inválido');
}
console.log('\n═'.repeat(60));
console.log('\n📄 XML completo (primeiros 2000 chars):\n');
console.log(xml.substring(0, 2000));
console.log('\n...\n');
console.log('\n📄 XML completo (últimos 1000 chars):\n');
console.log('...\n');
console.log(xml.substring(xml.length - 1000));