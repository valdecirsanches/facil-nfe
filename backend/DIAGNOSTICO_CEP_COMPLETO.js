const Database = require('better-sqlite3');
const fs = require('fs');
console.log('🔍 DIAGNÓSTICO COMPLETO - PROBLEMA DO CEP\n');
console.log('═'.repeat(70));

// 1. Verificar tipo de dados no banco
console.log('\n📊 1. VERIFICANDO SCHEMA DO BANCO\n');
const mainDb = new Database('./principal.db');
const empresasSchema = mainDb.prepare("PRAGMA table_info(empresas)").all();
const cepColumn = empresasSchema.find(col => col.name === 'cep');
console.log('Coluna CEP na tabela empresas:');
console.log(`   Tipo: ${cepColumn.type}`);
console.log(`   Permite NULL: ${cepColumn.notnull === 0 ? 'Sim' : 'Não'}`);
console.log(`   Valor padrão: ${cepColumn.dflt_value || '(nenhum)'}`);

// 2. Verificar CEPs existentes
console.log('\n📊 2. VERIFICANDO CEPs EXISTENTES\n');
const empresas = mainDb.prepare('SELECT id, razao_social, cep, typeof(cep) as tipo_cep FROM empresas').all();
empresas.forEach(emp => {
  const cep = emp.cep;
  const tipo = emp.tipo_cep;
  const tamanho = cep ? String(cep).length : 0;
  console.log(`Empresa ${emp.id}: ${emp.razao_social}`);
  console.log(`   CEP: "${cep}"`);
  console.log(`   Tipo no banco: ${tipo}`);
  console.log(`   Tamanho: ${tamanho} caracteres`);
  console.log(`   typeof em JS: ${typeof cep}`);
  if (cep && tamanho < 8) {
    console.log(`   ⚠️  PROBLEMA: CEP com menos de 8 dígitos!`);
  }
  console.log('');
});
mainDb.close();

// 3. Verificar bancos de empresas
console.log('\n📊 3. VERIFICANDO BANCOS DE EMPRESAS\n');
const arquivos = fs.readdirSync(__dirname);
const bancosDados = arquivos.filter(f => f.startsWith('empresa_') && f.endsWith('.db'));
bancosDados.forEach(arquivo => {
  const empresaId = arquivo.match(/empresa_(\d+)\.db/)[1];
  console.log(`\n🏢 Empresa ${empresaId}:`);
  try {
    const db = new Database(`./${arquivo}`);

    // Verificar schema
    const clientesSchema = db.prepare("PRAGMA table_info(clientes)").all();
    const cepCol = clientesSchema.find(col => col.name === 'cep');
    console.log(`   Schema CEP: ${cepCol.type}`);

    // Verificar dados
    const clientes = db.prepare('SELECT id, razao_social, cep, typeof(cep) as tipo_cep FROM clientes LIMIT 3').all();
    clientes.forEach(cli => {
      const cep = cli.cep;
      const tamanho = cep ? String(cep).length : 0;
      console.log(`   Cliente ${cli.id}: CEP="${cep}" (${cli.tipo_cep}, ${tamanho} chars)`);
      if (cep && tamanho < 8) {
        console.log(`      ⚠️  PROBLEMA DETECTADO!`);
      }
    });
    db.close();
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }
});

// 4. Análise de possíveis causas
console.log('\n' + '═'.repeat(70));
console.log('\n🔍 ANÁLISE DE POSSÍVEIS CAUSAS:\n');
console.log('1. CONVERSÃO IMPLÍCITA NO SQLITE:');
console.log('   - SQLite pode converter "06056230" para número 6056230');
console.log('   - Isso acontece se o valor for passado como número no JavaScript\n');
console.log('2. CONVERSÃO NO BACKEND (server.js):');
console.log('   - Se req.body.cep vier como número do frontend');
console.log('   - Se houver parseInt(cep) ou Number(cep) em algum lugar\n');
console.log('3. CONVERSÃO NO FRONTEND:');
console.log('   - Se o input type="number" (deve ser type="text")');
console.log('   - Se houver conversão antes de enviar para API\n');
console.log('═'.repeat(70));
console.log('\n💡 RECOMENDAÇÕES:\n');
console.log('1. ✅ Garantir que CEP seja SEMPRE string no server.js:');
console.log('   req.body.cep = String(req.body.cep || "");\n');
console.log('2. ✅ Usar prepared statements corretamente:');
console.log('   db.prepare("INSERT ... VALUES (?)").run(String(cep));\n');
console.log('3. ✅ Validar tipo antes de salvar:');
console.log('   if (typeof cep !== "string") cep = String(cep);\n');
console.log('4. ✅ Executar script de correção:');
console.log('   node CORRIGIR_CEP_BANCO_FINAL.js\n');
console.log('═'.repeat(70) + '\n');