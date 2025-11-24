const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');
const Database = require('better-sqlite3');
console.log('📤 TESTE DE ENVIO DIRETO\n');
console.log('═'.repeat(60));
const empresaId = 1;

// Carregar certificado
const db = new Database(`./empresa_${empresaId}.db`);
const config = db.prepare('SELECT certificado_senha FROM configuracoes WHERE id = 1').get();
db.close();
const senha = config?.certificado_senha || '';
const certPath = path.join(__dirname, 'Arqs', `empresa_${empresaId}`, 'certificado.pfx');
const pfxBuffer = fs.readFileSync(certPath);
const httpsAgent = new https.Agent({
  pfx: pfxBuffer,
  passphrase: senha,
  rejectUnauthorized: false
});

// Ler XML mais recente
const logsDir = path.join(__dirname, 'Arqs', `empresa_${empresaId}`, 'logs');
const xmlFiles = fs.readdirSync(logsDir).filter(f => f.startsWith('debug_xml_')).sort().reverse();
const xmlPath = path.join(logsDir, xmlFiles[0]);
let nfeXML = fs.readFileSync(xmlPath, 'utf8');
console.log(`\n📄 XML: ${xmlFiles[0]}`);
console.log(`📏 Tamanho original: ${nfeXML.length} bytes`);

// REMOVER milissegundos da data (testar se é isso)
nfeXML = nfeXML.replace(/T(\d{2}:\d{2}:\d{2})\.\d{3}(-\d{2}:\d{2})/g, 'T$1$2');
console.log(`📏 Tamanho após ajuste: ${nfeXML.length} bytes`);

// Verificar dhEmi
const dhEmiMatch = nfeXML.match(/<dhEmi>(.*?)<\/dhEmi>/);
if (dhEmiMatch) {
  console.log(`📅 dhEmi: ${dhEmiMatch[1]}`);
}
const lote = Date.now().toString().slice(-15);
const envelope = `<?xml version="1.0" encoding="UTF-8"?><soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"><soap12:Body><nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4"><enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><idLote>${lote}</idLote><indSinc>1</indSinc>${nfeXML}</enviNFe></nfeDadosMsg></soap12:Body></soap12:Envelope>`;
console.log('\n📤 Enviando para SEFAZ...\n');
axios.post('https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx', envelope, {
  timeout: 30000,
  httpsAgent: httpsAgent,
  headers: {
    'Content-Type': 'application/soap+xml; charset=utf-8',
    'SOAPAction': 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4'
  },
  validateStatus: () => true
}).then(response => {
  console.log(`📊 Status HTTP: ${response.status}\n`);
  if (response.status === 200) {
    const cStatMatch = response.data.match(/<cStat>(\d+)<\/cStat>/g);
    const xMotivoMatch = response.data.match(/<xMotivo>(.*?)<\/xMotivo>/g);
    if (cStatMatch && xMotivoMatch) {
      console.log('📋 Códigos de status encontrados:');
      cStatMatch.forEach((stat, i) => {
        const codigo = stat.match(/\d+/)[0];
        const motivo = xMotivoMatch[i] ? xMotivoMatch[i].replace(/<\/?xMotivo>/g, '') : 'N/A';
        console.log(`   ${i + 1}. cStat ${codigo}: ${motivo}`);
        if (codigo === '100') {
          console.log('   ✅✅✅ AUTORIZADA!');
        } else if (codigo === '225') {
          console.log('   ❌ Falha no Schema XML');
        }
      });
    }
  }
  console.log('\n📄 Resposta completa (primeiros 1000 chars):');
  console.log(response.data.substring(0, 1000));
}).catch(error => {
  console.log(`\n❌ Erro: ${error.message}`);
});