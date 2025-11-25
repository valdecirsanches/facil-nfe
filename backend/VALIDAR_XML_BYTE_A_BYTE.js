const fs = require('fs');
const {
  execSync
} = require('child_process');
console.log('🔍 VALIDAÇÃO BYTE-A-BYTE DO XML\n');
console.log('═'.repeat(70));

// Ler o XML mais recente
const xmlPath = '/home/sanches/Magic/nfe/src/backend/Arqs/empresa_1/logs/debug_xml_1764079860899.xml';
const xml = fs.readFileSync(xmlPath, 'utf8');
console.log('\n📋 ANÁLISE DETALHADA:\n');

// 1. Verificar se tem quebras de linha ou espaços extras
console.log('1️⃣ FORMATAÇÃO:');
if (xml.includes('\n')) {
  console.log('   ⚠️  XML tem quebras de linha (pode causar erro 225)');
  console.log(`   Total de quebras: ${(xml.match(/\n/g) || []).length}`);
} else {
  console.log('   ✅ XML sem quebras de linha');
}
if (xml.match(/>\s+</)) {
  console.log('   ⚠️  XML tem espaços entre tags');
} else {
  console.log('   ✅ XML sem espaços entre tags');
}

// 2. Verificar encoding
console.log('\n2️⃣ ENCODING:');
const hasAcentos = /[áàâãéèêíïóôõöúçñ]/i.test(xml);
if (hasAcentos) {
  console.log('   ❌ XML tem acentos (devem ser removidos!)');
  const matches = xml.match(/[áàâãéèêíïóôõöúçñ]/gi);
  console.log(`   Encontrados: ${matches?.slice(0, 10).join(', ')}`);
} else {
  console.log('   ✅ XML sem acentos');
}

// 3. Verificar tags obrigatórias do Simples Nacional
console.log('\n3️⃣ TAGS SIMPLES NACIONAL (CRT=1):');
const checks = {
  'ICMSSN102 ou ICMSSN103': xml.includes('<ICMSSN102>') || xml.includes('<ICMSSN103>'),
  'CSOSN': xml.includes('<CSOSN>'),
  'PISOutr ou PISSN': xml.includes('<PISOutr>') || xml.includes('<PISSN>'),
  'COFINSOutr ou COFINSSN': xml.includes('<COFINSOutr>') || xml.includes('<COFINSSN>'),
  'IPI com cEnq': xml.includes('<IPI>') && xml.includes('<cEnq>')
};
Object.entries(checks).forEach(([tag, existe]) => {
  console.log(`   ${existe ? '✅' : '❌'} ${tag}`);
});

// 4. Verificar valores decimais
console.log('\n4️⃣ VALORES DECIMAIS:');
const valores = {
  'vProd (2 decimais)': xml.match(/<vProd>\d+\.\d{2}<\/vProd>/),
  'vNF (2 decimais)': xml.match(/<vNF>\d+\.\d{2}<\/vNF>/),
  'qCom (4 decimais)': xml.match(/<qCom>\d+\.\d{4}<\/qCom>/),
  'vUnCom (4 decimais)': xml.match(/<vUnCom>\d+\.\d{4}<\/vUnCom>/)
};
Object.entries(valores).forEach(([campo, match]) => {
  if (match) {
    console.log(`   ✅ ${campo}: ${match[0]}`);
  } else {
    console.log(`   ❌ ${campo}: não encontrado ou formato errado`);
  }
});

// 5. Mostrar primeiros 1000 chars
console.log('\n5️⃣ INÍCIO DO XML:');
console.log(xml.substring(0, 1000));
console.log('\n[...]\n');

// 6. Validar com xmllint (se disponível)
console.log('6️⃣ VALIDAÇÃO XMLLINT:');
try {
  // Salvar XML temporário
  fs.writeFileSync('/tmp/nfe_temp.xml', xml, 'utf8');

  // Validar estrutura XML básica
  execSync('xmllint --noout /tmp/nfe_temp.xml 2>&1');
  console.log('   ✅ XML bem formado (estrutura válida)');
} catch (error) {
  console.log('   ❌ XML mal formado:');
  console.log(`   ${error.message}`);
}
console.log('\n═'.repeat(70));
console.log('\n🎯 DIAGNÓSTICO FINAL:\n');
if (hasAcentos) {
  console.log('❌ PROBLEMA ENCONTRADO: ACENTOS NO XML!');
  console.log('\n💡 SOLUÇÃO:');
  console.log('   A função removeAcentos() não está funcionando corretamente');
  console.log('   Todos os textos devem ter acentos removidos ANTES de gerar o XML\n');
} else if (xml.includes('\n')) {
  console.log('⚠️  POSSÍVEL PROBLEMA: XML com quebras de linha');
  console.log('\n💡 SOLUÇÃO:');
  console.log('   O XMLBuilder deve gerar XML em uma única linha (format: false)\n');
} else {
  console.log('🤔 XML parece estruturalmente correto');
  console.log('\n💡 PRÓXIMA AÇÃO:');
  console.log('   Vou criar um XML MÍNIMO para testar isoladamente\n');
}
console.log('═'.repeat(70));