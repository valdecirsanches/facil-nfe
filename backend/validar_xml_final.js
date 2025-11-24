const fs = require('fs');
const path = require('path');
const logsDir = path.join(__dirname, 'Arqs', 'empresa_1', 'logs');
const xmlFiles = fs.readdirSync(logsDir).filter(f => f.startsWith('debug_xml_')).sort().reverse();
const xmlPath = path.join(logsDir, xmlFiles[0]);
const xml = fs.readFileSync(xmlPath, 'utf8');
console.log('🔍 VALIDAÇÃO FINAL DO XML\n');
console.log('═'.repeat(60));
console.log(`\n📄 Arquivo: ${xmlFiles[0]}`);
console.log(`📏 Tamanho: ${xml.length} bytes\n`);

// Checklist completo
const checks = [{
  nome: 'NCM correto (84716053)',
  regex: /<NCM>84716053<\/NCM>/,
  critico: true
}, {
  nome: 'vUnCom com 4 casas',
  regex: /<vUnCom>\d+\.\d{4}<\/vUnCom>/,
  critico: true
}, {
  nome: 'vUnTrib com 4 casas',
  regex: /<vUnTrib>\d+\.\d{4}<\/vUnTrib>/,
  critico: true
}, {
  nome: 'dhEmi sem milissegundos',
  regex: /<dhEmi>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-\d{2}:\d{2}<\/dhEmi>/,
  critico: true
}, {
  nome: 'ICMS41 presente',
  regex: /<ICMS41>/,
  critico: true
}, {
  nome: 'Signature presente',
  regex: /<Signature/,
  critico: true
}, {
  nome: 'SignatureValue presente',
  regex: /<SignatureValue>/,
  critico: true
}, {
  nome: 'X509Certificate presente',
  regex: /<X509Certificate>/,
  critico: true
}, {
  nome: 'DigestValue presente',
  regex: /<DigestValue>/,
  critico: true
}, {
  nome: 'Namespace NFe correto',
  regex: /xmlns="http:\/\/www\.portalfiscal\.inf\.br\/nfe"/,
  critico: true
}, {
  nome: 'Tag nro fechada corretamente',
  regex: /<nro>\d+<\/nro>/,
  critico: false
}];
console.log('📋 CHECKLIST DE VALIDAÇÃO:\n');
let errosCriticos = 0;
checks.forEach((check, i) => {
  const passou = check.regex.test(xml);
  const status = passou ? '✅' : check.critico ? '❌' : '⚠️';
  console.log(`${i + 1}. ${status} ${check.nome}`);
  if (!passou && check.critico) {
    errosCriticos++;
  }
});
console.log(`\n📊 Erros críticos: ${errosCriticos}`);

// Extrair e mostrar campos específicos
console.log('\n📋 CAMPOS EXTRAÍDOS:\n');
const extrair = campo => {
  const regex = new RegExp(`<${campo}>(.*?)</${campo}>`);
  const match = xml.match(regex);
  return match ? match[1] : 'NÃO ENCONTRADO';
};
console.log(`NCM: ${extrair('NCM')}`);
console.log(`vUnCom: ${extrair('vUnCom')}`);
console.log(`vUnTrib: ${extrair('vUnTrib')}`);
console.log(`dhEmi: ${extrair('dhEmi')}`);
console.log(`CST (ICMS): ${xml.match(/<ICMS41>[\s\S]*?<CST>(.*?)<\/CST>/)?.[1] || 'NÃO ENCONTRADO'}`);

// Verificar estrutura da assinatura
if (xml.includes('<Signature')) {
  console.log('\n🔐 ESTRUTURA DA ASSINATURA:\n');
  const sigMatch = xml.match(/<Signature[^>]*>(.*?)<\/Signature>/s);
  if (sigMatch) {
    const sig = sigMatch[0];
    console.log(`Tamanho: ${sig.length} bytes`);
    console.log(`SignedInfo: ${sig.includes('<SignedInfo>') ? '✅' : '❌'}`);
    console.log(`SignatureValue: ${sig.includes('<SignatureValue>') ? '✅' : '❌'}`);
    console.log(`KeyInfo: ${sig.includes('<KeyInfo>') ? '✅' : '❌'}`);
    console.log(`X509Certificate: ${sig.includes('<X509Certificate>') ? '✅' : '❌'}`);

    // Verificar se DigestValue está correto
    const digestMatch = sig.match(/<DigestValue>(.*?)<\/DigestValue>/);
    if (digestMatch) {
      console.log(`\nDigestValue: ${digestMatch[1].substring(0, 30)}...`);
    }
  }
}
console.log('\n═'.repeat(60));
console.log('\n📄 PRIMEIROS 2000 CARACTERES:\n');
console.log(xml.substring(0, 2000));
console.log('\n...\n');