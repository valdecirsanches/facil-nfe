const Database = require('better-sqlite3');
console.log('🔧 Adicionando coluna CRT na tabela empresas...\n');
const db = new Database('./principal.db');
try {
  // Verificar se coluna já existe
  const tableInfo = db.prepare("PRAGMA table_info(empresas)").all();
  const hasCrt = tableInfo.some(col => col.name === 'crt');
  if (hasCrt) {
    console.log('✅ Coluna CRT já existe!');
  } else {
    // Adicionar coluna CRT
    db.exec(`ALTER TABLE empresas ADD COLUMN crt TEXT DEFAULT '1';`);
    console.log('✅ Coluna CRT adicionada com sucesso!');

    // Atualizar empresas existentes para CRT = 1 (Simples Nacional)
    const result = db.prepare(`UPDATE empresas SET crt = '1' WHERE crt IS NULL`).run();
    console.log(`✅ ${result.changes} empresa(s) atualizada(s) para CRT = 1 (Simples Nacional)`);
  }

  // Mostrar empresas
  console.log('\n📊 Empresas cadastradas:\n');
  const empresas = db.prepare('SELECT id, razao_social, cnpj, crt FROM empresas').all();
  empresas.forEach(emp => {
    const crtDesc = emp.crt === '1' ? 'Simples Nacional' : emp.crt === '2' ? 'Simples - Excesso' : emp.crt === '3' ? 'Regime Normal' : 'Não definido';
    console.log(`  ${emp.id}. ${emp.razao_social}`);
    console.log(`     CNPJ: ${emp.cnpj}`);
    console.log(`     CRT: ${emp.crt || '(vazio)'} - ${crtDesc}\n`);
  });
} catch (error) {
  console.error('❌ Erro:', error.message);
} finally {
  db.close();
}
console.log('✅ Pronto! Agora reinicie o backend e teste a emissão.');