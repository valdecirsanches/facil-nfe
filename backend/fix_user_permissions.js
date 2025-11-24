const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
console.log('🔒 CORREÇÃO CRÍTICA DE PERMISSÕES DE USUÁRIOS\n');
const mainDb = new Database('./principal.db');

// Verificar estrutura da tabela
const tableInfo = mainDb.prepare("PRAGMA table_info(usuarios)").all();
const hasTipo = tableInfo.some(col => col.name === 'tipo');
if (!hasTipo) {
  console.log('❌ ERRO: Coluna tipo não existe! Execute npm start primeiro.\n');
  process.exit(1);
}
console.log('📊 ANÁLISE DE USUÁRIOS:\n');

// Buscar todos os usuários
const usuarios = mainDb.prepare('SELECT id, nome, email, empresa_id, tipo FROM usuarios').all();
console.log(`Total de usuários: ${usuarios.length}\n`);
let corrigidos = 0;
usuarios.forEach(user => {
  console.log(`👤 Usuário: ${user.nome} (${user.email})`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Empresa ID: ${user.empresa_id || 'NULL (sem empresa)'}`);
  console.log(`   Tipo atual: ${user.tipo || 'NULL (SEM TIPO!)'}`);

  // Determinar tipo correto
  let tipoCorreto = user.tipo;

  // Se não tem tipo, definir baseado em regras
  if (!user.tipo) {
    if (user.email === 'admin@nfe.com') {
      tipoCorreto = 'super';
    } else if (user.empresa_id === null) {
      tipoCorreto = 'super';
    } else {
      tipoCorreto = 'usuario';
    }
    console.log(`   ⚠️  SEM TIPO! Definindo como: ${tipoCorreto}`);
  }

  // Validar consistência
  if (user.tipo === 'super' && user.empresa_id !== null) {
    console.log(`   ⚠️  INCONSISTÊNCIA: Super usuário com empresa_id! Corrigindo...`);
    mainDb.prepare('UPDATE usuarios SET empresa_id = NULL WHERE id = ?').run(user.id);
    corrigidos++;
  }

  // Atualizar tipo se necessário
  if (user.tipo !== tipoCorreto) {
    mainDb.prepare('UPDATE usuarios SET tipo = ? WHERE id = ?').run(tipoCorreto, user.id);
    console.log(`   ✅ Tipo atualizado para: ${tipoCorreto}`);
    corrigidos++;
  }
  console.log('');
});

// Garantir que admin@nfe.com seja super
const admin = mainDb.prepare('SELECT * FROM usuarios WHERE email = ?').get('admin@nfe.com');
if (admin) {
  if (admin.tipo !== 'super' || admin.empresa_id !== null) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    mainDb.prepare('UPDATE usuarios SET senha = ?, tipo = ?, empresa_id = NULL WHERE email = ?').run(hashedPassword, 'super', 'admin@nfe.com');
    console.log('✅ Admin corrigido: admin@nfe.com / admin123 (tipo: super, empresa_id: NULL)\n');
    corrigidos++;
  }
}
console.log('═══════════════════════════════════════════════════════\n');
console.log('📋 RESULTADO FINAL:\n');

// Mostrar estado final
const usuariosFinais = mainDb.prepare('SELECT id, nome, email, empresa_id, tipo FROM usuarios ORDER BY tipo, id').all();
const superUsers = usuariosFinais.filter(u => u.tipo === 'super');
const admins = usuariosFinais.filter(u => u.tipo === 'admin');
const usuarios_normais = usuariosFinais.filter(u => u.tipo === 'usuario');
console.log(`🛡️  SUPER USUÁRIOS (${superUsers.length}):`);
superUsers.forEach(u => {
  console.log(`   - ${u.nome} (${u.email}) - Empresa: ${u.empresa_id || 'TODAS'}`);
});
console.log('');
console.log(`🛡  ADMINISTRADORES (${admins.length}):`);
admins.forEach(u => {
  console.log(`   - ${u.nome} (${u.email}) - Empresa: ${u.empresa_id || 'NENHUMA'}`);
});
console.log('');
console.log(`✓  USUÁRIOS (${usuarios_normais.length}):`);
usuarios_normais.forEach(u => {
  console.log(`   - ${u.nome} (${u.email}) - Empresa: ${u.empresa_id || 'NENHUMA'}`);
});
console.log('');
console.log('═══════════════════════════════════════════════════════\n');
if (corrigidos > 0) {
  console.log(`✅ ${corrigidos} usuário(s) corrigido(s)!\n`);
  console.log('⚠️  IMPORTANTE: Todos os usuários devem fazer logout e login novamente!\n');
} else {
  console.log('✅ Todos os usuários estão com permissões corretas!\n');
}
console.log('🔐 REGRAS DE PERMISSÃO:\n');
console.log('   1. Super Usuário: tipo = "super" E empresa_id = NULL');
console.log('   2. Administrador: tipo = "admin" E empresa_id = [ID da empresa]');
console.log('   3. Usuário: tipo = "usuario" E empresa_id = [ID da empresa]\n');
mainDb.close();