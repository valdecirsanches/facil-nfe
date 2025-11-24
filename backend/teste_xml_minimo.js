const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');
const Database = require('better-sqlite3');
console.log('📤 TESTE COM XML MINIMALISTA\n');
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

// XML MINIMALISTA baseado na NFe aprovada
// Removendo TODOS os campos opcionais
const nfeXML = `<NFe xmlns="http://www.portalfiscal.inf.br/nfe"><infNFe Id="NFe35251167570036000181550010000000111234567890" versao="4.00"><ide><cUF>35</cUF><cNF>12345678</cNF><natOp>VENDA</natOp><mod>55</mod><serie>1</serie><nNF>11</nNF><dhEmi>2025-11-24T10:00:00-03:00</dhEmi><tpNF>1</tpNF><idDest>1</idDest><cMunFG>3550308</cMunFG><tpImp>1</tpImp><tpEmis>1</tpEmis><cDV>0</cDV><tpAmb>2</tpAmb><finNFe>1</finNFe><indFinal>0</indFinal><indPres>1</indPres><procEmi>0</procEmi><verProc>1.0</verProc></ide><emit><CNPJ>67570036000181</CNPJ><xNome>EDS Informatica ltda ME</xNome><xFant>EDSSolution Tecnologia</xFant><enderEmit><xLgr>Rua Paulo Aparecido Pereira</xLgr><nro>365</nro><xBairro>Centro</xBairro><cMun>3550308</cMun><xMun>Osasco</xMun><UF>SP</UF><CEP>06056230</CEP><cPais>1058</cPais><xPais>Brasil</xPais></enderEmit><IE>123123123</IE><CRT>3</CRT></emit><dest><CNPJ>30511823000142</CNPJ><xNome>CLIENTE TESTE</xNome><enderDest><xLgr>Rua Teste</xLgr><nro>123</nro><xBairro>Centro</xBairro><cMun>3550308</cMun><xMun>Osasco</xMun><UF>SP</UF><CEP>06150495</CEP><cPais>1058</cPais><xPais>Brasil</xPais></enderDest><indIEDest>9</indIEDest></dest><det nItem="1"><prod><cProd>1</cProd><cEAN>SEM GTIN</cEAN><xProd>PRODUTO TESTE</xProd><NCM>19059090</NCM><CFOP>5102</CFOP><uCom>UN</uCom><qCom>1.0000</qCom><vUnCom>100.0000000000</vUnCom><vProd>100.00</vProd><cEANTrib>SEM GTIN</cEANTrib><uTrib>UN</uTrib><qTrib>1.0000</qTrib><vUnTrib>100.0000000000</vUnTrib><indTot>1</indTot></prod><imposto><ICMS><ICMS00><orig>0</orig><CST>00</CST><modBC>3</modBC><vBC>0.00</vBC><pICMS>0.00</pICMS><vICMS>0.00</vICMS></ICMS00></ICMS><IPI><cEnq>999</cEnq><IPINT><CST>53</CST></IPINT></IPI><PIS><PISNT><CST>06</CST></PISNT></PIS><COFINS><COFINSNT><CST>06</CST></COFINSNT></COFINS></imposto></det><total><ICMSTot><vBC>0.00</vBC><vICMS>0.00</vICMS><vICMSDeson>0.00</vICMSDeson><vFCP>0.00</vFCP><vBCST>0.00</vBCST><vST>0.00</vST><vFCPST>0.00</vFCPST><vFCPSTRet>0.00</vFCPSTRet><vProd>100.00</vProd><vFrete>0.00</vFrete><vSeg>0.00</vSeg><vDesc>0.00</vDesc><vII>0.00</vII><vIPI>0.00</vIPI><vIPIDevol>0.00</vIPIDevol><vPIS>0.00</vPIS><vCOFINS>0.00</vCOFINS><vOutro>0.00</vOutro><vNF>100.00</vNF></ICMSTot></total><transp><modFrete>9</modFrete></transp></infNFe></NFe>`;
console.log(`\n📏 Tamanho: ${nfeXML.length} bytes`);
console.log(`📋 Número NFe: 11 (sem zeros à esquerda)`);
console.log(`📅 Data: 2025-11-24T10:00:00-03:00 (sem milissegundos)`);
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
      console.log('📋 Códigos de status:');
      cStatMatch.forEach((stat, i) => {
        const codigo = stat.match(/\d+/)[0];
        const motivo = xMotivoMatch[i] ? xMotivoMatch[i].replace(/<\/?xMotivo>/g, '') : 'N/A';
        console.log(`   ${i + 1}. cStat ${codigo}: ${motivo}`);
        if (codigo === '100') {
          console.log('   ✅✅✅ AUTORIZADA! O PROBLEMA ESTÁ EM ALGUM CAMPO ESPECÍFICO!');
        } else if (codigo === '225') {
          console.log('   ❌ Ainda falha no Schema - problema estrutural');
        } else if (codigo === '539') {
          console.log('   ⚠️  CNPJ emitente não cadastrado (normal em homologação)');
        }
      });
    }
  }
  console.log('\n📄 Resposta (primeiros 800 chars):');
  console.log(response.data.substring(0, 800));
}).catch(error => {
  console.log(`\n❌ Erro: ${error.message}`);
});