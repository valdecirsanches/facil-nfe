const fs = require('fs');
const path = require('path');
const logsDir = path.join(__dirname, 'Arqs', 'empresa_1', 'logs');
const xmlFiles = fs.readdirSync(logsDir).filter(f => f.startsWith('debug_xml_')).sort().reverse();
const xmlPath = path.join(logsDir, xmlFiles[0]);
const xml = fs.readFileSync(xmlPath, 'utf8');

// Extrair dhEmi
const dhEmiMatch = xml.match(/<dhEmi>(.*?)<\/dhEmi>/);
console.log('🔍 DEBUG dhEmi\n');
console.log('═'.repeat(60));
if (dhEmiMatch) {
  const dhEmi = dhEmiMatch[1];
  console.log(`\n📅 dhEmi encontrado: "${dhEmi}"`);
  console.log(`📏 Tamanho: ${dhEmi.length} caracteres`);

  // Verificar formato
  const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?[+-]\d{2}:\d{2}$/;
  if (regex.test(dhEmi)) {
    console.log('✅ Formato CORRETO!');
  } else {
    console.log('❌ Formato INCORRETO!');
    console.log('\n📋 Formato esperado:');
    console.log('   2025-11-24T10:00:00-03:00  (sem milissegundos)');
    console.log('   2025-11-24T10:00:00.000-03:00  (com milissegundos)');

    // Analisar o que está errado
    if (dhEmi.includes('.')) {
      const parts = dhEmi.split('.');
      console.log(`\n⚠️  Contém ponto decimal`);
      console.log(`   Parte antes do ponto: "${parts[0]}"`);
      console.log(`   Parte depois do ponto: "${parts[1]}"`);
      const millis = parts[1].match(/^\d+/);
      if (millis) {
        console.log(`   Milissegundos: ${millis[0].length} dígitos (deve ser 3)`);
      }
    }
    if (!dhEmi.match(/[+-]\d{2}:\d{2}$/)) {
      console.log(`\n⚠️  Timezone incorreto ou ausente`);
      console.log(`   Deve terminar com: +HH:MM ou -HH:MM`);
      console.log(`   Exemplo: -03:00`);
    }
  }
} else {
  console.log('❌ dhEmi não encontrado no XML!');
}
console.log('\n═'.repeat(60));