const fs = require('fs');
const {
  execSync
} = require('child_process');
console.log('🔧 RESTAURANDO E CORRIGINDO NFE_SERVICE.JS...\n');

// Tentar restaurar do git
try {
  console.log('📦 Tentando restaurar do git...');
  execSync('git checkout nfe_service.js', {
    stdio: 'inherit'
  });
  console.log('✅ Arquivo restaurado do git!\n');
} catch (error) {
  console.log('⚠️  Git não disponível, continuando com arquivo atual...\n');
}

// Ler arquivo
let code = fs.readFileSync('nfe_service.js', 'utf8');
console.log('🔧 Aplicando correções...\n');

// 1. CEP com padStart - SIMPLES E DIRETO
code = code.replace(/CEP: emitente\.cep\.replace\(\/\\D\/g, ''\),/g, "CEP: emitente.cep.replace(/\\D/g, '').padStart(8, '0'),");
code = code.replace(/CEP: destinatario\.cep\.replace\(\/\\D\/g, ''\),/g, "CEP: destinatario.cep.replace(/\\D/g, '').padStart(8, '0'),");

// 2. Produtos - linha por linha
code = code.replace(/qCom: item\.quantidade,/g, 'qCom: parseFloat(item.quantidade).toFixed(4),');
code = code.replace(/vUnCom: item\.valor_unitario,/g, 'vUnCom: parseFloat(item.valor_unitario).toFixed(4),');
code = code.replace(/vProd: item\.valor_total,/g, 'vProd: parseFloat(item.valor_total).toFixed(2),');
code = code.replace(/qTrib: item\.quantidade,/g, 'qTrib: parseFloat(item.quantidade).toFixed(4),');
code = code.replace(/vUnTrib: item\.valor_unitario,/g, 'vUnTrib: parseFloat(item.valor_unitario).toFixed(4),');

// 3. Totais - todos os campos zerados
const camposZero = ['vBC', 'vICMS', 'vICMSDeson', 'vFCP', 'vBCST', 'vST', 'vFCPST', 'vFCPSTRet', 'vFrete', 'vSeg', 'vDesc', 'vII', 'vIPI', 'vIPIDevol', 'vPIS', 'vCOFINS', 'vOutro'];
camposZero.forEach(campo => {
  code = code.replace(new RegExp(`${campo}: '0',`, 'g'), `${campo}: '0.00',`);
});

// vProd e vNF com toFixed
code = code.replace(/vProd: nfe\.valor_total,/g, 'vProd: nfe.valor_total.toFixed(2),');
code = code.replace(/vNF: nfe\.valor_total,/g, 'vNF: nfe.valor_total.toFixed(2),');

// 4. Pagamento
code = code.replace(/tPag: '1',/g, "tPag: '01',");
code = code.replace(/vPag: nfe\.valor_total$/gm, 'vPag: nfe.valor_total.toFixed(2)');
code = code.replace(/vPag: nfe\.valor_total\s*}/g, 'vPag: nfe.valor_total.toFixed(2)\n            }');

// Salvar
fs.writeFileSync('nfe_service.js', code);
console.log('✅ CORREÇÕES APLICADAS!\n');
console.log('🔄 Reinicie o backend: npm start\n');