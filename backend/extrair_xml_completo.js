const fs = require('fs');
const path = require('path');
const logsDir = path.join(__dirname, 'Arqs', 'empresa_1', 'logs');
const xmlFiles = fs.readdirSync(logsDir).filter(f => f.startsWith('debug_xml_')).sort().reverse();
const xmlPath = path.join(logsDir, xmlFiles[0]);
const xml = fs.readFileSync(xmlPath, 'utf8');
console.log('📄 XML COMPLETO GERADO\n');
console.log('═'.repeat(80));
console.log(xml);
console.log('═'.repeat(80));

// Salvar em arquivo separado para análise
const outputPath = path.join(__dirname, 'ultimo_xml_gerado.xml');
fs.writeFileSync(outputPath, xml, 'utf8');
console.log(`\n✅ XML salvo em: ${outputPath}`);
console.log(`📏 Tamanho: ${xml.length} bytes`);

// Checklist rápido
console.log('\n📋 CHECKLIST RÁPIDO:');
console.log(`cEAN: ${xml.includes('<cEAN>0000000000000</cEAN>') ? '✅ 0000000000000' : '❌ Incorreto'}`);
console.log(`cEANTrib: ${xml.includes('<cEANTrib>0000000000000</cEANTrib>') ? '✅ 0000000000000' : '❌ Incorreto'}`);
console.log(`IPI CST: ${xml.includes('<CST>03</CST>') && xml.indexOf('<CST>03</CST>') > xml.indexOf('<IPI>') ? '✅ 03' : '❌ Incorreto'}`);
console.log(`SignedInfo: ${xml.includes('<SignedInfo') ? '✅ Presente' : '❌ AUSENTE'}`);
console.log(`Signature: ${xml.includes('<Signature') ? '✅ Presente' : '❌ AUSENTE'}`);