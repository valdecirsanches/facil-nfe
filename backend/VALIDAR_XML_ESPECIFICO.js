const fs = require('fs');
const path = require('path');
console.log('🔍 VALIDAÇÃO ESPECÍFICA DO XML GERADO\n');
console.log('═'.repeat(70));
const xmlPath = '/home/sanches/Magic/nfe/src/backend/Arqs/empresa_1/logs/debug_xml_1764077700316.xml';
if (!fs.existsSync(xmlPath)) {
  console.log('❌ XML não encontrado');
  process.exit(1);
}
const xml = fs.readFileSync(xmlPath, 'utf8');
console.log('\n📋 VALIDAÇÕES CRÍTICAS:\n');
let erros = [];
let avisos = [];

// 1. Verificar estrutura básica
console.log('1️⃣ ESTRUTURA BÁSICA:');
const checks = {
  '<NFe xmlns=': xml.includes('<NFe xmlns='),
  '<infNFe Id=': xml.includes('<infNFe Id='),
  'versao="4.00"': xml.includes('versao="4.00"'),
  '<ide>': xml.includes('<ide>'),
  '<emit>': xml.includes('<emit>'),
  '<dest>': xml.includes('<dest>'),
  '<det nItem=': xml.includes('<det nItem='),
  '<total>': xml.includes('<total>'),
  '<transp>': xml.includes('<transp>'),
  '<pag>': xml.includes('<pag>'),
  '<Signature': xml.includes('<Signature'),
  '</NFe>': xml.includes('</NFe>')
};
Object.entries(checks).forEach(([tag, existe]) => {
  console.log(`   ${existe ? '✅' : '❌'} ${tag}`);
  if (!existe) erros.push(`Tag ${tag} faltando`);
});

// 2. Verificar campos obrigatórios do IDE
console.log('\n2️⃣ CAMPOS IDE:');
const ideMatch = xml.match(/<ide>(.*?)<\/ide>/s);
if (ideMatch) {
  const ide = ideMatch[1];
  const camposIde = {
    'cUF': /<cUF>\d{2}<\/cUF>/.test(ide),
    'cNF': /<cNF>\d{8}<\/cNF>/.test(ide),
    'natOp': /<natOp>.+<\/natOp>/.test(ide),
    'mod': /<mod>55<\/mod>/.test(ide),
    'serie': /<serie>\d+<\/serie>/.test(ide),
    'nNF': /<nNF>\d+<\/nNF>/.test(ide),
    'dhEmi': /<dhEmi>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-\d{2}:\d{2}<\/dhEmi>/.test(ide),
    'tpNF': /<tpNF>[01]<\/tpNF>/.test(ide),
    'idDest': /<idDest>[123]<\/idDest>/.test(ide),
    'cMunFG': /<cMunFG>\d{7}<\/cMunFG>/.test(ide),
    'tpImp': /<tpImp>[1-5]<\/tpImp>/.test(ide),
    'tpEmis': /<tpEmis>[1-9]<\/tpEmis>/.test(ide),
    'cDV': /<cDV>\d<\/cDV>/.test(ide),
    'tpAmb': /<tpAmb>[12]<\/tpAmb>/.test(ide),
    'finNFe': /<finNFe>[1-4]<\/finNFe>/.test(ide),
    'indFinal': /<indFinal>[01]<\/indFinal>/.test(ide),
    'indPres': /<indPres>[0-9]<\/indPres>/.test(ide),
    'procEmi': /<procEmi>[0-3]<\/procEmi>/.test(ide),
    'verProc': /<verProc>.+<\/verProc>/.test(ide)
  };
  Object.entries(camposIde).forEach(([campo, valido]) => {
    console.log(`   ${valido ? '✅' : '❌'} ${campo}`);
    if (!valido) erros.push(`Campo IDE/${campo} inválido ou faltando`);
  });
}

// 3. Verificar EMIT
console.log('\n3️⃣ EMITENTE:');
const emitMatch = xml.match(/<emit>(.*?)<\/emit>/s);
if (emitMatch) {
  const emit = emitMatch[1];
  const camposEmit = {
    'CNPJ (14 dígitos)': /<CNPJ>\d{14}<\/CNPJ>/.test(emit),
    'xNome': /<xNome>.+<\/xNome>/.test(emit),
    'enderEmit': /<enderEmit>/.test(emit),
    'xLgr': /<xLgr>.+<\/xLgr>/.test(emit),
    'nro': /<nro>.+<\/nro>/.test(emit),
    'xBairro': /<xBairro>.+<\/xBairro>/.test(emit),
    'cMun (7 dígitos)': /<cMun>\d{7}<\/cMun>/.test(emit),
    'xMun': /<xMun>.+<\/xMun>/.test(emit),
    'UF (2 letras)': /<UF>[A-Z]{2}<\/UF>/.test(emit),
    'CEP (8 dígitos)': /<CEP>\d{8}<\/CEP>/.test(emit),
    'IE': /<IE>\d+<\/IE>/.test(emit),
    'CRT': /<CRT>[123]<\/CRT>/.test(emit)
  };
  Object.entries(camposEmit).forEach(([campo, valido]) => {
    console.log(`   ${valido ? '✅' : '❌'} ${campo}`);
    if (!valido) erros.push(`Campo EMIT/${campo} inválido`);
  });
}

