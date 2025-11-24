const fs = require('fs');
const path = require('path');
console.log('🔧 APLICANDO TODAS AS CORREÇÕES NO NFE_SERVICE.JS...\n');
const filePath = path.join(__dirname, 'nfe_service.js');
let code = fs.readFileSync(filePath, 'utf8');
let mudancas = 0;

// 1. Corrigir CEP do emitente
if (code.includes("CEP: emitente.cep.replace(/\\D/g, '')")) {
  code = code.replace(/CEP: emitente\.cep\.replace\(\/\\D\/g, ''\)/g, "CEP: emitente.cep.replace(/\\D/g, '').padStart(8, '0')");
  mudancas++;
  console.log('✅ 1. CEP do emitente corrigido');
} else {
  console.log('⏭️  1. CEP do emitente já corrigido');
}

// 2. Corrigir CEP do destinatário
if (code.includes("CEP: destinatario.cep.replace(/\\D/g, '')") && !code.includes("CEP: destinatario.cep.replace(/\\D/g, '').padStart(8, '0')")) {
  code = code.replace(/CEP: destinatario\.cep\.replace\(\/\\D\/g, ''\)(?!\.padStart)/g, "CEP: destinatario.cep.replace(/\\D/g, '').padStart(8, '0')");
  mudancas++;
  console.log('✅ 2. CEP do destinatário corrigido');
} else {
  console.log('⏭️  2. CEP do destinatário já corrigido');
}

// 3. Corrigir cNF (código numérico) - deve ter 8 dígitos
if (code.includes('Math.floor(Math.random() * 100000000)')) {
  code = code.replace(/const cNF = Math\.floor\(Math\.random\(\) \* 100000000\)\.toString\(\)\.padStart\(8, '0'\);/g, "const cNF = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');");
  console.log('⏭️  3. cNF já está correto (8 dígitos)');
} else {
  console.log('⚠️  3. cNF não encontrado no formato esperado');
}

// 4. Corrigir quantidade (qCom) - deve ter 4 casas decimais
if (code.includes('qCom: item.quantidade.toFixed(4)')) {
  code = code.replace(/qCom: item\.quantidade\.toFixed\(4\)/g, 'qCom: parseFloat(item.quantidade).toFixed(4)');
  mudancas++;
  console.log('✅ 4. qCom corrigido (4 casas decimais)');
} else {
  console.log('⏭️  4. qCom já corrigido');
}

// 5. Corrigir valor unitário (vUnCom) - deve ter 4 casas decimais
if (code.includes('vUnCom: item.valor_unitario.toFixed(4)')) {
  code = code.replace(/vUnCom: item\.valor_unitario\.toFixed\(4\)/g, 'vUnCom: parseFloat(item.valor_unitario).toFixed(4)');
  mudancas++;
  console.log('✅ 5. vUnCom corrigido (4 casas decimais)');
} else {
  console.log('⏭️  5. vUnCom já corrigido');
}

// 6. Corrigir valor produto (vProd) - deve ter 2 casas decimais
if (code.includes('vProd: item.valor_total.toFixed(2)')) {
  code = code.replace(/vProd: item\.valor_total\.toFixed\(2\)/g, 'vProd: parseFloat(item.valor_total).toFixed(2)');
  mudancas++;
  console.log('✅ 6. vProd corrigido (2 casas decimais)');
} else {
  console.log('⏭️  6. vProd já corrigido');
}

// 7. Corrigir qTrib - deve ter 4 casas decimais
if (code.includes('qTrib: item.quantidade.toFixed(4)')) {
  code = code.replace(/qTrib: item\.quantidade\.toFixed\(4\)/g, 'qTrib: parseFloat(item.quantidade).toFixed(4)');
  mudancas++;
  console.log('✅ 7. qTrib corrigido (4 casas decimais)');
} else {
  console.log('⏭️  7. qTrib já corrigido');
}

// 8. Corrigir vUnTrib - deve ter 4 casas decimais
if (code.includes('vUnTrib: item.valor_unitario.toFixed(4)')) {
  code = code.replace(/vUnTrib: item\.valor_unitario\.toFixed\(4\)/g, 'vUnTrib: parseFloat(item.valor_unitario).toFixed(4)');
  mudancas++;
  console.log('✅ 8. vUnTrib corrigido (4 casas decimais)');
} else {
  console.log('⏭️  8. vUnTrib já corrigido');
}

// 9. Corrigir tipo de pagamento (tPag) - deve ser '01' não '1'
if (code.includes("tPag: '1'")) {
  code = code.replace(/tPag: '1'/g, "tPag: '01'");
  mudancas++;
  console.log('✅ 9. tPag corrigido (01 com zero à esquerda)');
} else {
  console.log('⏭️  9. tPag já corrigido');
}

// 10. Corrigir vPag - deve ter 2 casas decimais
if (code.includes('vPag: nfe.valor_total.toFixed(2)')) {
  console.log('⏭️  10. vPag já está correto');
} else if (code.includes('vPag: nfe.valor_total')) {
  code = code.replace(/vPag: nfe\.valor_total(?!\.toFixed)/g, 'vPag: nfe.valor_total.toFixed(2)');
  mudancas++;
  console.log('✅ 10. vPag corrigido (2 casas decimais)');
}

// Salvar arquivo
fs.writeFileSync(filePath, code, 'utf8');
console.log('\n' + '='.repeat(70));
console.log(`\n✅ TOTAL DE MUDANÇAS APLICADAS: ${mudancas}`);
console.log('\n🔄 AGORA REINICIE O BACKEND:');
console.log('   1. Pressione Ctrl+C para parar');
console.log('   2. Execute: npm start');
console.log('\n' + '='.repeat(70) + '\n');