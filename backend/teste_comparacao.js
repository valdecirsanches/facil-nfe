const fs = require('fs');
console.log('🔍 COMPARANDO XMLs\n');
console.log('═'.repeat(60));

// XML do teste que FUNCIONA
const xmlTeste = `<NFe xmlns="http://www.portalfiscal.inf.br/nfe"><infNFe Id="NFe35251101234567000123550010000000011234567890" versao="4.00"><ide><cUF>35</cUF><cNF>12345678</cNF><natOp>Venda</natOp><mod>55</mod><serie>1</serie><nNF>1</nNF><dhEmi>2025-11-24T10:00:00-03:00</dhEmi><tpNF>1</tpNF><idDest>1</idDest><cMunFG>3550308</cMunFG><tpImp>1</tpImp><tpEmis>1</tpEmis><cDV>0</cDV><tpAmb>2</tpAmb><finNFe>1</finNFe><indFinal>0</indFinal><indPres>1</indPres><procEmi>0</procEmi><verProc>1.0</verProc></ide>`;

// XML do app que DÁ ERRO
const xmlApp = `<NFe xmlns="http://www.portalfiscal.inf.br/nfe"><infNFe Id="NFe35251167570036000181550010000000071813116713" versao="4.00"><ide><cUF>35</cUF><cNF>81311671</cNF><natOp>Venda de mercadoria</natOp><mod>55</mod><serie>1</serie><nNF>000007</nNF><dhEmi>2025-11-24T13:23:03.809Z</dhEmi><tpNF>1</tpNF><idDest>1</idDest><cMunFG>3550308</cMunFG><tpImp>1</tpImp><tpEmis>1</tpEmis><cDV>3</cDV><tpAmb>2</tpAmb><finNFe>1</finNFe><indFinal>0</indFinal><indPres>1</indPres><procEmi>0</procEmi><verProc>1.0.0</verProc></ide>`;
console.log('\n📊 DIFERENÇAS ENCONTRADAS:\n');

// Comparar dhEmi
const dhEmiTeste = xmlTeste.match(/<dhEmi>(.*?)<\/dhEmi>/)[1];
const dhEmiApp = xmlApp.match(/<dhEmi>(.*?)<\/dhEmi>/)[1];
console.log('1️⃣ FORMATO DE DATA:');
console.log(`   Teste (FUNCIONA): ${dhEmiTeste}`);
console.log(`   App (DÁ ERRO):    ${dhEmiApp}`);
console.log(`   ❌ PROBLEMA: App usa "Z" (UTC), teste usa "-03:00" (timezone BR)`);

// Comparar nNF
const nNFTeste = xmlTeste.match(/<nNF>(.*?)<\/nNF>/)[1];
const nNFApp = xmlApp.match(/<nNF>(.*?)<\/nNF>/)[1];
console.log('\n2️⃣ NÚMERO DA NFE:');
console.log(`   Teste: ${nNFTeste}`);
console.log(`   App:   ${nNFApp}`);
console.log(`   ⚠️  App usa zeros à esquerda`);

// Comparar verProc
const verProcTeste = xmlTeste.match(/<verProc>(.*?)<\/verProc>/)[1];
const verProcApp = xmlApp.match(/<verProc>(.*?)<\/verProc>/)[1];
console.log('\n3️⃣ VERSÃO DO PROCESSO:');
console.log(`   Teste: ${verProcTeste}`);
console.log(`   App:   ${verProcApp}`);
console.log('\n═'.repeat(60));
console.log('\n🎯 SOLUÇÃO: Ajustar formato de data para usar timezone BR (-03:00)');
console.log('            ao invés de UTC (Z)\n');