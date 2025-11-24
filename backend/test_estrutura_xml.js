const fs = require('fs');
const path = require('path');
console.log('🧪 TESTE DE ESTRUTURA XML\n');
console.log('═'.repeat(60));

// Simular um XML de NFe
const xmlTeste = `<NFe xmlns="http://www.portalfiscal.inf.br/nfe"><infNFe Id="NFe35251167570036000181550010000000281360771814" versao="4.00"><ide><cUF>35</cUF><cNF>36077181</cNF><natOp>Venda</natOp><mod>55</mod><serie>1</serie><nNF>28</nNF><dhEmi>2025-11-25T10:30:00-03:00</dhEmi><tpNF>1</tpNF><idDest>1</idDest><cMunFG>3550308</cMunFG><tpImp>1</tpImp><tpEmis>1</tpEmis><cDV>4</cDV><tpAmb>2</tpAmb><finNFe>1</finNFe><indFinal>0</indFinal><indPres>1</indPres><procEmi>0</procEmi><verProc>1.0</verProc></ide><emit><CNPJ>67570036000181</CNPJ><xNome>EDS INFORMÁTICA LTDA ME</xNome><xFant>EDS INFORMÁTICA</xFant><enderEmit><xLgr>Rua Exemplo</xLgr><nro>123</nro><xBairro>Centro</xBairro><cMun>3550308</cMun><xMun>São Paulo</xMun><UF>SP</UF><CEP>01234567</CEP><cPais>1058</cPais><xPais>Brasil</xPais></enderEmit><IE>123456789</IE><CRT>1</CRT></emit><dest><CNPJ>12345678000190</CNPJ><xNome>Cliente Teste</xNome><enderDest><xLgr>Av Principal</xLgr><nro>456</nro><xBairro>Centro</xBairro><cMun>3550308</cMun><xMun>São Paulo</xMun><UF>SP</UF><CEP>01234567</CEP><cPais>1058</cPais><xPais>Brasil</xPais></enderDest><indIEDest>2</indIEDest></dest><det nItem="1"><prod><cProd>1</cProd><cEAN>SEM GTIN</cEAN><xProd>Produto Teste</xProd><NCM>84716053</NCM><CFOP>5102</CFOP><uCom>UN</uCom><qCom>1.0000</qCom><vUnCom>100.0000</vUnCom><vProd>100.00</vProd><cEANTrib>SEM GTIN</cEANTrib><uTrib>UN</uTrib><qTrib>1.0000</qTrib><vUnTrib>100.0000</vUnTrib><indTot>1</indTot></prod><imposto><ICMS><ICMSSN102><orig>0</orig><CSOSN>102</CSOSN></ICMSSN102></ICMS><IPI><IPINT><CST>53</CST></IPINT></IPI><PIS><PISOutr><CST>49</CST><vBC>0.00</vBC><pPIS>0.00</pPIS><vPIS>0.00</vPIS></PISOutr></PIS><COFINS><COFINSOutr><CST>49</CST><vBC>0.00</vBC><pCOFINS>0.00</pCOFINS><vCOFINS>0.00</vCOFINS></COFINSOutr></COFINS></imposto></det><total><ICMSTot><vBC>0.00</vBC><vICMS>0.00</vICMS><vICMSDeson>0.00</vICMSDeson><vFCP>0.00</vFCP><vBCST>0.00</vBCST><vST>0.00</vST><vFCPST>0.00</vFCPST><vFCPSTRet>0.00</vFCPSTRet><vProd>100.00</vProd><vFrete>0.00</vFrete><vSeg>0.00</vSeg><vDesc>0.00</vDesc><vII>0.00</vII><vIPI>0.00</vIPI><vIPIDevol>0.00</vIPIDevol><vPIS>0.00</vPIS><vCOFINS>0.00</vCOFINS><vOutro>0.00</vOutro><vNF>100.00</vNF></ICMSTot></total><transp><modFrete>0</modFrete></transp></infNFe><Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><SignedInfo><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></CanonicalizationMethod><SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"></SignatureMethod><Reference URI="#NFe35251167570036000181550010000000281360771814"><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform><Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></Transform></Transforms><DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></DigestMethod><DigestValue>EXEMPLO_DIGEST_BASE64</DigestValue></Reference></SignedInfo><SignatureValue>EXEMPLO_SIGNATURE_BASE64</SignatureValue><KeyInfo><X509Data><X509Certificate>EXEMPLO_CERTIFICADO_BASE64</X509Certificate></X509Data></KeyInfo></Signature></NFe>`;
console.log('📋 Validando estrutura do XML...\n');

// Verificar tags principais
const tags = {
  '<NFe': xmlTeste.includes('<NFe'),
  '<infNFe': xmlTeste.includes('<infNFe'),
  '</infNFe>': xmlTeste.includes('</infNFe>'),
  '<Signature': xmlTeste.includes('<Signature'),
  '</Signature>': xmlTeste.includes('</Signature>'),
  '</NFe>': xmlTeste.includes('</NFe>')
};
console.log('✅ Tags encontradas:');
Object.entries(tags).forEach(([tag, found]) => {
  console.log(`   ${found ? '✅' : '❌'} ${tag}`);
});

// Verificar ordem
const posInfNFeFim = xmlTeste.indexOf('</infNFe>');
const posSignatureInicio = xmlTeste.indexOf('<Signature');
const posNFeFim = xmlTeste.indexOf('</NFe>');
console.log('\n📊 Posições no XML:');
console.log(`   </infNFe>: ${posInfNFeFim}`);
console.log(`   <Signature>: ${posSignatureInicio}`);
console.log(`   </NFe>: ${posNFeFim}`);
const ordemCorreta = posInfNFeFim < posSignatureInicio && posSignatureInicio < posNFeFim;
console.log(`\n${ordemCorreta ? '✅' : '❌'} Ordem das tags: ${ordemCorreta ? 'CORRETA' : 'INCORRETA'}`);
console.log('   Esperado: </infNFe> → <Signature> → </NFe>');

// Extrair estrutura visual
console.log('\n📄 Estrutura visual:');
const estrutura = xmlTeste.replace(/<NFe[^>]*>/, '<NFe>\n  ').replace(/<infNFe[^>]*>/, '<infNFe>\n    ').replace(/<\/infNFe>/, '\n  </infNFe>\n  ').replace(/<Signature[^>]*>/, '<Signature>\n    ').replace(/<\/Signature>/, '\n  </Signature>\n').replace(/<\/NFe>/, '</NFe>');
const linhas = estrutura.split('\n').slice(0, 10);
linhas.forEach(linha => console.log(`   ${linha.substring(0, 80)}${linha.length > 80 ? '...' : ''}`));
console.log('\n' + '═'.repeat(60));
if (ordemCorreta && Object.values(tags).every(v => v)) {
  console.log('✅ ESTRUTURA XML VÁLIDA!\n');
  console.log('A estrutura está correta:');
  console.log('  <NFe>');
  console.log('    <infNFe>');
  console.log('      ... dados da nota ...');
  console.log('    </infNFe>');
  console.log('    <Signature>');
  console.log('      ... assinatura digital ...');
  console.log('    </Signature>');
  console.log('  </NFe>');
} else {
  console.log('❌ ESTRUTURA XML INVÁLIDA!\n');
  console.log('Corrija a estrutura para:');
  console.log('  <NFe>');
  console.log('    <infNFe>');
  console.log('      ... dados da nota ...');
  console.log('    </infNFe>');
  console.log('    <Signature>');
  console.log('      ... assinatura digital ...');
  console.log('    </Signature>');
  console.log('  </NFe>');
}
console.log('');