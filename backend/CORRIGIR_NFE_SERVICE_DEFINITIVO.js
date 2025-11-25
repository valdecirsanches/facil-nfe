const fs = require('fs');
const path = require('path');
console.log('🔧 CORREÇÃO DEFINITIVA DO NFE_SERVICE.JS\n');
console.log('═'.repeat(70));
const nfeServicePath = path.join(__dirname, 'nfe_service.js');

// Ler arquivo
let content = fs.readFileSync(nfeServicePath, 'utf8');
console.log('\n1️⃣ REMOVENDO @_xmlns DA TAG NFe:\n');

// Procurar e remover a linha '@_xmlns'
const antes = content;
content = content.replace(/NFe:\s*\{[\s\n]*'@_xmlns':\s*'http:\/\/www\.portalfiscal\.inf\.br\/nfe',?[\s\n]*/, 'NFe: {\n        ');
if (content !== antes) {
  console.log('✅ Linha @_xmlns removida com sucesso!');
} else {
  console.log('⚠️  Linha @_xmlns não encontrada (pode já estar correta)');
}

// Salvar arquivo
fs.writeFileSync(nfeServicePath, content, 'utf8');
console.log('\n2️⃣ ARQUIVO SALVO!\n');
console.log('═'.repeat(70));
console.log('\n✅ CORREÇÃO APLICADA COM SUCESSO!\n');
console.log('📋 PRÓXIMOS PASSOS:\n');
console.log('   1. Reinicie o backend: pkill -9 node && npm start');
console.log('   2. Emita uma nova NFe');
console.log('   3. Verifique os logs - deve mostrar:');
console.log('      "🔧 Namespace removido da tag <NFe>"');
console.log('      "❌ NFe xmlns=" deve estar AUSENTE\n');
console.log('═'.repeat(70));