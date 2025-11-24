const nfeService = require('./nfe_service');
const Database = require('better-sqlite3');
console.log('🧪 TESTE DE EMISSÃO COMPLETA - NFe\n');
console.log('═'.repeat(70));
async function testarEmissao() {
  try {
    // 1. Buscar empresa
    console.log('\n📊 1. Buscando empresa...\n');
    const mainDb = new Database('./principal.db');
    const empresa = mainDb.prepare('SELECT * FROM empresas LIMIT 1').get();
    mainDb.close();
    if (!empresa) {
      console.log('❌ Nenhuma empresa cadastrada!');
      return;
    }
    console.log(`✅ Empresa encontrada: ${empresa.razao_social}`);
    console.log(`   CNPJ: ${empresa.cnpj}`);
    console.log(`   CRT: ${empresa.crt || '(não configurado)'}`);

    // 2. Buscar cliente
    console.log('\n👤 2. Buscando cliente...\n');
    const db = new Database(`./empresa_${empresa.id}.db`);
    const cliente = db.prepare('SELECT * FROM clientes LIMIT 1').get();
    if (!cliente) {
      console.log('❌ Nenhum cliente cadastrado!');
      db.close();
      return;
    }
    console.log(`✅ Cliente encontrado: ${cliente.razao_social}`);
    console.log(`   Documento: ${cliente.documento}`);

    // 3. Buscar produto
    console.log('\n📦 3. Buscando produto...\n');
    const produto = db.prepare('SELECT * FROM produtos LIMIT 1').get();
    if (!produto) {
      console.log('❌ Nenhum produto cadastrado!');
      db.close();
      return;
    }
    console.log(`✅ Produto encontrado: ${produto.descricao}`);
    console.log(`   Valor: R$ ${produto.preco_venda}`);

    // 4. Buscar configurações
    console.log('\n⚙️  4. Verificando configurações...\n');
    const config = db.prepare('SELECT * FROM configuracoes WHERE id = 1').get();
    if (!config) {
      console.log('❌ Configurações não encontradas!');
      db.close();
      return;
    }
    console.log(`✅ Configurações encontradas:`);
    console.log(`   Ambiente: ${config.sefaz_ambiente === 1 ? 'Produção' : 'Homologação'}`);
    console.log(`   Série: ${config.serie_nfe}`);
    console.log(`   Próximo número: ${config.proximo_numero}`);
    db.close();

    // 5. Montar dados da NFe
    console.log('\n📝 5. Montando dados da NFe...\n');
    const nfe = {
      serie: config.serie_nfe,
      numero: config.proximo_numero,
      natureza_operacao: 'Venda de mercadoria',
      cfop: '5102',
      valor_total: parseFloat(produto.preco_venda)
    };
    const items = [{
      produto_id: produto.id,
      descricao: produto.descricao,
      ncm: produto.ncm || '84716053',
      quantidade: 1,
      valor_unitario: parseFloat(produto.preco_venda),
      valor_total: parseFloat(produto.preco_venda)
    }];
    console.log(`✅ Dados montados:`);
    console.log(`   Série: ${nfe.serie}`);
    console.log(`   Número: ${nfe.numero}`);
    console.log(`   Valor: R$ ${nfe.valor_total.toFixed(2)}`);

    // 6. Gerar XML
    console.log('\n🔨 6. Gerando XML...\n');
    const {
      xml,
      chave
    } = nfeService.gerarXML(nfe, empresa, cliente, items);
    console.log(`✅ XML gerado com sucesso!`);
    console.log(`   Tamanho: ${xml.length} bytes`);
    console.log(`   Chave: ${chave}`);

    // 7. Assinar XML
    console.log('\n🔏 7. Assinando XML...\n');
    const xmlAssinado = nfeService.assinarXML(xml, empresa.id);
    if (xmlAssinado.includes('<Signature')) {
      console.log(`✅ XML assinado com sucesso!`);
      console.log(`   Tamanho: ${xmlAssinado.length} bytes`);
    } else {
      console.log(`⚠️  XML não foi assinado (certificado não configurado)`);
    }

    // 8. Verificar status SEFAZ
    console.log('\n🌐 8. Verificando status da SEFAZ...\n');
    const status = await nfeService.consultarStatus(config.sefaz_uf, empresa.id);
    console.log(`📊 Status SEFAZ ${config.sefaz_uf}:`);
    console.log(`   Código: ${status.codigo}`);
    console.log(`   Mensagem: ${status.mensagem}`);
    console.log(`   Status: ${status.status === 'online' ? '✅ Online' : '❌ Offline'}`);
    if (status.status !== 'online') {
      console.log('\n⚠️  SEFAZ offline! Não é possível enviar a NFe agora.');
      console.log('   A NFe será salva localmente para envio posterior.\n');
    }

    // 9. Enviar NFe
    console.log('\n📤 9. Enviando NFe para SEFAZ...\n');
    const resultado = await nfeService.enviarNFe(xmlAssinado, config.sefaz_uf, empresa.id);
    if (resultado.online) {
      console.log('✅ NFe enviada com sucesso!');
      console.log('\n📊 Resposta da SEFAZ:');
      console.log(JSON.stringify(resultado.data, null, 2));
    } else {
      console.log('⚠️  NFe salva em modo offline');
      console.log(`   Motivo: ${resultado.mensagem}`);
      console.log(`   Detalhes: ${resultado.detalhes || 'N/A'}`);
    }

    // 10. Salvar arquivos
    console.log('\n💾 10. Salvando arquivos...\n');
    const arquivos = nfeService.salvarArquivos(empresa.id, nfe.numero, xmlAssinado, chave, !resultado.online);
    console.log(`✅ Arquivos salvos:`);
    console.log(`   XML: ${arquivos.xmlPath}`);
    console.log(`   Log: ${arquivos.logPath}`);

    // Resumo final
    console.log('\n' + '═'.repeat(70));
    console.log('\n📋 RESUMO DO TESTE:\n');
    console.log(`✅ Empresa: ${empresa.razao_social}`);
    console.log(`✅ Cliente: ${cliente.razao_social}`);
    console.log(`✅ Produto: ${produto.descricao}`);
    console.log(`✅ Valor: R$ ${nfe.valor_total.toFixed(2)}`);
    console.log(`✅ Chave: ${chave}`);
    console.log(`${resultado.online ? '✅' : '⚠️ '} Status: ${resultado.online ? 'Enviada para SEFAZ' : 'Salva localmente'}`);
    if (resultado.online) {
      console.log('\n🎉 SUCESSO! NFe autorizada pela SEFAZ!\n');
    } else {
      console.log('\n⚠️  NFe salva localmente. Verifique:');
      console.log('   1. Certificado digital configurado');
      console.log('   2. Senha do certificado correta');
      console.log('   3. Status da SEFAZ');
      console.log('   4. Conexão com internet\n');
    }
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    console.error('\n📋 Stack trace:');
    console.error(error.stack);
  }
}

// Executar teste
testarEmissao().then(() => {
  console.log('═'.repeat(70));
  console.log('\n✅ Teste concluído!\n');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});