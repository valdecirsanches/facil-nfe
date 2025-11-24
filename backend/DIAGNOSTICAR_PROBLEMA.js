const fs = require('fs');
const path = require('path');
console.log('🔍 DIAGNÓSTICO COMPLETO\n');
console.log('='.repeat(70));
const filePath = path.join(__dirname, 'nfe_service.js');
const code = fs.readFileSync(filePath, 'utf8');
console.log('\n📋 VERIFICANDO CORREÇÕES NO ARQUIVO:\n');

// Verificar cada correção
const verificacoes = [{
  nome: 'CEP Emitente',
  busca: /CEP: emitente\.cep\.replace\(\/\\D\/g, ''\)\.padStart\(8, '0'\)/,
  correto: code.match(/CEP: emitente\.cep\.replace\(\/\\D\/g, ''\)\.padStart\(8, '0'\)/) !== null
}, {
  nome: 'CEP Destinatário',
  busca: /CEP: destinatario\.cep\.replace\(\/\\D\/g, ''\)\.padStart\(8, '0'\)/,
  correto: code.match(/CEP: destinatario\.cep\.replace\(\/\\D\/g, ''\)\.padStart\(8, '0'\)/) !== null
}, {
  nome: 'qCom (quantidade)',
  busca: /qCom: parseFloat\(item\.quantidade\)\.toFixed\(4\)/,
  correto: code.match(/qCom: parseFloat\(item\.quantidade\)\.toFixed\(4\)/) !== null
}, {
  nome: 'vUnCom (valor unitário)',
  busca: /vUnCom: parseFloat\(item\.valor_unitario\)\.toFixed\(4\)/,
  correto: code.match(/vUnCom: parseFloat\(item\.valor_unitario\)\.toFixed\(4\)/) !== null
}, {
  nome: 'vProd (valor produto)',
  busca: /vProd: parseFloat\(item\.valor_total\)\.toFixed\(2\)/,
  correto: code.match(/vProd: parseFloat\(item\.valor_total\)\.toFixed\(2\)/) !== null
}, {
  nome: 'tPag (tipo pagamento)',
  busca: /tPag: '01'/,
  correto: code.match(/tPag: '01'/) !== null
}, {
  nome: 'vPag (valor pagamento)',
  busca: /vPag: nfe\.valor_total\.toFixed\(2\)/,
  correto: code.match(/vPag: nfe\.valor_total\.toFixed\(2\)/) !== null
}];
let todasCorretas = true;
verificacoes.forEach((v, i) => {
  if (v.correto) {
    console.log(`   ${i + 1}. ✅ ${v.nome}`);
  } else {
    console.log(`   ${i + 1}. ❌ ${v.nome} - FALTANDO!`);
    todasCorretas = false;
  }
});
console.log('\n' + '='.repeat(70));
if (todasCorretas) {
  console.log('\n✅ TODAS AS CORREÇÕES ESTÃO NO ARQUIVO!');
  console.log('\n❗ PROBLEMA: O backend está rodando com código antigo em memória!');
  console.log('\n🔧 SOLUÇÃO:');
  console.log('   1. Pare o backend (Ctrl+C)');
  console.log('   2. Execute: npm start');
  console.log('   3. Tente emitir a NFe novamente');
  console.log('\n💡 DICA: Use nodemon para reiniciar automaticamente:');
  console.log('   npm install -g nodemon');
  console.log('   nodemon server.js');
} else {
  console.log('\n❌ ALGUMAS CORREÇÕES ESTÃO FALTANDO!');
  console.log('\n🔧 Execute este comando para aplicar:');
  console.log('   node CORRIGIR_TUDO_AGORA.js');
}
console.log('\n' + '='.repeat(70) + '\n');