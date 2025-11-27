const http = require('http');

console.log('\n🧪 INICIANDO TESTES DE FATURAMENTO...\n');

function testarRota(method, path, body = {}) {
  return new Promise(resolve => {

    const data = JSON.stringify(body);

    const options = {
      hostname: 'localhost',
      port: 5300,
      path,
      method,
      timeout: 3000,
      headers: {
        'Authorization': 'Bearer fake-token-for-test',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, res => {

      console.log(`➡️  ${method} ${path}`);
      console.log(`   🔢 Status: ${res.statusCode}`);

      let resposta = '';

      res.on('data', chunk => resposta += chunk);

      res.on('end', () => {
        if (res.statusCode === 404) {
          console.log('   ❌ ROTA NÃO ENCONTRADA!\n');
        } else if (res.statusCode === 401) {
          console.log('   ✅ Rota existe! (401 é esperado, já que o token é fake)\n');
        } else {
          console.log('   ✅ Respondeu OK com status', res.statusCode);
          console.log('   📦 Resposta:', resposta, '\n');
        }
        resolve();
      });
    });

    req.on('timeout', () => {
      console.log(`⏳ Tempo esgotado para ${method} ${path}\n`);
      req.destroy();
      resolve();
    });

    req.on('error', err => {
      console.log(`🔥 Erro na requisição: ${err.message}\n`);
      resolve();
    });

    req.write(data); // inclui body mesmo que vazio
    req.end();
  });
}

async function executarTestes() {
  console.log('='.repeat(60));
  console.log('🚀 TESTANDO ROTAS DE FATURAMENTO');
  console.log('='.repeat(60), '\n');

  // Com body vazio (PUT normalmente espera algo)
  const corpoFake = { motivo: "teste-automatizado" };

  await testarRota('PUT', '/api/empresas/1/pedidos/1/faturar', corpoFake);
  await testarRota('PUT', '/api/empresas/1/pedidos/1/desfaturar', corpoFake);

  console.log('='.repeat(60));
  console.log('\n📌 RESULTADOS ESPERADOS:');
  console.log('✔ 401 = Rota existe (token fake, tudo certo)');
  console.log('❌ 404 = Rota NÃO existe ou caminho errado\n');
  console.log('DICA: Se der 404, rodar: node adicionar_rotas_faturamento.js\n');
}

executarTestes();
