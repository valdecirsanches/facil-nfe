const fs = require('fs');
console.log('🔍 COMPARAÇÃO COM XML VÁLIDO\n');
console.log('═'.repeat(70));

// XML atual (do log)
const xmlAtual = fs.readFileSync('./xml_formatado_analise.xml', 'utf8');
console.log('\n📋 ANÁLISE DO XML ATUAL:\n');

// Verificar se xMun do destinatário está correto
const xMunDestMatch = xmlAtual.match(/<dest>[\s\S]*?<xMun>(.*?)<\/xMun>/);
if (xMunDestMatch) {
  console.log(`✅ xMun destinatário: ${xMunDestMatch[1]}`);
}

// Verificar se cMun do destinatário está correto  
const cMunDestMatch = xmlAtual.match(/<dest>[\s\S]*?<cMun>(.*?)<\/cMun>/);
if (cMunDestMatch) {
  console.log(`✅ cMun destinatário: ${cMunDestMatch[1]}`);
}
console.log('\n🔍 PROBLEMA IDENTIFICADO:\n');

// O problema é que Osasco tem código 3534401, não 3550308 (que é São Paulo capital)
console.log('❌ ERRO ENCONTRADO: Código de município incorreto!\n');
console.log('   Destinatário:');
console.log('   - Cidade: Osasco');
console.log('   - cMun no XML: 3550308 (SÃO PAULO - CAPITAL)');
console.log('   - cMun correto: 3534401 (OSASCO)\n');
console.log('   Emitente:');
console.log('   - Cidade: Osasco');
console.log('   - cMun no XML: 3550308 (SÃO PAULO - CAPITAL)');
console.log('   - cMun correto: 3534401 (OSASCO)\n');
console.log('═'.repeat(70));
console.log('\n💡 SOLUÇÃO:\n');
console.log('O código de município está ERRADO tanto no emitente quanto no destinatário!\n');
console.log('Você está usando:');
console.log('   cMun: 3550308 (São Paulo - Capital)\n');
console.log('Mas deveria usar:');
console.log('   cMun: 3534401 (Osasco)\n');
console.log('Isso está causando o erro 225 porque a SEFAZ valida se o código');
console.log('do município corresponde ao nome da cidade.\n');
console.log('🔧 COMO CORRIGIR:\n');
console.log('1. Atualize o cadastro da empresa com o código correto');
console.log('2. Atualize o cadastro do cliente com o código correto');
console.log('3. Ou corrija diretamente no código do nfe_service.js\n');
console.log('📚 Tabela de códigos de município:');
console.log('   https://www.ibge.gov.br/explica/codigos-dos-municipios.php\n');
console.log('═'.repeat(70));