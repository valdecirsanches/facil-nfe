const fs = require('fs');
const path = require('path');

console.log('🔧 APLICANDO CORREÇÃO: CEP não atualiza cidade e código IBGE\n');
console.log('═'.repeat(70));

const arquivos = [
  {
    caminho: 'pages/Clients.tsx',
    nome: 'Clientes'
  },
  {
    caminho: 'pages/Companies.tsx',
    nome: 'Empresas'
  },
  {
    caminho: 'components/DeliveryAddresses.tsx',
    nome: 'Endereços de Entrega'
  }
];

let totalCorrecoes = 0;

arquivos.forEach(arquivo => {
  const caminhoCompleto = path.join(__dirname, arquivo.caminho);
  
  console.log(`\n📄 Processando: ${arquivo.nome} (${arquivo.caminho})`);
  console.log('─'.repeat(70));
  
  try {
    if (!fs.existsSync(caminhoCompleto)) {
      console.log(`   ⚠️  Arquivo não encontrado, pulando...`);
      return;
    }
    
    let conteudo = fs.readFileSync(caminhoCompleto, 'utf8');
    const conteudoOriginal = conteudo;
    
    // Padrão a ser corrigido: setFormData que não inclui o CEP retornado
    const padraoAntigo = /setFormData\(\(prev\) => \(\{\s*\.\.\.prev,\s*endereco: cepData\.endereco,\s*bairro: cepData\.bairro,\s*cidade: cepData\.cidade,\s*uf: cepData\.uf,\s*codigo_municipio: cepData\.codigo_municipio,\s*\}\)\)/g;
    
    const padraoNovo = `setFormData((prev) => ({
          ...prev,
          cep: cepData.cep,
          endereco: cepData.endereco,
          bairro: cepData.bairro,
          cidade: cepData.cidade,
          uf: cepData.uf,
          codigo_municipio: cepData.codigo_municipio,
        }))`;
    
    // Verificar se o padrão existe
    if (padraoAntigo.test(conteudo)) {
      // Fazer backup
      const backupPath = caminhoCompleto + '.backup_cep_' + Date.now();
      fs.writeFileSync(backupPath, conteudoOriginal, 'utf8');
      console.log(`   💾 Backup criado: ${path.basename(backupPath)}`);
      
      // Aplicar correção
      conteudo = conteudo.replace(padraoAntigo, padraoNovo);
      
      // Salvar arquivo corrigido
      fs.writeFileSync(caminhoCompleto, conteudo, 'utf8');
      
      console.log(`   ✅ Correção aplicada com sucesso!`);
      console.log(`   📝 Adicionada linha: cep: cepData.cep,`);
      totalCorrecoes++;
    } else {
      // Verificar se já está corrigido
      if (conteudo.includes('cep: cepData.cep,')) {
        console.log(`   ✅ Arquivo já está corrigido!`);
      } else {
        console.log(`   ⚠️  Padrão não encontrado. Pode precisar de correção manual.`);
      }
    }
    
  } catch (error) {
    console.log(`   ❌ Erro ao processar arquivo: ${error.message}`);
  }
});

console.log('\n' + '═'.repeat(70));
console.log(`\n📊 RESUMO:`);
console.log(`   ✅ Arquivos corrigidos: ${totalCorrecoes}`);
console.log(`   📁 Total de arquivos processados: ${arquivos.length}`);

if (totalCorrecoes > 0) {
  console.log('\n🎉 CORREÇÃO APLICADA COM SUCESSO!\n');
  console.log('📋 O QUE FOI CORRIGIDO:');
  console.log('   - Adicionada linha "cep: cepData.cep," no setFormData');
  console.log('   - Agora o CEP retornado pela API é aplicado corretamente\n');
  console.log('🔄 PRÓXIMOS PASSOS:');
  console.log('   1. Reinicie o frontend (se estiver rodando)');
  console.log('   2. Teste alterando o CEP de um cliente');
  console.log('   3. Verifique se cidade e código IBGE atualizam corretamente\n');
  console.log('🧪 TESTE SUGERIDO:');
  console.log('   CEP: 01310-100 (Av. Paulista, São Paulo)');
  console.log('   Deve preencher:');
  console.log('   - Cidade: São Paulo');
  console.log('   - UF: SP');
  console.log('   - Código IBGE: 3550308\n');
} else {
  console.log('\n⚠️  Nenhuma correção foi necessária.');
  console.log('   Os arquivos já estão corretos ou precisam de correção manual.\n');
}

console.log('═'.repeat(70) + '\n');
