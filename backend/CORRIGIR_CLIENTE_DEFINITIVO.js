const Database = require('better-sqlite3');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 CORREÇÃO DEFINITIVA - CLIENTE COM CEP ERRADO\n');
console.log('═'.repeat(70));

const db = new Database('./empresa_1.db');

// Listar todos os clientes
const clientes = db.prepare('SELECT id, razao_social, cep, cidade, uf, codigo_municipio FROM clientes').all();

console.log('\n📊 CLIENTES CADASTRADOS:\n');

clientes.forEach(cliente => {
  console.log(`${cliente.id}. ${cliente.razao_social}`);
  console.log(`   CEP: ${cliente.cep || '(vazio)'}`);
  console.log(`   Cidade: ${cliente.cidade || '(vazio)'} / ${cliente.uf || '(vazio)'}`);
  console.log(`   Código IBGE: ${cliente.codigo_municipio || '(vazio)'}`);
  console.log('');
});

console.log('═'.repeat(70));

rl.question('\nDigite o ID do cliente que deseja corrigir: ', (clienteId) => {
  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(clienteId);
  
  if (!cliente) {
    console.log('\n❌ Cliente não encontrado!');
    db.close();
    rl.close();
    return;
  }
  
  console.log(`\n📝 Cliente selecionado: ${cliente.razao_social}`);
  console.log(`   CEP atual: ${cliente.cep}`);
  console.log(`   Cidade atual: ${cliente.cidade}`);
  console.log(`   Código IBGE atual: ${cliente.codigo_municipio}`);
  
  rl.question('\nDigite a CIDADE CORRETA: ', (cidade) => {
    rl.question('Digite a UF CORRETA: ', (uf) => {
      rl.question('Digite o CÓDIGO IBGE CORRETO: ', (codigoIbge) => {
        
        console.log('\n🔄 Aplicando correção...\n');
        
        const result = db.prepare(`
          UPDATE clientes 
          SET cidade = ?, uf = ?, codigo_municipio = ?
          WHERE id = ?
        `).run(cidade, uf, codigoIbge, clienteId);
        
        if (result.changes > 0) {
          console.log('✅ Cliente atualizado com sucesso!\n');
          
          const clienteAtualizado = db.prepare('SELECT * FROM clientes WHERE id = ?').get(clienteId);
          
          console.log('📊 DADOS APÓS CORREÇÃO:\n');
          console.log(`   Razão Social: ${clienteAtualizado.razao_social}`);
          console.log(`   CEP: ${clienteAtualizado.cep}`);
          console.log(`   Cidade: ${clienteAtualizado.cidade}`);
          console.log(`   UF: ${clienteAtualizado.uf}`);
          console.log(`   Código IBGE: ${clienteAtualizado.codigo_municipio}`);
          console.log('');
          console.log('═'.repeat(70));
          console.log('\n✅ CORREÇÃO CONCLUÍDA!\n');
          console.log('💡 Agora você pode emitir NFe com os dados corretos.\n');
        } else {
          console.log('❌ Erro ao atualizar cliente!');
        }
        
        db.close();
        rl.close();
      });
    });
  });
});
