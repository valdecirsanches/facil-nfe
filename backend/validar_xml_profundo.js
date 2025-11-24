const fs = require('fs');
const path = require('path');
console.log('🔍 VALIDAÇÃO PROFUNDA DO XML\n');
console.log('═'.repeat(70));

// Buscar XML mais recente
const logsDir = path.join(__dirname, 'Arqs', 'empresa_1', 'logs');
const arquivos = fs.readdirSync(logsDir).filter(f => f.startsWith('debug_xml_')).sort().reverse();
const xmlPath = path.join(logsDir, arquivos[0]);
const xml = fs.readFileSync(xmlPath, 'utf8');
console.log(`\n📄 Arquivo: ${arquivos[0]}\n`);
console.log('═'.repeat(70));

// Mostrar o XML completo (primeiros 3000 caracteres)
console.log('\n📋 XML COMPLETO (início):\n');
console.log(xml.substring(0, 3000));
console.log('\n...\n');

// Verificar problema específico: tag <ide> sem cMunFG
console.log('\n🔍 VERIFICANDO TAG <ide>:\n');
const ideMatch = xml.match(/<ide>([\s\S]*?)<\/ide>/);
if (ideMatch) {
  const ideContent = ideMatch[1];
  console.log('Conteúdo da tag <ide>:');
  console.log(ideContent);

  // Verificar se tem cMunFG
  if (!ideContent.includes('<cMunFG>')) {
    console.log('\n❌ ERRO ENCONTRADO: Tag <cMunFG> está FALTANDO em <ide>!');
    console.log('   Esta tag é OBRIGATÓRIA e deve vir depois de <idDest>');
  } else {
    console.log('\n✅ Tag <cMunFG> presente');
  }
}

// Verificar se cMunFG está na posição correta
console.log('\n🔍 VERIFICANDO POSIÇÃO DE cMunFG:\n');
const ideCompleto = xml.match(/<ide>([\s\S]*?)<\/ide>/);
if (ideCompleto) {
  const tags = ideCompleto[1].match(/<(\w+)>/g);
  console.log('Ordem das tags em <ide>:');
  tags.forEach((tag, i) => {
    console.log(`   ${i + 1}. ${tag}`);
  });

  // Ordem correta esperada
  const ordemEsperada = ['cUF', 'cNF', 'natOp', 'mod', 'serie', 'nNF', 'dhEmi', 'tpNF', 'idDest', 'cMunFG', 'tpImp', 'tpEmis', 'cDV', 'tpAmb', 'finNFe', 'indFinal', 'indPres', 'procEmi', 'verProc'];
  console.log('\n📋 Ordem esperada:');
  ordemEsperada.forEach((tag, i) => {
    console.log(`   ${i + 1}. <${tag}>`);
  });
}
console.log('\n═'.repeat(70));
console.log('\n💡 DIAGNÓSTICO:\n');
console.log('Se a tag <cMunFG> estiver faltando ou na posição errada,');
console.log('esse é o problema que causa o erro 225!\n');