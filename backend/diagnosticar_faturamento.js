const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
console.log('🔍 DIAGNÓSTICO COMPLETO - FATURAMENTO\n');
console.log('='.repeat(60));

// 1. Verificar se tabela financeiro existe
console.log('\n1️⃣  VERIFICANDO TABELA FINANCEIRO...');
try {
  const dbPath = path.join(__dirname, 'empresa_1.db');
  if (!fs.existsSync(dbPath)) {
    console.log('❌ Banco de dados não encontrado:', dbPath);
  } else {
    const db = new Database(dbPath);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='financeiro'").all();
    if (tables.length > 0) {
      console.log('✅ Tabela financeiro existe');
      const columns = db.prepare('PRAGMA table_info(financeiro)').all();
      console.log('   Colunas:', columns.map(c => c.name).join(', '));
    } else {
      console.log('❌ Tabela financeiro NÃO existe');
      console.log('   Execute: node criar_tabela_financeiro.js');
    }
    db.close();
  }
} catch (error) {
  console.log('❌ Erro ao verificar tabela:', error.message);
}

// 2. Verificar rotas no server.js
console.log('\n2️⃣  VERIFICANDO ROTAS NO SERVER.JS...');
try {
  const serverPath = path.join(__dirname, 'server.js');
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  const faturarMatches = serverContent.match(/app\.put\(['"]\/api\/empresas\/:empresaId\/pedidos\/:id\/faturar['"]/g) || [];
  const desfaturarMatches = serverContent.match(/app\.put\(['"]\/api\/empresas\/:empresaId\/pedidos\/:id\/desfaturar['"]/g) || [];
  console.log(`   Rota /faturar: ${faturarMatches.length} vez(es)`);
  console.log(`   Rota /desfaturar: ${desfaturarMatches.length} vez(es)`);
  if (faturarMatches.length === 0) {
    console.log('❌ Rota /faturar NÃO encontrada!');
    console.log('   Execute: node adicionar_rotas_faturamento.js');
  } else if (faturarMatches.length > 1) {
    console.log('⚠️  Rotas DUPLICADAS encontradas!');
    console.log('   Execute: node remover_rotas_duplicadas.js');
  } else {
    console.log('✅ Rotas corretas (sem duplicatas)');
  }

  // Mostrar linhas onde as rotas estão
  const lines = serverContent.split('\n');
  lines.forEach((line, index) => {
    if (line.includes("app.put('/api/empresas/:empresaId/pedidos/:id/faturar'") || line.includes('app.put("/api/empresas/:empresaId/pedidos/:id/faturar"')) {
      console.log(`   Linha ${index + 1}: /faturar`);
    }
    if (line.includes("app.put('/api/empresas/:empresaId/pedidos/:id/desfaturar'") || line.includes('app.put("/api/empresas/:empresaId/pedidos/:id/desfaturar"')) {
      console.log(`   Linha ${index + 1}: /desfaturar`);
    }
  });
} catch (error) {
  console.log('❌ Erro ao verificar server.js:', error.message);
}

// 3. Verificar se backend está rodando
console.log('\n3️⃣  VERIFICANDO SE BACKEND ESTÁ RODANDO...');
const http = require('http');
const checkServer = () => {
  return new Promise(resolve => {
    const req = http.get('http://localhost:5300', res => {
      resolve(true);
    });
    req.on('error', () => {
      resolve(false);
    });
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
};
checkServer().then(isRunning => {
  if (isRunning) {
    console.log('✅ Backend está rodando na porta 5300');
  } else {
    console.log('❌ Backend NÃO está rodando!');
    console.log('   Execute: npm start');
  }

  // 4. Resumo e próximos passos
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 RESUMO E PRÓXIMOS PASSOS:\n');
  const serverContent = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
  const faturarCount = (serverContent.match(/app\.put\(['"]\/api\/empresas\/:empresaId\/pedidos\/:id\/faturar['"]/g) || []).length;
  const dbPath = path.join(__dirname, 'empresa_1.db');
  let hasTable = false;
  if (fs.existsSync(dbPath)) {
    const db = new Database(dbPath);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='financeiro'").all();
    hasTable = tables.length > 0;
    db.close();
  }
  if (!hasTable) {
    console.log('1. ❌ Criar tabela financeiro:');
    console.log('   node criar_tabela_financeiro.js\n');
  }
  if (faturarCount === 0) {
    console.log('2. ❌ Adicionar rotas:');
    console.log('   node adicionar_rotas_faturamento.js\n');
  } else if (faturarCount > 1) {
    console.log('2. ⚠️  Remover duplicatas:');
    console.log('   node remover_rotas_duplicadas.js\n');
  }
  if (!isRunning) {
    console.log('3. ❌ Reiniciar backend:');
    console.log('   npm start\n');
  }
  if (hasTable && faturarCount === 1 && isRunning) {
    console.log('✅ TUDO CERTO! Backend pronto para faturamento.');
    console.log('\n   Teste agora no navegador:');
    console.log('   1. Ctrl+Shift+R para limpar cache');
    console.log('   2. Vá em Pedidos');
    console.log('   3. Clique em "Faturar"');
  }
  console.log('\n' + '='.repeat(60));
});