// 4. Verificar DEST
console.log('\n4️⃣ DESTINATÁRIO:');
const destMatch = xml.match(/<dest>(.*?)<\/dest>/s);
if (destMatch) {
  const dest = destMatch[1];
  const temCNPJ = /<CNPJ>\d{14}<\/CNPJ>/.test(dest);
  const temCPF = /<CPF>\d{11}<\/CPF>/.test(dest);
  const camposDest = {
    'CNPJ ou CPF': temCNPJ || temCPF,
    'xNome': /<xNome>.+<\/xNome>/.test(dest),
    'enderDest': /<enderDest>/.test(dest),
    'xLgr': /<xLgr>.+<\/xLgr>/.test(dest),
    'nro': /<nro>.+<\/nro>/.test(dest),
    'xBairro': /<xBairro>.+<\/xBairro>/.test(dest),
    'cMun (7 dígitos)': /<cMun>\d{7}<\/cMun>/.test(dest),
    'xMun': /<xMun>.+<\/xMun>/.test(dest),
    'UF (2 letras)': /<UF>[A-Z]{2}<\/UF>/.test(dest),
    'CEP (8 dígitos)': /<CEP>\d{8}<\/CEP>/.test(dest),
    'indIEDest': /<indIEDest>[1-9]<\/indIEDest>/.test(dest)
  };
  Object.entries(camposDest).forEach(([campo, valido]) => {
    console.log(`   ${valido ? '✅' : '❌'} ${campo}`);
    if (!valido) erros.push(`Campo DEST/${campo} inválido`);
  });
}

// 5. Verificar PRODUTO
console.log('\n5️⃣ PRODUTO:');
const detMatch = xml.match(/<det nItem="1">(.*?)<\/det>/s);
if (detMatch) {
  const det = detMatch[1];
  const camposProd = {
    'cProd': /<cProd>.+<\/cProd>/.test(det),
    'cEAN': /<cEAN>.+<\/cEAN>/.test(det),
    'xProd': /<xProd>.+<\/xProd>/.test(det),
    'NCM (8 dígitos)': /<NCM>\d{8}<\/NCM>/.test(det),
    'CFOP (4 dígitos)': /<CFOP>\d{4}<\/CFOP>/.test(det),
    'uCom': /<uCom>.+<\/uCom>/.test(det),
    'qCom': /<qCom>\d+\.\d{4}<\/qCom>/.test(det),
    'vUnCom': /<vUnCom>\d+\.\d{4}<\/vUnCom>/.test(det),
    'vProd': /<vProd>\d+\.\d{2}<\/vProd>/.test(det),
    'ICMS': /<ICMS>/.test(det),
    'PIS': /<PIS>/.test(det),
    'COFINS': /<COFINS>/.test(det)
  };
  Object.entries(camposProd).forEach(([campo, valido]) => {
    console.log(`   ${valido ? '✅' : '❌'} ${campo}`);
    if (!valido) erros.push(`Campo PRODUTO/${campo} inválido`);
  });
}

// 6. Verificar TOTAIS
console.log('\n6️⃣ TOTAIS:');
const totalMatch = xml.match(/<total>(.*?)<\/total>/s);
if (totalMatch) {
  const total = totalMatch[1];
  const camposTotal = {
    'ICMSTot': /<ICMSTot>/.test(total),
    'vBC': /<vBC>\d+\.\d{2}<\/vBC>/.test(total),
    'vICMS': /<vICMS>\d+\.\d{2}<\/vICMS>/.test(total),
    'vProd': /<vProd>\d+\.\d{2}<\/vProd>/.test(total),
    'vNF': /<vNF>\d+\.\d{2}<\/vNF>/.test(total)
  };
  Object.entries(camposTotal).forEach(([campo, valido]) => {
    console.log(`   ${valido ? '✅' : '❌'} ${campo}`);
    if (!valido) erros.push(`Campo TOTAL/${campo} inválido`);
  });
}

// 7. Verificar PAGAMENTO
console.log('\n7️⃣ PAGAMENTO:');
const pagMatch = xml.match(/<pag>(.*?)<\/pag>/s);
if (pagMatch) {
  const pag = pagMatch[1];
  const camposPag = {
    'detPag': /<detPag>/.test(pag),
    'tPag': /<tPag>\d{2}<\/tPag>/.test(pag),
    'vPag': /<vPag>\d+\.\d{2}<\/vPag>/.test(pag)
  };
  Object.entries(camposPag).forEach(([campo, valido]) => {
    console.log(`   ${valido ? '✅' : '❌'} ${campo}`);
    if (!valido) erros.push(`Campo PAG/${campo} inválido`);
  });
}
console.log('\n═'.repeat(70));
console.log('\n📊 RESULTADO FINAL:\n');
if (erros.length === 0) {
  console.log('✅ NENHUM ERRO ENCONTRADO!');
  console.log('\n🤔 O XML parece estar correto estruturalmente.');
  console.log('   O erro 225 pode ser causado por:');
  console.log('   1. Problema na assinatura digital');
  console.log('   2. Certificado inválido ou expirado');
  console.log('   3. Algum valor numérico com formato incorreto');
  console.log('   4. Problema no envelope SOAP\n');
  console.log('💡 PRÓXIMOS PASSOS:');
  console.log('   1. Verificar se certificado está válido');
  console.log('   2. Comparar com um XML que funciona');
  console.log('   3. Testar em ambiente de homologação da Receita\n');
} else {
  console.log(`❌ ${erros.length} ERRO(S) ENCONTRADO(S):\n`);
  erros.forEach((erro, i) => {
    console.log(`   ${i + 1}. ${erro}`);
  });
  console.log('\n💡 CORRIJA ESTES ERROS E TENTE NOVAMENTE!\n');
}
console.log('═'.repeat(70));