const fs = require('fs');
console.log('🔧 DESATIVANDO VALIDAÇÃO TEMPORARIAMENTE...\n');
const filePath = './nfe_service.js';
let content = fs.readFileSync(filePath, 'utf8');

// Backup
fs.writeFileSync('./nfe_service.js.backup2', content, 'utf8');
console.log('💾 Backup criado: nfe_service.js.backup2\n');

// Encontrar a validação no método enviarNFe
const validacaoInicio = content.indexOf('// VALIDAÇÃO COMPLETA ANTES DE ENVIAR');
const validacaoFim = content.indexOf('console.log(\'✅ NFe validada com sucesso!\');');
if (validacaoInicio === -1 || validacaoFim === -1) {
  console.log('❌ Validação não encontrada!');
  process.exit(1);
}

// Comentar toda a validação
const antes = content.substring(0, validacaoInicio);
const validacaoBloco = content.substring(validacaoInicio, validacaoFim + 50);
const depois = content.substring(validacaoFim + 50);
const validacaoComentada = validacaoBloco.split('\n').map(linha => {
  if (linha.trim() === '') return linha;
  return '// ' + linha;
}).join('\n');
const novoConteudo = antes + validacaoComentada + depois;
fs.writeFileSync(filePath, novoConteudo, 'utf8');
console.log('✅ Validação desativada!');
console.log('⚠️  ATENÇÃO: A validação foi DESATIVADA temporariamente');
console.log('   O XML será enviado SEM validação prévia\n');
console.log('🔄 Reinicie o backend:');
console.log('   pkill -9 node');
console.log('   npm start\n');