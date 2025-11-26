// Script para corrigir todas as issues do sistema
const Database = require('better-sqlite3');
console.log('🔧 Iniciando correções do sistema...\n');

// Conectar ao banco principal
const mainDb = new Database('./principal.db');

// 1️⃣ ADICIONAR CAMPOS FALTANTES NAS TABELAS
console.log('1️⃣ Adicionando campos faltantes...');
try {
  // Adicionar plano_id em empresas (se não existir)
  mainDb.exec(`
    ALTER TABLE empresas ADD COLUMN plano_id INTEGER DEFAULT 1;
  `);
  console.log('✅ Campo plano_id adicionado em empresas');
} catch (e) {
  console.log('⚠️  Campo plano_id já existe em empresas');
}
try {
  // Adicionar ativo em empresas
  mainDb.exec(`
    ALTER TABLE empresas ADD COLUMN ativo INTEGER DEFAULT 1;
  `);
  console.log('✅ Campo ativo adicionado em empresas');
} catch (e) {
  console.log('⚠️  Campo ativo já existe em empresas');
}
try {
  // Adicionar ativo em usuarios
  mainDb.exec(`
    ALTER TABLE usuarios ADD COLUMN ativo INTEGER DEFAULT 1;
  `);
  console.log('✅ Campo ativo adicionado em usuarios');
} catch (e) {
  console.log('⚠️  Campo ativo já existe em usuarios');
}
try {
  // Adicionar pix_code em faturas
  mainDb.exec(`
    ALTER TABLE faturas ADD COLUMN pix_code TEXT;
  `);
  console.log('✅ Campo pix_code adicionado em faturas');
} catch (e) {
  console.log('⚠️  Campo pix_code já existe em faturas');
}
try {
  // Adicionar pix_gerado_em em faturas
  mainDb.exec(`
    ALTER TABLE faturas ADD COLUMN pix_gerado_em DATETIME;
  `);
  console.log('✅ Campo pix_gerado_em adicionado em faturas');
} catch (e) {
  console.log('⚠️  Campo pix_gerado_em já existe em faturas');
}

// 2️⃣ GARANTIR QUE TODOS OS USUÁRIOS TÊM CAMPO TIPO
console.log('\n2️⃣ Corrigindo campo tipo em usuários...');
const usuariosSemTipo = mainDb.prepare(`
  SELECT id, empresa_id FROM usuarios WHERE tipo IS NULL OR tipo = ''
`).all();
for (const user of usuariosSemTipo) {
  const tipo = user.empresa_id === null ? 'super' : 'usuario';
  mainDb.prepare('UPDATE usuarios SET tipo = ? WHERE id = ?').run(tipo, user.id);
  console.log(`✅ Usuário ${user.id} atualizado para tipo: ${tipo}`);
}

// 3️⃣ GARANTIR QUE TODAS AS EMPRESAS TÊM PLANO
console.log('\n3️⃣ Atribuindo plano padrão para empresas sem plano...');
const empresasSemPlano = mainDb.prepare(`
  SELECT id, razao_social FROM empresas WHERE plano_id IS NULL
`).all();
for (const empresa of empresasSemPlano) {
  mainDb.prepare('UPDATE empresas SET plano_id = 1 WHERE id = ?').run(empresa.id);
  console.log(`✅ Empresa ${empresa.id} (${empresa.razao_social}) atribuída ao plano Gratuito`);
}

// 4️⃣ ATIVAR TODOS OS USUÁRIOS E EMPRESAS
console.log('\n4️⃣ Ativando todos os usuários e empresas...');
mainDb.exec(`
  UPDATE usuarios SET ativo = 1 WHERE ativo IS NULL OR ativo = 0;
  UPDATE empresas SET ativo = 1 WHERE ativo IS NULL OR ativo = 0;
`);
console.log('✅ Todos os usuários e empresas ativados');

// 5️⃣ VERIFICAR INTEGRIDADE DOS DADOS
console.log('\n5️⃣ Verificando integridade dos dados...');
const stats = {
  empresas: mainDb.prepare('SELECT COUNT(*) as count FROM empresas').get().count,
  usuarios: mainDb.prepare('SELECT COUNT(*) as count FROM usuarios').get().count,
  planos: mainDb.prepare('SELECT COUNT(*) as count FROM planos').get().count,
  faturas: mainDb.prepare('SELECT COUNT(*) as count FROM faturas').get().count
};
console.log('\n📊 Estatísticas do banco:');
console.log(`   Empresas: ${stats.empresas}`);
console.log(`   Usuários: ${stats.usuarios}`);
console.log(`   Planos: ${stats.planos}`);
console.log(`   Faturas: ${stats.faturas}`);
mainDb.close();
console.log('\n✅ Todas as correções aplicadas com sucesso!');
console.log('🔄 Reinicie o backend para aplicar as mudanças.\n');