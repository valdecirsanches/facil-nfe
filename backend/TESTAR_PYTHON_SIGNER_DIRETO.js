const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
console.log('🧪 TESTE DIRETO DO PYTHON SIGNER\n');
console.log('═'.repeat(80));
async function testarPythonSigner() {
  try {
    // 1. Buscar senha do certificado no banco
    console.log('🔐 Buscando senha do certificado no banco...\n');
    const db = new Database('./empresa_1.db');
    const config = db.prepare('SELECT certificado_senha FROM configuracoes WHERE id = 1').get();
    db.close();
    const senha = config?.certificado_senha || '';
    console.log(`✅ Senha encontrada: ${senha ? '***' + senha.slice(-2) : '(vazia)'}`);
    console.log(`📏 Tamanho da senha: ${senha.length} caracteres\n`);
    if (!senha) {
      console.log('❌ SENHA VAZIA NO BANCO!');
      console.log('   Execute: sqlite3 empresa_1.db "UPDATE configuracoes SET certificado_senha = \'05851287\' WHERE id = 1"\n');
      return;
    }

    // 2. Ler último XML gerado (SEM assinatura)
    const logsDir = path.join(__dirname, 'Arqs', 'empresa_1', 'logs');
    const xmlFiles = fs.readdirSync(logsDir).filter(f => f.startsWith('debug_xml_')).sort().reverse();
    if (xmlFiles.length === 0) {
      console.log('❌ Nenhum XML encontrado!');
      return;
    }
    const lastXmlFile = path.join(logsDir, xmlFiles[0]);
    const xmlContent = fs.readFileSync(lastXmlFile, 'utf8');
    console.log(`📄 Usando XML: ${xmlFiles[0]}`);
    console.log(`📏 Tamanho: ${xmlContent.length} bytes\n`);

    // 3. Enviar para Python Signer COM A SENHA CORRETA
    console.log('📤 Enviando para Python Signer (http://localhost:5301/sign)...');
    console.log(`🔑 Usando senha: ${senha}\n`);
    const certPath = path.join(__dirname, 'Arqs', 'empresa_1', 'certificado.pfx');
    const response = await axios.post('http://localhost:5301/sign', {
      xml: xmlContent,
      cert_path: certPath,
      cert_password: senha // ✅ SENHA CORRETA DO BANCO
    }, {
      timeout: 10000
    });
    console.log('✅ Resposta recebida!\n');
    console.log('📊 Status:', response.status);
    console.log('📦 Dados:', JSON.stringify(response.data, null, 2));
    if (response.data.success) {
      const xmlAssinado = response.data.signed_xml;
      console.log('\n✅ XML ASSINADO COM SUCESSO!');
      console.log(`📏 Tamanho do XML assinado: ${xmlAssinado.length} bytes`);
      console.log(`🔐 DigestValue: ${response.data.digest_value}`);

      // Verificar se tem assinatura
      if (xmlAssinado.includes('<Signature')) {
        console.log('✅ XML contém tag <Signature>');

        // Salvar XML assinado para comparação
        const outputPath = path.join(logsDir, `xml_assinado_teste_${Date.now()}.xml`);
        fs.writeFileSync(outputPath, xmlAssinado, 'utf8');
        console.log(`📁 XML assinado salvo em: ${outputPath}`);

        // Contar tags
        const signatureCount = (xmlAssinado.match(/<Signature/g) || []).length;
        console.log(`📊 Quantidade de <Signature>: ${signatureCount}`);
        if (signatureCount === 1) {
          console.log('✅ XML tem exatamente 1 assinatura (correto!)');
          console.log('\n🎉 PYTHON SIGNER FUNCIONANDO PERFEITAMENTE!');
          console.log('   O problema está no nfe_service.js não buscar a senha corretamente.\n');
        } else {
          console.log(`⚠️  XML tem ${signatureCount} assinaturas (esperado: 1)`);
        }
      } else {
        console.log('❌ XML NÃO contém tag <Signature>!');
        console.log('   Python Signer retornou XML sem assinatura!');
      }
    } else {
      console.log('❌ Python Signer retornou erro:');
      console.log(response.data);
    }
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:');
    if (error.code === 'ECONNREFUSED') {
      console.error('   Python Signer NÃO está rodando na porta 5301!');
      console.error('   Execute: cd python_signer && python3 signer.py');
    } else if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Dados:`, error.response.data);
    } else {
      console.error(`   Mensagem: ${error.message}`);
    }
  }
}
console.log('═'.repeat(80));
console.log('\n🚀 Iniciando teste...\n');
testarPythonSigner().then(() => {
  console.log('\n═'.repeat(80));
  console.log('\n✅ Teste concluído!\n');
}).catch(error => {
  console.error('\n❌ Erro fatal:', error);
});