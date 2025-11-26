const Database = require('better-sqlite3');
console.log('🔍 DIAGNÓSTICO DO SISTEMA DE PLANOS\n');
console.log('='.repeat(60));
try {
  // 1. Verificar banco principal
  console.log('\n1️⃣ VERIFICANDO BANCO PRINCIPAL (principal.db)...\n');
  const mainDb = new Database('./principal.db');

  // Verificar tabela planos
  const tabelaPlanos = mainDb.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='planos'
  `).get();
  if (tabelaPlanos) {
    console.log('   ✅ Tabela "planos" existe');

    // Contar planos
    const countPlanos = mainDb.prepare('SELECT COUNT(*) as count FROM planos').get();
    console.log(`   ✅ ${countPlanos.count} planos cadastrados`);

    // Listar planos
    if (countPlanos.count > 0) {
      const planos = mainDb.prepare('SELECT * FROM planos').all();
      console.log('\n   📋 Planos cadastrados:');
      planos.forEach(p => {
        console.log(`      ${p.id}. ${p.nome} - R$ ${p.preco_mensal} - ${p.limite_nfes} NFes/mês`);
      });
    } else {
      console.log('   ⚠️  PROBLEMA: Nenhum plano cadastrado!');
      console.log('   💡 Execute: node add_im_plano_columns.js');
    }
  } else {
    console.log('   ❌ PROBLEMA: Tabela "planos" NÃO existe!');
    console.log('   💡 Execute: node add_im_plano_columns.js');
  }

  // Verificar colunas da tabela empresas
  console.log('\n2️⃣ VERIFICANDO TABELA EMPRESAS...\n');
  const colunasEmpresas = mainDb.pragma('table_info(empresas)');
  const hasIM = colunasEmpresas.some(col => col.name === 'im');
  const hasPlanoId = colunasEmpresas.some(col => col.name === 'plano_id');
  console.log(`   ${hasIM ? '✅' : '❌'} Coluna "im" ${hasIM ? 'existe' : 'NÃO existe'}`);
  console.log(`   ${hasPlanoId ? '✅' : '❌'} Coluna "plano_id" ${hasPlanoId ? 'existe' : 'NÃO existe'}`);
  if (!hasIM || !hasPlanoId) {
    console.log('\n   ⚠️  PROBLEMA: Colunas faltando!');
    console.log('   💡 Execute: node add_im_plano_columns.js');
  }

  // Verificar empresas existentes
  const empresas = mainDb.prepare('SELECT id, razao_social, plano_id FROM empresas').all();
  if (empresas.length > 0) {
    console.log(`\n   📊 ${empresas.length} empresa(s) cadastrada(s):`);
    empresas.forEach(e => {
      console.log(`      Empresa #${e.id}: ${e.razao_social} - Plano ID: ${e.plano_id || 'NULL'}`);
    });
  }
  mainDb.close();

  // 3. Verificar server.js
  console.log('\n3️⃣ VERIFICANDO SERVER.JS...\n');
  const fs = require('fs');
  const serverContent = fs.readFileSync('./server.js', 'utf8');
  const hasRotaPlanos = serverContent.includes("app.get('/api/planos'");
  const hasRotaLimites = serverContent.includes("app.get('/api/empresas/:empresaId/limites'");
  console.log(`   ${hasRotaPlanos ? '✅' : '❌'} Rota GET /api/planos ${hasRotaPlanos ? 'existe' : 'NÃO existe'}`);
  console.log(`   ${hasRotaLimites ? '✅' : '❌'} Rota GET /api/empresas/:id/limites ${hasRotaLimites ? 'existe' : 'NÃO existe'}`);
  if (!hasRotaPlanos || !hasRotaLimites) {
    console.log('\n   ⚠️  PROBLEMA: Rotas faltando no server.js!');
    console.log('   💡 Atualize o server.js com as rotas de planos');
  }

  // 4. Verificar arquivos frontend
  console.log('\n4️⃣ VERIFICANDO ARQUIVOS FRONTEND...\n');
  const hasPlanSelection = fs.existsSync('../components/PlanSelection.tsx');
  console.log(`   ${hasPlanSelection ? '✅' : '❌'} components/PlanSelection.tsx ${hasPlanSelection ? 'existe' : 'NÃO existe'}`);
  if (fs.existsSync('../pages/Register.tsx')) {
    const registerContent = fs.readFileSync('../pages/Register.tsx', 'utf8');
    const hasImportPlanSelection = registerContent.includes("import { PlanSelection }");
    const hasStepPlan = registerContent.includes("step === 'plan'");
    console.log(`   ${hasImportPlanSelection ? '✅' : '❌'} Register.tsx importa PlanSelection ${hasImportPlanSelection ? 'sim' : 'NÃO'}`);
    console.log(`   ${hasStepPlan ? '✅' : '❌'} Register.tsx tem step 'plan' ${hasStepPlan ? 'sim' : 'NÃO'}`);
    if (!hasImportPlanSelection || !hasStepPlan) {
      console.log('\n   ⚠️  PROBLEMA: Register.tsx não foi atualizado corretamente!');
    }
  } else {
    console.log('   ❌ pages/Register.tsx NÃO existe!');
  }
  if (fs.existsSync('../components/CompanyRegistration.tsx')) {
    const companyRegContent = fs.readFileSync('../components/CompanyRegistration.tsx', 'utf8');
    const hasPlanIdProp = companyRegContent.includes('planId:');
    const hasIMField = companyRegContent.includes('Inscrição Municipal');
    console.log(`   ${hasPlanIdProp ? '✅' : '❌'} CompanyRegistration aceita planId ${hasPlanIdProp ? 'sim' : 'NÃO'}`);
    console.log(`   ${hasIMField ? '✅' : '❌'} CompanyRegistration tem campo IM ${hasIMField ? 'sim' : 'NÃO'}`);
  }

  // 5. Teste de API
  console.log('\n5️⃣ TESTANDO API (se backend estiver rodando)...\n');
  const http = require('http');
  const testAPI = (path, callback) => {
    const options = {
      hostname: 'localhost',
      port: 5300,
      path: path,
      method: 'GET'
    };
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        callback(null, res.statusCode, data);
      });
    });
    req.on('error', error => {
      callback(error);
    });
    req.setTimeout(2000, () => {
      req.destroy();
      callback(new Error('Timeout'));
    });
    req.end();
  };
  testAPI('/api/planos', (error, statusCode, data) => {
    if (error) {
      console.log('   ⚠️  Backend não está rodando ou não responde');
      console.log('   💡 Inicie o backend: cd backend && npm start');
    } else if (statusCode === 200) {
      try {
        const planos = JSON.parse(data);
        console.log(`   ✅ API /api/planos funcionando - ${planos.length} planos retornados`);
      } catch (e) {
        console.log('   ❌ API retornou resposta inválida');
      }
    } else {
      console.log(`   ❌ API retornou status ${statusCode}`);
    }

    // Resumo final
    console.log('\n' + '='.repeat(60));
    console.log('\n📋 RESUMO DO DIAGNÓSTICO:\n');
    if (!tabelaPlanos) {
      console.log('❌ PROBLEMA CRÍTICO: Tabela planos não existe');
      console.log('   👉 SOLUÇÃO: Execute "node add_im_plano_columns.js"');
    } else if (countPlanos.count === 0) {
      console.log('❌ PROBLEMA: Tabela planos existe mas está vazia');
      console.log('   👉 SOLUÇÃO: Execute "node add_im_plano_columns.js"');
    } else if (!hasPlanoId) {
      console.log('❌ PROBLEMA: Coluna plano_id não existe na tabela empresas');
      console.log('   👉 SOLUÇÃO: Execute "node add_im_plano_columns.js"');
    } else if (!hasRotaPlanos) {
      console.log('❌ PROBLEMA: Rotas de planos não existem no server.js');
      console.log('   👉 SOLUÇÃO: Atualize o server.js com as rotas de planos');
    } else if (!hasPlanSelection) {
      console.log('❌ PROBLEMA: Componente PlanSelection.tsx não existe');
      console.log('   👉 SOLUÇÃO: Crie o arquivo components/PlanSelection.tsx');
    } else {
      console.log('✅ Estrutura básica parece OK!');
      console.log('   Se ainda não funciona, verifique:');
      console.log('   1. Backend está rodando? (npm start)');
      console.log('   2. Frontend foi reiniciado?');
      console.log('   3. Console do navegador tem erros?');
    }
    console.log('\n' + '='.repeat(60));
    console.log('\n');
  });
} catch (error) {
  console.error('\n❌ ERRO NO DIAGNÓSTICO:', error.message);
  console.error(error.stack);
}