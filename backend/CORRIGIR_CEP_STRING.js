const fs = require('fs');
console.log('🔧 GARANTINDO CEP COMO STRING...\n');
const filePath = './nfe_service.js';
let content = fs.readFileSync(filePath, 'utf8');

// Backup
fs.writeFileSync('./nfe_service.js.backup3', content, 'utf8');
console.log('💾 Backup criado: nfe_service.js.backup3\n');

// Procurar e substituir as linhas do CEP para garantir que seja STRING
let modificado = false;

// Padrão atual: CEP: emitente.cep.replace(/\D/g, '').padStart(8, '0')
// Novo padrão: CEP: String(emitente.cep || '').replace(/\D/g, '').padStart(8, '0')

const patterns = [{
  old: /CEP:\s*emitente\.cep\.replace\(\/\\D\/g,\s*''\)\.padStart\(8,\s*'0'\)/g,
  new: "CEP: String(emitente.cep || '').replace(/\\D/g, '').padStart(8, '0')"
}, {
  old: /CEP:\s*destinatario\.cep\.replace\(\/\\D\/g,\s*''\)\.padStart\(8,\s*'0'\)/g,
  new: "CEP: String(destinatario.cep || '').replace(/\\D/g, '').padStart(8, '0')"
}];
patterns.forEach((pattern, index) => {
  if (pattern.old.test(content)) {
    content = content.replace(pattern.old, pattern.new);
    console.log(`✅ Padrão ${index + 1} corrigido`);
    modificado = true;
  }
});
if (modificado) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('\n✅ Arquivo atualizado!');
  console.log('📝 CEPs agora são convertidos para STRING antes de processar\n');
  console.log('🔄 Reinicie o backend:');
  console.log('   pkill -9 node');
  console.log('   npm start\n');
} else {
  console.log('⚠️  Padrões não encontrados ou já corrigidos\n');
}