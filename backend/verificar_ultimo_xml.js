const fs = require('fs');
const path = require('path');
const logsDir = path.join(__dirname, 'Arqs', 'empresa_1', 'logs');
const xmlFiles = fs.readdirSync(logsDir).filter(f => f.startsWith('debug_xml_')).sort().reverse();
const xmlPath = path.join(logsDir, xmlFiles[0]);
const xml = fs.readFileSync(xmlPath, 'utf8');
console.log('🔍 VERIFICANDO ÚLTIMO XML GERADO\n');
console.log('═'.repeat(60));
console.log(`\n📄 Arquivo: ${xmlFiles[0]}\n`);

// Extrair campos críticos
const extrair = campo => {
  const regex = new RegExp(`<${campo}>(.*?)</${campo}>`, 'g');
  const matches = [...xml.matchAll(regex)];
  return matches.map(m => m[1]);
};
console.log('📊 CAMPOS CRÍTICOS:\n');
console.log('1️⃣ NCM:');
const ncms = extrair('NCM');
ncms.forEach((ncm, i) => {
  console.log(`   Item ${i + 1}: "${ncm}" (${ncm.length} dígitos)`);
  if (ncm === '00000000') {
    console.log('   ❌ NCM ZERADO - ERRO!');
  } else if (ncm.length !== 8) {
    console.log(`   ❌ NCM deve ter 8 dígitos!`);
  } else {
    console.log('   ✅ NCM OK');
  }
});
console.log('\n2️⃣ verProc:');
const verProc = extrair('verProc')[0];
console.log(`   "${verProc}"`);
if (verProc === '1.0') {
  console.log('   ✅ verProc OK');
} else {
  console.log(`   ⚠️  verProc deveria ser "1.0"`);
}
console.log('\n3️⃣ IPI:');
if (xml.includes('<IPI>')) {
  console.log('   ✅ Tag IPI presente');
  if (xml.includes('<cEnq>999</cEnq>')) {
    console.log('   ✅ cEnq presente');
  } else {
    console.log('   ❌ cEnq ausente');
  }
  if (xml.includes('<IPINT>')) {
    console.log('   ✅ IPINT presente');
  } else {
    console.log('   ❌ IPINT ausente');
  }
} else {
  console.log('   ❌ Tag IPI AUSENTE!');
}
console.log('\n4️⃣ PIS/COFINS:');
if (xml.includes('<PISNT>')) {
  console.log('   ✅ PISNT presente');
} else if (xml.includes('<PISAliq>')) {
  console.log('   ❌ Usando PISAliq (deveria ser PISNT)');
}
if (xml.includes('<COFINSNT>')) {
  console.log('   ✅ COFINSNT presente');
} else if (xml.includes('<COFINSAliq>')) {
  console.log('   ❌ Usando COFINSAliq (deveria ser COFINSNT)');
}
console.log('\n5️⃣ Estrutura de impostos:');
const impostoMatch = xml.match(/<imposto>(.*?)<\/imposto>/s);
if (impostoMatch) {
  const imposto = impostoMatch[1];
  console.log('   Ordem das tags:');
  const tags = imposto.match(/<([A-Z]+)>/g);
  if (tags) {
    tags.forEach(tag => console.log(`   - ${tag}`));
  }

  // Verificar ordem correta: ICMS -> IPI -> PIS -> COFINS
  const ordemCorreta = ['<ICMS>', '<IPI>', '<PIS>', '<COFINS>'];
  const ordemAtual = tags.filter(t => ordemCorreta.includes(t));
  if (JSON.stringify(ordemAtual) === JSON.stringify(ordemCorreta)) {
    console.log('   ✅ Ordem correta');
  } else {
    console.log('   ❌ Ordem incorreta!');
    console.log(`   Esperado: ${ordemCorreta.join(' -> ')}`);
    console.log(`   Atual: ${ordemAtual.join(' -> ')}`);
  }
}
console.log('\n═'.repeat(60));
console.log('\n💡 XML COMPLETO (primeiros 2000 chars):\n');
console.log(xml.substring(0, 2000));
console.log('\n...\n');