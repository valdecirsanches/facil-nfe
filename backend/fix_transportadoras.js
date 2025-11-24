const Database = require('better-sqlite3');
const fs = require('fs');
console.log('🔧 CORREÇÃO: Adicionando colunas faltantes em transportadoras\n');

// Encontrar todos os bancos de empresas
const files = fs.readdirSync('./');
const companyDbs = files.filter(f => f.startsWith('empresa_') && f.endsWith('.db'));
if (companyDbs.length === 0) {
  console.log('❌ Nenhum banco de empresa encontrado.');
  process.exit(1);
}
console.log(`📊 Encontrados ${companyDbs.length} banco(s) de empresa(s)\n`);
const fieldsToAdd = [{
  name: 'placa_veiculo',
  type: 'TEXT'
}, {
  name: 'uf_veiculo',
  type: 'TEXT'
}, {
  name: 'rntc',
  type: 'TEXT'
}, {
  name: 'numero',
  type: 'TEXT'
}, {
  name: 'complemento',
  type: 'TEXT'
}, {
  name: 'bairro',
  type: 'TEXT'
}, {
  name: 'cep',
  type: 'TEXT'
}, {
  name: 'email',
  type: 'TEXT'
}, {
  name: 'nome_motorista',
  type: 'TEXT'
}, {
  name: 'uf',
  type: 'TEXT'
}, {
  name: 'observacoes',
  type: 'TEXT'
}];
companyDbs.forEach(dbFile => {
  const match = dbFile.match(/empresa_(\d+)\.db/);
  if (!match) return;
  const companyId = parseInt(match[1]);
  console.log(`\n📦 Processando ${dbFile} (Empresa ID: ${companyId})`);
  try {
    const db = new Database(dbFile);

    // Verificar se a tabela transportadoras existe
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='transportadoras'
    `).get();
    if (!tableExists) {
      console.log('  ⚠️  Tabela transportadoras não existe, criando...');
      db.exec(`
        CREATE TABLE transportadoras (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          razao_social TEXT NOT NULL,
          cnpj TEXT,
          ie TEXT,
          endereco TEXT,
          cidade TEXT,
          estado TEXT,
          telefone TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('  ✅ Tabela transportadoras criada');
    }

    // Obter colunas existentes
    const tableInfo = db.prepare("PRAGMA table_info(transportadoras)").all();
    const existingColumns = tableInfo.map(col => col.name);
    console.log(`  📋 Colunas existentes: ${existingColumns.join(', ')}`);
    let addedCount = 0;

    // Adicionar colunas faltantes
    fieldsToAdd.forEach(field => {
      if (!existingColumns.includes(field.name)) {
        try {
          db.exec(`ALTER TABLE transportadoras ADD COLUMN ${field.name} ${field.type};`);
          console.log(`  ✅ Coluna ${field.name} adicionada`);
          addedCount++;
        } catch (error) {
          console.log(`  ❌ Erro ao adicionar ${field.name}: ${error.message}`);
        }
      }
    });

    // Migrar dados de 'estado' para 'uf' se necessário
    if (existingColumns.includes('estado') && existingColumns.includes('uf')) {
      const result = db.prepare(`UPDATE transportadoras SET uf = estado WHERE uf IS NULL AND estado IS NOT NULL`).run();
      if (result.changes > 0) {
        console.log(`  ✅ ${result.changes} registro(s) migrado(s) de estado para uf`);
      }
    }
    if (addedCount === 0) {
      console.log('  ✓ Todas as colunas já existem');
    } else {
      console.log(`  ✅ ${addedCount} coluna(s) adicionada(s) com sucesso`);
    }

    // Verificar resultado final
    const finalTableInfo = db.prepare("PRAGMA table_info(transportadoras)").all();
    console.log(`  📊 Total de colunas: ${finalTableInfo.length}`);
    db.close();
  } catch (error) {
    console.error(`  ❌ Erro ao processar ${dbFile}:`, error.message);
  }
});
console.log('\n✅ CORREÇÃO CONCLUÍDA!\n');
console.log('📝 Próximos passos:');
console.log('   1. Reinicie o servidor: npm start');
console.log('   2. Tente cadastrar a transportadora novamente\n');