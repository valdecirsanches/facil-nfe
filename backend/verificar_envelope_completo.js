const fs = require('fs');
const path = require('path');
const logsDir = path.join(__dirname, 'Arqs', 'empresa_1', 'logs');
const envelopeFiles = fs.readdirSync(logsDir).filter(f => f.startsWith('debug_envelope_')).sort().reverse();
if (envelopeFiles.length === 0) {
  console.log('❌ Nenhum envelope encontrado');
  process.exit(1);
}
const envelopePath = path.join(logsDir, envelopeFiles[0]);
const envelope = fs.readFileSync(envelopePath, 'utf8');
console.log('📦 ENVELOPE SOAP COMPLETO\n');
console.log('═'.repeat(80));
console.log(envelope);
console.log('═'.repeat(80));

// Verificações
console.log('\n📋 VERIFICAÇÕES:');
console.log(`Tem <enviNFe>: ${envelope.includes('<enviNFe') ? '✅' : '❌'}`);
console.log(`Tem <idLote>: ${envelope.includes('<idLote>') ? '✅' : '❌'}`);
console.log(`Tem <indSinc>: ${envelope.includes('<indSinc>') ? '✅' : '❌'}`);
console.log(`Tem <NFe>: ${envelope.includes('<NFe') ? '✅' : '❌'}`);
console.log(`Tem <Signature>: ${envelope.includes('<Signature') ? '✅' : '❌'}`);
console.log(`Tem xmlns NFe: ${envelope.includes('xmlns="http://www.portalfiscal.inf.br/nfe"') ? '✅' : '❌'}`);
console.log(`\n📏 Tamanho total: ${envelope.length} bytes`);