const Database = require('better-sqlite3');

// Script para popular tabelas NCM e CFOP com dados de teste
const mainDb = new Database('./principal.db');
console.log('🌱 Populando tabelas NCM e CFOP...\n');

// Verificar se as tabelas existem
try {
  const tables = mainDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND (name='tbNCM' OR name='tbCFOP')").all();
  console.log('Tabelas encontradas:', tables.map(t => t.name).join(', '));
  if (tables.length === 0) {
    console.log('❌ Tabelas não encontradas. Execute o backend primeiro para criar as tabelas.');
    process.exit(1);
  }
} catch (error) {
  console.error('Erro ao verificar tabelas:', error.message);
  process.exit(1);
}

// Dados de exemplo de NCM
const ncmExamples = [{
  id: 1010,
  descricao: 'CAVALOS VIVOS',
  categoria: 'Animais vivos',
  uTrib: 'UN'
}, {
  id: 1011,
  descricao: 'CAVALOS REPRODUTORES DE RAÇA PURA',
  categoria: 'Animais vivos',
  uTrib: 'UN'
}, {
  id: 1012,
  descricao: 'ASININOS VIVOS',
  categoria: 'Animais vivos',
  uTrib: 'UN'
}, {
  id: 8471,
  descricao: 'MÁQUINAS AUTOMÁTICAS PARA PROCESSAMENTO DE DADOS',
  categoria: 'Máquinas',
  uTrib: 'UN'
}, {
  id: 8473,
  descricao: 'PARTES E ACESSÓRIOS PARA MÁQUINAS',
  categoria: 'Máquinas',
  uTrib: 'UN'
}];

// Dados de exemplo de CFOP
const cfopExamples = [{
  id: 5102,
  descricao: 'Venda de mercadoria adquirida ou recebida de terceiros',
  texto: 'Venda de mercadoria',
  operacao: 'SAIDA'
}, {
  id: 5103,
  descricao: 'Venda de produção do estabelecimento',
  texto: 'Venda de produção própria',
  operacao: 'SAIDA'
}, {
  id: 5104,
  descricao: 'Venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária',
  texto: 'Venda com ST',
  operacao: 'SAIDA'
}, {
  id: 5405,
  descricao: 'Venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária, na condição de contribuinte substituído',
  texto: 'Venda ST substituído',
  operacao: 'SAIDA'
}, {
  id: 6102,
  descricao: 'Venda de mercadoria adquirida ou recebida de terceiros',
  texto: 'Venda interestadual',
  operacao: 'SAIDA'
}];

// Inserir NCMs
console.log('\n📦 Inserindo NCMs...');
const insertNCM = mainDb.prepare(`
  INSERT OR IGNORE INTO tbNCM (id, descricao, categoria, uTrib)
  VALUES (?, ?, ?, ?)
`);
ncmExamples.forEach(ncm => {
  try {
    insertNCM.run(ncm.id, ncm.descricao, ncm.categoria, ncm.uTrib);
    console.log(`  ✓ NCM ${ncm.id} - ${ncm.descricao}`);
  } catch (error) {
    console.log(`  ⚠ NCM ${ncm.id} já existe`);
  }
});

// Inserir CFOPs
console.log('\n📋 Inserindo CFOPs...');
const insertCFOP = mainDb.prepare(`
  INSERT OR IGNORE INTO tbCFOP (id, descricao, texto, operacao, indNFe, indComunica, indTransp, indDevol, gera_credito)
  VALUES (?, ?, ?, ?, 1, 0, 0, 0, 0)
`);
cfopExamples.forEach(cfop => {
  try {
    insertCFOP.run(cfop.id, cfop.descricao, cfop.texto, cfop.operacao);
    console.log(`  ✓ CFOP ${cfop.id} - ${cfop.descricao}`);
  } catch (error) {
    console.log(`  ⚠ CFOP ${cfop.id} já existe`);
  }
});

// Verificar dados inseridos
const ncmCount = mainDb.prepare('SELECT COUNT(*) as count FROM tbNCM').get();
const cfopCount = mainDb.prepare('SELECT COUNT(*) as count FROM tbCFOP').get();
console.log('\n✅ Dados inseridos com sucesso!');
console.log(`   Total de NCMs: ${ncmCount.count}`);
console.log(`   Total de CFOPs: ${cfopCount.count}`);

// Testar busca
console.log('\n🔍 Testando buscas...');
const testNCM = mainDb.prepare(`
  SELECT * FROM tbNCM 
  WHERE CAST(id AS TEXT) = ? 
     OR CAST(id AS TEXT) LIKE ? 
     OR LOWER(descricao) LIKE LOWER(?) 
     OR LOWER(categoria) LIKE LOWER(?)
  LIMIT 5
`).all('CAVALO', 'CAVALO%', '%CAVALO%', '%CAVALO%');
console.log(`\nBusca NCM "CAVALO": ${testNCM.length} resultados`);
testNCM.forEach(ncm => console.log(`  - ${ncm.id}: ${ncm.descricao}`));
const testCFOP = mainDb.prepare(`
  SELECT * FROM tbCFOP 
  WHERE CAST(id AS TEXT) = ? 
     OR CAST(id AS TEXT) LIKE ? 
     OR LOWER(texto) LIKE LOWER(?) 
     OR LOWER(descricao) LIKE LOWER(?)
  LIMIT 5
`).all('5102', '5102%', '%5102%', '%5102%');
console.log(`\nBusca CFOP "5102": ${testCFOP.length} resultados`);
testCFOP.forEach(cfop => console.log(`  - ${cfop.id}: ${cfop.descricao}`));
mainDb.close();
console.log('\n✨ Concluído!\n');