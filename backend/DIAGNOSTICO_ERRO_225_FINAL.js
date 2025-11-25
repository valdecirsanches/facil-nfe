const fs = require('fs');
const path = require('path');
console.log('🔍 DIAGNÓSTICO FINAL - ERRO 225\n');
console.log('═'.repeat(70));

// Ler o XML mais recente
const xmlPath = '/home/sanches/Magic/nfe/src/backend/Arqs/empresa_1/logs/debug_xml_1764077700316.xml';
if (!fs.existsSync(xmlPath)) {
  console.log('❌ XML não encontrado:', xmlPath);
  process.exit(1);
}
const xml = fs.readFileSync(xmlPath, 'utf8');
console.log('\n1️⃣ VERIFICAÇÃO DE NAMESPACE:\n');

// Verificar tag NFe
const nfeMatch = xml.match(/<NFe[^>]*>/);
if (nfeMatch) {
  console.log('📋 Tag <NFe>:');
  console.log(`   ${nfeMatch[0]}\n`);
  if (nfeMatch[0].includes('xmlns=')) {
    console.log('✅ TEM namespace');
    const nsMatch = nfeMatch[0].match(/xmlns="([^"]+)"/);
    if (nsMatch) {
      console.log(`   Valor: ${nsMatch[1]}`);
      if (nsMatch[1] === 'http://www.portalfiscal.inf.br/nfe') {
        console.log('   ✅ CORRETO!\n');
      } else {
        console.log('   ❌ INCORRETO!\n');
      }
    }
  } else {
    console.log('❌ SEM namespace!\n');
  }
}
console.log('═'.repeat(70));
console.log('\n2️⃣ VERIFICAÇÃO DE NAMESPACE DUPLICADO:\n');

// Contar quantas vezes xmlns aparece
const xmlnsCount = (xml.match(/xmlns="http:\/\/www\.portalfiscal\.inf\.br\/nfe"/g) || []).length;
console.log(`📊 Namespace aparece ${xmlnsCount} vez(es) no XML\n`);
if (xmlnsCount > 1) {
  console.log('❌ PROBLEMA: Namespace DUPLICADO!');
  console.log('   Isso causa erro 225 na SEFAZ\n');

  // Encontrar todas as ocorrências
  const regex = /<[^>]*xmlns="http:\/\/www\.portalfiscal\.inf\.br\/nfe"[^>]*>/g;
  const matches = xml.match(regex);
  if (matches) {
    console.log('📍 Locais onde o namespace aparece:\n');
    matches.forEach((match, i) => {
      console.log(`   ${i + 1}. ${match.substring(0, 80)}...`);
    });
  }
  console.log('\n💡 SOLUÇÃO:');
  console.log('   O namespace deve aparecer APENAS na tag <NFe>');
  console.log('   Remover de todas as outras tags!\n');
} else if (xmlnsCount === 1) {
  console.log('✅ Namespace aparece apenas 1 vez (correto!)\n');
} else {
  console.log('❌ Namespace NÃO ENCONTRADO!\n');
}
console.log('═'.repeat(70));
console.log('\n3️⃣ PRIMEIROS 1500 CARACTERES DO XML:\n');
console.log(xml.substring(0, 1500));
console.log('\n[...]\n');
console.log('═'.repeat(70));
console.log('\n4️⃣ DIAGNÓSTICO FINAL:\n');
if (xmlnsCount === 0) {
  console.log('❌ PROBLEMA: Namespace faltando na tag <NFe>');
  console.log('   Você NÃO aplicou a correção no nfe_service.js\n');
  console.log('💡 SOLUÇÃO:');
  console.log('   Adicione esta linha no nfe_service.js (linha ~330):');
  console.log(`   '@_xmlns': 'http://www.portalfiscal.inf.br/nfe',\n`);
} else if (xmlnsCount > 1) {
  console.log('❌ PROBLEMA: Namespace DUPLICADO');
  console.log('   O XMLBuilder está adicionando xmlns em várias tags\n');
  console.log('💡 SOLUÇÃO:');
  console.log('   Usar geração manual de XML (string template)');
  console.log('   OU configurar XMLBuilder para não adicionar xmlns automaticamente\n');
} else {
  console.log('✅ Namespace está correto (1 ocorrência)');
  console.log('   O erro 225 pode ser por outro motivo:\n');
  console.log('💡 POSSÍVEIS CAUSAS:');
  console.log('   1. Algum campo com formato inválido');
  console.log('   2. Valor numérico incorreto');
  console.log('   3. Data/hora com formato errado');
  console.log('   4. CEP ou outro campo obrigatório faltando\n');
  console.log('🔍 PRÓXIMO PASSO:');
  console.log('   Execute: node validador_nfe_receita.js\n');
}
console.log('═'.repeat(70));