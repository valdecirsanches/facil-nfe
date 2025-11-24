const nfeService = require('./nfe_service');
console.log('🧪 TESTANDO GERAÇÃO DE XML\n');

// Dados de teste
const nfe = {
  numero: '1',
  serie: '1',
  natureza_operacao: 'VENDA',
  cfop: '5102',
  valor_total: 47
};
const emitente = {
  cnpj: '12345678000190',
  razao_social: 'EMPRESA TESTE LTDA',
  nome_fantasia: 'EMPRESA TESTE',
  ie: '123456789',
  crt: '1',
  endereco: 'RUA TESTE',
  numero: '123',
  cidade: 'SAO PAULO',
  estado: 'SP',
  cep: '06056230',
  codigo_municipio: '3550308'
};
const destinatario = {
  documento: '12345678901',
  razao_social: 'CLIENTE TESTE',
  endereco: 'RUA CLIENTE',
  numero: '456',
  bairro: 'CENTRO',
  cidade: 'SAO PAULO',
  uf: 'SP',
  cep: '01310100',
  codigo_municipio: '3550308'
};
const items = [{
  produto_id: 1,
  descricao: 'PRODUTO TESTE',
  quantidade: 1,
  valor_unitario: 47,
  valor_total: 47,
  ncm: '84716053'
}];
try {
  const {
    xml,
    chave
  } = nfeService.gerarXML(nfe, emitente, destinatario, items);
  console.log('\n📄 XML GERADO:\n');
  console.log(xml);
  console.log('\n\n🔍 VERIFICANDO CAMPOS CRÍTICOS:\n');

  // Verificar CEPs
  const cepEmitMatch = xml.match(/<CEP>(\d+)<\/CEP>/g);
  console.log('CEPs encontrados:', cepEmitMatch);

  // Verificar valores numéricos
  const qComMatch = xml.match(/<qCom>([^<]+)<\/qCom>/);
  console.log('qCom:', qComMatch ? qComMatch[1] : 'NÃO ENCONTRADO');
  const vUnComMatch = xml.match(/<vUnCom>([^<]+)<\/vUnCom>/);
  console.log('vUnCom:', vUnComMatch ? vUnComMatch[1] : 'NÃO ENCONTRADO');
  const vProdMatch = xml.match(/<vProd>([^<]+)<\/vProd>/);
  console.log('vProd:', vProdMatch ? vProdMatch[1] : 'NÃO ENCONTRADO');
  const vNFMatch = xml.match(/<vNF>([^<]+)<\/vNF>/);
  console.log('vNF:', vNFMatch ? vNFMatch[1] : 'NÃO ENCONTRADO');
  const tPagMatch = xml.match(/<tPag>([^<]+)<\/tPag>/);
  console.log('tPag:', tPagMatch ? tPagMatch[1] : 'NÃO ENCONTRADO');
  const vPagMatch = xml.match(/<vPag>([^<]+)<\/vPag>/);
  console.log('vPag:', vPagMatch ? vPagMatch[1] : 'NÃO ENCONTRADO');
  console.log('\n✅ Teste concluído!');
} catch (error) {
  console.error('❌ ERRO:', error.message);
  console.error(error.stack);
}