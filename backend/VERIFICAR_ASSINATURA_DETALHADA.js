const fs = require('fs');
const forge = require('node-forge');
console.log('🔍 VERIFICAÇÃO DETALHADA DA ASSINATURA\n');
console.log('═'.repeat(70));
const xmlPath = '/home/sanches/Magic/nfe/src/backend/Arqs/empresa_1/logs/debug_xml_1764079860899.xml';
const xml = fs.readFileSync(xmlPath, 'utf8');
console.log('\n1️⃣ ESTRUTURA DA ASSINATURA:\n');

// Extrair partes da assinatura
const signatureMatch = xml.match(/<Signature[^>]*>(.*?)<\/Signature>/s);
if (!signatureMatch) {
  console.log('❌ Tag <Signature> não encontrada!');
  process.exit(1);
}
const signature = signatureMatch[1];

// Verificar componentes
const checks = {
  'SignedInfo': signature.includes('<SignedInfo'),
  'CanonicalizationMethod': signature.includes('<CanonicalizationMethod'),
  'SignatureMethod': signature.includes('<SignatureMethod'),
  'Reference': signature.includes('<Reference'),
  'DigestMethod': signature.includes('<DigestMethod'),
  'DigestValue': signature.includes('<DigestValue'),
  'SignatureValue': signature.includes('<SignatureValue'),
  'KeyInfo': signature.includes('<KeyInfo'),
  'X509Certificate': signature.includes('<X509Certificate')
};
Object.entries(checks).forEach(([tag, existe]) => {
  console.log(`   ${existe ? '✅' : '❌'} ${tag}`);
});
console.log('\n2️⃣ ALGORITMOS USADOS:\n');

// Extrair algoritmos
const canonMatch = signature.match(/CanonicalizationMethod[^>]*Algorithm="([^"]+)"/);
const signMethodMatch = signature.match(/SignatureMethod[^>]*Algorithm="([^"]+)"/);
const digestMatch = signature.match(/DigestMethod[^>]*Algorithm="([^"]+)"/);
if (canonMatch) {
  console.log(`   Canonicalização: ${canonMatch[1]}`);
  if (canonMatch[1].includes('xml-exc-c14n')) {
    console.log('   ✅ Algoritmo correto (exclusive)');
  } else {
    console.log('   ⚠️  Algoritmo pode estar incorreto');
  }
}
if (signMethodMatch) {
  console.log(`   Assinatura: ${signMethodMatch[1]}`);
  if (signMethodMatch[1].includes('rsa-sha256')) {
    console.log('   ✅ SHA-256 (correto)');
  } else {
    console.log('   ⚠️  Deveria ser SHA-256');
  }
}
if (digestMatch) {
  console.log(`   Digest: ${digestMatch[1]}`);
  if (digestMatch[1].includes('sha256')) {
    console.log('   ✅ SHA-256 (correto)');
  } else {
    console.log('   ⚠️  Deveria ser SHA-256');
  }
}
console.log('\n3️⃣ REFERÊNCIA DA ASSINATURA:\n');
const refMatch = signature.match(/Reference[^>]*URI="([^"]+)"/);
if (refMatch) {
  console.log(`   URI: ${refMatch[1]}`);

  // Verificar se a URI corresponde ao Id do infNFe
  const idMatch = xml.match(/infNFe[^>]*Id="([^"]+)"/);
  if (idMatch) {
    const expectedUri = `#${idMatch[1]}`;
    if (refMatch[1] === expectedUri) {
      console.log(`   ✅ URI corresponde ao Id: ${idMatch[1]}`);
    } else {
      console.log(`   ❌ URI NÃO corresponde!`);
      console.log(`      Esperado: ${expectedUri}`);
      console.log(`      Encontrado: ${refMatch[1]}`);
    }
  }
}
console.log('\n4️⃣ NAMESPACE NA ASSINATURA:\n');

// Verificar se Signature tem namespace
const sigNamespace = xml.match(/<Signature[^>]*xmlns="([^"]+)"/);
if (sigNamespace) {
  console.log(`   Namespace: ${sigNamespace[1]}`);
  if (sigNamespace[1] === 'http://www.w3.org/2000/09/xmldsig#') {
    console.log('   ✅ Namespace correto');
  } else {
    console.log('   ❌ Namespace incorreto!');
  }
} else {
  console.log('   ❌ Signature SEM namespace!');
  console.log('   A tag <Signature> DEVE ter xmlns="http://www.w3.org/2000/09/xmldsig#"');
}
console.log('\n5️⃣ POSIÇÃO DA ASSINATURA:\n');
const posInfNFe = xml.indexOf('</infNFe>');
const posSignature = xml.indexOf('<Signature');
const posNFe = xml.indexOf('</NFe>');
console.log(`   </infNFe> na posição: ${posInfNFe}`);
console.log(`   <Signature> na posição: ${posSignature}`);
console.log(`   </NFe> na posição: ${posNFe}`);
if (posSignature > posInfNFe && posSignature < posNFe) {
  console.log('   ✅ Assinatura na posição correta (após </infNFe>)');
} else {
  console.log('   ❌ Assinatura em posição incorreta!');
}
console.log('\n═'.repeat(70));
console.log('\n🎯 DIAGNÓSTICO:\n');
if (!sigNamespace) {
  console.log('❌ PROBLEMA ENCONTRADO: Signature sem namespace!');
  console.log('\n💡 SOLUÇÃO:');
  console.log('   A tag <Signature> deve ter:');
  console.log('   xmlns="http://www.w3.org/2000/09/xmldsig#"\n');
  console.log('   Isso é adicionado automaticamente pelo node-forge');
  console.log('   Verifique se o código de assinatura está correto\n');
} else {
  console.log('✅ Assinatura parece estar correta');
  console.log('\n🤔 O erro 225 pode ser causado por:');
  console.log('   1. Certificado inválido ou expirado');
  console.log('   2. Problema na canonicalização');
  console.log('   3. DigestValue calculado incorretamente');
  console.log('   4. Algum campo específico que a SEFAZ não aceita\n');
}
console.log('═'.repeat(70));