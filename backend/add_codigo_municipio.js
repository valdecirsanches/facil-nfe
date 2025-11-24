const Database = require('better-sqlite3');
console.log('🔧 ADICIONANDO CAMPO codigo_municipio\n');
console.log('═'.repeat(70));

// 1. Atualizar tabela empresas no banco principal
console.log('\n📊 1. Atualizando tabela empresas...\n');
const mainDb = new Database('./principal.db');
try {
  // Verificar se coluna já existe
  const colunas = mainDb.prepare("PRAGMA table_info(empresas)").all();
  const temCodigoMunicipio = colunas.some(col => col.name === 'codigo_municipio');
  if (!temCodigoMunicipio) {
    mainDb.prepare('ALTER TABLE empresas ADD COLUMN codigo_municipio TEXT').run();
    console.log('✅ Coluna codigo_municipio adicionada à tabela empresas');
  } else {
    console.log('⚠️  Coluna codigo_municipio já existe na tabela empresas');
  }

  // Atualizar empresas existentes com código de Osasco por padrão
  const empresas = mainDb.prepare('SELECT id, cidade FROM empresas').all();
  empresas.forEach(empresa => {
    if (empresa.cidade && empresa.cidade.toLowerCase().includes('osasco')) {
      mainDb.prepare('UPDATE empresas SET codigo_municipio = ? WHERE id = ?').run('3534401', empresa.id);
      console.log(`   ✅ Empresa ${empresa.id}: código_municipio = 3534401 (Osasco)`);
    }
  });
} catch (error) {
  console.error('❌ Erro ao atualizar empresas:', error.message);
}
mainDb.close();

// 2. Atualizar tabela clientes em cada banco de empresa
console.log('\n👥 2. Atualizando tabela clientes...\n');
const empresasIds = new Database('./principal.db').prepare('SELECT id FROM empresas').all().map(e => e.id);
new Database('./principal.db').close();
empresasIds.forEach(empresaId => {
  const dbPath = `./empresa_${empresaId}.db`;
  const db = new Database(dbPath);
  try {
    // Verificar se coluna já existe
    const colunas = db.prepare("PRAGMA table_info(clientes)").all();
    const temCodigoMunicipio = colunas.some(col => col.name === 'codigo_municipio');
    if (!temCodigoMunicipio) {
      db.prepare('ALTER TABLE clientes ADD COLUMN codigo_municipio TEXT').run();
      console.log(`✅ Empresa ${empresaId}: coluna codigo_municipio adicionada à tabela clientes`);
    } else {
      console.log(`⚠️  Empresa ${empresaId}: coluna codigo_municipio já existe na tabela clientes`);
    }

    // Atualizar clientes existentes com código de Osasco por padrão
    const clientes = db.prepare('SELECT id, cidade FROM clientes').all();
    clientes.forEach(cliente => {
      if (cliente.cidade && cliente.cidade.toLowerCase().includes('osasco')) {
        db.prepare('UPDATE clientes SET codigo_municipio = ? WHERE id = ?').run('3534401', cliente.id);
        console.log(`   ✅ Cliente ${cliente.id}: codigo_municipio = 3534401 (Osasco)`);
      }
    });
  } catch (error) {
    console.error(`❌ Erro ao atualizar clientes da empresa ${empresaId}:`, error.message);
  }
  db.close();
});
console.log('\n' + '═'.repeat(70));
console.log('\n✅ Migração concluída!\n');
console.log('💡 Próximos passos:');
console.log('   1. Os formulários foram atualizados para preencher automaticamente');
console.log('   2. Ao buscar CEP, o código do município será preenchido');
console.log('   3. O campo é obrigatório e será validado antes de salvar\n');