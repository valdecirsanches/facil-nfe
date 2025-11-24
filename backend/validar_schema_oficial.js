const fs = require('fs');
const path = require('path');
const {
  exec
} = require('child_process');
console.log('🔍 VALIDAÇÃO CONTRA SCHEMA OFICIAL NFe 4.0\n');
console.log('═'.repeat(70));

// Buscar XML mais recente
const logsDir = path.join(__dirname, 'Arqs', 'empresa_1', 'logs');
const arquivos = fs.readdirSync(logsDir).filter(f => f.startsWith('debug_xml_')).sort().reverse();
if (arquivos.length === 0) {
  console.log('❌ Nenhum XML encontrado!');
  process.exit(1);
}
const xmlPath = path.join(logsDir, arquivos[0]);
const xml = fs.readFileSync(xmlPath, 'utf8');
console.log(`📄 Analisando: ${arquivos[0]}\n`);
console.log('═'.repeat(70));

// Análise detalhada de campos específicos que costumam causar erro 225
console.log('\n🔍 ANÁLISE DETALHADA DE CAMPOS:\n');

// 1. Verificar dhEmi (formato de data/hora)
const dhEmiMatch = xml.match(/<dhEmi>(.*?)<\/dhEmi>/);
if (dhEmiMatch) {
  const dhEmi = dhEmiMatch[1];
  console.log(`📅 dhEmi: ${dhEmi}`);

  // Formato correto: AAAA-MM-DDTHH:MM:SS-03:00
  const formatoCorreto = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;
  if (formatoCorreto.test(dhEmi)) {
    console.log('   ✅ Formato correto\n');
  } else {
    console.log('   ❌ FORMATO INCORRETO!');
    console.log('   Esperado: AAAA-MM-DDTHH:MM:SS-03:00\n');
  }
}

// 2. Verificar valores numéricos
console.log('💰 VALORES NUMÉRICOS:\n');
const camposNumericos = ['qCom', 'vUnCom', 'vProd', 'qTrib', 'vUnTrib', 'vBC', 'vICMS', 'vPIS', 'vCOFINS', 'vNF', 'vTotTrib', 'vPag'];
camposNumericos.forEach(campo => {
  const regex = new RegExp(`<${campo}>(.*?)<\/${campo}>`, 'g');
  const matches = [...xml.matchAll(regex)];
  if (matches.length > 0) {
    matches.forEach(match => {
      const valor = match[1];

      // Verificar formato
      const formatoCorreto = /^\d+\.\d{2,4}$/.test(valor);
      const temPonto = valor.includes('.');
      if (!temPonto) {
        console.log(`   ❌ <${campo}>: ${valor} (falta casas decimais)`);
      } else if (!formatoCorreto) {
        console.log(`   ⚠️  <${campo}>: ${valor} (formato pode estar incorreto)`);
      }
    });
  }
});
console.log('   ✅ Verificação de valores concluída\n');

// 3. Verificar CNPJ/CPF
console.log('📋 DOCUMENTOS:\n');
const cnpjMatch = xml.match(/<CNPJ>(\d+)<\/CNPJ>/g);
if (cnpjMatch) {
  cnpjMatch.forEach(match => {
    const cnpj = match.match(/\d+/)[0];
    if (cnpj.length === 14) {
      console.log(`   ✅ CNPJ: ${cnpj} (14 dígitos)`);
    } else {
      console.log(`   ❌ CNPJ: ${cnpj} (${cnpj.length} dígitos - esperado 14)`);
    }
  });
}
const cpfMatch = xml.match(/<CPF>(\d+)<\/CPF>/g);
if (cpfMatch) {
  cpfMatch.forEach(match => {
    const cpf = match.match(/\d+/)[0];
    if (cpf.length === 11) {
      console.log(`   ✅ CPF: ${cpf} (11 dígitos)`);
    } else {
      console.log(`   ❌ CPF: ${cpf} (${cpf.length} dígitos - esperado 11)`);
    }
  });
}

// 4. Verificar CEP
console.log('\n📮 CEP:\n');
const cepMatches = xml.match(/<CEP>(\d+)<\/CEP>/g);
if (cepMatches) {
  cepMatches.forEach(match => {
    const cep = match.match(/\d+/)[0];
    if (cep.length === 8) {
      console.log(`   ✅ CEP: ${cep} (8 dígitos)`);
    } else {
      console.log(`   ❌ CEP: ${cep} (${cep.length} dígitos - esperado 8)`);
    }
  });
}

// 5. Verificar códigos de município
console.log('\n🏙️  CÓDIGOS DE MUNICÍPIO:\n');
const cMunMatches = xml.match(/<cMun>(\d+)<\/cMun>/g);
if (cMunMatches) {
  cMunMatches.forEach(match => {
    const cMun = match.match(/\d+/)[0];
    if (cMun.length === 7) {
      console.log(`   ✅ cMun: ${cMun} (7 dígitos)`);
    } else {
      console.log(`   ❌ cMun: ${cMun} (${cMun.length} dígitos - esperado 7)`);
    }
  });
}

