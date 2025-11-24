const fs = require('fs');
const path = require('path');
console.log('🔍 ENCONTRANDO ERRO 225 - ANÁLISE FINAL\n');
console.log('═'.repeat(70));
const logsDir = path.join(__dirname, 'Arqs', 'empresa_1', 'logs');
const arquivos = fs.readdirSync(logsDir).filter(f => f.startsWith('debug_xml_')).sort().reverse();
const xmlPath = path.join(logsDir, arquivos[0]);
const xml = fs.readFileSync(xmlPath, 'utf8');
console.log('\n🔍 VERIFICAÇÕES FINAIS:\n');

// 1. Verificar declaração XML
console.log('1️⃣  DECLARAÇÃO XML:');
if (xml.startsWith('<?xml')) {
  console.log('   ❌ ERRO: XML tem declaração <?xml...?>');
  console.log('   O XML da NFe NÃO deve ter declaração XML!');
  console.log('   Deve começar direto com <NFe>');
} else if (xml.startsWith('<NFe')) {
  console.log('   ✅ Correto: começa com <NFe>');
} else {
  console.log(`   ⚠️  Começa com: ${xml.substring(0, 50)}`);
}

// 2. Verificar encoding
console.log('\n2️⃣  ENCODING:');
const temCaracteresEspeciais = /[^\x00-\x7F]/.test(xml);
if (temCaracteresEspeciais) {
  console.log('   ⚠️  XML contém caracteres especiais (acentos)');
  console.log('   Verificando se estão codificados corretamente...');

  // Procurar por acentos
  const acentos = xml.match(/[áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/g);
  if (acentos) {
    console.log(`   Encontrados: ${[...new Set(acentos)].join(', ')}`);
  }
} else {
  console.log('   ✅ Sem caracteres especiais');
}

// 3. Verificar espaços em branco
console.log('\n3️⃣  ESPAÇOS EM BRANCO:');
const temEspacosExtras = />\s+</.test(xml);
if (temEspacosExtras) {
  console.log('   ⚠️  XML tem espaços/quebras de linha entre tags');
  console.log('   Isso pode causar problemas em alguns validadores');
} else {
  console.log('   ✅ XML compacto (sem espaços extras)');
}

// 4. Verificar tags vazias
console.log('\n4️⃣  TAGS VAZIAS:');
const tagsVazias = xml.match(/<(\w+)><\/\1>/g);
if (tagsVazias) {
  console.log('   ⚠️  Tags vazias encontradas:');
  tagsVazias.forEach(tag => console.log(`      ${tag}`));
} else {
  console.log('   ✅ Nenhuma tag vazia');
}

// 5. Verificar valores com zeros à esquerda
console.log('\n5️⃣  VALORES NUMÉRICOS:');
const valoresComZeros = xml.match(/<(\w+)>0+(\d+\.\d+)<\/\1>/g);
if (valoresComZeros) {
  console.log('   ⚠️  Valores com zeros à esquerda:');
  valoresComZeros.forEach(v => console.log(`      ${v}`));
} else {
  console.log('   ✅ Sem zeros à esquerda desnecessários');
}

// 6. Verificar problema específico: indFinal
console.log('\n6️⃣  CAMPO indFinal:');
const indFinalMatch = xml.match(/<indFinal>(\d)<\/indFinal>/);
if (indFinalMatch) {
  const indFinal = indFinalMatch[1];
  const indIEDestMatch = xml.match(/<indIEDest>(\d)<\/indIEDest>/);
  const indIEDest = indIEDestMatch ? indIEDestMatch[1] : null;
  console.log(`   indFinal: ${indFinal}`);
  console.log(`   indIEDest: ${indIEDest}`);

  // Regra: se destinatário é PJ (tem CNPJ), indFinal deve ser 0
  const temCNPJDest = xml.includes('<dest><CNPJ>');
  if (temCNPJDest && indFinal === '1') {
    console.log('   ❌ ERRO: Destinatário é PJ (CNPJ), mas indFinal=1');
    console.log('   Para PJ, indFinal deve ser 0');
  } else {
    console.log('   ✅ indFinal correto');
  }
}

// 7. Verificar problema: dhEmi com timezone
console.log('\n7️⃣  DATA/HORA EMISSÃO:');
const dhEmiMatch = xml.match(/<dhEmi>(.*?)<\/dhEmi>/);
if (dhEmiMatch) {
  const dhEmi = dhEmiMatch[1];
  console.log(`   dhEmi: ${dhEmi}`);

  // Verificar formato
  const formatoCorreto = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(dhEmi);
  if (!formatoCorreto) {
    console.log('   ❌ ERRO: Formato incorreto!');
    console.log('   Esperado: AAAA-MM-DDTHH:MM:SS-03:00');
  } else {
    console.log('   ✅ Formato correto');
  }

  // Verificar se a data é válida
  const data = new Date(dhEmi);
  if (isNaN(data.getTime())) {
    console.log('   ❌ ERRO: Data inválida!');
  } else {
    console.log(`   ✅ Data válida: ${data.toLocaleString('pt-BR')}`);
  }
}

// 8. Verificar problema: CFOP vs idDest
console.log('\n8️⃣  CFOP vs idDest:');
const cfopMatch = xml.match(/<CFOP>(\d+)<\/CFOP>/);
const idDestMatch = xml.match(/<idDest>(\d)<\/idDest>/);
if (cfopMatch && idDestMatch) {
  const cfop = cfopMatch[1];
  const idDest = idDestMatch[1];
  console.log(`   CFOP: ${cfop}`);
  console.log(`   idDest: ${idDest} (${idDest === '1' ? 'Interna' : idDest === '2' ? 'Interestadual' : 'Exterior'})`);

  // Validar consistência
  const cfopInicio = cfop[0];
  if (idDest === '1' && cfopInicio !== '5') {
    console.log('   ❌ ERRO: idDest=1 (interna) mas CFOP não começa com 5');
  } else if (idDest === '2' && cfopInicio !== '6') {
    console.log('   ❌ ERRO: idDest=2 (interestadual) mas CFOP não começa com 6');
  } else if (idDest === '3' && cfopInicio !== '7') {
    console.log('   ❌ ERRO: idDest=3 (exterior) mas CFOP não começa com 7');
  } else {
    console.log('   ✅ CFOP consistente com idDest');
  }
}
console.log('\n' + '═'.repeat(70));
console.log('\n💡 CONCLUSÃO:\n');
console.log('Se todos os itens acima estão corretos, o erro 225 pode ser:');
console.log('1. Problema no certificado digital (assinatura inválida)');
console.log('2. Versão do schema incompatível');
console.log('3. Bug específico da SEFAZ-SP em homologação');
console.log('4. Algum campo com valor fora do range permitido\n');
console.log('💡 RECOMENDAÇÃO:');
console.log('Tente validar o XML em: https://www.nfe.fazenda.gov.br/portal/validador.aspx\n');