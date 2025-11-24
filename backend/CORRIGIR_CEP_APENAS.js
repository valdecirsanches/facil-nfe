const fs = require('fs');
console.log('🔧 CORRIGINDO APENAS CEP...\n');
const filePath = './nfe_service.js';
let content = fs.readFileSync(filePath, 'utf8');

// Backup
fs.writeFileSync('./nfe_service.js.backup', content, 'utf8');
console.log('💾 Backup criado: nfe_service.js.backup\n');

// Procurar e substituir APENAS as linhas do CEP
let modificado = false;

// Corrigir CEP do emitente (linha ~360)
if (content.includes("CEP: emitente.cep.replace(/\\D/g, '')")) {
  content = content.replace(/CEP: emitente\.cep\.replace\(\/\\D\/g, ''\)/g, "CEP: emitente.cep.replace(/\\D/g, '').padStart(8, '0')");
  console.log('✅ CEP do emitente corrigido');
  modificado = true;
}

// Corrigir CEP do destinatário (linha ~380)
if (content.includes("CEP: destinatario.cep.replace(/\\D/g, '')")) {
  content = content.replace(/CEP: destinatario\.cep\.replace\(\/\\D\/g, ''\)/g, "CEP: destinatario.cep.replace(/\\D/g, '').padStart(8, '0')");
  console.log('✅ CEP do destinatário corrigido');
  modificado = true;
}
if (modificado) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('\n✅ Arquivo atualizado com sucesso!');
  console.log('\n🔄 Agora reinicie o backend:');
  console.log('   pkill -9 node');
  console.log('   npm start\n');
} else {
  console.log('⚠️  CEPs já estão corretos ou não foram encontrados');
  console.log('   Verifique manualmente as linhas ~360 e ~380\n');
}