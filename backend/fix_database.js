const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
console.log('🔧 Corrigindo banco de dados...\n');
const mainDb = new Database('./principal.db');

// Verificar se a coluna tipo existe
const tableInfo = mainDb.prepare("PRAGMA table_info(usuarios)").all();
const hasTipo = tableInfo.some(col => col.name === 'tipo');
if (!hasTipo) {
  console.log('→ Adicionando coluna tipo...');
  mainDb.exec(`ALTER TABLE usuarios ADD COLUMN tipo TEXT DEFAULT 'usuario';`);
  console.log('✓ Coluna tipo adicionada\n');
} else {
  console.log('✓ Coluna tipo já existe\n');
}

// Atualizar usuários sem tipo
console.log('→ Atualizando usuários...');
const usuarios = mainDb.prepare('SELECT id, email, empresa_id, tipo FROM usuarios').all();
usuarios.forEach(user => {
  if (!user.tipo) {
    const novoTipo = user.empresa_id === null ? 'super' : 'usuario';
    mainDb.prepare('UPDATE usuarios SET tipo = ? WHERE id = ?').run(novoTipo, user.id);
    console.log(`  ✓ Usuário ${user.email}: tipo = ${novoTipo}`);
  }
});

// Garantir que admin@nfe.com seja super
const admin = mainDb.prepare('SELECT * FROM usuarios WHERE email = ?').get('admin@nfe.com');
if (admin) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  mainDb.prepare('UPDATE usuarios SET senha = ?, tipo = ?, empresa_id = NULL WHERE email = ?').run(hashedPassword, 'super', 'admin@nfe.com');
  console.log('\n✓ Admin atualizado: admin@nfe.com / admin123 (tipo: super)');
} else {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  mainDb.prepare('INSERT INTO usuarios (nome, email, senha, empresa_id, tipo) VALUES (?, ?, ?, ?, ?)').run('Administrador', 'admin@nfe.com', hashedPassword, null, 'super');
  console.log('\n✓ Admin criado: admin@nfe.com / admin123 (tipo: super)');
}

// Verificar resultado
console.log('\n📊 Usuários no banco:');
const allUsers = mainDb.prepare('SELECT id, nome, email, empresa_id, tipo FROM usuarios').all();
allUsers.forEach(user => {
  console.log(`  - ${user.email} (${user.tipo || 'SEM TIPO'})`);
});
mainDb.close();
console.log('\n✅ Banco de dados corrigido com sucesso!\n');
console.log('Agora execute: npm start\n');