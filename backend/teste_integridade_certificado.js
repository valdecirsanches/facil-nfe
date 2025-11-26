const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

/**
 * Testa integridade do certificado comparando hashes
 */

// Configuração
const EMPRESA_ID = 1; // Altere para sua empresa
const CERTIFICADO_ORIGINAL = '/home/sanches/temp/edssolution13-05-2026-1008017763.pfx'; // ALTERE AQUI
const CERTIFICADO_UPLOADED = '/home/sanches/Magic/nfe/src/backend/Arqs/empresa_1/certificado.pfx' //`./Arqs/empresa_${EMPRESA_ID}/certificado.pfx`;
console.log('🔍 TESTE DE INTEGRIDADE DO CERTIFICADO\n');

// Função para calcular hash SHA256
function calcularHash(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  } catch (error) {
    console.error(`❌ Erro ao ler arquivo ${filePath}:`, error.message);
    return null;
  }
}

// Função para obter tamanho do arquivo
function obterTamanho(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return null;
  }
}

// Verificar se arquivos existem
console.log('📁 Verificando arquivos...\n');
if (!fs.existsSync(CERTIFICADO_UPLOADED)) {
  console.error(`❌ Certificado uploaded não encontrado: ${CERTIFICADO_UPLOADED}`);
  console.log('\n💡 Faça upload do certificado pela interface primeiro!');
  process.exit(1);
}
console.log(`✅ Certificado uploaded encontrado: ${CERTIFICADO_UPLOADED}`);

// Se você quiser comparar com o original, altere o caminho acima
if (CERTIFICADO_ORIGINAL === '/caminho/para/certificado_original.pfx') {
  console.log('\n⚠️  Para comparar com o original, edite o script e defina CERTIFICADO_ORIGINAL');
  console.log('   Exemplo: const CERTIFICADO_ORIGINAL = "/home/user/Downloads/certificado.pfx"');
  console.log('\n📊 Informações do certificado uploaded:\n');
  const tamanhoUploaded = obterTamanho(CERTIFICADO_UPLOADED);
  const hashUploaded = calcularHash(CERTIFICADO_UPLOADED);
  console.log(`   Tamanho: ${tamanhoUploaded} bytes`);
  console.log(`   SHA256:  ${hashUploaded}`);
  console.log('\n✅ Certificado uploaded está acessível e legível!');
  process.exit(0);
}

// Comparar com original
if (!fs.existsSync(CERTIFICADO_ORIGINAL)) {
  console.error(`\n❌ Certificado original não encontrado: ${CERTIFICADO_ORIGINAL}`);
  process.exit(1);
}
console.log(`✅ Certificado original encontrado: ${CERTIFICADO_ORIGINAL}\n`);

// Calcular hashes
console.log('🔐 Calculando hashes SHA256...\n');
const hashOriginal = calcularHash(CERTIFICADO_ORIGINAL);
const hashUploaded = calcularHash(CERTIFICADO_UPLOADED);
const tamanhoOriginal = obterTamanho(CERTIFICADO_ORIGINAL);
const tamanhoUploaded = obterTamanho(CERTIFICADO_UPLOADED);

// Exibir resultados
console.log('📊 RESULTADOS:\n');
console.log('📄 Certificado Original:');
console.log(`   Tamanho: ${tamanhoOriginal} bytes`);
console.log(`   SHA256:  ${hashOriginal}\n`);
console.log('📤 Certificado Uploaded:');
console.log(`   Tamanho: ${tamanhoUploaded} bytes`);
console.log(`   SHA256:  ${hashUploaded}\n`);

// Comparar
if (hashOriginal === hashUploaded) {
  console.log('✅ CERTIFICADOS IDÊNTICOS!');
  console.log('   Os arquivos são exatamente iguais (hash SHA256 idêntico)');
  console.log('   ✓ Upload funcionou perfeitamente!');
  console.log('   ✓ Nenhuma corrupção detectada!');
} else {
  console.log('❌ CERTIFICADOS DIFERENTES!');
  console.log('   Os hashes SHA256 não coincidem');
  console.log('   ⚠️  Pode haver corrupção no upload ou arquivos diferentes');
  if (tamanhoOriginal !== tamanhoUploaded) {
    console.log(`   ⚠️  Tamanhos diferentes: ${tamanhoOriginal} vs ${tamanhoUploaded} bytes`);
  }
}
console.log('\n🔍 TESTE ADICIONAL: Tentar ler o certificado com OpenSSL\n');

// Testar se o certificado pode ser lido
const {
  execSync
} = require('child_process');
try {
  console.log('📋 Informações do certificado uploaded:\n');
  const info = execSync(`openssl pkcs12 -in "${CERTIFICADO_UPLOADED}" -info -noout -passin pass:SENHA_AQUI 2>&1`, {
    encoding: 'utf8'
  });
  console.log(info);
  console.log('✅ Certificado pode ser lido pelo OpenSSL!');
} catch (error) {
  console.log('⚠️  Não foi possível ler com OpenSSL (pode ser senha incorreta)');
  console.log('   Isso é normal se você não definiu a senha no script');
}
console.log('\n✅ Teste de integridade concluído!');