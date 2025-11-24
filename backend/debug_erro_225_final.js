const fs = require('fs');
const path = require('path');
console.log('🔍 DEBUG FINAL - ERRO 225\n');
console.log('═'.repeat(70));

// Buscar XML mais recente
const logsDir = path.join(__dirname, 'Arqs', 'empresa_1', 'logs');
const arquivos = fs.readdirSync(logsDir).filter(f => f.startsWith('debug_xml_')).sort().reverse();
if (arquivos.length === 0) {
  console.log('❌ Nenhum XML encontrado!');
  process.exit(1);
}
const xmlPath = path.join(logsDir, arquivos[0]);
const xml = fs.readFileSync(xmlPath, 'utf8');
console.log(`📄 Analisando: ${arquivos[0]}\n`);
console.log('═'.repeat(70));

// Extrair e analisar cada campo crítico
console.log('\n🔍 ANÁLISE CAMPO POR CAMPO:\n');

// 1. Código do Município
const cMunMatches = [...xml.matchAll(/<cMun>(\d+)<\/cMun>/g)];
console.log('🏙️  CÓDIGOS DE MUNICÍPIO:');
cMunMatches.forEach((match, i) => {
  const cMun = match[1];
  const contexto = xml.substring(Math.max(0, match.index - 100), match.index + 100);
  const isEmit = contexto.includes('<emit>');
  const isDest = contexto.includes('<dest>');
  const isIde = contexto.includes('<ide>');
  console.log(`   ${i + 1}. cMun: ${cMun} (${cMun.length} dígitos)`);
  if (isEmit) console.log('      Contexto: Emitente');
  if (isDest) console.log('      Contexto: Destinatário');
  if (isIde) console.log('      Contexto: IDE (cMunFG)');
  if (cMun.length !== 7) {
    console.log(`      ❌ ERRO: Deve ter 7 dígitos!`);
  } else {
    console.log(`      ✅ OK`);
  }
});

// 2. Verificar xMun vs cMun
console.log('\n🏙️  VALIDAÇÃO MUNICÍPIO:');
const xMunEmitMatch = xml.match(/<emit>[\s\S]*?<xMun>(.*?)<\/xMun>/);
const cMunEmitMatch = xml.match(/<emit>[\s\S]*?<cMun>(\d+)<\/cMun>/);
if (xMunEmitMatch && cMunEmitMatch) {
  console.log(`   Emitente:`);
  console.log(`   - xMun: ${xMunEmitMatch[1]}`);
  console.log(`   - cMun: ${cMunEmitMatch[1]}`);

  // Validar se o código corresponde ao município
  const municipios = {
    '3534401': 'Osasco',
    '3550308': 'São Paulo'
  };
  const cidadeEsperada = municipios[cMunEmitMatch[1]];
  if (cidadeEsperada && xMunEmitMatch[1] !== cidadeEsperada) {
    console.log(`   ❌ ERRO: cMun ${cMunEmitMatch[1]} corresponde a "${cidadeEsperada}", mas xMun é "${xMunEmitMatch[1]}"`);
  } else {
    console.log(`   ✅ Município correto`);
  }
}
const xMunDestMatch = xml.match(/<dest>[\s\S]*?<xMun>(.*?)<\/xMun>/);
const cMunDestMatch = xml.match(/<dest>[\s\S]*?<cMun>(\d+)<\/cMun>/);
if (xMunDestMatch && cMunDestMatch) {
  console.log(`\n   Destinatário:`);
  console.log(`   - xMun: ${xMunDestMatch[1]}`);
  console.log(`   - cMun: ${cMunDestMatch[1]}`);
  const municipios = {
    '3534401': 'Osasco',
    '3550308': 'São Paulo'
  };
  const cidadeEsperada = municipios[cMunDestMatch[1]];
  if (cidadeEsperada && xMunDestMatch[1] !== cidadeEsperada) {
    console.log(`   ❌ ERRO: cMun ${cMunDestMatch[1]} corresponde a "${cidadeEsperada}", mas xMun é "${xMunDestMatch[1]}"`);
  } else {
    console.log(`   ✅ Município correto`);
  }
}

