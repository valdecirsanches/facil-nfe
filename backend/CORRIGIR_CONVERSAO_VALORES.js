const fs = require('fs');
console.log('🔧 CORRIGINDO CONVERSÃO DE VALORES...\n');
let code = fs.readFileSync('nfe_service.js', 'utf8');

// Encontrar a seção det: items.map e substituir COMPLETAMENTE
const detRegex = /det: items\.map\(\(item, index\) => \(\{[\s\S]*?}\)\),/;
const newDetCode = `det: items.map((item, index) => ({
            '@_nItem': (index + 1).toString(),
            prod: {
              cProd: item.produto_id.toString(),
              cEAN: '0000000000000',
              xProd: removeAcentos(item.descricao),
              NCM: item.ncm || '84716053',
              CFOP: nfe.cfop,
              uCom: 'UN',
              qCom: parseFloat(item.quantidade || 0).toFixed(4),
              vUnCom: parseFloat(item.valor_unitario || 0).toFixed(4),
              vProd: parseFloat(item.valor_total || 0).toFixed(2),
              cEANTrib: '0000000000000',
              uTrib: 'UN',
              qTrib: parseFloat(item.quantidade || 0).toFixed(4),
              vUnTrib: parseFloat(item.valor_unitario || 0).toFixed(4),
              indTot: '1'
            },`;
code = code.replace(detRegex, newDetCode);

// Corrigir total com TODOS os campos
const totalRegex = /total: \{[\s\S]*?}\s*},/;
const newTotalCode = `total: {
            ICMSTot: {
              vBC: '0.00',
              vICMS: '0.00',
              vICMSDeson: '0.00',
              vFCP: '0.00',
              vBCST: '0.00',
              vST: '0.00',
              vFCPST: '0.00',
              vFCPSTRet: '0.00',
              vProd: parseFloat(nfe.valor_total || 0).toFixed(2),
              vFrete: '0.00',
              vSeg: '0.00',
              vDesc: '0.00',
              vII: '0.00',
              vIPI: '0.00',
              vIPIDevol: '0.00',
              vPIS: '0.00',
              vCOFINS: '0.00',
              vOutro: '0.00',
              vNF: parseFloat(nfe.valor_total || 0).toFixed(2),
              vTotTrib: '0.00'
            }
          },`;
code = code.replace(totalRegex, newTotalCode);

// Corrigir pagamento
const pagRegex = /pag: \{[\s\S]*?}\s*}/;
const newPagCode = `pag: {
            detPag: {
              indPag: '0',
              tPag: '01',
              vPag: parseFloat(nfe.valor_total || 0).toFixed(2)
            }
          }`;
code = code.replace(pagRegex, newPagCode);

// Corrigir CEP
code = code.replace(/CEP: emitente\.cep\.replace\(\/\\D\/g, ''\)(?!\.padStart)/g, "CEP: (emitente.cep || '').replace(/\\D/g, '').padStart(8, '0')");
code = code.replace(/CEP: destinatario\.cep\.replace\(\/\\D\/g, ''\)(?!\.padStart)/g, "CEP: (destinatario.cep || '').replace(/\\D/g, '').padStart(8, '0')");
fs.writeFileSync('nfe_service.js', code);
console.log('✅ CORREÇÕES APLICADAS COM SUCESSO!');
console.log('\n🔄 REINICIE O BACKEND: npm start\n');