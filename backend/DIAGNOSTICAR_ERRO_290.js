const fs = require('fs');
const path = require('path');
console.log('🔍 DIAGNÓSTICO DO ERRO 290 - CERTIFICADO INVÁLIDO\n');
console.log('═'.repeat(80));
const logsDir = path.join(__dirname, 'Arqs', 'empresa_1', 'logs');

// 1. Verificar último XML gerado
console.log('\n1️⃣ VERIFICANDO ÚLTIMO XML GERADO:\n');
const xmlFiles = fs.readdirSync(logsDir).filter(f => f.startsWith('debug_xml_')).sort().reverse();
if (xmlFiles.length === 0) {
  console.log('❌ Nenhum XML encontrado!');
  process.exit(1);
}
const lastXmlFile = path.join(logsDir, xmlFiles[0]);
const xmlContent = fs.readFileSync(lastXmlFile, 'utf8');
console.log(`📄 Arquivo: ${xmlFiles[0]}`);
console.log(`📏 Tamanho: ${xmlContent.length} bytes\n`);

// 2. Verificar CNPJ no XML
console.log('2️⃣ VERIFICANDO CNPJ NO XML:\n');
const cnpjMatch = xmlContent.match(/<CNPJ>(\d+)<\/CNPJ>/);
if (cnpjMatch) {
  const cnpjXml = cnpjMatch[1];
  const cnpjCertificado = '67570036000181';
  console.log(`   CNPJ no XML: ${cnpjXml}`);
  console.log(`   CNPJ no Certificado: ${cnpjCertificado}`);
  if (cnpjXml === cnpjCertificado) {
    console.log('   ✅ CNPJs IGUAIS!\n');
  } else {
    console.log('   ❌ CNPJs DIFERENTES! ESTE É O PROBLEMA!\n');
    console.log('   💡 SOLUÇÃO: Atualizar CNPJ da empresa no banco de dados\n');
  }
} else {
  console.log('   ❌ CNPJ não encontrado no XML!\n');
}

// 3. Verificar assinatura
console.log('3️⃣ VERIFICANDO ASSINATURA:\n');
const signatureCount = (xmlContent.match(/<Signature/g) || []).length;
console.log(`   Quantidade de <Signature>: ${signatureCount}`);
if (signatureCount === 0) {
  console.log('   ❌ XML NÃO ESTÁ ASSINADO!\n');
  console.log('   💡 SOLUÇÃO: Python Signer não está funcionando\n');
} else if (signatureCount === 1) {
  console.log('   ✅ XML assinado corretamente!\n');

  // Verificar posição da assinatura
  const signaturePos = xmlContent.indexOf('<Signature');
  const infNFeEndPos = xmlContent.indexOf('</infNFe>');
  const nfeEndPos = xmlContent.indexOf('</NFe>');
  console.log(`   Posição <Signature>: ${signaturePos}`);
  console.log(`   Posição </infNFe>: ${infNFeEndPos}`);
  console.log(`   Posição </NFe>: ${nfeEndPos}\n`);
  if (signaturePos > infNFeEndPos && signaturePos < nfeEndPos) {
    console.log('   ✅ Assinatura no lugar correto (entre </infNFe> e </NFe>)!\n');
  } else {
    console.log('   ❌ Assinatura no lugar ERRADO!\n');
    console.log('   💡 SOLUÇÃO: Assinatura deve estar DEPOIS de </infNFe>\n');
  }
} else {
  console.log(`   ❌ XML tem ${signatureCount} assinaturas (esperado: 1)!\n`);
}

// 4. Verificar certificado na assinatura
console.log('4️⃣ VERIFICANDO CERTIFICADO NA ASSINATURA:\n');
const x509Match = xmlContent.match(/<X509Certificate>([^<]+)<\/X509Certificate>/);
if (x509Match) {
  const certBase64 = x509Match[1];
  console.log(`   Tamanho do certificado: ${certBase64.length} caracteres`);
  if (certBase64.length > 2000) {
    console.log('   ✅ Certificado presente e completo!\n');
  } else {
    console.log('   ❌ Certificado muito pequeno ou incompleto!\n');
  }

  // Verificar se é o certificado correto (primeiros caracteres)
  const expectedStart = 'MIIH4jCCBcqgAwIBAgIISQM5lsoRzzkw';
  if (certBase64.startsWith(expectedStart)) {
    console.log('   ✅ Certificado correto (AC SAFEWEB RFB v5)!\n');
  } else {
    console.log('   ⚠️  Certificado diferente do esperado\n');
    console.log(`   Primeiros 32 chars: ${certBase64.substring(0, 32)}\n`);
  }
} else {
  console.log('   ❌ Certificado não encontrado na assinatura!\n');
}