// 3. Verificar todos os valores numéricos
console.log('\n💰 VALORES NUMÉRICOS:');
const valoresNumericos = [{
  tag: 'qCom',
  esperado: /^\d+\.\d{4}$/
}, {
  tag: 'vUnCom',
  esperado: /^\d+\.\d{4}$/
}, {
  tag: 'vProd',
  esperado: /^\d+\.\d{2}$/
}, {
  tag: 'qTrib',
  esperado: /^\d+\.\d{4}$/
}, {
  tag: 'vUnTrib',
  esperado: /^\d+\.\d{4}$/
}, {
  tag: 'vNF',
  esperado: /^\d+\.\d{2}$/
}, {
  tag: 'vPag',
  esperado: /^\d+\.\d{2}$/
}];
valoresNumericos.forEach(({
  tag,
  esperado
}) => {
  const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`, 'g');
  const matches = [...xml.matchAll(regex)];
  matches.forEach(match => {
    const valor = match[1];
    if (!esperado.test(valor)) {
      console.log(`   ❌ <${tag}>: ${valor} (formato incorreto)`);
    }
  });
});
console.log('   ✅ Verificação de valores concluída');

// 4. Verificar estrutura de impostos
console.log('\n📊 ESTRUTURA DE IMPOSTOS:');
const impostoMatch = xml.match(/<imposto>([\s\S]*?)<\/imposto>/);
if (impostoMatch) {
  const impostoXml = impostoMatch[1];

  // Verificar se tem todos os impostos obrigatórios
  const temICMS = impostoXml.includes('<ICMS>');
  const temIPI = impostoXml.includes('<IPI>');
  const temPIS = impostoXml.includes('<PIS>');
  const temCOFINS = impostoXml.includes('<COFINS>');
  console.log(`   ICMS: ${temICMS ? '✅' : '❌'}`);
  console.log(`   IPI: ${temIPI ? '✅' : '❌'}`);
  console.log(`   PIS: ${temPIS ? '✅' : '❌'}`);
  console.log(`   COFINS: ${temCOFINS ? '✅' : '❌'}`);

  // Verificar ordem
  const posICMS = impostoXml.indexOf('<ICMS>');
  const posIPI = impostoXml.indexOf('<IPI>');
  const posPIS = impostoXml.indexOf('<PIS>');
  const posCOFINS = impostoXml.indexOf('<COFINS>');
  if (posICMS < posIPI && posIPI < posPIS && posPIS < posCOFINS) {
    console.log('   ✅ Ordem correta: ICMS → IPI → PIS → COFINS');
  } else {
    console.log('   ❌ Ordem incorreta!');
  }
}

// 5. Verificar namespace duplicado
console.log('\n🔍 NAMESPACES:');
const nfeMatches = [...xml.matchAll(/<NFe[^>]*>/g)];
console.log(`   Tags <NFe> encontradas: ${nfeMatches.length}`);
nfeMatches.forEach((match, i) => {
  console.log(`   ${i + 1}. ${match[0]}`);
  if (match[0].includes('xmlns=') && i > 0) {
    console.log(`      ⚠️  Namespace redeclarado (pode causar problema)`);
  }
});

// 6. Mostrar XML completo formatado para análise visual
console.log('\n═'.repeat(70));
console.log('\n📄 SALVANDO XML FORMATADO...\n');
const xmlFormatado = xml.replace(/></g, '>\n<').split('\n').map((line, i) => {
  const depth = line.split('<').length - line.split('</').length;
  const indent = '  '.repeat(Math.max(0, depth));
  return `${indent}${line}`;
}).join('\n');
fs.writeFileSync('./xml_debug_final.xml', xmlFormatado, 'utf8');
console.log('✅ XML formatado salvo em: ./xml_debug_final.xml');
console.log('\n═'.repeat(70));
console.log('\n💡 PRÓXIMOS PASSOS:\n');
console.log('1. Abra o arquivo xml_debug_final.xml');
console.log('2. Verifique visualmente se há algum problema');
console.log('3. Compare com um XML válido de exemplo');
console.log('4. Foque nos campos que mostraram erro acima\n');