const Database = require('better-sqlite3');
const nfeService = require('./nfe_service');
const fs = require('fs');
console.log('🔍 GERANDO XML DE TESTE...\n');

// Conectar ao banco
const db = new Database('./empresa_1.db');

// Buscar dados de teste
const config = db.prepare('SELECT * FROM configuracoes WHERE id = 1').get();
const destinatario = db.prepare('SELECT * FROM clientes LIMIT 1').get();
const produto = db.prepare('SELECT * FROM produtos LIMIT 1').get();
if (!config || !destinatario || !produto) {
  console.error('❌ Dados não encontrados no banco!');
  console.log('Config:', config);
  console.log('Destinatário:', destinatario);
  console.log('Produto:', produto);
  process.exit(1);
}

// Montar emitente a partir das configurações
const emitente = {
  razao_social: config.razao_social || 'Empresa Teste',
  nome_fantasia: config.nome_fantasia || 'Empresa Teste',
  cnpj: config.cnpj || '00000000000000',
  ie: config.ie || '000000000',
  cep: config.cep || '00000000',
  endereco: config.endereco || 'Rua Teste',
  numero: config.numero || '123',
  cidade: config.cidade || 'São Paulo',
  estado: config.estado || 'SP',
  codigo_municipio: config.codigo_municipio || '3534401',
  crt: config.crt || '1'
};

// Montar dados da NFe
const nfe = {
  numero: 1,
  serie: 1,
  natureza_operacao: 'Venda',
  cfop: '5102',
  valor_total: 47.00
};
const items = [{
  produto_id: produto.id,
  descricao: produto.descricao,
  ncm: produto.ncm,
  quantidade: 1,
  valor_unitario: 47.00,
  valor_total: 47.00
}];
console.log('📋 Dados de teste:');
console.log('   Emitente:', emitente.razao_social);
console.log('   CEP Emitente:', emitente.cep);
console.log('   Destinatário:', destinatario.razao_social);
console.log('   CEP Destinatário:', destinatario.cep);
console.log('   Produto:', produto.descricao);
console.log('   Valor:', nfe.valor_total);
console.log('');
try {
  // Gerar XML
  const {
    xml,
    chave
  } = nfeService.gerarXML(nfe, emitente, destinatario, items);

  // Salvar em arquivo
  const filename = `./XML_TESTE_${Date.now()}.xml`;
  fs.writeFileSync(filename, xml, 'utf8');
  console.log('✅ XML gerado com sucesso!');
  console.log('📁 Arquivo:', filename);
  console.log('🔑 Chave:', chave);
  console.log('📏 Tamanho:', xml.length, 'bytes');
  console.log('');
  console.log('📋 CONTEÚDO DO XML:');
  console.log('─'.repeat(80));
  console.log(xml);
  console.log('─'.repeat(80));
  console.log('');

  // Verificar valores específicos
  console.log('🔍 VERIFICANDO VALORES NO XML:');
  console.log('');
  const checks = [{
    campo: 'cNF',
    regex: /<cNF>(\d+)<\/cNF>/,
    esperado: '8 dígitos'
  }, {
    campo: 'CEP Emitente',
    regex: /<CEP>(\d+)<\/CEP>/,
    esperado: '8 dígitos'
  }, {
    campo: 'qCom',
    regex: /<qCom>([\d.]+)<\/qCom>/,
    esperado: 'formato 0.0000'
  }, {
    campo: 'vUnCom',
    regex: /<vUnCom>([\d.]+)<\/vUnCom>/,
    esperado: 'formato 0.0000'
  }, {
    campo: 'vProd (item)',
    regex: /<vProd>([\d.]+)<\/vProd>/,
    esperado: 'formato 0.00'
  }, {
    campo: 'vBC',
    regex: /<vBC>([\d.]+)<\/vBC>/,
    esperado: 'formato 0.00'
  }, {
    campo: 'vNF',
    regex: /<vNF>([\d.]+)<\/vNF>/,
    esperado: 'formato 0.00'
  }, {
    campo: 'tPag',
    regex: /<tPag>(\d+)<\/tPag>/,
    esperado: '01'
  }, {
    campo: 'vPag',
    regex: /<vPag>([\d.]+)<\/vPag>/,
    esperado: 'formato 0.00'
  }];
  checks.forEach(check => {
    const match = xml.match(check.regex);
    if (match) {
      const valor = match[1];
      const ok = check.campo === 'cNF' && valor.length === 8 || check.campo.includes('CEP') && valor.length === 8 || check.campo === 'tPag' && valor === '01' || check.esperado.includes('0.0000') && /^\d+\.\d{4}$/.test(valor) || check.esperado.includes('0.00') && /^\d+\.\d{2}$/.test(valor);
      console.log(`   ${ok ? '✅' : '❌'} ${check.campo}: ${valor} (esperado: ${check.esperado})`);
    } else {
      console.log(`   ❌ ${check.campo}: NÃO ENCONTRADO`);
    }
  });
} catch (error) {
  console.error('❌ Erro ao gerar XML:', error.message);
  console.error(error.stack);
}
db.close();