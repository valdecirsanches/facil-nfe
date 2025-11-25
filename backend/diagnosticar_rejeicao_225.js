const fs = require('fs');
const path = require('path');
const {
  execSync
} = require('child_process');
console.log('🔍 DIAGNÓSTICO COMPLETO - REJEIÇÃO 225\n');
console.log('═'.repeat(70));

// Procurar último XML enviado
const arqsPath = path.join(__dirname, 'Arqs');
let xmlPath = null;
let xmlNome = null;
if (fs.existsSync(arqsPath)) {
  const empresas = fs.readdirSync(arqsPath).filter(f => f.startsWith('empresa_'));
  for (const empresa of empresas) {
    const pendentesPath = path.join(arqsPath, empresa, 'pendentes');
    if (fs.existsSync(pendentesPath)) {
      const arquivos = fs.readdirSync(pendentesPath).filter(f => f.endsWith('.xml')).map(f => ({
        nome: f,
        path: path.join(pendentesPath, f),
        mtime: fs.statSync(path.join(pendentesPath, f)).mtime
      })).sort((a, b) => b.mtime - a.mtime);
      if (arquivos.length > 0) {
        xmlPath = arquivos[0].path;
        xmlNome = arquivos[0].nome;
        break;
      }
    }
  }
}
if (!xmlPath) {
  console.log('❌ Nenhum XML encontrado para diagnosticar\n');
  process.exit(1);
}
console.log(`\n📄 Analisando: ${xmlNome}\n`);
console.log('═'.repeat(70));
const xmlString = fs.readFileSync(xmlPath, 'utf8');

// 1. VERIFICAR NAMESPACE
console.log('\n1️⃣ VERIFICAÇÃO DE NAMESPACE:\n');
const temNamespaceNFe = xmlString.includes('xmlns="http://www.portalfiscal.inf.br/nfe"');
const temNamespaceXmldsig = xmlString.includes('xmlns="http://www.w3.org/2000/09/xmldsig#"');
console.log(`   NFe namespace: ${temNamespaceNFe ? '✅' : '❌ FALTANDO'}`);
console.log(`   Xmldsig namespace: ${temNamespaceXmldsig ? '✅' : '❌ FALTANDO'}`);
if (!temNamespaceNFe) {
  console.log('\n   ⚠️  PROBLEMA: Namespace da NFe está faltando!');
  console.log('   Solução: Execute node corrigir_namespace_xml.js\n');
}

// 2. VERIFICAR ESTRUTURA BÁSICA
console.log('\n2️⃣ VERIFICAÇÃO DE ESTRUTURA:\n');
const tags = {
  'NFe': xmlString.includes('<NFe'),
  'infNFe': xmlString.includes('<infNFe'),
  'ide': xmlString.includes('<ide>'),
  'emit': xmlString.includes('<emit>'),
  'dest': xmlString.includes('<dest>'),
  'det': xmlString.includes('<det'),
  'total': xmlString.includes('<total>'),
  'transp': xmlString.includes('<transp>'),
  'pag': xmlString.includes('<pag>'),
  'Signature': xmlString.includes('<Signature')
};
Object.entries(tags).forEach(([tag, existe]) => {
  console.log(`   <${tag}>: ${existe ? '✅' : '❌ FALTANDO'}`);
});

// 3. VERIFICAR ATRIBUTOS OBRIGATÓRIOS
console.log('\n3️⃣ VERIFICAÇÃO DE ATRIBUTOS:\n');
const infNFeMatch = xmlString.match(/<infNFe\s+([^>]+)>/);
if (infNFeMatch) {
  const attrs = infNFeMatch[1];
  const temId = attrs.includes('Id=');
  const temVersao = attrs.includes('versao=');
  console.log(`   infNFe Id: ${temId ? '✅' : '❌ FALTANDO'}`);
  console.log(`   infNFe versao: ${temVersao ? '✅' : '❌ FALTANDO'}`);
  if (temId) {
    const idMatch = attrs.match(/Id="([^"]+)"/);
    if (idMatch) {
      const chave = idMatch[1].replace('NFe', '');
      console.log(`   Chave de acesso: ${chave.length === 44 ? '✅ 44 dígitos' : `❌ ${chave.length} dígitos`}`);
    }
  }
} else {
  console.log('   ❌ Tag infNFe não encontrada ou malformada');
}

