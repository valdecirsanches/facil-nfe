const Database = require('better-sqlite3');
console.log('🔧 CORRIGINDO CEPs NO BANCO...\n');
const db = new Database('./empresa_1.db');

// Buscar todos os clientes com CEP
const clientes = db.prepare('SELECT id, razao_social, cep FROM clientes').all();
console.log(`📊 Total de clientes: ${clientes.length}\n`);
let corrigidos = 0;
let problemas = 0;
const updateStmt = db.prepare('UPDATE clientes SET cep = ? WHERE id = ?');
clientes.forEach(cliente => {
  const cepOriginal = cliente.cep || '';

  // Remover tudo que não é dígito
  const cepLimpo = cepOriginal.replace(/\D/g, '');

  // Preencher com zeros à esquerda até 8 dígitos
  const cepCorrigido = cepLimpo.padStart(8, '0');
  if (cepOriginal !== cepCorrigido) {
    console.log(`📝 ${cliente.razao_social}`);
    console.log(`   Antes: "${cepOriginal}" (${cepOriginal.length} chars)`);
    console.log(`   Depois: "${cepCorrigido}" (${cepCorrigido.length} chars)`);
    console.log('');
    updateStmt.run(cepCorrigido, cliente.id);
    corrigidos++;
  }
  if (cepCorrigido === '00000000') {
    problemas++;
  }
});
console.log(`✅ CEPs corrigidos: ${corrigidos}`);
console.log(`⚠️  CEPs vazios/inválidos: ${problemas}`);
console.log('\n🔄 Reinicie o backend para aplicar as mudanças!\n');
db.close();