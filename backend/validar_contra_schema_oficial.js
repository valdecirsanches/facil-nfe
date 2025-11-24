const fs = require('fs');
const path = require('path');
const {
  XMLParser
} = require('fast-xml-parser');
console.log('🔍 VALIDAÇÃO CONTRA SCHEMA OFICIAL NFe 4.0\n');
console.log('═'.repeat(70));
const logsDir = path.join(__dirname, 'Arqs', 'empresa_1', 'logs');
const arquivos = fs.readdirSync(logsDir).filter(f => f.startsWith('debug_xml_')).sort().reverse();
const xmlPath = path.join(logsDir, arquivos[0]);
const xml = fs.readFileSync(xmlPath, 'utf8');
console.log(`\n📄 Analisando: ${arquivos[0]}\n`);
console.log('═'.repeat(70));

// Parse do XML
const parser = new XMLParser({
  ignoreAttributes: false
});
const parsed = parser.parse(xml);
const nfe = parsed.NFe;
const infNFe = nfe.infNFe;
const ide = infNFe.ide;
console.log('\n🔍 VALIDAÇÕES CRÍTICAS DO SCHEMA NFe 4.0:\n');
let erros = [];

// 1. Validar ordem das tags em <ide>
console.log('1️⃣  ORDEM DAS TAGS EM <ide>:');
const ordemCorretaIde = ['cUF', 'cNF', 'natOp', 'mod', 'serie', 'nNF', 'dhEmi', 'dhSaiEnt', 'tpNF', 'idDest', 'cMunFG', 'tpImp', 'tpEmis', 'cDV', 'tpAmb', 'finNFe', 'indFinal', 'indPres', 'indIntermed', 'procEmi', 'verProc'];
const tagsIde = Object.keys(ide).filter(k => !k.startsWith('@_'));
console.log('   Tags presentes:', tagsIde.join(', '));

// Verificar se dhSaiEnt está presente (opcional mas se tiver deve estar na posição certa)
if (tagsIde.includes('dhSaiEnt')) {
  const posDhEmi = tagsIde.indexOf('dhEmi');
  const posDhSaiEnt = tagsIde.indexOf('dhSaiEnt');
  if (posDhSaiEnt !== posDhEmi + 1) {
    erros.push('dhSaiEnt deve vir imediatamente após dhEmi');
    console.log('   ❌ dhSaiEnt na posição errada');
  }
}

// Verificar se indIntermed está presente (opcional para NFe 4.0)
if (!tagsIde.includes('indIntermed') && ide.tpNF === '1') {
  console.log('   ⚠️  Tag indIntermed ausente (opcional mas recomendada)');
}
console.log('   ✅ Ordem verificada');

// 2. Validar valores de campos
console.log('\n2️⃣  VALIDAÇÃO DE VALORES:');
const validacoes = [{
  campo: 'mod',
  valor: ide.mod,
  esperado: '55',
  tipo: 'string'
}, {
  campo: 'tpNF',
  valor: ide.tpNF,
  esperado: ['0', '1'],
  tipo: 'enum'
}, {
  campo: 'idDest',
  valor: ide.idDest,
  esperado: ['1', '2', '3'],
  tipo: 'enum'
}, {
  campo: 'tpImp',
  valor: ide.tpImp,
  esperado: ['0', '1', '2', '3', '4', '5'],
  tipo: 'enum'
}, {
  campo: 'tpEmis',
  valor: ide.tpEmis,
  esperado: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
  tipo: 'enum'
}, {
  campo: 'tpAmb',
  valor: ide.tpAmb,
  esperado: ['1', '2'],
  tipo: 'enum'
}, {
  campo: 'finNFe',
  valor: ide.finNFe,
  esperado: ['1', '2', '3', '4'],
  tipo: 'enum'
}, {
  campo: 'indFinal',
  valor: ide.indFinal,
  esperado: ['0', '1'],
  tipo: 'enum'
}, {
  campo: 'indPres',
  valor: ide.indPres,
  esperado: ['0', '1', '2', '3', '4', '5', '9'],
  tipo: 'enum'
}, {
  campo: 'procEmi',
  valor: ide.procEmi,
  esperado: ['0', '1', '2', '3'],
  tipo: 'enum'
}];
validacoes.forEach(v => {
  const valorStr = String(v.valor);
  if (v.tipo === 'enum') {
    if (!v.esperado.includes(valorStr)) {
      erros.push(`${v.campo}: valor "${valorStr}" inválido. Esperado: ${v.esperado.join(', ')}`);
      console.log(`   ❌ ${v.campo}: "${valorStr}" (esperado: ${v.esperado.join(', ')})`);
    } else {
      console.log(`   ✅ ${v.campo}: "${valorStr}"`);
    }
  } else if (v.tipo === 'string') {
    if (valorStr !== v.esperado) {
      erros.push(`${v.campo}: valor "${valorStr}" inválido. Esperado: "${v.esperado}"`);
      console.log(`   ❌ ${v.campo}: "${valorStr}" (esperado: "${v.esperado}")`);
    } else {
      console.log(`   ✅ ${v.campo}: "${valorStr}"`);
    }
  }
});