// 4. VERIFICAR CAMPOS CRÍTICOS
console.log('\n4️⃣ CAMPOS CRÍTICOS:\n');
const extrair = tag => {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i');
  const match = xmlString.match(regex);
  return match ? match[1].trim() : null;
};
const campos = {
  'cUF': extrair('cUF'),
  'natOp': extrair('natOp'),
  'mod': extrair('mod'),
  'serie': extrair('serie'),
  'nNF': extrair('nNF'),
  'dhEmi': extrair('dhEmi'),
  'tpNF': extrair('tpNF'),
  'cMunFG': extrair('cMunFG'),
  'tpAmb': extrair('tpAmb')
};
Object.entries(campos).forEach(([campo, valor]) => {
  if (valor) {
    console.log(`   ${campo}: ✅ ${valor}`);
  } else {
    console.log(`   ${campo}: ❌ FALTANDO`);
  }
});

// 5. VALIDAR COM XMLLINT (se disponível)
console.log('\n5️⃣ VALIDAÇÃO XMLLINT:\n');
try {
  execSync('which xmllint', {
    stdio: 'ignore'
  });

  // Validar apenas estrutura XML (não schema)
  const tempPath = path.join(__dirname, 'temp_diag.xml');
  fs.writeFileSync(tempPath, xmlString, 'utf8');
  try {
    execSync(`xmllint --noout "${tempPath}" 2>&1`, {
      encoding: 'utf8'
    });
    console.log('   ✅ XML bem formado (sintaxe correta)');
  } catch (error) {
    console.log('   ❌ XML malformado:');
    console.log(`   ${error.stdout || error.message}`);
  }
  fs.unlinkSync(tempPath);
} catch {
  console.log('   ⚠️  xmllint não disponível (instale: sudo apt-get install libxml2-utils)');
}

// 6. PROBLEMAS COMUNS REJEIÇÃO 225
console.log('\n6️⃣ CHECKLIST REJEIÇÃO 225:\n');
const problemas = [];

// Namespace
if (!temNamespaceNFe) {
  problemas.push('❌ Namespace da NFe faltando');
}

// Versão
if (!xmlString.includes('versao="4.00"')) {
  problemas.push('❌ Versão 4.00 não encontrada');
}

// Chave de acesso
const chaveMatch = xmlString.match(/Id="NFe(\d+)"/);
if (!chaveMatch || chaveMatch[1].length !== 44) {
  problemas.push('❌ Chave de acesso inválida');
}

// Data de emissão
const dhEmi = extrair('dhEmi');
if (dhEmi && !dhEmi.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/)) {
  problemas.push('❌ Data de emissão em formato incorreto');
}

// Código de município
const cMunFG = extrair('cMunFG');
if (cMunFG && cMunFG.length !== 7) {
  problemas.push(`❌ Código de município deve ter 7 dígitos (tem ${cMunFG.length})`);
}

// Modelo
const mod = extrair('mod');
if (mod !== '55') {
  problemas.push(`❌ Modelo deve ser 55 (está ${mod})`);
}
if (problemas.length === 0) {
  console.log('   ✅ Nenhum problema comum detectado');
} else {
  problemas.forEach(p => console.log(`   ${p}`));
}

// 7. RECOMENDAÇÕES
console.log('\n7️⃣ RECOMENDAÇÕES:\n');
if (!temNamespaceNFe) {
  console.log('   🔧 Execute: node corrigir_namespace_xml.js');
}
console.log('   🔧 Valide com: node validador_nfe_receita.js');
console.log('   🔧 Compare com XML válido de exemplo');
console.log('   🔧 Teste em homologação primeiro');
console.log('\n═'.repeat(70));
console.log('\n💡 PRÓXIMOS PASSOS:\n');
console.log('1. Corrija os problemas listados acima');
console.log('2. Execute: node validador_nfe_receita.js');
console.log('3. Se validar OK, tente enviar novamente');
console.log('4. Se persistir erro 225, envie o XML para análise manual\n');