const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const forge = require('node-forge');
console.log('🔍 DIAGNÓSTICO COMPLETO - AUTORIZAÇÃO NFe\n');
console.log('═'.repeat(70));

// 1. VERIFICAR BANCO DE DADOS E CONFIGURAÇÕES
console.log('\n📊 1. VERIFICANDO BANCO DE DADOS...\n');
const mainDb = new Database('./principal.db');
const empresas = mainDb.prepare('SELECT id, razao_social, cnpj, crt FROM empresas').all();
if (empresas.length === 0) {
  console.log('❌ Nenhuma empresa cadastrada!');
  mainDb.close();
  process.exit(1);
}
console.log(`✅ Encontradas ${empresas.length} empresa(s):`);
empresas.forEach(emp => {
  console.log(`   - ID ${emp.id}: ${emp.razao_social}`);
  console.log(`     CNPJ: ${emp.cnpj}`);
  console.log(`     CRT: ${emp.crt || '(não configurado)'}`);
});
mainDb.close();

// 2. VERIFICAR CONFIGURAÇÕES DE CADA EMPRESA
console.log('\n⚙️  2. VERIFICANDO CONFIGURAÇÕES...\n');
empresas.forEach(empresa => {
  const dbPath = `./empresa_${empresa.id}.db`;
  if (!fs.existsSync(dbPath)) {
    console.log(`❌ Banco empresa_${empresa.id}.db não existe!`);
    return;
  }
  const db = new Database(dbPath);
  const config = db.prepare('SELECT * FROM configuracoes WHERE id = 1').get();
  console.log(`📋 Empresa ${empresa.id} - ${empresa.razao_social}:`);
  console.log(`   Ambiente: ${config?.sefaz_ambiente === 1 ? 'Produção' : 'Homologação'}`);
  console.log(`   UF: ${config?.sefaz_uf || '(não configurado)'}`);
  console.log(`   Certificado: ${config?.certificado_path || '(não configurado)'}`);
  console.log(`   Senha certificado: ${config?.certificado_senha ? '✅ Configurada' : '❌ Não configurada'}`);
  console.log(`   Série NFe: ${config?.serie_nfe || '(não configurado)'}`);
  console.log(`   Próximo número: ${config?.proximo_numero || '(não configurado)'}`);
  console.log(`   CSOSN padrão: ${config?.csosn_padrao || '(não configurado)'}`);
  db.close();
});

// 3. VERIFICAR CERTIFICADO DIGITAL
console.log('\n🔐 3. VERIFICANDO CERTIFICADO DIGITAL...\n');
empresas.forEach(empresa => {
  const certPath = path.join(__dirname, 'Arqs', `empresa_${empresa.id}`, 'certificado.pfx');
  console.log(`📜 Empresa ${empresa.id}:`);
  if (!fs.existsSync(certPath)) {
    console.log(`   ❌ Certificado não encontrado em: ${certPath}`);
    return;
  }
  console.log(`   ✅ Certificado encontrado`);
  try {
    const db = new Database(`./empresa_${empresa.id}.db`);
    const config = db.prepare('SELECT certificado_senha FROM configuracoes WHERE id = 1').get();
    db.close();
    const senha = config?.certificado_senha || '';
    const pfxBuffer = fs.readFileSync(certPath);

    // Tentar ler o certificado
    const p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, senha);
    const bags = p12.getBags({
      bagType: forge.pki.oids.certBag
    });
    const certBag = bags[forge.pki.oids.certBag][0];
    const certificate = certBag.cert;
    console.log(`   ✅ Certificado válido`);
    console.log(`   📅 Válido de: ${certificate.validity.notBefore.toISOString().split('T')[0]}`);
    console.log(`   📅 Válido até: ${certificate.validity.notAfter.toISOString().split('T')[0]}`);
    const agora = new Date();
    if (agora < certificate.validity.notBefore) {
      console.log(`   ⚠️  ATENÇÃO: Certificado ainda não é válido!`);
    } else if (agora > certificate.validity.notAfter) {
      console.log(`   ❌ ERRO: Certificado VENCIDO!`);
    } else {
      const diasRestantes = Math.floor((certificate.validity.notAfter - agora) / (1000 * 60 * 60 * 24));
      console.log(`   ✅ Certificado válido (${diasRestantes} dias restantes)`);
    }

    // Extrair informações do certificado
    const subject = certificate.subject.attributes;
    const cnpjCert = subject.find(attr => attr.shortName === 'serialNumber')?.value || '';
    console.log(`   📋 CNPJ no certificado: ${cnpjCert}`);
    if (cnpjCert && empresa.cnpj.replace(/\D/g, '') !== cnpjCert.replace(/\D/g, '')) {
      console.log(`   ⚠️  ATENÇÃO: CNPJ do certificado diferente do cadastro!`);
    }
  } catch (error) {
    console.log(`   ❌ Erro ao ler certificado: ${error.message}`);
    if (error.message.includes('Invalid password')) {
      console.log(`   💡 Dica: Verifique a senha do certificado em Config. Sistema`);
    }
  }
});

