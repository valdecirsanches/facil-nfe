const fs = require('fs');
console.log('🔍 COMPARAÇÃO: SEU XML vs XML AUTORIZADO\n');
console.log('═'.repeat(70));

// XML autorizado (fornecido pelo usuário)
const xmlAutorizado = `<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
<infNFe Id="NFe35251167570036000181550010000000011426495490" versao="4.00">
<ide>
<cUF>35</cUF>
<cNF>42649549</cNF>
<natOp>Vendas de producao propria ou de terceiros</natOp>
<mod>55</mod>
<serie>1</serie>
<nNF>1</nNF>
<dhEmi>2025-11-25T12:41:12-03:00</dhEmi>
<dhSaiEnt>2025-11-25T12:41:12-03:00</dhSaiEnt>
<tpNF>1</tpNF>
<idDest>1</idDest>
<cMunFG>3534401</cMunFG>
<tpImp>1</tpImp>
<tpEmis>1</tpEmis>
<cDV>0</cDV>
<tpAmb>2</tpAmb>
<finNFe>1</finNFe>
<indFinal>1</indFinal>
<indPres>1</indPres>
<indIntermed>0</indIntermed>
<procEmi>0</procEmi>
<verProc>1.0</verProc>
</ide>`;

// Ler seu XML
const seuXmlPath = '/home/sanches/Magic/nfe/src/backend/Arqs/empresa_1/logs/debug_xml_1764079860899.xml';
const seuXml = fs.readFileSync(seuXmlPath, 'utf8');
console.log('\n📊 DIFERENÇAS CRÍTICAS ENCONTRADAS:\n');

// 1. Tag dhSaiEnt
console.log('1️⃣ TAG <dhSaiEnt>:');
if (xmlAutorizado.includes('<dhSaiEnt>')) {
  console.log('   ✅ XML Autorizado: TEM <dhSaiEnt>');
} else {
  console.log('   ❌ XML Autorizado: NÃO TEM <dhSaiEnt>');
}
if (seuXml.includes('<dhSaiEnt>')) {
  console.log('   ✅ Seu XML: TEM <dhSaiEnt>');
} else {
  console.log('   ❌ Seu XML: NÃO TEM <dhSaiEnt> ← PROBLEMA!');
}

// 2. Tag indIntermed
console.log('\n2️⃣ TAG <indIntermed>:');
if (xmlAutorizado.includes('<indIntermed>')) {
  console.log('   ✅ XML Autorizado: TEM <indIntermed>');
} else {
  console.log('   ❌ XML Autorizado: NÃO TEM <indIntermed>');
}
if (seuXml.includes('<indIntermed>')) {
  console.log('   ✅ Seu XML: TEM <indIntermed>');
} else {
  console.log('   ❌ Seu XML: NÃO TEM <indIntermed> ← PROBLEMA!');
}

// 3. Tag entrega
console.log('\n3️⃣ TAG <entrega>:');
if (xmlAutorizado.includes('<entrega>')) {
  console.log('   ✅ XML Autorizado: TEM <entrega>');
} else {
  console.log('   ❌ XML Autorizado: NÃO TEM <entrega>');
}
if (seuXml.includes('<entrega>')) {
  console.log('   ✅ Seu XML: TEM <entrega>');
} else {
  console.log('   ❌ Seu XML: NÃO TEM <entrega>');
}

// 4. Tag cobr (cobrança)
console.log('\n4️⃣ TAG <cobr>:');
if (xmlAutorizado.includes('<cobr>')) {
  console.log('   ✅ XML Autorizado: TEM <cobr>');
} else {
  console.log('   ❌ XML Autorizado: NÃO TEM <cobr>');
}
if (seuXml.includes('<cobr>')) {
  console.log('   ✅ Seu XML: TEM <cobr>');
} else {
  console.log('   ❌ Seu XML: NÃO TEM <cobr>');
}

// 5. Tag infAdic
console.log('\n5️⃣ TAG <infAdic>:');
if (xmlAutorizado.includes('<infAdic>')) {
  console.log('   ✅ XML Autorizado: TEM <infAdic>');
} else {
  console.log('   ❌ XML Autorizado: NÃO TEM <infAdic>');
}
if (seuXml.includes('<infAdic>')) {
  console.log('   ✅ Seu XML: TEM <infAdic>');
} else {
  console.log('   ❌ Seu XML: NÃO TEM <infAdic>');
}

// 6. Algoritmo de assinatura
console.log('\n6️⃣ ALGORITMO DE ASSINATURA:');
const seuAlgoritmo = seuXml.match(/SignatureMethod[^>]*Algorithm="([^"]+)"/);
const algoritmoAutorizado = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';
console.log(`   XML Autorizado: rsa-sha1 (SHA-1)`);
if (seuAlgoritmo) {
  console.log(`   Seu XML: ${seuAlgoritmo[1]}`);
  if (seuAlgoritmo[1].includes('sha256')) {
    console.log('   ⚠️  VOCÊ USA SHA-256, mas o autorizado usa SHA-1!');
  }
}

// 7. Canonicalização
console.log('\n7️⃣ CANONICALIZAÇÃO:');
const seuCanon = seuXml.match(/CanonicalizationMethod[^>]*Algorithm="([^"]+)"/);
const canonAutorizado = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';
console.log(`   XML Autorizado: ${canonAutorizado}`);
if (seuCanon) {
  console.log(`   Seu XML: ${seuCanon[1]}`);
  if (!seuCanon[1].includes('xml-c14n-20010315')) {
    console.log('   ⚠️  CANONICALIZAÇÃO DIFERENTE!');
  }
}
console.log('\n═'.repeat(70));
console.log('\n🎯 PROBLEMAS ENCONTRADOS:\n');
const problemas = [];
if (!seuXml.includes('<dhSaiEnt>')) {
  problemas.push('Falta tag <dhSaiEnt> (data/hora de saída)');
}
if (!seuXml.includes('<indIntermed>')) {
  problemas.push('Falta tag <indIntermed> (indicador de intermediador)');
}
if (seuAlgoritmo && seuAlgoritmo[1].includes('sha256')) {
  problemas.push('Assinatura usa SHA-256, mas SEFAZ aceita SHA-1 também');
}
if (seuCanon && !seuCanon[1].includes('xml-c14n-20010315')) {
  problemas.push('Canonicalização diferente do XML autorizado');
}
if (problemas.length > 0) {
  problemas.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p}`);
  });
  console.log('\n💡 SOLUÇÃO:');
  console.log('   Adicionar as tags faltantes no gerarXML():\n');
  console.log('   - <dhSaiEnt> (mesmo valor de dhEmi)');
  console.log('   - <indIntermed>0</indIntermed> (sem intermediador)\n');
} else {
  console.log('   ✅ Nenhuma diferença crítica encontrada');
}
console.log('═'.repeat(70));

// PROBLEMA 2: Código IBGE
console.log('\n\n🔧 PROBLEMA 2: CÓDIGO IBGE NÃO SALVA\n');
console.log('═'.repeat(70));
console.log('\nVou verificar o código do server.js...\n');