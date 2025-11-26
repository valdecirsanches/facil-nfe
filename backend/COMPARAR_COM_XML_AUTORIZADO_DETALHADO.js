const fs = require('fs');
console.log('🔍 ANÁLISE DETALHADA: XML AUTORIZADO vs SEU CÓDIGO\n');
console.log('═'.repeat(80));

// XML AUTORIZADO (fornecido pelo usuário)
const xmlAutorizado = `<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
<infNFe Id="NFe35251167570036000181550010000000011426495490" versao="4.00">
<ide>
<cUF>35</cUF>
<cNF>42649549</cNF>
<natOp>Vendas de producao propria ou de terceiros</natOp>
<mod>55</mod>
<serie>1</serie>
<nNF>1</nNF>
<dhEmi>2025-11-25T12:41:12-03:00</dhEmi>
<dhSaiEnt>2025-11-25T12:41:12-03:00</dhSaiEnt>
<tpNF>1</tpNF>
<idDest>1</idDest>
<cMunFG>3534401</cMunFG>
<tpImp>1</tpImp>
<tpEmis>1</tpEmis>
<cDV>0</cDV>
<tpAmb>2</tpAmb>
<finNFe>1</finNFe>
<indFinal>1</indFinal>
<indPres>1</indPres>
<indIntermed>0</indIntermed>
<procEmi>0</procEmi>
<verProc>1.0</verProc>
</ide>
<emit>
<CNPJ>67570036000181</CNPJ>
<xNome>E D S INFORMATICA LTDA - ME</xNome>
<xFant>EDSSOLUTION TECNOLOGIA</xFant>
<enderEmit>
<xLgr>Rua Paulo Aparecido Pereira</xLgr>
<nro>365</nro>
<xBairro>Bussocaba</xBairro>
<cMun>3534401</cMun>
<xMun>Osasco</xMun>
<UF>SP</UF>
<CEP>06056230</CEP>
<cPais>1058</cPais>
<xPais>BRASIL</xPais>
<fone>11997010404</fone>
</enderEmit>
<IE>492353140114</IE>
<IM>40703</IM>
<CNAE>4751201</CNAE>
<CRT>1</CRT>
</emit>
<dest>
<CNPJ>30511823000142</CNPJ>
<xNome>NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL</xNome>
<enderDest>
<xLgr>Rua Dalia Formosa</xLgr>
<nro>112</nro>
<xBairro>Santa Maria</xBairro>
<cMun>3534401</cMun>
<xMun>Osasco</xMun>
<UF>SP</UF>
<CEP>06150495</CEP>
<cPais>1058</cPais>
<xPais>Brasil</xPais>
<fone>1141444457</fone>
</enderDest>
<indIEDest>9</indIEDest>
<IE>120074766115</IE>
<email>revistasflashmais@gmail.com</email>
</dest>
<entrega>
<CNPJ/>
<xLgr>Rua Dalia Formosa</xLgr>
<nro>112</nro>
<xCpl>112</xCpl>
<xBairro>Santa Maria</xBairro>
<cMun>3534401</cMun>
<xMun>Osasco</xMun>
<UF>SP</UF>
<cPais>1058</cPais>
<xPais>BRASIL</xPais>
</entrega>
<det nItem="1">
<prod>
<cProd>prod001</cProd>
<cEAN>1231231231232</cEAN>
<xProd>TECLADO BORRACHA PADRAO ABNT</xProd>
<NCM>84716052</NCM>
<CFOP>5102</CFOP>
<uCom>PC</uCom>
<qCom>1.0000</qCom>
<vUnCom>2.0000000000</vUnCom>
<vProd>2.00</vProd>
<cEANTrib>1231231231232</cEANTrib>
<uTrib>PC</uTrib>
<qTrib>1.0000</qTrib>
<vUnTrib>2.0000000000</vUnTrib>
<indTot>1</indTot>
<xPed>0</xPed>
<nItemPed>1</nItemPed>
</prod>
<imposto>
<vTotTrib>0.36</vTotTrib>
<ICMS>
<ICMSSN102>
<orig>0</orig>
<CSOSN>102</CSOSN>
</ICMSSN102>
</ICMS>
<IPI>
<cEnq>999</cEnq>
<IPITrib>
<CST>99</CST>
<vBC>2.00</vBC>
<pIPI>0.0000</pIPI>
<vIPI>0.00</vIPI>
</IPITrib>
</IPI>
<PIS>
<PISOutr>
<CST>99</CST>
<vBC>0.00</vBC>
<pPIS>0.0000</pPIS>
<vPIS>0.00</vPIS>
</PISOutr>
</PIS>
<COFINS>
<COFINSOutr>
<CST>99</CST>
<vBC>0.00</vBC>
<pCOFINS>0.0000</pCOFINS>
<vCOFINS>0.00</vCOFINS>
</COFINSOutr>
</COFINS>
</imposto>
</det>
<total>
<ICMSTot>
<vBC>0.00</vBC>
<vICMS>0.36</vICMS>
<vICMSDeson>0.00</vICMSDeson>
<vFCP>0.00</vFCP>
<vBCST>0.00</vBCST>
<vST>0.00</vST>
<vFCPST>0.00</vFCPST>
<vFCPSTRet>0.00</vFCPSTRet>
<vProd>2.00</vProd>
<vFrete>0.00</vFrete>
<vSeg>0.00</vSeg>
<vDesc>0.00</vDesc>
<vII>0.00</vII>
<vIPI>0.00</vIPI>
<vIPIDevol>0.00</vIPIDevol>
<vPIS>0.00</vPIS>
<vCOFINS>0.00</vCOFINS>
<vOutro>0.00</vOutro>
<vNF>2.00</vNF>
<vTotTrib>0.36</vTotTrib>
</ICMSTot>
</total>
<transp>
<modFrete>0</modFrete>
<transporta>
<xNome>Nosso Carro</xNome>
<xEnder>None, None</xEnder>
</transporta>
<vol>
<qVol>1</qVol>
<esp>CAIXAS</esp>
<marca>None</marca>
<nVol>1</nVol>
<pesoL>1.000</pesoL>
<pesoB>1.000</pesoB>
</vol>
</transp>
<cobr>
<fat>
<nFat>0</nFat>
<vOrig>2.00</vOrig>
<vDesc>0.00</vDesc>
<vLiq>2.00</vLiq>
</fat>
</cobr>
<pag>
<detPag>
<indPag>0</indPag>
<tPag>01</tPag>
<vPag>2.00</vPag>
</detPag>
</pag>
<infAdic>
<infCpl>DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL;NAO GERA DIREITO A CREDITO FISCAL DE IPI;</infCpl>
</infAdic>
</infNFe>
</NFe>`;
console.log('\n📊 ESTRUTURA DO XML AUTORIZADO:\n');