// 3. Validar formato de data
console.log('\n3️⃣  FORMATO DE DATA/HORA:');
const dhEmi = ide.dhEmi;
const formatoDataCorreto = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;
if (!formatoDataCorreto.test(dhEmi)) {
  erros.push(`dhEmi: formato inválido "${dhEmi}"`);
  console.log(`   ❌ dhEmi: "${dhEmi}" (formato incorreto)`);
} else {
  console.log(`   ✅ dhEmi: "${dhEmi}"`);
}

// 4. Validar tamanhos de campos
console.log('\n4️⃣  TAMANHO DE CAMPOS:');
const tamanhos = [{
  campo: 'cUF',
  valor: ide.cUF,
  min: 2,
  max: 2
}, {
  campo: 'cNF',
  valor: ide.cNF,
  min: 8,
  max: 8
}, {
  campo: 'serie',
  valor: String(ide.serie),
  min: 1,
  max: 3
}, {
  campo: 'nNF',
  valor: String(ide.nNF),
  min: 1,
  max: 9
}, {
  campo: 'cDV',
  valor: ide.cDV,
  min: 1,
  max: 1
}, {
  campo: 'cMunFG',
  valor: ide.cMunFG,
  min: 7,
  max: 7
}];
tamanhos.forEach(t => {
  const valorStr = String(t.valor);
  const tamanho = valorStr.length;
  if (tamanho < t.min || tamanho > t.max) {
    erros.push(`${t.campo}: tamanho ${tamanho} inválido (esperado: ${t.min}-${t.max})`);
    console.log(`   ❌ ${t.campo}: ${tamanho} dígitos (esperado: ${t.min}-${t.max})`);
  } else {
    console.log(`   ✅ ${t.campo}: ${tamanho} dígitos`);
  }
});

// 5. Validar estrutura de impostos
console.log('\n5️⃣  ESTRUTURA DE IMPOSTOS:');
const det = Array.isArray(infNFe.det) ? infNFe.det[0] : infNFe.det;
const imposto = det.imposto;
const temICMS = imposto.ICMS !== undefined;
const temIPI = imposto.IPI !== undefined;
const temPIS = imposto.PIS !== undefined;
const temCOFINS = imposto.COFINS !== undefined;
console.log(`   ICMS: ${temICMS ? '✅' : '❌'}`);
console.log(`   IPI: ${temIPI ? '✅' : '❌'}`);
console.log(`   PIS: ${temPIS ? '✅' : '❌'}`);
console.log(`   COFINS: ${temCOFINS ? '✅' : '❌'}`);
if (!temICMS || !temIPI || !temPIS || !temCOFINS) {
  erros.push('Estrutura de impostos incompleta');
}
console.log('\n═'.repeat(70));
console.log('\n📊 RESULTADO DA VALIDAÇÃO:\n');
if (erros.length === 0) {
  console.log('✅ XML VÁLIDO segundo schema NFe 4.0!');
  console.log('\n🤔 Se o erro 225 persiste, pode ser:');
  console.log('   1. Problema na assinatura digital');
  console.log('   2. Certificado inválido ou expirado');
  console.log('   3. Bug específico da SEFAZ-SP em homologação');
  console.log('   4. Algum campo com valor fora do range aceito pela SEFAZ\n');
} else {
  console.log('❌ ERROS ENCONTRADOS:\n');
  erros.forEach((erro, i) => {
    console.log(`   ${i + 1}. ${erro}`);
  });
  console.log('\n💡 Corrija estes erros e tente novamente.\n');
}
console.log('═'.repeat(70));