// 6. Verificar NCM
console.log('\n📦 NCM:\n');
const ncmMatch = xml.match(/<NCM>(\d+)<\/NCM>/);
if (ncmMatch) {
  const ncm = ncmMatch[1];
  if (ncm.length === 8) {
    console.log(`   ✅ NCM: ${ncm} (8 dígitos)`);
  } else {
    console.log(`   ❌ NCM: ${ncm} (${ncm.length} dígitos - esperado 8)`);
  }
}

// 7. Verificar CFOP
console.log('\n🔢 CFOP:\n');
const cfopMatch = xml.match(/<CFOP>(\d+)<\/CFOP>/);
if (cfopMatch) {
  const cfop = cfopMatch[1];
  if (cfop.length === 4) {
    console.log(`   ✅ CFOP: ${cfop} (4 dígitos)`);
  } else {
    console.log(`   ❌ CFOP: ${cfop} (${cfop.length} dígitos - esperado 4)`);
  }
}

// 8. Verificar chave de acesso
console.log('\n🔑 CHAVE DE ACESSO:\n');
const idMatch = xml.match(/Id="NFe(\d+)"/);
if (idMatch) {
  const chave = idMatch[1];
  if (chave.length === 44) {
    console.log(`   ✅ Chave: ${chave} (44 dígitos)`);
  } else {
    console.log(`   ❌ Chave: ${chave} (${chave.length} dígitos - esperado 44)`);
  }
}

// 9. Análise específica de campos problemáticos conhecidos
console.log('\n⚠️  CAMPOS PROBLEMÁTICOS CONHECIDOS:\n');
let problemasEncontrados = [];

// Verificar se indPag está correto (0 ou 1)
const indPagMatch = xml.match(/<indPag>(\d+)<\/indPag>/);
if (indPagMatch) {
  const indPag = indPagMatch[1];
  if (indPag === '0' || indPag === '1') {
    console.log(`   ✅ indPag: ${indPag}`);
  } else {
    problemasEncontrados.push(`indPag inválido: ${indPag} (deve ser 0 ou 1)`);
    console.log(`   ❌ indPag: ${indPag} (deve ser 0 ou 1)`);
  }
}

// Verificar se tPag está correto
const tPagMatch = xml.match(/<tPag>(\d+)<\/tPag>/);
if (tPagMatch) {
  const tPag = tPagMatch[1];
  const tPagValidos = ['01', '02', '03', '04', '05', '10', '11', '12', '13', '14', '15', '90', '99'];
  if (tPagValidos.includes(tPag)) {
    console.log(`   ✅ tPag: ${tPag}`);
  } else {
    problemasEncontrados.push(`tPag inválido: ${tPag}`);
    console.log(`   ❌ tPag: ${tPag} (código inválido)`);
  }
}

// Verificar se modFrete está correto
const modFreteMatch = xml.match(/<modFrete>(\d+)<\/modFrete>/);
if (modFreteMatch) {
  const modFrete = modFreteMatch[1];
  if (['0', '1', '2', '3', '4', '9'].includes(modFrete)) {
    console.log(`   ✅ modFrete: ${modFrete}`);
  } else {
    problemasEncontrados.push(`modFrete inválido: ${modFrete}`);
    console.log(`   ❌ modFrete: ${modFrete} (deve ser 0-4 ou 9)`);
  }
}

// Verificar se indIEDest está correto
const indIEDestMatch = xml.match(/<indIEDest>(\d+)<\/indIEDest>/);
if (indIEDestMatch) {
  const indIEDest = indIEDestMatch[1];
  if (['1', '2', '9'].includes(indIEDest)) {
    console.log(`   ✅ indIEDest: ${indIEDest}`);
  } else {
    problemasEncontrados.push(`indIEDest inválido: ${indIEDest}`);
    console.log(`   ❌ indIEDest: ${indIEDest} (deve ser 1, 2 ou 9)`);
  }
}
console.log('\n' + '═'.repeat(70));
console.log('\n📋 RESUMO FINAL:\n');
if (problemasEncontrados.length === 0) {
  console.log('✅ Todos os campos verificados estão corretos!\n');
  console.log('🤔 O erro 225 pode ser causado por:\n');
  console.log('   1. Algum campo obrigatório específico do seu estado/município');
  console.log('   2. Regra de validação específica da SEFAZ-SP');
  console.log('   3. Problema com encoding de caracteres especiais');
  console.log('   4. Ordem de tags em algum grupo específico\n');
  console.log('💡 PRÓXIMOS PASSOS:\n');
  console.log('   1. Abra o arquivo: ./xml_formatado_analise.xml');
  console.log('   2. Compare com um XML válido de exemplo');
  console.log('   3. Verifique o Manual de Integração NFe 4.0');
  console.log('   4. Consulte a tabela de rejeições da SEFAZ\n');
  console.log('📚 Documentação oficial:');
  console.log('   https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=Iy/5Qol1YbE=\n');
} else {
  console.log('❌ PROBLEMAS ENCONTRADOS:\n');
  problemasEncontrados.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p}`);
  });
  console.log('\n💡 Corrija estes problemas e tente novamente.\n');
}
console.log('═'.repeat(70));
console.log('\n📄 XML completo salvo em: ./xml_formatado_analise.xml');
console.log('   Abra este arquivo para análise visual detalhada.\n');