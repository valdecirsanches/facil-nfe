const fs = require('fs');
console.log('🔍 ANÁLISE DO ENVELOPE SOAP\n');
console.log('═'.repeat(70));
const envelopePath = '/home/sanches/Magic/nfe/src/backend/Arqs/empresa_1/logs/debug_envelope_1764079860899.xml';
if (!fs.existsSync(envelopePath)) {
  console.log('❌ Envelope não encontrado');
  process.exit(1);
}
const envelope = fs.readFileSync(envelopePath, 'utf8');
console.log('\n1️⃣ VERIFICANDO NAMESPACE NO ENVELOPE:\n');

// Procurar por xmlns duplicado
const xmlnsMatches = envelope.match(/<[^>]*xmlns="http:\/\/www\.portalfiscal\.inf\.br\/nfe"[^>]*>/g);
if (xmlnsMatches) {
  console.log(`📊 Namespace NFe aparece ${xmlnsMatches.length} vez(es):\n`);
  xmlnsMatches.forEach((match, i) => {
    console.log(`   ${i + 1}. ${match.substring(0, 100)}...`);
  });
  if (xmlnsMatches.length > 2) {
    console.log('\n❌ PROBLEMA ENCONTRADO: Namespace DUPLICADO!');
    console.log('   O namespace aparece em:');
    console.log('   - Tag <enviNFe> (correto)');
    console.log('   - Tag <NFe> (INCORRETO - causa erro 225!)');
    console.log('\n💡 SOLUÇÃO:');
    console.log('   Remover xmlns da tag <NFe> dentro do envelope');
    console.log('   A tag <NFe> NÃO deve ter xmlns quando está dentro de <enviNFe>\n');
  }
}
console.log('\n═'.repeat(70));
console.log('\n2️⃣ ESTRUTURA DO ENVELOPE:\n');

// Verificar estrutura
const checks = {
  'soap12:Envelope': envelope.includes('soap12:Envelope'),
  'soap12:Body': envelope.includes('soap12:Body'),
  'nfeDadosMsg': envelope.includes('nfeDadosMsg'),
  'enviNFe xmlns=': envelope.includes('<enviNFe xmlns='),
  'NFe xmlns=': envelope.includes('<NFe xmlns='),
  'idLote': envelope.includes('<idLote>'),
  'indSinc': envelope.includes('<indSinc>')
};
Object.entries(checks).forEach(([tag, existe]) => {
  console.log(`   ${existe ? '✅' : '❌'} ${tag}`);
});
console.log('\n═'.repeat(70));
console.log('\n3️⃣ TRECHO DO ENVELOPE (enviNFe e NFe):\n');

// Extrair trecho relevante
const enviNFeMatch = envelope.match(/<enviNFe[^>]*>.*?<NFe[^>]*>/s);
if (enviNFeMatch) {
  console.log(enviNFeMatch[0]);
}
console.log('\n═'.repeat(70));
console.log('\n4️⃣ DIAGNÓSTICO:\n');
if (envelope.includes('<enviNFe xmlns=') && envelope.includes('<NFe xmlns=')) {
  console.log('❌ PROBLEMA CONFIRMADO: Namespace duplicado!');
  console.log('\n📋 ESTRUTURA ATUAL (ERRADA):');
  console.log('   <enviNFe xmlns="http://www.portalfiscal.inf.br/nfe">');
  console.log('     <NFe xmlns="http://www.portalfiscal.inf.br/nfe">  ← REMOVER!');
  console.log('       ...');
  console.log('     </NFe>');
  console.log('   </enviNFe>');
  console.log('\n📋 ESTRUTURA CORRETA:');
  console.log('   <enviNFe xmlns="http://www.portalfiscal.inf.br/nfe">');
  console.log('     <NFe>  ← SEM xmlns!');
  console.log('       ...');
  console.log('     </NFe>');
  console.log('   </enviNFe>');
  console.log('\n💡 CAUSA:');
  console.log('   O XMLBuilder está adicionando xmlns na tag <NFe>');
  console.log('   Mas quando <NFe> está dentro de <enviNFe>, ela herda o namespace');
  console.log('   Namespace duplicado causa erro 225 na SEFAZ!');
  console.log('\n🔧 SOLUÇÃO:');
  console.log('   Modificar nfe_service.js para remover xmlns da tag <NFe>');
  console.log('   antes de inserir no envelope SOAP\n');
} else {
  console.log('✅ Estrutura parece correta');
  console.log('   Verifique outros possíveis problemas\n');
}
console.log('═'.repeat(70));