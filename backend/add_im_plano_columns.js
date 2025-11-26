const Database = require('better-sqlite3');

console.log('🔄 Adicionando colunas IM e sistema de planos...\n');

// Banco principal
const mainDb = new Database('./principal.db');

try {
  // 1. Adicionar coluna 'im' se não existir
  console.log('1️⃣ Verificando coluna ATIVO na tabela empresas...');
  const columns = mainDb.pragma('table_info(usuarios)');
  const hasIM = columns.some(col => col.name === 'ativo');
  
  if (!hasIM) {
    console.log('   ➕ Adicionando coluna ATIVO...');
    mainDb.exec('ALTER TABLE usuarios ADD COLUMN ativo INTEGER NOT NULL DEFAULT 1 CHECK(ativo IN (0,1));');
    console.log('   ✅ Coluna ATIVO adicionada');
  } else {
    console.log('   ✅ Coluna ATIVOP já existe');
  }

//   // 2. Criar tabela de planos
//   console.log('\n2️⃣ Criando tabela de planos...');
//   mainDb.exec(`
//     CREATE TABLE IF NOT EXISTS planos (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       nome TEXT NOT NULL,
//       descricao TEXT,
//       limite_nfes INTEGER NOT NULL,
//       limite_produtos INTEGER,
//       limite_faturamento REAL,
//       preco_mensal REAL NOT NULL DEFAULT 0,
//       ativo INTEGER DEFAULT 1,
//       created_at DATETIME DEFAULT CURRENT_TIMESTAMP
//     );
//   `);
//   console.log('   ✅ Tabela planos criada');

//   // 3. Inserir planos padrão
//   console.log('\n3️⃣ Inserindo planos padrão...');
//   const planoExists = mainDb.prepare('SELECT COUNT(*) as count FROM planos').get();
  
//   if (planoExists.count === 0) {
//     mainDb.exec(`
//       INSERT INTO planos (nome, descricao, limite_nfes, limite_produtos, limite_faturamento, preco_mensal) VALUES
//       ('Gratuito', 'Ideal para começar', 10, 50, 5000.00, 0.00),
//       ('Básico', 'Para pequenas empresas', 50, 200, 25000.00, 49.90),
//       ('Profissional', 'Para empresas em crescimento', 200, 1000, 100000.00, 149.90),
//       ('Empresarial', 'Sem limites para sua empresa', -1, -1, -1, 399.90);
//     `);
//     console.log('   ✅ Planos inseridos:');
//     console.log('      • Gratuito: 10 NFes/mês - R$ 0,00');
//     console.log('      • Básico: 50 NFes/mês - R$ 49,90');
//     console.log('      • Profissional: 200 NFes/mês - R$ 149,90');
//     console.log('      • Empresarial: Ilimitado - R$ 399,90');
//   } else {
//     console.log('   ✅ Planos já existem');
//   }

//   // 4. Adicionar coluna plano_id na tabela empresas
//   console.log('\n4️⃣ Verificando coluna plano_id na tabela empresas...');
//   const hasPlanoId = columns.some(col => col.name === 'plano_id');
  
//   if (!hasPlanoId) {
//     console.log('   ➕ Adicionando coluna plano_id...');
//     mainDb.exec('ALTER TABLE empresas ADD COLUMN plano_id INTEGER DEFAULT 1');
//     console.log('   ✅ Coluna plano_id adicionada (padrão: Gratuito)');
//   } else {
//     console.log('   ✅ Coluna plano_id já existe');
//   }

//   // 5. Adicionar colunas de controle de uso
//   console.log('\n5️⃣ Adicionando colunas de controle de uso...');
  
//   const hasNfesEmitidas = columns.some(col => col.name === 'nfes_emitidas_mes');
//   if (!hasNfesEmitidas) {
//     mainDb.exec('ALTER TABLE empresas ADD COLUMN nfes_emitidas_mes INTEGER DEFAULT 0');
//     console.log('   ✅ Coluna nfes_emitidas_mes adicionada');
//   }
  
//   const hasMesReferencia = columns.some(col => col.name === 'mes_referencia');
//   if (!hasMesReferencia) {
//     mainDb.exec("ALTER TABLE empresas ADD COLUMN mes_referencia TEXT DEFAULT (strftime('%Y-%m', 'now'))");
//     console.log('   ✅ Coluna mes_referencia adicionada');
//   }

  console.log('\n✅ Migração concluída com sucesso!\n');

} catch (error) {
  console.error('\n❌ Erro na migração:', error.message);
  process.exit(1);
} finally {
  mainDb.close();
}