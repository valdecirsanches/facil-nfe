const fs = require('fs');
const path = require('path');
console.log('🔍 ANÁLISE DETALHADA - ERRO 225\n');
console.log('═'.repeat(70));

// Buscar o XML mais recente nos logs
const logsDir = path.join(__dirname, 'Arqs', 'empresa_1', 'logs');
if (!fs.existsSync(logsDir)) {
  console.log('❌ Pasta de logs não encontrada!');
  process.exit(1);
}
const arquivos = fs.readdirSync(logsDir).filter(f => f.startsWith('debug_xml_')).sort().reverse();
if (arquivos.length === 0) {
  console.log('❌ Nenhum XML de debug encontrado!');
  console.log('   Execute o teste de emissão primeiro.\n');
  process.exit(1);
}
const xmlPath = path.join(logsDir, arquivos[0]);
console.log(`📄 Analisando: ${arquivos[0]}\n`);
const xml = fs.readFileSync(xmlPath, 'utf8');
console.log('═'.repeat(70));
console.log('\n🔍 VERIFICAÇÕES DETALHADAS:\n');

// 1. Verificar estrutura básica
console.log('1️⃣  ESTRUTURA BÁSICA:\n');
const checks = {
  'Declaração XML': xml.startsWith('<?xml') || xml.startsWith('<NFe'),
  'Tag <NFe>': xml.includes('<NFe'),
  'Namespace correto': xml.includes('xmlns="http://www.portalfiscal.inf.br/nfe"'),
  'Tag <infNFe>': xml.includes('<infNFe'),
  'Atributo Id': xml.includes('Id="NFe'),
  'Versão 4.00': xml.includes('versao="4.00"'),
  'Tag </NFe>': xml.includes('</NFe>')
};
Object.entries(checks).forEach(([nome, ok]) => {
  console.log(`   ${ok ? '✅' : '❌'} ${nome}`);
});

// 2. Verificar tags obrigatórias
console.log('\n2️⃣  TAGS OBRIGATÓRIAS:\n');
const tagsObrigatorias = ['ide', 'emit', 'dest', 'det', 'prod', 'imposto', 'ICMS', 'IPI', 'PIS', 'COFINS', 'total', 'ICMSTot', 'transp', 'pag', 'detPag'];
tagsObrigatorias.forEach(tag => {
  const tem = xml.includes(`<${tag}`);
  console.log(`   ${tem ? '✅' : '❌'} <${tag}>`);
});

// 3. Verificar valores problemáticos
console.log('\n3️⃣  VALORES PROBLEMÁTICOS:\n');
const problemas = [];
if (xml.includes('NaN')) {
  problemas.push('❌ Contém valores NaN');
  console.log('   ❌ XML contém valores NaN (Not a Number)');
}
if (xml.includes('undefined')) {
  problemas.push('❌ Contém "undefined"');
  console.log('   ❌ XML contém valores "undefined"');
}
if (xml.includes('null')) {
  problemas.push('❌ Contém "null"');
  console.log('   ❌ XML contém valores "null"');
}
if (xml.includes('SEM GTIN')) {
  problemas.push('❌ EAN com "SEM GTIN"');
  console.log('   ❌ EAN com "SEM GTIN" (use 0000000000000)');
}

// Verificar CST do IPI
const cstIpiMatch = xml.match(/<IPI>[\s\S]*?<CST>(\d+)<\/CST>/);
if (cstIpiMatch) {
  const cst = cstIpiMatch[1];
  if (cst === '53') {
    problemas.push('❌ IPI CST 53 inválido');
    console.log('   ❌ IPI com CST 53 (não existe, use 51)');
  } else {
    console.log(`   ✅ IPI CST: ${cst}`);
  }
}

// Verificar série
const serieMatch = xml.match(/<serie>(\d+)<\/serie>/);
if (serieMatch) {
  const serie = serieMatch[1];
  if (parseInt(serie) > 999) {
    problemas.push(`❌ Série inválida: ${serie}`);
    console.log(`   ❌ Série ${serie} (deve ser ≤ 999)`);
  } else {
    console.log(`   ✅ Série: ${serie}`);
  }
}
if (problemas.length === 0) {
  console.log('   ✅ Nenhum valor problemático encontrado');
}

// 4. Verificar ordem das tags de impostos
console.log('\n4️⃣  ORDEM DOS IMPOSTOS:\n');
const impostoMatch = xml.match(/<imposto>([\s\S]*?)<\/imposto>/);
if (impostoMatch) {
  const impostoXml = impostoMatch[1];
  const tags = [];
  if (impostoXml.includes('<ICMS>')) tags.push('ICMS');
  if (impostoXml.includes('<IPI>')) tags.push('IPI');
  if (impostoXml.includes('<II>')) tags.push('II');
  if (impostoXml.includes('<ISSQN>')) tags.push('ISSQN');
  if (impostoXml.includes('<PIS>')) tags.push('PIS');
  if (impostoXml.includes('<PISST>')) tags.push('PISST');
  if (impostoXml.includes('<COFINS>')) tags.push('COFINS');
  if (impostoXml.includes('<COFINSST>')) tags.push('COFINSST');
  console.log(`   Ordem encontrada: ${tags.join(' → ')}`);
  const ordemCorreta = ['ICMS', 'IPI', 'II', 'ISSQN', 'PIS', 'PISST', 'COFINS', 'COFINSST'];
  const ordemAtual = tags.filter(t => ordemCorreta.includes(t));
  let ordemOk = true;
  for (let i = 1; i < ordemAtual.length; i++) {
    const idxAnterior = ordemCorreta.indexOf(ordemAtual[i - 1]);
    const idxAtual = ordemCorreta.indexOf(ordemAtual[i]);
    if (idxAtual < idxAnterior) {
      ordemOk = false;
      break;
    }
  }
  if (ordemOk) {
    console.log('   ✅ Ordem correta');
  } else {
    problemas.push('❌ Ordem dos impostos incorreta');
    console.log('   ❌ Ordem incorreta!');
    console.log(`   Esperado: ICMS → IPI → PIS → COFINS`);
  }
}

