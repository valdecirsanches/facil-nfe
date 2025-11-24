const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');
const Database = require('better-sqlite3');
console.log('📤 TESTE COM XML DO APP\n');
console.log('═'.repeat(60));
const empresaId = 1;

// 1. Carregar certificado
console.log('\n1️⃣ CARREGANDO CERTIFICADO:');
const db = new Database(`./empresa_${empresaId}.db`);
const config = db.prepare('SELECT certificado_senha FROM configuracoes WHERE id = 1').get();
db.close();
const senha = config?.certificado_senha || '';
const certPath = path.join(__dirname, 'Arqs', `empresa_${empresaId}`, 'certificado.pfx');
if (!fs.existsSync(certPath)) {
  console.log('❌ Certificado não encontrado');
  process.exit(1);
}
const pfxBuffer = fs.readFileSync(certPath);
const httpsAgent = new https.Agent({
  pfx: pfxBuffer,
  passphrase: senha,
  rejectUnauthorized: false
});
console.log('✅ Certificado carregado');

// 2. Ler XML mais recente do app
console.log('\n2️⃣ LENDO XML DO APP:');
const logsDir = path.join(__dirname, 'Arqs', `empresa_${empresaId}`, 'logs');
const xmlFiles = fs.readdirSync(logsDir).filter(f => f.startsWith('debug_xml_')).sort().reverse();
if (xmlFiles.length === 0) {
  console.log('❌ Nenhum XML encontrado');
  process.exit(1);
}
const xmlPath = path.join(logsDir, xmlFiles[0]);
const nfeXML = fs.readFileSync(xmlPath, 'utf8');
console.log(`✅ XML carregado: ${xmlFiles[0]}`);
console.log(`   Tamanho: ${nfeXML.length} bytes`);
const lote = Date.now().toString().slice(-15);

// 3. Criar envelope EXATAMENTE como o teste que funciona
const envelope = `<?xml version="1.0" encoding="UTF-8"?><soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"><soap12:Body><nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4"><enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><idLote>${lote}</idLote><indSinc>1</indSinc>${nfeXML}</enviNFe></nfeDadosMsg></soap12:Body></soap12:Envelope>`;
console.log(`   Tamanho envelope: ${envelope.length} bytes`);

// 4. Enviar para SEFAZ
console.log('\n3️⃣ ENVIANDO PARA SEFAZ:');
console.log('   URL: https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx');
axios.post('https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx', envelope, {
  timeout: 30000,
  httpsAgent: httpsAgent,
  headers: {
    'Content-Type': 'application/soap+xml; charset=utf-8',
    'SOAPAction': 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4',
    'User-Agent': 'Mozilla/5.0'
  },
  validateStatus: () => true
}).then(response => {
  console.log(`\n✅ RESPOSTA RECEBIDA:`);
  console.log(`   Status HTTP: ${response.status}`);
  console.log(`   Content-Type: ${response.headers['content-type']}`);
  console.log(`   Tamanho: ${response.data.length} bytes`);
  console.log(`\n📄 CONTEÚDO DA RESPOSTA:`);
  console.log(response.data);
  if (response.status === 200) {
    console.log('\n✅✅✅ SUCESSO!');
  } else {
    console.log(`\n❌ ERRO ${response.status}`);
  }
}).catch(error => {
  console.log(`\n❌ ERRO NA REQUISIÇÃO:`);
  console.log(`   Mensagem: ${error.message}`);
  console.log(`   Código: ${error.code}`);
  if (error.response) {
    console.log(`   Status: ${error.response.status}`);
    console.log(`   Data:`, error.response.data);
  }
});