// 4. VERIFICAR ESTRUTURA DE PASTAS
console.log('\n📁 4. VERIFICANDO ESTRUTURA DE PASTAS...\n');
empresas.forEach(empresa => {
  const baseDir = path.join(__dirname, 'Arqs', `empresa_${empresa.id}`);
  const dirs = ['xml', 'pdf', 'logs', 'pendentes'];
  console.log(`📂 Empresa ${empresa.id}:`);
  if (!fs.existsSync(baseDir)) {
    console.log(`   ❌ Pasta base não existe: ${baseDir}`);
    console.log(`   💡 Criando estrutura...`);
    fs.mkdirSync(baseDir, {
      recursive: true
    });
  }
  dirs.forEach(dir => {
    const dirPath = path.join(baseDir, dir);
    if (!fs.existsSync(dirPath)) {
      console.log(`   ⚠️  Pasta ${dir}/ não existe, criando...`);
      fs.mkdirSync(dirPath, {
        recursive: true
      });
    } else {
      console.log(`   ✅ Pasta ${dir}/ existe`);
    }
  });
});

// 5. VERIFICAR PRODUTOS E CLIENTES
console.log('\n📦 5. VERIFICANDO DADOS CADASTRAIS...\n');
empresas.forEach(empresa => {
  const db = new Database(`./empresa_${empresa.id}.db`);
  const produtos = db.prepare('SELECT COUNT(*) as total FROM produtos').get();
  const clientes = db.prepare('SELECT COUNT(*) as total FROM clientes').get();
  console.log(`📊 Empresa ${empresa.id}:`);
  console.log(`   Produtos cadastrados: ${produtos.total}`);
  console.log(`   Clientes cadastrados: ${clientes.total}`);
  if (produtos.total === 0) {
    console.log(`   ⚠️  Nenhum produto cadastrado!`);
  }
  if (clientes.total === 0) {
    console.log(`   ⚠️  Nenhum cliente cadastrado!`);
  }
  db.close();
});

// 6. GERAR RELATÓRIO FINAL
console.log('\n' + '═'.repeat(70));
console.log('\n📋 RELATÓRIO FINAL:\n');
let problemas = [];
let avisos = [];
empresas.forEach(empresa => {
  // Verificar CRT
  if (!empresa.crt) {
    problemas.push(`Empresa ${empresa.id}: CRT não configurado`);
  }

  // Verificar certificado
  const certPath = path.join(__dirname, 'Arqs', `empresa_${empresa.id}`, 'certificado.pfx');
  if (!fs.existsSync(certPath)) {
    problemas.push(`Empresa ${empresa.id}: Certificado não encontrado`);
  }

  // Verificar configurações
  const dbPath = `./empresa_${empresa.id}.db`;
  if (fs.existsSync(dbPath)) {
    const db = new Database(dbPath);
    const config = db.prepare('SELECT * FROM configuracoes WHERE id = 1').get();
    if (!config?.certificado_senha) {
      problemas.push(`Empresa ${empresa.id}: Senha do certificado não configurada`);
    }
    if (!config?.csosn_padrao) {
      avisos.push(`Empresa ${empresa.id}: CSOSN padrão não configurado (usará 102)`);
    }
    const produtos = db.prepare('SELECT COUNT(*) as total FROM produtos').get();
    const clientes = db.prepare('SELECT COUNT(*) as total FROM clientes').get();
    if (produtos.total === 0) {
      avisos.push(`Empresa ${empresa.id}: Nenhum produto cadastrado`);
    }
    if (clientes.total === 0) {
      avisos.push(`Empresa ${empresa.id}: Nenhum cliente cadastrado`);
    }
    db.close();
  }
});
if (problemas.length === 0 && avisos.length === 0) {
  console.log('✅ TUDO OK! Sistema pronto para emitir NFe!\n');
  console.log('🚀 Próximos passos:');
  console.log('   1. Inicie o backend: npm start');
  console.log('   2. Acesse o sistema');
  console.log('   3. Vá em "Nova NFe"');
  console.log('   4. Preencha os dados e emita!\n');
} else {
  if (problemas.length > 0) {
    console.log('❌ PROBLEMAS ENCONTRADOS:\n');
    problemas.forEach((p, i) => console.log(`   ${i + 1}. ${p}`));
    console.log('');
  }
  if (avisos.length > 0) {
    console.log('⚠️  AVISOS:\n');
    avisos.forEach((a, i) => console.log(`   ${i + 1}. ${a}`));
    console.log('');
  }
  console.log('💡 SOLUÇÕES:\n');
  if (problemas.some(p => p.includes('CRT'))) {
    console.log('   📋 CRT não configurado:');
    console.log('      - Acesse: Empresas → Editar');
    console.log('      - Configure o CRT (1 = Simples Nacional)\n');
  }
  if (problemas.some(p => p.includes('Certificado não encontrado'))) {
    console.log('   🔐 Certificado não encontrado:');
    console.log('      - Acesse: Config. Sistema');
    console.log('      - Faça upload do certificado .pfx\n');
  }
  if (problemas.some(p => p.includes('Senha do certificado'))) {
    console.log('   🔑 Senha do certificado:');
    console.log('      - Acesse: Config. Sistema');
    console.log('      - Configure a senha do certificado\n');
  }
  if (avisos.some(a => a.includes('produto'))) {
    console.log('   📦 Cadastrar produtos:');
    console.log('      - Acesse: Produtos → Novo Produto');
    console.log('      - Cadastre pelo menos 1 produto\n');
  }
  if (avisos.some(a => a.includes('cliente'))) {
    console.log('   👤 Cadastrar clientes:');
    console.log('      - Acesse: Clientes → Novo Cliente');
    console.log('      - Cadastre pelo menos 1 cliente\n');
  }
}
console.log('═'.repeat(70));
console.log('\n✅ Diagnóstico concluído!\n');