// 5. Verificar envelope SOAP
console.log('5️⃣ VERIFICANDO ENVELOPE SOAP:\n');
const envelopeFiles = fs.readdirSync(logsDir).filter(f => f.startsWith('debug_envelope_')).sort().reverse();
if (envelopeFiles.length > 0) {
  const lastEnvelopeFile = path.join(logsDir, envelopeFiles[0]);
  const envelopeContent = fs.readFileSync(lastEnvelopeFile, 'utf8');
  console.log(`📄 Arquivo: ${envelopeFiles[0]}`);
  console.log(`📏 Tamanho: ${envelopeContent.length} bytes\n`);

  // Verificar estrutura do envelope
  const checks = [{
    tag: '<enviNFe',
    desc: 'Tag enviNFe'
  }, {
    tag: '<idLote>',
    desc: 'ID do lote'
  }, {
    tag: '<NFe>',
    desc: 'Tag NFe'
  }, {
    tag: '<Signature',
    desc: 'Assinatura'
  }, {
    tag: 'xmlns="http://www.portalfiscal.inf.br/nfe"',
    desc: 'Namespace NFe'
  }];
  console.log('   Estrutura do envelope:');
  checks.forEach(check => {
    const presente = envelopeContent.includes(check.tag);
    console.log(`   ${presente ? '✅' : '❌'} ${check.desc}`);
  });

  // Verificar namespace duplicado
  const nfeTagMatch = envelopeContent.match(/<NFe[^>]*>/);
  if (nfeTagMatch) {
    const nfeTag = nfeTagMatch[0];
    const hasXmlns = nfeTag.includes('xmlns=');
    console.log(`\n   Tag <NFe>: ${nfeTag.substring(0, 50)}...`);
    if (hasXmlns) {
      console.log('   ⚠️  Tag <NFe> tem xmlns (pode causar duplicação!)');
      console.log('   💡 SOLUÇÃO: Remover xmlns da tag <NFe> no envelope\n');
    } else {
      console.log('   ✅ Tag <NFe> SEM xmlns (correto!)\n');
    }
  }
} else {
  console.log('   ❌ Nenhum envelope encontrado!\n');
}

// 6. Verificar algoritmo de assinatura
console.log('6️⃣ VERIFICANDO ALGORITMO DE ASSINATURA:\n');
const signatureMethodMatch = xmlContent.match(/<SignatureMethod[^>]*Algorithm="([^"]+)"/);
if (signatureMethodMatch) {
  const algorithm = signatureMethodMatch[1];
  console.log(`   Algoritmo: ${algorithm}`);
  if (algorithm.includes('rsa-sha1')) {
    console.log('   ✅ SHA-1 (correto para SEFAZ)!\n');
  } else if (algorithm.includes('rsa-sha256')) {
    console.log('   ❌ SHA-256 (SEFAZ rejeita!)');
    console.log('   💡 SOLUÇÃO: Python Signer deve usar SHA-1\n');
  } else {
    console.log(`   ⚠️  Algoritmo desconhecido: ${algorithm}\n`);
  }
} else {
  console.log('   ❌ Algoritmo de assinatura não encontrado!\n');
}

// 7. Verificar DigestMethod
console.log('7️⃣ VERIFICANDO DIGEST METHOD:\n');
const digestMethodMatch = xmlContent.match(/<DigestMethod[^>]*Algorithm="([^"]+)"/);
if (digestMethodMatch) {
  const digestAlg = digestMethodMatch[1];
  console.log(`   Algoritmo: ${digestAlg}`);
  if (digestAlg.includes('sha1')) {
    console.log('   ✅ SHA-1 (correto para SEFAZ)!\n');
  } else {
    console.log('   ❌ Algoritmo incorreto!');
    console.log('   💡 SOLUÇÃO: Deve ser SHA-1\n');
  }
} else {
  console.log('   ❌ DigestMethod não encontrado!\n');
}
console.log('═'.repeat(80));
console.log('\n📊 RESUMO DO DIAGNÓSTICO:\n');
const problemas = [];
if (!cnpjMatch || cnpjMatch[1] !== '67570036000181') {
  problemas.push('🔴 CNPJ no XML diferente do certificado');
}
if (signatureCount === 0) {
  problemas.push('🔴 XML não está assinado');
} else if (signatureCount > 1) {
  problemas.push('🔴 XML tem múltiplas assinaturas');
}
if (!x509Match || x509Match[1].length < 2000) {
  problemas.push('🔴 Certificado ausente ou incompleto na assinatura');
}
if (signatureMethodMatch && !signatureMethodMatch[1].includes('rsa-sha1')) {
  problemas.push('🔴 Algoritmo de assinatura incorreto (não é SHA-1)');
}
if (problemas.length > 0) {
  console.log('❌ PROBLEMAS ENCONTRADOS:\n');
  problemas.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p}`);
  });
} else {
  console.log('✅ NENHUM PROBLEMA ENCONTRADO NO XML!\n');
  console.log('🤔 O erro 290 pode ser:\n');
  console.log('   1. Problema de comunicação com SEFAZ');
  console.log('   2. Certificado revogado (verificar com AC)');
  console.log('   3. Problema no servidor SEFAZ (temporário)');
}
console.log('\n═'.repeat(80));
console.log('\n✅ Diagnóstico concluído!\n');