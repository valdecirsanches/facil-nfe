const Database = require('better-sqlite3');
console.log('🧪 TESTE DE GERAÇÃO DE CHAVE DE ACESSO\n');
console.log('═'.repeat(60));

// Simular dados de uma NFe
const nfeTest = {
  numero: '28',
  serie: '1'
};
const emitenteTest = {
  cnpj: '67.570.036/0001-81',
  estado: 'SP',
  razao_social: 'EDS INFORMÁTICA LTDA ME',
  crt: '1'
};

// Função para calcular DV (copiada do nfe_service.js)
function calcularDV(chave) {
  if (!chave || chave.length !== 43) {
    throw new Error(`Chave inválida: ${chave?.length || 0} dígitos`);
  }
  const pesos = [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma = 0;
  for (let i = 0; i < 43; i++) {
    soma += parseInt(chave[i]) * pesos[i];
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

// Função para gerar chave (copiada do nfe_service.js)
function gerarChaveAcesso(nfe, emitente) {
  const cUF = '35'; // SP

  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = (now.getMonth() + 1).toString().padStart(2, '0');
  const aamm = yy + mm;
  const cnpj = emitente.cnpj.replace(/\D/g, '').padStart(14, '0');
  const mod = '55';
  const serie = nfe.serie.toString().padStart(3, '0');
  const nNF = nfe.numero.toString().padStart(9, '0');
  const tpEmis = '1';
  const cNF = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  const chaveBase = `${cUF}${aamm}${cnpj}${mod}${serie}${nNF}${tpEmis}${cNF}`;
  console.log('\n📋 COMPONENTES DA CHAVE:');
  console.log(`   cUF (UF): ${cUF} (${cUF.length} dígitos)`);
  console.log(`   AAMM (Ano/Mês): ${aamm} (${aamm.length} dígitos)`);
  console.log(`   CNPJ: ${cnpj} (${cnpj.length} dígitos)`);
  console.log(`   Modelo: ${mod} (${mod.length} dígitos)`);
  console.log(`   Série: ${serie} (${serie.length} dígitos)`);
  console.log(`   Número: ${nNF} (${nNF.length} dígitos)`);
  console.log(`   TpEmis: ${tpEmis} (${tpEmis.length} dígito)`);
  console.log(`   cNF (Aleatório): ${cNF} (${cNF.length} dígitos)`);
  console.log(`\n   Chave Base: ${chaveBase}`);
  console.log(`   Tamanho: ${chaveBase.length} dígitos`);
  if (chaveBase.length !== 43) {
    console.error(`\n❌ ERRO: Chave base tem ${chaveBase.length} dígitos, esperado 43!`);
    return null;
  }
  const dv = calcularDV(chaveBase);
  const chaveCompleta = chaveBase + dv;
  console.log(`\n   DV Calculado: ${dv}`);
  console.log(`\n🔑 CHAVE COMPLETA: ${chaveCompleta}`);
  console.log(`   Tamanho: ${chaveCompleta.length} dígitos`);
  return chaveCompleta;
}

// Gerar 3 chaves de teste
console.log('\n🎯 GERANDO 3 CHAVES DE TESTE:\n');
for (let i = 1; i <= 3; i++) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`TESTE ${i}:`);
  console.log('─'.repeat(60));
  const chave = gerarChaveAcesso(nfeTest, emitenteTest);
  if (chave && chave.length === 44) {
    console.log('\n✅ Chave válida!');
    console.log(`   Id da NFe: NFe${chave}`);
  } else {
    console.log('\n❌ Chave inválida!');
  }
}
console.log('\n' + '═'.repeat(60));
console.log('✅ Teste concluído!\n');
console.log('💡 Agora reinicie o backend e teste a emissão de NFe.');
console.log('   O log mostrará a chave gerada com todos os detalhes.\n');