// 5. Verificar namespace da assinatura
console.log('\n5️⃣  ASSINATURA DIGITAL:\n');
if (xml.includes('<Signature')) {
  console.log('   ✅ Tag <Signature> presente');
  if (xml.includes('xmlns="http://www.w3.org/2000/09/xmldsig#"')) {
    console.log('   ✅ Namespace correto');
  } else {
    problemas.push('❌ Namespace da assinatura incorreto');
    console.log('   ❌ Namespace incorreto');
  }
  if (xml.includes('xml-exc-c14n#')) {
    console.log('   ✅ Canonicalização Exclusiva');
  } else if (xml.includes('xml-c14n-20010315')) {
    problemas.push('❌ Canonicalização incorreta');
    console.log('   ❌ Canonicalização incorreta (use xml-exc-c14n#)');
  }
  if (xml.includes('rsa-sha256')) {
    console.log('   ✅ Algoritmo SHA-256');
  }
} else {
  problemas.push('❌ Assinatura ausente');
  console.log('   ❌ Assinatura ausente');
}

// 6. Verificar posição da assinatura
console.log('\n6️⃣  POSIÇÃO DA ASSINATURA:\n');
const posInfNFeFim = xml.indexOf('</infNFe>');
const posSignature = xml.indexOf('<Signature');
const posNFeFim = xml.indexOf('</NFe>');
if (posInfNFeFim > 0 && posSignature > 0 && posNFeFim > 0) {
  if (posInfNFeFim < posSignature && posSignature < posNFeFim) {
    console.log('   ✅ Posição correta: </infNFe> → <Signature> → </NFe>');
  } else {
    problemas.push('❌ Posição da assinatura incorreta');
    console.log('   ❌ Posição incorreta!');
    console.log(`   </infNFe>: ${posInfNFeFim}`);
    console.log(`   <Signature>: ${posSignature}`);
    console.log(`   </NFe>: ${posNFeFim}`);
  }
}

// 7. Extrair e mostrar trechos problemáticos
console.log('\n7️⃣  ANÁLISE DE CONTEÚDO:\n');

// Mostrar tag <pag>
const pagMatch = xml.match(/<pag>([\s\S]*?)<\/pag>/);
if (pagMatch) {
  console.log('   ✅ Tag <pag> encontrada:');
  console.log('   ' + pagMatch[0].replace(/\n/g, '\n   '));
} else {
  problemas.push('❌ Tag <pag> ausente');
  console.log('   ❌ Tag <pag> ausente (obrigatória)');
}

// Mostrar vTotTrib
if (xml.includes('<vTotTrib>')) {
  const vTotTribMatch = xml.match(/<vTotTrib>(.*?)<\/vTotTrib>/);
  if (vTotTribMatch) {
    console.log(`\n   ✅ <vTotTrib>: ${vTotTribMatch[1]}`);
  }
} else {
  problemas.push('❌ Tag <vTotTrib> ausente');
  console.log('\n   ❌ Tag <vTotTrib> ausente (obrigatória)');
}

// RESUMO FINAL
console.log('\n' + '═'.repeat(70));
console.log('\n📋 RESUMO:\n');
if (problemas.length === 0) {
  console.log('✅ NENHUM PROBLEMA ÓBVIO ENCONTRADO!\n');
  console.log('O erro 225 pode ser causado por:');
  console.log('   1. Problema sutil no formato de algum campo');
  console.log('   2. Valor numérico com formato incorreto');
  console.log('   3. Data/hora em formato inválido');
  console.log('   4. Algum campo obrigatório faltando\n');
  console.log('💡 Recomendação:');
  console.log('   - Valide o XML em: https://www.nfe.fazenda.gov.br/portal/principal.aspx');
  console.log('   - Use o validador de schema oficial da SEFAZ\n');
} else {
  console.log('❌ PROBLEMAS ENCONTRADOS:\n');
  problemas.forEach((p, i) => console.log(`   ${i + 1}. ${p}`));
  console.log('\n💡 CORRIJA ESTES PROBLEMAS E TENTE NOVAMENTE.\n');
}

// Salvar XML formatado para análise
const xmlFormatado = xml.replace(/></g, '>\n<').split('\n').map(line => {
  const depth = (line.match(/^<[^\/]/g) || []).length - (line.match(/<\//g) || []).length;
  return '  '.repeat(Math.max(0, depth)) + line;
}).join('\n');
const xmlFormatadoPath = './xml_formatado_analise.xml';
fs.writeFileSync(xmlFormatadoPath, xmlFormatado, 'utf8');
console.log(`📄 XML formatado salvo em: ${xmlFormatadoPath}`);
console.log('   Abra este arquivo para análise visual detalhada.\n');
console.log('═'.repeat(70));