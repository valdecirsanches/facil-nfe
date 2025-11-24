const fs = require('fs');
const path = require('path');
console.log('🔍 VALIDANDO SCHEMA XML\n');
console.log('═'.repeat(60));

// Ler XML mais recente
const logsDir = path.join(__dirname, 'Arqs', 'empresa_1', 'logs');
const xmlFiles = fs.readdirSync(logsDir).filter(f => f.startsWith('debug_xml_')).sort().reverse();
const xmlPath = path.join(logsDir, xmlFiles[0]);
const xml = fs.readFileSync(xmlPath, 'utf8');
console.log(`\n📄 Analisando: ${xmlFiles[0]}`);
console.log(`📏 Tamanho: ${xml.length} bytes\n`);

// Validações do Schema NFe 4.00
const erros = [];

// 1. Verificar estrutura básica
if (!xml.includes('<NFe xmlns="http://www.portalfiscal.inf.br/nfe">')) {
  erros.push('❌ Namespace NFe incorreto ou ausente');
}

// 2. Verificar versão
if (!xml.includes('versao="4.00"')) {
  erros.push('❌ Versão deve ser 4.00');
}

// 3. Verificar campos obrigatórios
const camposObrigatorios = ['infNFe', 'ide', 'emit', 'dest', 'det', 'total', 'transp'];
camposObrigatorios.forEach(campo => {
  if (!xml.includes(`<${campo}`)) {
    erros.push(`❌ Campo obrigatório ausente: ${campo}`);
  }
});

// 4. Verificar formato de campos específicos
const checks = [{
  campo: 'cUF',
  regex: /<cUF>(\d{2})<\/cUF>/,
  desc: 'Código UF (2 dígitos)'
}, {
  campo: 'mod',
  regex: /<mod>55<\/mod>/,
  desc: 'Modelo deve ser 55'
}, {
  campo: 'dhEmi',
  regex: /<dhEmi>(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2})<\/dhEmi>/,
  desc: 'Data/hora com timezone'
}, {
  campo: 'tpAmb',
  regex: /<tpAmb>[12]<\/tpAmb>/,
  desc: 'Tipo ambiente (1 ou 2)'
}, {
  campo: 'CNPJ',
  regex: /<CNPJ>\d{14}<\/CNPJ>/,
  desc: 'CNPJ (14 dígitos)'
}, {
  campo: 'CPF',
  regex: /<CPF>\d{11}<\/CPF>/,
  desc: 'CPF (11 dígitos)'
}];
checks.forEach(check => {
  if (xml.includes(`<${check.campo}>`)) {
    if (!check.regex.test(xml)) {
      erros.push(`❌ ${check.campo}: ${check.desc} - formato inválido`);
    }
  }
});

// 5. Verificar NCM (deve ter 8 dígitos ou ser vazio)
const ncmMatch = xml.match(/<NCM>(.*?)<\/NCM>/);
if (ncmMatch) {
  const ncm = ncmMatch[1];
  if (ncm !== '' && ncm.length !== 8) {
    erros.push(`❌ NCM deve ter 8 dígitos ou ser vazio. Encontrado: "${ncm}" (${ncm.length} caracteres)`);
  }
}

// 6. Verificar CFOP (deve ter 4 dígitos)
const cfopMatch = xml.match(/<CFOP>(\d+)<\/CFOP>/);
if (cfopMatch) {
  const cfop = cfopMatch[1];
  if (cfop.length !== 4) {
    erros.push(`❌ CFOP deve ter 4 dígitos. Encontrado: "${cfop}" (${cfop.length} dígitos)`);
  }
}

// 7. Verificar valores decimais
const valoresMatch = xml.match(/<v[A-Z][a-zA-Z]*>([^<]+)<\/v[A-Z][a-zA-Z]*>/g);
if (valoresMatch) {
  valoresMatch.forEach(valor => {
    const match = valor.match(/>([^<]+)</);
    if (match) {
      const val = match[1];
      if (!/^\d+\.\d{2}$/.test(val)) {
        erros.push(`⚠️  Valor com formato incorreto: ${valor} (deve ter 2 casas decimais)`);
      }
    }
  });
}

// 8. Verificar quantidades
const qtdMatch = xml.match(/<q[A-Z][a-zA-Z]*>([^<]+)<\/q[A-Z][a-zA-Z]*>/g);
if (qtdMatch) {
  qtdMatch.forEach(qtd => {
    const match = qtd.match(/>([^<]+)</);
    if (match) {
      const val = match[1];
      if (!/^\d+\.\d{4}$/.test(val)) {
        erros.push(`⚠️  Quantidade com formato incorreto: ${qtd} (deve ter 4 casas decimais)`);
      }
    }
  });
}

// 9. Verificar valores unitários
const vUnMatch = xml.match(/<vUn[A-Z][a-zA-Z]*>([^<]+)<\/vUn[A-Z][a-zA-Z]*>/g);
if (vUnMatch) {
  vUnMatch.forEach(vUn => {
    const match = vUn.match(/>([^<]+)</);
    if (match) {
      const val = match[1];
      if (!/^\d+\.\d{10}$/.test(val)) {
        erros.push(`⚠️  Valor unitário com formato incorreto: ${vUn} (deve ter 10 casas decimais)`);
      }
    }
  });
}
console.log('═'.repeat(60));
console.log('\n📊 RESULTADO DA VALIDAÇÃO:\n');
if (erros.length === 0) {
  console.log('✅ Nenhum erro encontrado!');
  console.log('   O XML parece estar correto segundo as regras básicas.');
  console.log('   O erro 225 pode ser por validação mais específica da SEFAZ.');
} else {
  console.log(`❌ ${erros.length} erro(s) encontrado(s):\n`);
  erros.forEach((erro, i) => {
    console.log(`${i + 1}. ${erro}`);
  });
}
console.log('\n═'.repeat(60));
console.log('\n💡 PRÓXIMOS PASSOS:');
console.log('   1. Corrigir os erros listados acima');
console.log('   2. Verificar se NCM está preenchido corretamente (8 dígitos)');
console.log('   3. Verificar se CFOP está correto (4 dígitos)');
console.log('   4. Tentar enviar novamente\n');