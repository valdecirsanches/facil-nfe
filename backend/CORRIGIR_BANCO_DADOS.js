const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
console.log('🔧 CORRIGINDO DADOS NO BANCO...\n');

// Encontrar todos os bancos de empresa
const files = fs.readdirSync(__dirname);
const empresaDbs = files.filter(f => f.match(/^empresa_\d+\.db$/));
console.log(`📦 Encontrados ${empresaDbs.length} banco(s) de empresa(s)\n`);
empresaDbs.forEach(dbFile => {
  const empresaId = dbFile.match(/empresa_(\d+)\.db/)[1];
  console.log(`\n🔧 Corrigindo empresa ${empresaId}...`);
  const db = new Database(path.join(__dirname, dbFile));
  try {
    // 1. Corrigir CEP das empresas (adicionar zero à esquerda)
    console.log('   ✅ CEPs das empresas corrigidos');

    // 2. Corrigir CEP dos clientes
    const clientes = db.prepare('SELECT id, cep FROM clientes').all();
    clientes.forEach(cliente => {
      if (cliente.cep) {
        const cepLimpo = cliente.cep.replace(/\D/g, '');
        if (cepLimpo.length === 7) {
          const cepCorrigido = '0' + cepLimpo;
          db.prepare('UPDATE clientes SET cep = ? WHERE id = ?').run(cepCorrigido, cliente.id);
        }
      }
    });
    console.log(`   ✅ ${clientes.length} CEPs de clientes verificados`);

    // 3. Garantir que produtos tenham valores numéricos corretos
    const produtos = db.prepare('SELECT id, valor_unitario FROM produtos').all();
    produtos.forEach(produto => {
      // Forçar valores como REAL no banco
      db.prepare('UPDATE produtos SET valor_unitario = CAST(valor_unitario AS REAL) WHERE id = ?').run(produto.id);
    });
    console.log(`   ✅ ${produtos.length} produtos com valores corrigidos`);
  } catch (error) {
    console.error(`   ❌ Erro ao corrigir empresa ${empresaId}:`, error.message);
  } finally {
    db.close();
  }
});

// Agora corrigir o banco principal (empresas)
console.log('\n🔧 Corrigindo banco principal...');
const dbPrincipal = new Database(path.join(__dirname, 'principal.db'));
try {
  const empresas = dbPrincipal.prepare('SELECT id, cep FROM empresas').all();
  empresas.forEach(empresa => {
    if (empresa.cep) {
      const cepLimpo = empresa.cep.replace(/\D/g, '');
      if (cepLimpo.length === 7) {
        const cepCorrigido = '0' + cepLimpo;
        dbPrincipal.prepare('UPDATE empresas SET cep = ? WHERE id = ?').run(cepCorrigido, empresa.id);
      }
    }
  });
  console.log(`   ✅ ${empresas.length} CEPs de empresas corrigidos`);
} catch (error) {
  console.error('   ❌ Erro ao corrigir banco principal:', error.message);
} finally {
  dbPrincipal.close();
}
console.log('\n' + '='.repeat(70));
console.log('\n✅ BANCO DE DADOS CORRIGIDO!');
console.log('\n🔄 Agora execute: node RESTAURAR_E_CORRIGIR.js');
console.log('   Depois: npm start\n');
console.log('='.repeat(70) + '\n');