const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
console.log('🔧 CORREÇÃO FINAL DE CEPs NO BANCO DE DADOS\n');

// Função para corrigir CEP (adicionar zero à esquerda se necessário)
function corrigirCEP(cep) {
  if (!cep) return null;

  // Remover formatação e garantir 8 dígitos
  const cepLimpo = String(cep).replace(/\D/g, '');
  const cepCorrigido = cepLimpo.padStart(8, '0');
  if (cepLimpo.length < 8) {
    console.log(`   ⚠️  CEP "${cep}" → "${cepCorrigido}" (adicionado zero à esquerda)`);
  }
  return cepCorrigido;
}

// Buscar todos os bancos de dados de empresas
const arquivos = fs.readdirSync(__dirname);
const bancosDados = arquivos.filter(f => f.startsWith('empresa_') && f.endsWith('.db'));
console.log(`📊 Encontrados ${bancosDados.length} banco(s) de dados\n`);
let totalCorrecoes = 0;
bancosDados.forEach(arquivo => {
  const empresaId = arquivo.match(/empresa_(\d+)\.db/)[1];
  console.log(`\n🏢 EMPRESA ${empresaId} (${arquivo})`);
  console.log('─'.repeat(60));
  try {
    const db = new Database(path.join(__dirname, arquivo));

    // 1. CORRIGIR EMPRESAS (EMITENTES)
    console.log('\n1️⃣  Corrigindo CEPs das EMPRESAS...');
    const empresas = db.prepare('SELECT id, razao_social, cep FROM empresas').all();
    empresas.forEach(empresa => {
      if (empresa.cep) {
        const cepOriginal = empresa.cep;
        const cepCorrigido = corrigirCEP(empresa.cep);
        if (cepOriginal !== cepCorrigido) {
          db.prepare('UPDATE empresas SET cep = ? WHERE id = ?').run(cepCorrigido, empresa.id);
          console.log(`   ✅ ${empresa.razao_social}: ${cepOriginal} → ${cepCorrigido}`);
          totalCorrecoes++;
        }
      }
    });

    // 2. CORRIGIR CLIENTES (DESTINATÁRIOS)
    console.log('\n2️⃣  Corrigindo CEPs dos CLIENTES...');
    const clientes = db.prepare('SELECT id, razao_social, cep FROM clientes').all();
    clientes.forEach(cliente => {
      if (cliente.cep) {
        const cepOriginal = cliente.cep;
        const cepCorrigido = corrigirCEP(cliente.cep);
        if (cepOriginal !== cepCorrigido) {
          db.prepare('UPDATE clientes SET cep = ? WHERE id = ?').run(cepCorrigido, cliente.id);
          console.log(`   ✅ ${cliente.razao_social}: ${cepOriginal} → ${cepCorrigido}`);
          totalCorrecoes++;
        }
      }
    });

    // 3. CORRIGIR TRANSPORTADORAS
    console.log('\n3️⃣  Corrigindo CEPs das TRANSPORTADORAS...');
    const transportadoras = db.prepare('SELECT id, razao_social, cep FROM transportadoras').all();
    transportadoras.forEach(transp => {
      if (transp.cep) {
        const cepOriginal = transp.cep;
        const cepCorrigido = corrigirCEP(transp.cep);
        if (cepOriginal !== cepCorrigido) {
          db.prepare('UPDATE transportadoras SET cep = ? WHERE id = ?').run(cepCorrigido, transp.id);
          console.log(`   ✅ ${transp.razao_social}: ${cepOriginal} → ${cepCorrigido}`);
          totalCorrecoes++;
        }
      }
    });

    // 4. CORRIGIR ENDEREÇOS DE ENTREGA
    console.log('\n4️⃣  Corrigindo CEPs dos ENDEREÇOS DE ENTREGA...');
    const enderecos = db.prepare('SELECT id, nome, cep FROM enderecos_entrega').all();
    enderecos.forEach(endereco => {
      if (endereco.cep) {
        const cepOriginal = endereco.cep;
        const cepCorrigido = corrigirCEP(endereco.cep);
        if (cepOriginal !== cepCorrigido) {
          db.prepare('UPDATE enderecos_entrega SET cep = ? WHERE id = ?').run(cepCorrigido, endereco.id);
          console.log(`   ✅ ${endereco.nome}: ${cepOriginal} → ${cepCorrigido}`);
          totalCorrecoes++;
        }
      }
    });
    db.close();
    console.log(`\n✅ Empresa ${empresaId} processada com sucesso!`);
  } catch (error) {
    console.error(`❌ Erro ao processar empresa ${empresaId}:`, error.message);
  }
});
console.log('\n' + '═'.repeat(60));
console.log(`\n✅ CORREÇÃO CONCLUÍDA!`);
console.log(`📊 Total de CEPs corrigidos: ${totalCorrecoes}`);
console.log('\n💡 PRÓXIMOS PASSOS:');
console.log('   1. Reinicie o backend: npm start');
console.log('   2. Teste emitir uma nova NFe');
console.log('   3. Verifique se o CEP tem 8 dígitos no XML gerado\n');