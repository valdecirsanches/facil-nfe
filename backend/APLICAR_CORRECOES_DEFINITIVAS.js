const fs = require('fs');
console.log('🔧 APLICANDO CORREÇÕES DEFINITIVAS...\n');
const code = fs.readFileSync('nfe_service.js', 'utf8');

// Aplicar TODAS as correções de uma vez
let newCode = code;

// 1. CEP com padStart
newCode = newCode.replace(/CEP: emitente\.cep\.replace\(\/\\D\/g, ''\)(?!\.padStart)/g, "CEP: emitente.cep.replace(/\\D/g, '').padStart(8, '0')");
newCode = newCode.replace(/CEP: destinatario\.cep\.replace\(\/\\D\/g, ''\)(?!\.padStart)/g, "CEP: destinatario.cep.replace(/\\D/g, '').padStart(8, '0')");

// 2. Produtos com parseFloat e toFixed
newCode = newCode.replace(/qCom: item\.quantidade(?!\.toFixed)/g, 'qCom: parseFloat(item.quantidade).toFixed(4)');
newCode = newCode.replace(/vUnCom: item\.valor_unitario(?!\.toFixed)/g, 'vUnCom: parseFloat(item.valor_unitario).toFixed(4)');
newCode = newCode.replace(/vProd: item\.valor_total(?!\.toFixed)/g, 'vProd: parseFloat(item.valor_total).toFixed(2)');
newCode = newCode.replace(/qTrib: item\.quantidade(?!\.toFixed)/g, 'qTrib: parseFloat(item.quantidade).toFixed(4)');
newCode = newCode.replace(/vUnTrib: item\.valor_unitario(?!\.toFixed)/g, 'vUnTrib: parseFloat(item.valor_unitario).toFixed(4)');

// 3. Totais com .toFixed(2)
const totaisFields = ['vBC', 'vICMS', 'vICMSDeson', 'vFCP', 'vBCST', 'vST', 'vFCPST', 'vFCPSTRet', 'vFrete', 'vSeg', 'vDesc', 'vII', 'vIPI', 'vIPIDevol', 'vPIS', 'vCOFINS', 'vOutro'];
totaisFields.forEach(field => {
  newCode = newCode.replace(new RegExp(`${field}: '0'(?!\\.)`, 'g'), `${field}: '0.00'`);
  newCode = newCode.replace(new RegExp(`${field}: 0(?!\\.)`, 'g'), `${field}: '0.00'`);
});

// vProd e vNF com nfe.valor_total.toFixed(2)
newCode = newCode.replace(/vProd: nfe\.valor_total(?!\.toFixed)/g, 'vProd: nfe.valor_total.toFixed(2)');
newCode = newCode.replace(/vNF: nfe\.valor_total(?!\.toFixed)/g, 'vNF: nfe.valor_total.toFixed(2)');

// 4. tPag com zero à esquerda
newCode = newCode.replace(/tPag: '1'(?!,)/g, "tPag: '01'");

// 5. vPag com toFixed(2)
newCode = newCode.replace(/vPag: nfe\.valor_total(?!\.toFixed)/g, 'vPag: nfe.valor_total.toFixed(2)');
fs.writeFileSync('nfe_service.js', newCode);
console.log('✅ TODAS AS CORREÇÕES APLICADAS!');
console.log('\n🔄 Reinicie o backend: npm start\n');