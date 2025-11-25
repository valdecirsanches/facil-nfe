const Database = require('better-sqlite3');

console.log('🔍 VERIFICANDO DADOS DE CEP - EMPRESA vs CLIENTE\n');
console.log('═'.repeat(70));

// 1. Verificar dados da EMPRESA (emitente)
console.log('\n📊 1. DADOS DA EMPRESA (EMITENTE)\n');

const mainDb = new Database('./principal.db');
const empresas = mainDb.prepare('SELECT id, razao_social, cep, cidade, estado, codigo_municipio FROM empresas').all();

empresas.forEach(empresa => {
  console.log(`🏢 Empresa ${empresa.id}: ${empresa.razao_social}`);
  console.log(`   CEP: ${empresa.cep || '(vazio)'}`);
  console.log(`   Cidade: ${empresa.cidade || '(vazio)'}`);
  console.log(`   Estado: ${empresa.estado || '(vazio)'}`);
  console.log(`   Código IBGE: ${empresa.codigo_municipio || '(vazio)'}`);
  console.log('');
});

mainDb.close();

// 2. Verificar dados dos CLIENTES (destinatários)
console.log('\n👥 2. DADOS DOS CLIENTES (DESTINATÁRIOS)\n');

const db1 = new Database('./empresa_1.db');
const clientes = db1.prepare('SELECT id, razao_social, cep, cidade, uf, codigo_municipio FROM clientes').all();

console.log(`Total de clientes: ${clientes.length}\n`);

clientes.forEach(cliente => {
  console.log(`👤 Cliente ${cliente.id}: ${cliente.razao_social}`);
  console.log(`   CEP: ${cliente.cep || '(vazio)'}`);
  console.log(`   Cidade: ${cliente.cidade || '(vazio)'}`);
  console.log(`   UF: ${cliente.uf || '(vazio)'}`);
  console.log(`   Código IBGE: ${cliente.codigo_municipio || '(vazio)'}`);
  
  // Verificar se CEP 06150495 está correto
  if (cliente.cep === '06150495' || cliente.cep === '6150495') {
    console.log(`   ⚠️  ATENÇÃO: Este CEP é de Carapicuíba, não Osasco!`);
    console.log(`   📍 Cidade atual no banco: ${cliente.cidade}`);
    console.log(`   📍 Cidade CORRETA: Carapicuíba`);
    console.log(`   📍 Código IBGE CORRETO: 3510609`);
  }
  
  console.log('');
});

db1.close();

// 3. Testar API ViaCEP
console.log('\n🌐 3. TESTANDO API VIACEP\n');

const https = require('https');

function buscarCEP(cep) {
  return new Promise((resolve, reject) => {
    https.get(`https://viacep.com.br/ws/${cep}/json/`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

(async () => {
  try {
    console.log('Testando CEP 06150495...\n');
    const resultado = await buscarCEP('06150495');
    
    console.log('📋 Resposta da API ViaCEP:');
    console.log(`   CEP: ${resultado.cep}`);
    console.log(`   Logradouro: ${resultado.logradouro}`);
    console.log(`   Bairro: ${resultado.bairro}`);
    console.log(`   Cidade: ${resultado.localidade}`);
    console.log(`   UF: ${resultado.uf}`);
    console.log(`   Código IBGE: ${resultado.ibge}`);
    
    if (resultado.localidade !== 'Carapicuíba') {
      console.log(`\n   ❌ ERRO: API retornou cidade errada!`);
      console.log(`   Esperado: Carapicuíba`);
      console.log(`   Recebido: ${resultado.localidade}`);
    } else {
      console.log(`\n   ✅ API ViaCEP está correta!`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar CEP:', error.message);
  }
  
  console.log('\n' + '═'.repeat(70));
  console.log('\n📊 DIAGNÓSTICO:\n');
  console.log('Se a API ViaCEP retornar Carapicuíba mas o banco mostrar Osasco,');
  console.log('o problema está no frontend não aplicando os dados corretamente.\n');
  console.log('Se a API ViaCEP retornar Osasco, o problema é da própria API.\n');
  console.log('═'.repeat(70) + '\n');
})();
