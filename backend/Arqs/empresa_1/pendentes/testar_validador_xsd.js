const ValidadorXSD = require('../../../validador_xsd_oficial');
const fs = require('fs');
const path = require('path');

console.log('🧪 TESTANDO VALIDADOR XSD\n');
console.log('═'.repeat(70));

// Procurar XMLs existentes
function encontrarXMLs() {
  const xmls = [];
  const arqsPath = path.join(__dirname, 'Arqs');
  
  if (!fs.existsSync(arqsPath)) {
    console.log('⚠️  Pasta Arqs não encontrada');
    return xmls;
  }
  
  // Procurar em todas as empresas
  const empresas = fs.readdirSync(arqsPath).filter(f => f.startsWith('empresa_'));
  
  empresas.forEach(empresa => {
    const nfePath = path.join(arqsPath, empresa, 'NFe');
    
    if (fs.existsSync(nfePath)) {
      const arquivos = fs.readdirSync(nfePath).filter(f => f.endsWith('-nfe.xml'));
      
      arquivos.forEach(arquivo => {
        xmls.push({
          empresa,
          arquivo,
          caminho: path.join(nfePath, arquivo)
        });
      });
    }
  });
  
  return xmls;
}

// Criar XML de teste se não existir nenhum
function criarXMLTeste() {
  console.log('\n📝 Criando XML de teste...\n');
  
  const xmlTeste = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe Id="NFe35240100000000000001550010000000011000000011" versao="4.00">
    <ide>
      <cUF>35</cUF>
      <cNF>00000001</cNF>
      <natOp>Venda de mercadoria</natOp>
      <mod>55</mod>
      <serie>1</serie>
      <nNF>1</nNF>
      <dhEmi>2024-01-15T10:30:00-03:00</dhEmi>
      <tpNF>1</tpNF>
      <idDest>1</idDest>
      <cMunFG>3534401</cMunFG>
      <tpImp>1</tpImp>
      <tpEmis>1</tpEmis>
      <cDV>1</cDV>
      <tpAmb>2</tpAmb>
      <finNFe>1</finNFe>
      <indFinal>0</indFinal>
      <indPres>1</indPres>
      <procEmi>0</procEmi>
      <verProc>1.0</verProc>
    </ide>
    <emit>
      <CNPJ>00000000000100</CNPJ>
      <xNome>EMPRESA TESTE LTDA</xNome>
      <xFant>Empresa Teste</xFant>
      <enderEmit>
        <xLgr>Rua Teste</xLgr>
        <nro>123</nro>
        <xBairro>Centro</xBairro>
        <cMun>3534401</cMun>
        <xMun>Osasco</xMun>
        <UF>SP</UF>
        <CEP>06150000</CEP>
        <cPais>1058</cPais>
        <xPais>Brasil</xPais>
      </enderEmit>
      <IE>123456789012</IE>
      <CRT>1</CRT>
    </emit>
    <dest>
      <CNPJ>00000000000200</CNPJ>
      <xNome>CLIENTE TESTE LTDA</xNome>
      <enderDest>
        <xLgr>Rua Cliente</xLgr>
        <nro>456</nro>
        <xBairro>Centro</xBairro>
        <cMun>3534401</cMun>
        <xMun>Osasco</xMun>
        <UF>SP</UF>
        <CEP>06150000</CEP>
        <cPais>1058</cPais>
        <xPais>Brasil</xPais>
      </enderDest>
      <indIEDest>1</indIEDest>
      <IE>123456789013</IE>
    </dest>
    <det nItem="1">
      <prod>
        <cProd>001</cProd>
        <cEAN>SEM GTIN</cEAN>
        <xProd>PRODUTO TESTE</xProd>
        <NCM>12345678</NCM>
        <CFOP>5102</CFOP>
        <uCom>UN</uCom>
        <qCom>1.0000</qCom>
        <vUnCom>100.00</vUnCom>
        <vProd>100.00</vProd>
        <cEANTrib>SEM GTIN</cEANTrib>
        <uTrib>UN</uTrib>
        <qTrib>1.0000</qTrib>
        <vUnTrib>100.00</vUnTrib>
        <indTot>1</indTot>
      </prod>
      <imposto>
        <ICMS>
          <ICMS00>
            <orig>0</orig>
            <CST>00</CST>
            <modBC>0</modBC>
            <vBC>100.00</vBC>
            <pICMS>18.00</pICMS>
            <vICMS>18.00</vICMS>
          </ICMS00>
        </ICMS>
        <PIS>
          <PISAliq>
            <CST>01</CST>
            <vBC>100.00</vBC>
            <pPIS>1.65</pPIS>
            <vPIS>1.65</vPIS>
          </PISAliq>
        </PIS>
        <COFINS>
          <COFINSAliq>
            <CST>01</CST>
            <vBC>100.00</vBC>
            <pCOFINS>7.60</pCOFINS>
            <vCOFINS>7.60</vCOFINS>
          </COFINSAliq>
        </COFINS>
      </imposto>
    </det>
    <total>
      <ICMSTot>
        <vBC>100.00</vBC>
        <vICMS>18.00</vICMS>
        <vICMSDeson>0.00</vICMSDeson>
        <vFCP>0.00</vFCP>
        <vBCST>0.00</vBCST>
        <vST>0.00</vST>
        <vFCPST>0.00</vFCPST>
        <vFCPSTRet>0.00</vFCPSTRet>
        <vProd>100.00</vProd>
        <vFrete>0.00</vFrete>
        <vSeg>0.00</vSeg>
        <vDesc>0.00</vDesc>
        <vII>0.00</vII>
        <vIPI>0.00</vIPI>
        <vIPIDevol>0.00</vIPIDevol>
        <vPIS>1.65</vPIS>
        <vCOFINS>7.60</vCOFINS>
        <vOutro>0.00</vOutro>
        <vNF>100.00</vNF>
      </ICMSTot>
    </total>
    <transp>
      <modFrete>9</modFrete>
    </transp>
    <pag>
      <detPag>
        <indPag>0</indPag>
        <tPag>01</tPag>
        <vPag>100.00</vPag>
      </detPag>
    </pag>
  </infNFe>
</NFe>`;

  return xmlTeste;
}

// Executar teste
const validador = new ValidadorXSD();

console.log('\n📂 Procurando XMLs existentes...\n');
const xmlsEncontrados = encontrarXMLs();

if (xmlsEncontrados.length > 0) {
  console.log(`✅ Encontrados ${xmlsEncontrados.length} XML(s):\n`);
  
  xmlsEncontrados.forEach((xml, index) => {
    console.log(`${index + 1}. ${xml.empresa}/${xml.arquivo}`);
  });
  
  console.log('\n' + '═'.repeat(70));
  console.log('\n🔍 Validando primeiro XML encontrado...\n');
  
  const primeiroXML = xmlsEncontrados[0];
  const xmlContent = fs.readFileSync(primeiroXML.caminho, 'utf8');
  
  const resultado = validador.validar(xmlContent);
  validador.gerarRelatorioDetalhado(resultado);
  
} else {
  console.log('⚠️  Nenhum XML encontrado. Testando com XML de exemplo...\n');
  console.log('═'.repeat(70));
  
  const xmlTeste = criarXMLTeste();
  const resultado = validador.validar(xmlTeste);
  validador.gerarRelatorioDetalhado(resultado);
}

console.log('\n💡 DICAS:\n');
console.log('1. Para validar um XML específico:');
console.log('   const xml = fs.readFileSync("caminho/do/arquivo.xml", "utf8");');
console.log('   const resultado = validador.validar(xml);\n');
console.log('2. Integre no nfe_service.js antes de enviar para SEFAZ');
console.log('3. Use para detectar erros antes de assinar o XML\n');
