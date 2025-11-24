const nfeService = require('./nfe_service');
const Database = require('better-sqlite3');
const fs = require('fs');
console.log('🔍 VALIDAÇÃO DO XML GERADO\n');
console.log('═'.repeat(70));

// Buscar dados
const mainDb = new Database('./principal.db');
const empresa = mainDb.prepare('SELECT * FROM empresas LIMIT 1').get();
mainDb.close();
const db = new Database(`./empresa_${empresa.id}.db`);
const cliente = db.prepare('SELECT * FROM clientes LIMIT 1').get();
const produto = db.prepare('SELECT * FROM produtos LIMIT 1').get();
const config = db.prepare('SELECT * FROM configuracoes WHERE id = 1').get();
db.close();

// Montar NFe
const nfe = {
  serie: config.serie_nfe,
  numero: config.proximo_numero,
  natureza_operacao: 'Venda de mercadoria',
  cfop: '5102',
  valor_total: parseFloat(produto.preco_venda) || 47.00
};
const items = [{
  produto_id: produto.id,
  descricao: produto.descricao,
  ncm: produto.ncm || '84716053',
  quantidade: 1,
  valor_unitario: parseFloat(produto.preco_venda) || 47.00,
  valor_total: parseFloat(produto.preco_venda) || 47.00
}];
console.log('\n📝 Gerando XML...\n');
const {
  xml,
  chave
} = nfeService.gerarXML(nfe, empresa, cliente, items);
console.log('✅ XML gerado!\n');
console.log('═'.repeat(70));
console.log('\n📋 VALIDANDO ESTRUTURA:\n');

// Validações
const validacoes = {
  'Tag <NFe>': xml.includes('<NFe'),
  'Namespace NFe': xml.includes('xmlns="http://www.portalfiscal.inf.br/nfe"'),
  'Tag <infNFe>': xml.includes('<infNFe'),
  'Atributo Id': xml.includes('Id="NFe'),
  'Atributo versao': xml.includes('versao="4.00"'),
  'Tag <ide>': xml.includes('<ide>'),
  'Tag <emit>': xml.includes('<emit>'),
  'Tag <dest>': xml.includes('<dest>'),
  'Tag <det>': xml.includes('<det'),
  'Tag <prod>': xml.includes('<prod>'),
  'Tag <imposto>': xml.includes('<imposto>'),
  'Tag <ICMS>': xml.includes('<ICMS>'),
  'Tag <IPI>': xml.includes('<IPI>'),
  'Tag <PIS>': xml.includes('<PIS>'),
  'Tag <COFINS>': xml.includes('<COFINS>'),
  'Tag <total>': xml.includes('<total>'),
  'Tag <ICMSTot>': xml.includes('<ICMSTot>'),
  'Tag <vTotTrib>': xml.includes('<vTotTrib>'),
  'Tag <transp>': xml.includes('<transp>'),
  'Tag <pag>': xml.includes('<pag>'),
  'Tag <detPag>': xml.includes('<detPag>'),
  'Tag </NFe>': xml.includes('</NFe>'),
  'EAN correto': xml.includes('<cEAN>0000000000000</cEAN>'),
  'EANTrib correto': xml.includes('<cEANTrib>0000000000000</cEANTrib>')
};
Object.entries(validacoes).forEach(([nome, valido]) => {
  console.log(`${valido ? '✅' : '❌'} ${nome}`);
});
console.log('\n═'.repeat(70));
console.log('\n🔍 VERIFICANDO PROBLEMAS COMUNS:\n');

// Verificar problemas específicos
const problemas = [];

// 1. Verificar se tem valores NaN
if (xml.includes('NaN')) {
  problemas.push('❌ ERRO: XML contém valores NaN (Not a Number)');
  console.log('❌ ERRO CRÍTICO: XML contém valores NaN!');
  console.log('   Isso acontece quando valores numéricos não são parseados corretamente.\n');
}

// 2. Verificar série (deve ser 3 dígitos no XML)
const serieMatch = xml.match(/<serie>(\d+)<\/serie>/);
if (serieMatch) {
  const serie = serieMatch[1];
  if (serie.length > 3) {
    problemas.push(`❌ ERRO: Série com mais de 3 dígitos: ${serie}`);
    console.log(`❌ ERRO: Série incorreta: ${serie}`);
    console.log('   A série deve ter no máximo 3 dígitos.\n');
  }
}

// 3. Verificar se tem tag <pag>
if (!xml.includes('<pag>')) {
  problemas.push('❌ ERRO: Tag <pag> obrigatória está faltando');
  console.log('❌ ERRO: Tag <pag> obrigatória está faltando!\n');
}

// 4. Verificar se tem <vTotTrib>
if (!xml.includes('<vTotTrib>')) {
  problemas.push('❌ ERRO: Tag <vTotTrib> obrigatória está faltando');
  console.log('❌ ERRO: Tag <vTotTrib> obrigatória está faltando!\n');
}

// 5. Verificar CST do IPI
const cstIpiMatch = xml.match(/<IPI>[\s\S]*?<CST>(\d+)<\/CST>/);
if (cstIpiMatch) {
  const cst = cstIpiMatch[1];
  if (cst === '53') {
    problemas.push('❌ ERRO: IPI com CST 53 (não existe)');
    console.log('❌ ERRO: IPI com CST 53 inválido!');
    console.log('   Use CST 51 para Simples Nacional.\n');
  }
}

// 6. Verificar EAN
if (xml.includes('SEM GTIN')) {
  problemas.push('❌ ERRO: EAN com "SEM GTIN" (não aceito)');
  console.log('❌ ERRO: EAN com "SEM GTIN"!');
  console.log('   Use "0000000000000" para produtos sem código de barras.\n');
}
console.log('═'.repeat(70));
if (problemas.length === 0) {
  console.log('\n✅ NENHUM PROBLEMA ENCONTRADO!\n');
  console.log('O XML parece estar correto. Se ainda houver erro 225,');
  console.log('verifique o arquivo de log completo.\n');
} else {
  console.log('\n❌ PROBLEMAS ENCONTRADOS:\n');
  problemas.forEach((p, i) => console.log(`${i + 1}. ${p}`));
  console.log('\n💡 CORRIJA ESTES PROBLEMAS E TENTE NOVAMENTE.\n');
}

// Salvar XML para análise
const xmlPath = './xml_validacao.xml';
fs.writeFileSync(xmlPath, xml, 'utf8');
console.log(`📄 XML salvo em: ${xmlPath}`);
console.log('   Você pode abrir este arquivo para análise detalhada.\n');
console.log('═'.repeat(70));