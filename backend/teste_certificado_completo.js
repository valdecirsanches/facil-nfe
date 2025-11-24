const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const https = require('https');
const axios = require('axios');
console.log('🔐 TESTE COMPLETO DO CERTIFICADO\n');
console.log('═'.repeat(60));
const empresaId = 1;

// 1. Verificar se certificado existe
console.log('\n1️⃣ VERIFICANDO ARQUIVO DO CERTIFICADO:');
const certPath = path.join(__dirname, 'Arqs', `empresa_${empresaId}`, 'certificado.pfx');
console.log(`   Caminho: ${certPath}`);
if (fs.existsSync(certPath)) {
  const stats = fs.statSync(certPath);
  console.log(`   ✅ Arquivo encontrado!`);
  console.log(`   Tamanho: ${stats.size} bytes`);
  console.log(`   Modificado: ${stats.mtime}`);
} else {
  console.log(`   ❌ Arquivo NÃO encontrado!`);
  process.exit(1);
}

// 2. Verificar senha no banco
console.log('\n2️⃣ VERIFICANDO SENHA NO BANCO:');
const db = new Database(`./empresa_${empresaId}.db`);
const config = db.prepare('SELECT certificado_senha FROM configuracoes WHERE id = 1').get();
db.close();
const senha = config?.certificado_senha || '';
console.log(`   Senha configurada: ${senha ? 'Sim (***' + senha.slice(-3) + ')' : 'NÃO'}`);
if (!senha) {
  console.log(`   ⚠️  ATENÇÃO: Senha não configurada!`);
  console.log(`   Configure a senha em Config. Sistema`);
}

// 3. Testar carregamento do certificado
console.log('\n3️⃣ TESTANDO CARREGAMENTO DO CERTIFICADO:');
try {
  const pfxBuffer = fs.readFileSync(certPath);
  console.log(`   ✅ Certificado lido com sucesso`);
  console.log(`   Buffer size: ${pfxBuffer.length} bytes`);

  // Tentar criar agente HTTPS
  const httpsAgent = new https.Agent({
    pfx: pfxBuffer,
    passphrase: senha,
    rejectUnauthorized: false
  });
  console.log(`   ✅ Agente HTTPS criado com sucesso`);

  // 4. Testar conexão com SEFAZ
  console.log('\n4️⃣ TESTANDO CONEXÃO COM SEFAZ:');
  const envelope = `<?xml version="1.0" encoding="UTF-8"?><soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"><soap:Header/><soap:Body><nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4"><consStatServ xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><tpAmb>2</tpAmb><cUF>35</cUF><xServ>STATUS</xServ></consStatServ></nfeDadosMsg></soap:Body></soap:Envelope>`;
  console.log(`   🔄 Enviando requisição SOAP com certificado...`);
  axios.post('https://homologacao.nfe.fazenda.sp.gov.br/ws/nfestatusservico4.asmx', envelope, {
    timeout: 30000,
    httpsAgent: httpsAgent,
    headers: {
      'Content-Type': 'application/soap+xml; charset=utf-8',
      'User-Agent': 'Mozilla/5.0'
    }
  }).then(response => {
    console.log(`   ✅ SUCESSO! Status HTTP: ${response.status}`);
    console.log(`   Tamanho da resposta: ${response.data.length} bytes`);

    // Extrair status da resposta
    if (response.data.includes('cStat')) {
      const match = response.data.match(/<cStat>(\d+)<\/cStat>/);
      const motivo = response.data.match(/<xMotivo>(.*?)<\/xMotivo>/);
      if (match) {
        console.log(`\n   📊 STATUS SEFAZ:`);
        console.log(`   Código: ${match[1]}`);
        console.log(`   Mensagem: ${motivo ? motivo[1] : 'N/A'}`);
        if (match[1] === '107') {
          console.log(`\n   ✅✅✅ SEFAZ OPERACIONAL! ✅✅✅`);
        }
      }
    }
    console.log('\n' + '═'.repeat(60));
    console.log('✅ CERTIFICADO FUNCIONANDO PERFEITAMENTE!\n');
  }).catch(error => {
    console.log(`   ❌ ERRO: ${error.message}`);
    if (error.response) {
      console.log(`   Status HTTP: ${error.response.status}`);
      console.log(`   Headers:`, error.response.headers);
    }
    if (error.code === 'ERR_BAD_REQUEST' && error.response?.status === 403) {
      console.log(`\n   💡 DIAGNÓSTICO:`);
      console.log(`   - Erro 403 = Acesso negado`);
      console.log(`   - Possíveis causas:`);
      console.log(`     1. Senha do certificado incorreta`);
      console.log(`     2. Certificado expirado ou inválido`);
      console.log(`     3. Certificado não é de homologação`);
      console.log(`\n   🔧 SOLUÇÃO:`);
      console.log(`   1. Verifique a senha do certificado em Config. Sistema`);
      console.log(`   2. Confirme que o certificado é válido para homologação`);
      console.log(`   3. Verifique a data de validade do certificado`);
    }
    console.log('\n' + '═'.repeat(60));
    console.log('❌ CERTIFICADO COM PROBLEMAS\n');
  });
} catch (error) {
  console.log(`   ❌ Erro ao carregar certificado: ${error.message}`);
  if (error.message.includes('asn1 encoding')) {
    console.log(`\n   💡 DIAGNÓSTICO: Senha incorreta ou arquivo corrompido`);
  }
}