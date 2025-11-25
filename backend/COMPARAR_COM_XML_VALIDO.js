const fs = require('fs');
console.log('🔍 COMPARAÇÃO COM XML VÁLIDO DA RECEITA\n');
console.log('═'.repeat(70));

// Ler o XML gerado
const xmlPath = '/home/sanches/Magic/nfe/src/backend/Arqs/empresa_1/logs/debug_xml_1764079211562.xml';
const xml = fs.readFileSync(xmlPath, 'utf8');
console.log('\n📋 VERIFICAÇÕES CRÍTICAS QUE A SEFAZ FAZ:\n');
let erros = [];

// 1. Verificar se tem declaração XML (NÃO DEVE TER quando dentro de envelope)
if (xml.startsWith('<?xml')) {
  console.log('❌ 1. XML tem declaração <?xml...?> (deve ser removida no envelope)');
  erros.push('Declaração XML presente');
} else {
  console.log('✅ 1. XML sem declaração (correto para envelope)');
}

// 2. Verificar espaços em branco no início
if (xml.match(/^\s+/)) {
  console.log('❌ 2. XML tem espaços em branco no início');
  erros.push('Espaços em branco no início');
} else {
  console.log('✅ 2. XML sem espaços no início');
}

// 3. Verificar tag de fechamento </infNFe>
if (!xml.includes('</infNFe>')) {
  console.log('❌ 3. Tag </infNFe> não encontrada');
  erros.push('Tag </infNFe> faltando');
} else {
  console.log('✅ 3. Tag </infNFe> presente');
}

// 4. Verificar se Signature está DEPOIS de </infNFe>
const posInfNFe = xml.indexOf('</infNFe>');
const posSignature = xml.indexOf('<Signature');
if (posSignature < posInfNFe) {
  console.log('❌ 4. Signature está ANTES de </infNFe> (ordem errada)');
  erros.push('Ordem incorreta: Signature antes de </infNFe>');
} else {
  console.log('✅ 4. Signature está DEPOIS de </infNFe> (correto)');
}

// 5. Verificar campos com valores vazios
const camposVazios = xml.match(/<[^>]+><\/[^>]+>/g);
if (camposVazios && camposVazios.length > 0) {
  console.log(`❌ 5. Encontrados ${camposVazios.length} campos vazios:`);
  camposVazios.slice(0, 5).forEach(campo => {
    console.log(`   - ${campo}`);
  });
  erros.push(`${camposVazios.length} campos vazios`);
} else {
  console.log('✅ 5. Nenhum campo vazio encontrado');
}

// 6. Verificar valores numéricos com formato errado
const valoresNum = xml.match(/<v[A-Z][^>]*>[\d.]+<\/v[A-Z][^>]*>/g);
if (valoresNum) {
  const errosNum = valoresNum.filter(v => {
    const valor = v.match(/>([\d.]+)</)[1];
    // Verificar se tem casas decimais corretas
    if (v.includes('vProd') || v.includes('vNF')) {
      return !valor.match(/^\d+\.\d{2}$/); // Deve ter 2 casas decimais
    }
    if (v.includes('qCom') || v.includes('vUnCom')) {
      return !valor.match(/^\d+\.\d{4}$/); // Deve ter 4 casas decimais
    }
    return false;
  });
  if (errosNum.length > 0) {
    console.log(`❌ 6. Valores numéricos com formato incorreto:`);
    errosNum.slice(0, 3).forEach(v => console.log(`   - ${v}`));
    erros.push('Formato numérico incorreto');
  } else {
    console.log('✅ 6. Valores numéricos com formato correto');
  }
}

// 7. Verificar caracteres especiais não escapados
const caracteresEspeciais = xml.match(/[<>&"']/g);
const dentroTags = xml.match(/>[^<]*[&<>][^<]*</g);
if (dentroTags && dentroTags.length > 0) {
  console.log('❌ 7. Caracteres especiais não escapados no conteúdo:');
  dentroTags.slice(0, 3).forEach(c => console.log(`   - ${c}`));
  erros.push('Caracteres especiais não escapados');
} else {
  console.log('✅ 7. Nenhum caractere especial não escapado');
}

// 8. Verificar IPI sem cEnq
if (xml.includes('<IPI>') && !xml.includes('<cEnq>')) {
  console.log('❌ 8. Tag <IPI> sem <cEnq> (obrigatório)');
  erros.push('IPI sem cEnq');
} else {
  console.log('✅ 8. IPI com cEnq presente');
}

// 9. Verificar se tem indPag em detPag
if (xml.includes('<detPag>')) {
  if (!xml.match(/<detPag>[\s\S]*?<indPag>/)) {
    console.log('⚠️  9. detPag pode estar faltando indPag');
  } else {
    console.log('✅ 9. detPag com indPag presente');
  }
}

// 10. Mostrar estrutura do XML
console.log('\n═'.repeat(70));
console.log('\n📊 ESTRUTURA DO XML:\n');
console.log('Primeiros 800 caracteres:');
console.log(xml.substring(0, 800));
console.log('\n[...]\n');
console.log('═'.repeat(70));
console.log('\n🎯 RESULTADO:\n');
if (erros.length === 0) {
  console.log('✅ NENHUM ERRO ÓBVIO ENCONTRADO!');
  console.log('\n🤔 O erro 225 pode ser causado por:');
  console.log('   1. Algum campo com valor inválido específico');
  console.log('   2. Problema na assinatura digital');
  console.log('   3. Incompatibilidade com versão do schema da SEFAZ');
  console.log('\n💡 PRÓXIMA AÇÃO:');
  console.log('   Vou criar um XML MÍNIMO para testar se a estrutura básica funciona\n');
} else {
  console.log(`❌ ${erros.length} PROBLEMA(S) ENCONTRADO(S):\n`);
  erros.forEach((erro, i) => {
    console.log(`   ${i + 1}. ${erro}`);
  });
  console.log('\n💡 CORRIJA ESTES PROBLEMAS PRIMEIRO!\n');
}
console.log('═'.repeat(70));