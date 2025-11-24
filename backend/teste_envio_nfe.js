const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');
const Database = require('better-sqlite3');
console.log('📤 TESTE DE ENVIO DE NFE\n');
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

// 2. XML de teste MÍNIMO
console.log('\n2️⃣ CRIANDO XML DE TESTE:');
const chave = '35251101234567000123550010000000011234567890';
const lote = Date.now().toString().slice(-15);
const nfeXML = `<NFe xmlns="http://www.portalfiscal.inf.br/nfe"><infNFe Id="NFe${chave}" versao="4.00"><ide><cUF>35</cUF><cNF>12345678</cNF><natOp>Venda</natOp><mod>55</mod><serie>1</serie><nNF>1</nNF><dhEmi>2025-11-24T10:00:00-03:00</dhEmi><tpNF>1</tpNF><idDest>1</idDest><cMunFG>3550308</cMunFG><tpImp>1</tpImp><tpEmis>1</tpEmis><cDV>0</cDV><tpAmb>2</tpAmb><finNFe>1</finNFe><indFinal>0</indFinal><indPres>1</indPres><procEmi>0</procEmi><verProc>1.0</verProc></ide><emit><CNPJ>01234567000123</CNPJ><xNome>EMPRESA TESTE LTDA</xNome><xFant>TESTE</xFant><enderEmit><xLgr>RUA TESTE</xLgr><nro>123</nro><xBairro>CENTRO</xBairro><cMun>3550308</cMun><xMun>SAO PAULO</xMun><UF>SP</UF><CEP>01000000</CEP><cPais>1058</cPais><xPais>BRASIL</xPais></enderEmit><IE>123456789012</IE><CRT>3</CRT></emit><dest><CNPJ>12345678000199</CNPJ><xNome>CLIENTE TESTE</xNome><enderDest><xLgr>RUA CLIENTE</xLgr><nro>456</nro><xBairro>CENTRO</xBairro><cMun>3550308</cMun><xMun>SAO PAULO</xMun><UF>SP</UF><CEP>02000000</CEP><cPais>1058</cPais><xPais>BRASIL</xPais></enderDest><indIEDest>9</indIEDest></dest><det nItem="1"><prod><cProd>1</cProd><cEAN>SEM GTIN</cEAN><xProd>PRODUTO TESTE</xProd><NCM>00000000</NCM><CFOP>5102</CFOP><uCom>UN</uCom><qCom>1.0000</qCom><vUnCom>100.0000000000</vUnCom><vProd>100.00</vProd><cEANTrib>SEM GTIN</cEANTrib><uTrib>UN</uTrib><qTrib>1.0000</qTrib><vUnTrib>100.0000000000</vUnTrib><indTot>1</indTot></prod><imposto><ICMS><ICMS00><orig>0</orig><CST>00</CST><modBC>3</modBC><vBC>0.00</vBC><pICMS>0.00</pICMS><vICMS>0.00</vICMS></ICMS00></ICMS><PIS><PISAliq><CST>01</CST><vBC>0.00</vBC><pPIS>0.00</pPIS><vPIS>0.00</vPIS></PISAliq></PIS><COFINS><COFINSAliq><CST>01</CST><vBC>0.00</vBC><pCOFINS>0.00</pCOFINS><vCOFINS>0.00</vCOFINS></COFINSAliq></COFINS></imposto></det><total><ICMSTot><vBC>0.00</vBC><vICMS>0.00</vICMS><vICMSDeson>0.00</vICMSDeson><vFCP>0.00</vFCP><vBCST>0.00</vBCST><vST>0.00</vST><vFCPST>0.00</vFCPST><vFCPSTRet>0.00</vFCPSTRet><vProd>100.00</vProd><vFrete>0.00</vFrete><vSeg>0.00</vSeg><vDesc>0.00</vDesc><vII>0.00</vII><vIPI>0.00</vIPI><vIPIDevol>0.00</vIPIDevol><vPIS>0.00</vPIS><vCOFINS>0.00</vCOFINS><vOutro>0.00</vOutro><vNF>100.00</vNF></ICMSTot></total><transp><modFrete>9</modFrete></transp><infAdic><infCpl>Nota Fiscal de Homologacao</infCpl></infAdic></infNFe></NFe>`;
const envelope = `<?xml version="1.0" encoding="UTF-8"?><soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"><soap12:Body><nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4"><enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><idLote>${lote}</idLote><indSinc>1</indSinc>${nfeXML}</enviNFe></nfeDadosMsg></soap12:Body></soap12:Envelope>`;
console.log('✅ XML criado');
console.log(`   Lote: ${lote}`);
console.log(`   Tamanho: ${envelope.length} bytes`);

// 3. Enviar para SEFAZ
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
  validateStatus: () => true // Aceitar qualquer status
}).then(response => {
  console.log(`\n✅ RESPOSTA RECEBIDA:`);
  console.log(`   Status HTTP: ${response.status}`);
  console.log(`   Content-Type: ${response.headers['content-type']}`);
  console.log(`   Tamanho: ${response.data.length} bytes`);
  console.log(`\n📄 CONTEÚDO DA RESPOSTA:`);
  console.log(response.data);
  if (response.status === 200) {
    console.log('\n✅✅✅ ENVIO BEM-SUCEDIDO!');
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