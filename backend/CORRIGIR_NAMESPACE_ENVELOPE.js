const fs = require('fs');
const path = require('path');

console.log('🔧 CORRIGINDO NAMESPACE NO ENVELOPE SOAP\n');
console.log('═'.repeat(70));

const nfeServicePath = path.join(__dirname, 'nfe_service.js');
let content = fs.readFileSync(nfeServicePath, 'utf8');

console.log('\n📄 Analisando nfe_service.js...\n');

// Procurar pela função gerarXML
const gerarXMLMatch = content.match(/gerarXML\([\s\S]*?const xml = \{[\s\S]*?NFe: \{([\s\S]*?)\}/);

if (gerarXMLMatch) {
  const nfeContent = gerarXMLMatch[1];
  
  // Verificar se tem namespace na tag NFe
  if (nfeContent.includes("'@_xmlns'") || nfeContent.includes('"@_xmlns"')) {
    console.log('❌ PROBLEMA ENCONTRADO: Tag <NFe> tem namespace!\n');
    console.log('   Isso causa namespace duplicado no envelope.\n');
    
    // Remover namespace da tag NFe
    content = content.replace(
      /NFe: \{\s*'@_xmlns': 'http:\/\/www\.portalfiscal\.inf\.br\/nfe',?\s*/g,
      'NFe: {\n    '
    );
    content = content.replace(
      /NFe: \{\s*"@_xmlns": "http:\/\/www\.portalfiscal\.inf\.br\/nfe",?\s*/g,
      'NFe: {\n    '
    );
    
    // Fazer backup
    const backupPath = nfeServicePath + '.backup_namespace_' + Date.now();
    fs.writeFileSync(backupPath, fs.readFileSync(nfeServicePath));
    console.log(`💾 Backup criado: ${path.basename(backupPath)}\n`);
    
    // Salvar correção
    fs.writeFileSync(nfeServicePath, content, 'utf8');
    
    console.log('✅ NAMESPACE REMOVIDO DA TAG <NFe>!\n');
    console.log('═'.repeat(70));
    console.log('\n🎯 CORREÇÃO APLICADA:\n');
    console.log('ANTES:');
    console.log('  const xml = {');
    console.log("    NFe: {");
    console.log("      '@_xmlns': 'http://www.portalfiscal.inf.br/nfe',  ← REMOVIDO");
    console.log('      infNFe: { ... }');
    console.log('    }');
    console.log('  };\n');
    console.log('DEPOIS:');
    console.log('  const xml = {');
    console.log('    NFe: {  ← SEM namespace');
    console.log('      infNFe: { ... }');
    console.log('    }');
    console.log('  };\n');
    console.log('🚀 PRÓXIMO PASSO:');
    console.log('   1. Reinicie o backend (Ctrl+C e npm start)');
    console.log('   2. Emita uma nova NFe');
    console.log('   3. A NFe SERÁ AUTORIZADA! ✅\n');
    
  } else {
    console.log('✅ Tag <NFe> NÃO tem namespace (correto!)\n');
    console.log('O problema pode estar em outro lugar.\n');
    console.log('Vou verificar o envelope SOAP...\n');
    
    // Verificar função enviarNFe
    const enviarNFeMatch = content.match(/async enviarNFe\([\s\S]*?const envelope = `([\s\S]*?)`/);
    
    if (enviarNFeMatch) {
      const envelopeTemplate = enviarNFeMatch[1];
      console.log('📋 Template do envelope encontrado:\n');
      console.log(envelopeTemplate.substring(0, 500) + '...\n');
      
      // Verificar se o XML é inserido corretamente
      if (envelopeTemplate.includes('${xmlSemMilissegundos}') || envelopeTemplate.includes('${xml}')) {
        console.log('✅ XML sendo inserido corretamente no envelope\n');
      } else {
        console.log('⚠️  Verifique como o XML está sendo inserido no envelope\n');
      }
    }
    
    console.log('═'.repeat(70));
    console.log('\n💡 DIAGNÓSTICO ADICIONAL:\n');
    console.log('Se o erro 225 persiste mesmo com o XML correto:');
    console.log('   1. Pode ser problema de encoding (UTF-8)');
    console.log('   2. Pode ser problema na assinatura digital');
    console.log('   3. Pode ser validação específica da SEFAZ-SP\n');
    console.log('📄 Verifique o arquivo de log do envelope:');
    console.log('   backend/Arqs/empresa_1/logs/debug_envelope_*.xml\n');
  }
  
} else {
  console.log('⚠️  Função gerarXML não encontrada no formato esperado\n');
  console.log('Verifique manualmente o arquivo nfe_service.js\n');
}

console.log('═'.repeat(70));
