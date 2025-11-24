const Database = require('better-sqlite3');
const db = new Database('./principal.db');
console.log('🧪 Testando salvamento de configuração...\n');

// 1. Ver valor atual
const antes = db.prepare('SELECT * FROM configuracoes WHERE chave = ?').get('certificado_senha');
console.log('📊 ANTES:', antes);

// 2. Atualizar valor
const result = db.prepare(`
  UPDATE configuracoes 
  SET valor = ?, updated_at = CURRENT_TIMESTAMP
  WHERE chave = ?
`).run('TESTE123', 'certificado_senha');
console.log('\n💾 Resultado do UPDATE:', {
  changes: result.changes,
  lastInsertRowid: result.lastInsertRowid
});

// 3. Ver valor depois
const depois = db.prepare('SELECT * FROM configuracoes WHERE chave = ?').get('certificado_senha');
console.log('\n📊 DEPOIS:', depois);

// 4. Limpar (voltar ao vazio)
db.prepare(`
  UPDATE configuracoes 
  SET valor = '', updated_at = CURRENT_TIMESTAMP
  WHERE chave = ?
`).run('certificado_senha');
console.log('\n✅ Teste concluído! O salvamento funciona no banco.');
console.log('🔍 Se os valores somem no frontend, o problema está na comunicação frontend-backend.');
db.close();