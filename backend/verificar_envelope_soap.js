const fs = require('fs');
const path = require('path');
console.log('🔍 VERIFICANDO ENVELOPE SOAP\n');
console.log('═'.repeat(70));

// Buscar envelope mais recente
const logsDir = path.join(__dirname, 'Arqs', 'empresa_1', 'logs');
const arquivos = fs.readdirSync(logsDir).filter(f => f.startsWith('debug_envelope_')).sort().reverse();
if (arquivos.length === 0) {
  console.log('❌ Nenhum arquivo de envelope encontrado!');
  process.exit(1);
}
const envelopePath = path.join(logsDir, arquivos[0]);
const envelope = fs.readFileSync(envelopePath, 'utf8');
console.log(`\n📄 Arquivo: ${arquivos[0]}\n`);
console.log('═'.repeat(70));

// Mostrar primeiros 2000 caracteres
console.log('\n📋 ENVELOPE COMPLETO (início):\n');
console.log(envelope.substring(0, 2000));
console.log('\n...\n');

// Verificar estrutura
console.log('🔍 VERIFICANDO ESTRUTURA:\n');
const checks = {
  'Declaração XML': envelope.startsWith('<?xml'),
  'Tag soap12:Envelope': envelope.includes('<soap12:Envelope'),
  'Tag soap12:Body': envelope.includes('<soap12:Body'),
  'Tag nfeDadosMsg': envelope.includes('<nfeDadosMsg'),
  'Tag enviNFe': envelope.includes('<enviNFe'),
  'Namespace enviNFe': envelope.includes('xmlns="http://www.portalfiscal.inf.br/nfe"'),
  'Tag idLote': envelope.includes('<idLote>'),
  'Tag indSinc': envelope.includes('<indSinc>'),
  'Tag NFe': envelope.includes('<NFe'),
  'Tag Signature': envelope.includes('<Signature')
};
Object.entries(checks).forEach(([nome, ok]) => {
  console.log(`   ${ok ? '✅' : '❌'} ${nome}`);
});

// Verificar namespace duplicado
console.log('\n🔍 VERIFICANDO NAMESPACES:\n');
const enviNFeMatch = envelope.match(/<enviNFe[^>]*>/);
const nfeMatch = envelope.match(/<NFe[^>]*>/);
if (enviNFeMatch) {
  console.log('Tag <enviNFe>:');
  console.log(`   ${enviNFeMatch[0]}`);
}
if (nfeMatch) {
  console.log('\nTag <NFe>:');
  console.log(`   ${nfeMatch[0]}`);
}

// Verificar se namespace está duplicado
if (enviNFeMatch && nfeMatch) {
  const enviNFeTemNS = enviNFeMatch[0].includes('xmlns=');
  const nfeTemNS = nfeMatch[0].includes('xmlns=');
  if (enviNFeTemNS && nfeTemNS) {
    console.log('\n❌ PROBLEMA ENCONTRADO!');
    console.log('   Namespace xmlns="http://www.portalfiscal.inf.br/nfe" está declarado');
    console.log('   TANTO em <enviNFe> QUANTO em <NFe>!');
    console.log('\n   Isso causa erro 225 porque o schema não aceita namespace duplicado.');
    console.log('\n💡 SOLUÇÃO:');
    console.log('   O namespace deve estar APENAS em <enviNFe>, não em <NFe>');
  } else if (!enviNFeTemNS) {
    console.log('\n❌ PROBLEMA: <enviNFe> sem namespace!');
  } else {
    console.log('\n✅ Namespaces corretos');
  }
}
console.log('\n═'.repeat(70));