const fs = require('fs');
const path = require('path');
console.log('🔧 DESABILITANDO VALIDAÇÃO TEMPORARIAMENTE\n');
const nfeServicePath = path.join(__dirname, 'nfe_service.js');
let content = fs.readFileSync(nfeServicePath, 'utf8');

// Comentar a validação
const original = `      // VALIDAÇÃO COMPLETA ANTES DE ENVIAR
      console.log('🔍 Validando NFe antes de enviar...');
      const validacao = nfeValidator.validar(xml);
      
      if (!validacao.valido) {
        console.log('❌ NFe com erros de validação!');
        console.log(\`📊 Total de erros: \${validacao.totalErros}\`);
        
        validacao.erros.forEach((erro, i) => {
          console.log(\`\\n   \${i + 1}. Campo: \${erro.campo}\`);
          console.log(\`      Erro: \${erro.erro}\`);
          console.log(\`      Solução: \${erro.solucao}\`);
        });
        
        return {
          success: false,
          online: false,
          modo: 'validacao',
          mensagem: 'NFe com erros de validação',
          erros: validacao.erros,
          avisos: validacao.avisos
        };
      }`;
const commented = `      // VALIDAÇÃO DESABILITADA TEMPORARIAMENTE
      console.log('⚠️  VALIDAÇÃO DESABILITADA - APENAS PARA TESTE!');
      // const validacao = nfeValidator.validar(xml);`;
if (content.includes(original)) {
  content = content.replace(original, commented);
  fs.writeFileSync(nfeServicePath, content, 'utf8');
  console.log('✅ Validação desabilitada!');
  console.log('\n⚠️  ATENÇÃO: Isso é APENAS para teste!');
  console.log('   A NFe pode ser rejeitada pela SEFAZ se tiver erros.\n');
} else {
  console.log('⚠️  Validação já está desabilitada ou código foi modificado.\n');
}