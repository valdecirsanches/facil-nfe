const https = require('https');
const axios = require('axios');
console.log('🔍 DIAGNÓSTICO DE CONECTIVIDADE SEFAZ\n');
console.log('═'.repeat(60));
const urls = {
  'SEFAZ SP Homologação': 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfestatusservico4.asmx',
  'Google (teste básico)': 'https://www.google.com',
  'Portal Fiscal': 'https://www.nfe.fazenda.gov.br'
};
async function testarURL(nome, url) {
  console.log(`\n📡 Testando: ${nome}`);
  console.log(`   URL: ${url}`);
  return new Promise(resolve => {
    const startTime = Date.now();
    https.get(url, {
      timeout: 10000,
      rejectUnauthorized: false
    }, res => {
      const duration = Date.now() - startTime;
      console.log(`   ✅ SUCESSO!`);
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Tempo: ${duration}ms`);
      resolve(true);
    }).on('error', err => {
      const duration = Date.now() - startTime;
      console.log(`   ❌ ERRO!`);
      console.log(`   Código: ${err.code}`);
      console.log(`   Mensagem: ${err.message}`);
      console.log(`   Tempo: ${duration}ms`);
      resolve(false);
    }).on('timeout', () => {
      console.log(`   ❌ TIMEOUT (10s)`);
      resolve(false);
    });
  });
}
async function testarSOAP() {
  console.log(`\n\n📨 TESTE DE REQUISIÇÃO SOAP COMPLETA`);
  console.log('═'.repeat(60));
  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4">
      <consStatServ xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
        <tpAmb>2</tpAmb>
        <cUF>35</cUF>
        <xServ>STATUS</xServ>
      </consStatServ>
    </nfeDadosMsg>
  </soap12:Body>
</soap12:Envelope>`;
  try {
    console.log('\n🔄 Enviando requisição SOAP...');
    const startTime = Date.now();
    const response = await axios.post('https://homologacao.nfe.fazenda.sp.gov.br/ws/nfestatusservico4.asmx', envelope, {
      timeout: 30000,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
        keepAlive: true
      }),
      headers: {
        'Content-Type': 'application/soap+xml; charset=utf-8',
        'SOAPAction': 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4',
        'User-Agent': 'NFe-System/1.0'
      }
    });
    const duration = Date.now() - startTime;
    console.log(`✅ RESPOSTA RECEBIDA!`);
    console.log(`   Status HTTP: ${response.status}`);
    console.log(`   Tempo: ${duration}ms`);
    console.log(`   Tamanho: ${response.data.length} bytes`);

    // Tentar extrair status da resposta
    if (response.data.includes('cStat')) {
      const match = response.data.match(/<cStat>(\d+)<\/cStat>/);
      const motivo = response.data.match(/<xMotivo>(.*?)<\/xMotivo>/);
      if (match) {
        console.log(`\n📊 STATUS SEFAZ:`);
        console.log(`   Código: ${match[1]}`);
        console.log(`   Mensagem: ${motivo ? motivo[1] : 'N/A'}`);
        if (match[1] === '107') {
          console.log(`   ✅ SEFAZ OPERACIONAL!`);
        }
      }
    }
  } catch (error) {
    console.log(`❌ ERRO NA REQUISIÇÃO SOAP!`);
    console.log(`   Código: ${error.code || 'N/A'}`);
    console.log(`   Mensagem: ${error.message}`);
    if (error.code === 'ENOTFOUND') {
      console.log(`\n💡 DIAGNÓSTICO:`);
      console.log(`   - Problema de DNS (não consegue resolver o domínio)`);
      console.log(`   - Possíveis causas:`);
      console.log(`     1. Sem conexão com internet`);
      console.log(`     2. Firewall bloqueando`);
      console.log(`     3. Proxy corporativo`);
      console.log(`     4. DNS configurado incorretamente`);
    } else if (error.code === 'ETIMEDOUT') {
      console.log(`\n💡 DIAGNÓSTICO:`);
      console.log(`   - Timeout na conexão`);
      console.log(`   - Possíveis causas:`);
      console.log(`     1. Firewall bloqueando porta 443`);
      console.log(`     2. SEFAZ temporariamente indisponível`);
      console.log(`     3. Conexão muito lenta`);
    }
  }
}
async function executarTestes() {
  console.log('\n1️⃣ TESTES DE CONECTIVIDADE BÁSICA\n');
  for (const [nome, url] of Object.entries(urls)) {
    await testarURL(nome, url);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  await testarSOAP();
  console.log('\n\n' + '═'.repeat(60));
  console.log('✅ TESTES CONCLUÍDOS\n');
}
executarTestes();