// Extrair todas as tags principais
const tags = ['dhSaiEnt', 'indIntermed', 'IM', 'CNAE', 'fone', 'entrega', 'xPed', 'nItemPed', 'vTotTrib', 'cEnq', 'IPITrib', 'vol', 'cobr', 'fat', 'infAdic'];
console.log('✅ TAGS PRESENTES NO XML AUTORIZADO:\n');
tags.forEach(tag => {
  const presente = xmlAutorizado.includes(`<${tag}>`);
  console.log(`   ${presente ? '✅' : '❌'} <${tag}>`);
});
console.log('\n\n🔍 DETALHES IMPORTANTES:\n');
console.log('1️⃣ TAG <dhSaiEnt>:');
console.log('   ✅ OBRIGATÓRIA para NFe modelo 55');
console.log('   ✅ Deve ter o MESMO valor de <dhEmi>');
console.log('   📝 Formato: 2025-11-25T12:41:12-03:00\n');
console.log('2️⃣ TAG <indIntermed>:');
console.log('   ✅ OBRIGATÓRIA desde versão 4.0');
console.log('   ✅ Valores: 0 = Sem intermediador, 1 = Com intermediador');
console.log('   📝 No XML autorizado: 0\n');
console.log('3️⃣ TAG <entrega>:');
console.log('   ✅ OPCIONAL mas presente no XML autorizado');
console.log('   ✅ Usado quando entrega é em local diferente do destinatário');
console.log('   📝 Pode ter <CNPJ/> vazio\n');
console.log('4️⃣ TAG <vTotTrib> (dentro de <imposto>):');
console.log('   ✅ OBRIGATÓRIA - Valor aproximado dos tributos');
console.log('   ✅ No XML autorizado: 0.36 (18% de 2.00)');
console.log('   📝 Cálculo: valor_total * 0.18\n');
console.log('5️⃣ TAG <IPI> com <IPITrib>:');
console.log('   ✅ Para Simples Nacional, usar <IPITrib> com CST 99');
console.log('   ✅ Não usar <IPINT> (IPI não tributado)');
console.log('   📝 Deve ter <cEnq>999</cEnq>\n');
console.log('6️⃣ TAG <vol> (volumes):');
console.log('   ✅ OPCIONAL mas presente no XML autorizado');
console.log('   ✅ Informações de transporte (quantidade, peso, etc)\n');
console.log('7️⃣ TAG <cobr> (cobrança):');
console.log('   ✅ OPCIONAL mas presente no XML autorizado');
console.log('   ✅ Informações de fatura e duplicatas\n');
console.log('8️⃣ TAG <xPed> e <nItemPed>:');
console.log('   ✅ OPCIONAIS mas presentes no XML autorizado');
console.log('   ✅ Número do pedido e item do pedido\n');
console.log('\n═'.repeat(80));
console.log('\n🎯 RESUMO DAS DIFERENÇAS:\n');
console.log('SEU CÓDIGO ATUAL vs XML AUTORIZADO:\n');
const diferencas = [{
  tag: 'dhSaiEnt',
  status: 'FALTA',
  prioridade: 'CRÍTICA'
}, {
  tag: 'indIntermed',
  status: 'FALTA',
  prioridade: 'CRÍTICA'
}, {
  tag: 'entrega',
  status: 'FALTA',
  prioridade: 'MÉDIA'
}, {
  tag: 'vTotTrib (imposto)',
  status: 'FALTA',
  prioridade: 'CRÍTICA'
}, {
  tag: 'IPITrib',
  status: 'INCORRETO',
  prioridade: 'CRÍTICA'
}, {
  tag: 'vol',
  status: 'FALTA',
  prioridade: 'MÉDIA'
}, {
  tag: 'cobr',
  status: 'FALTA',
  prioridade: 'MÉDIA'
}, {
  tag: 'xPed/nItemPed',
  status: 'FALTA',
  prioridade: 'BAIXA'
}];
diferencas.forEach((diff, i) => {
  const emoji = diff.prioridade === 'CRÍTICA' ? '🔴' : diff.prioridade === 'MÉDIA' ? '🟡' : '🟢';
  console.log(`${i + 1}. ${emoji} ${diff.tag}: ${diff.status} (${diff.prioridade})`);
});
console.log('\n\n💡 CORREÇÕES NECESSÁRIAS NO nfe_service.js:\n');
console.log('1. Adicionar <dhSaiEnt> na tag <ide>:');
console.log('   dhSaiEnt: dhEmi,  // Mesmo valor de dhEmi\n');
console.log('2. Adicionar <indIntermed> na tag <ide>:');
console.log("   indIntermed: '0',  // Sem intermediador\n");
console.log('3. Adicionar <vTotTrib> dentro de <imposto> (cada item):');
console.log('   vTotTrib: vTotTrib,  // Valor aproximado dos tributos\n');
console.log('4. Corrigir <IPI> para usar <IPITrib>:');
console.log('   IPI: {');
console.log("     cEnq: '999',");
console.log('     IPITrib: {');
console.log("       CST: '99',");
console.log('       vBC: valor_total,');
console.log("       pIPI: '0.0000',");
console.log("       vIPI: '0.00'");
console.log('     }');
console.log('   }\n');
console.log('5. Adicionar <entrega> (opcional mas recomendado):');
console.log('   entrega: {');
console.log("     [tipoDoc]: '',  // CNPJ ou CPF vazio");
console.log('     xLgr: endereco,');
console.log('     nro: numero,');
console.log('     ...');
console.log('   }\n');
console.log('6. Adicionar <vol> em <transp>:');
console.log('   vol: {');
console.log("     qVol: '1',");
console.log("     esp: 'CAIXAS',");
console.log("     marca: 'None',");
console.log("     nVol: '1',");
console.log("     pesoL: '1.000',");
console.log("     pesoB: '1.000'");
console.log('   }\n');
console.log('7. Adicionar <cobr>:');
console.log('   cobr: {');
console.log('     fat: {');
console.log("       nFat: '0',");
console.log('       vOrig: valor_total,');
console.log("       vDesc: '0.00',");
console.log('       vLiq: valor_total');
console.log('     }');
console.log('   }\n');
console.log('═'.repeat(80));
console.log('\n✅ Execute este script e depois atualize o nfe_service.js!\n');