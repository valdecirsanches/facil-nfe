const fs = require('fs');
const path = require('path');
console.log('🔍 COMPARANDO XML DO APP vs XML DO TESTE\n');
console.log('═'.repeat(60));

// XML do app (mais recente)
const logsDir = path.join(__dirname, 'Arqs', 'empresa_1', 'logs');
const xmlFiles = fs.readdirSync(logsDir).filter(f => f.startsWith('debug_xml_')).sort().reverse();
const xmlApp = fs.readFileSync(path.join(logsDir, xmlFiles[0]), 'utf8');

// XML do teste (que funciona)
const xmlTeste = `<NFe xmlns="http://www.portalfiscal.inf.br/nfe"><infNFe Id="NFe35251101234567000123550010000000011234567890" versao="4.00"><ide><cUF>35</cUF><cNF>12345678</cNF><natOp>Venda</natOp><mod>55</mod><serie>1</serie><nNF>1</nNF><dhEmi>2025-11-24T10:00:00-03:00</dhEmi><tpNF>1</tpNF><idDest>1</idDest><cMunFG>3550308</cMunFG><tpImp>1</tpImp><tpEmis>1</tpEmis><cDV>0</cDV><tpAmb>2</tpAmb><finNFe>1</finNFe><indFinal>0</indFinal><indPres>1</indPres><procEmi>0</procEmi><verProc>1.0</verProc></ide><emit><CNPJ>01234567000123</CNPJ><xNome>Empresa Teste</xNome><xFant>Teste</xFant><enderEmit><xLgr>Rua Teste</xLgr><nro>123</nro><xBairro>Centro</xBairro><cMun>3550308</cMun><xMun>Sao Paulo</xMun><UF>SP</UF><CEP>01000000</CEP><cPais>1058</cPais><xPais>Brasil</xPais></enderEmit><IE>123456789</IE><CRT>3</CRT></emit><dest><CNPJ>98765432000198</CNPJ><xNome>Cliente Teste</xNome><enderDest><xLgr>Rua Cliente</xLgr><nro>456</nro><xBairro>Centro</xBairro><cMun>3550308</cMun><xMun>Sao Paulo</xMun><UF>SP</UF><CEP>02000000</CEP><cPais>1058</cPais><xPais>Brasil</xPais></enderDest><indIEDest>9</indIEDest></dest><det nItem="1"><prod><cProd>1</cProd><cEAN>SEM GTIN</cEAN><xProd>Produto Teste</xProd><NCM>12345678</NCM><CFOP>5102</CFOP><uCom>UN</uCom><qCom>1.0000</qCom><vUnCom>100.0000000000</vUnCom><vProd>100.00</vProd><cEANTrib>SEM GTIN</cEANTrib><uTrib>UN</uTrib><qTrib>1.0000</qTrib><vUnTrib>100.0000000000</vUnTrib><indTot>1</indTot></prod><imposto><ICMS><ICMS00><orig>0</orig><CST>00</CST><modBC>3</modBC><vBC>0.00</vBC><pICMS>0.00</pICMS><vICMS>0.00</vICMS></ICMS00></ICMS><PIS><PISAliq><CST>01</CST><vBC>0.00</vBC><pPIS>0.00</pPIS><vPIS>0.00</vPIS></PISAliq></PIS><COFINS><COFINSAliq><CST>01</CST><vBC>0.00</vBC><pCOFINS>0.00</pCOFINS><vCOFINS>0.00</vCOFINS></COFINSAliq></COFINS></imposto></det><total><ICMSTot><vBC>0.00</vBC><vICMS>0.00</vICMS><vICMSDeson>0.00</vICMSDeson><vFCP>0.00</vFCP><vBCST>0.00</vBCST><vST>0.00</vST><vFCPST>0.00</vFCPST><vFCPSTRet>0.00</vFCPSTRet><vProd>100.00</vProd><vFrete>0.00</vFrete><vSeg>0.00</vSeg><vDesc>0.00</vDesc><vII>0.00</vII><vIPI>0.00</vIPI><vIPIDevol>0.00</vIPIDevol><vPIS>0.00</vPIS><vCOFINS>0.00</vCOFINS><vOutro>0.00</vOutro><vNF>100.00</vNF></ICMSTot></total><transp><modFrete>9</modFrete></transp></NFe>`;
console.log('\n📊 DIFERENÇAS ESTRUTURAIS:\n');

// Comparar campos presentes
const camposApp = xmlApp.match(/<([a-zA-Z]+)>/g) || [];
const camposTeste = xmlTeste.match(/<([a-zA-Z]+)>/g) || [];
const camposAppUnicos = [...new Set(camposApp)];
const camposTesteUnicos = [...new Set(camposTeste)];

// Campos no app mas não no teste
const somenteApp = camposAppUnicos.filter(c => !camposTesteUnicos.includes(c));
if (somenteApp.length > 0) {
  console.log('⚠️  Campos APENAS no APP (podem estar causando erro):');
  somenteApp.forEach(c => console.log(`   ${c}`));
  console.log('');
}

// Campos no teste mas não no app
const somenteTeste = camposTesteUnicos.filter(c => !camposAppUnicos.includes(c));
if (somenteTeste.length > 0) {
  console.log('⚠️  Campos APENAS no TESTE (podem estar faltando):');
  somenteTeste.forEach(c => console.log(`   ${c}`));
  console.log('');
}

// Comparar valores específicos
console.log('📋 COMPARAÇÃO DE VALORES:\n');
const comparacoes = [{
  campo: 'verProc',
  desc: 'Versão do processo'
}, {
  campo: 'NCM',
  desc: 'NCM'
}, {
  campo: 'nNF',
  desc: 'Número da NFe'
}];
comparacoes.forEach(comp => {
  const regexApp = new RegExp(`<${comp.campo}>(.*?)</${comp.campo}>`);
  const regexTeste = new RegExp(`<${comp.campo}>(.*?)</${comp.campo}>`);
  const matchApp = xmlApp.match(regexApp);
  const matchTeste = xmlTeste.match(regexTeste);
  if (matchApp && matchTeste) {
    const valApp = matchApp[1];
    const valTeste = matchTeste[1];
    if (valApp !== valTeste) {
      console.log(`${comp.desc} (${comp.campo}):`);
      console.log(`   App:   "${valApp}"`);
      console.log(`   Teste: "${valTeste}"`);
      if (comp.campo === 'NCM' && valApp === '00000000') {
        console.log(`   ⚠️  NCM zerado pode causar rejeição!`);
      }
      if (comp.campo === 'verProc' && valApp.length > valTeste.length) {
        console.log(`   ⚠️  verProc muito longo pode causar rejeição!`);
      }
      console.log('');
    }
  }
});

// Verificar infAdic
if (xmlApp.includes('<infAdic>') && !xmlTeste.includes('<infAdic>')) {
  console.log('⚠️  APP tem <infAdic>, TESTE não tem');
  const infAdic = xmlApp.match(/<infAdic>(.*?)<\/infAdic>/s);
  if (infAdic) {
    console.log(`   Conteúdo: ${infAdic[1]}`);
  }
  console.log('');
}
console.log('═'.repeat(60));
console.log('\n🎯 PRINCIPAIS SUSPEITOS:\n');
console.log('1. NCM zerado (00000000) - deve ter 8 dígitos válidos');
console.log('2. verProc com 3 partes (1.0.0) vs 2 partes (1.0)');
console.log('3. Campo infAdic pode estar causando problema');
console.log('4. Número da NFe com zeros à esquerda (000009)');
console.log('\n');