const fs = require('fs');
const path = require('path');

/**
 * VALIDADOR NFe - REGRAS DA RECEITA FEDERAL
 * 
 * Valida XMLs de NFe seguindo as regras oficiais da Receita
 * sem depender de bibliotecas XSD complexas
 */

class ValidadorNFeReceita {
  constructor() {
    this.erros = [];
    this.avisos = [];
  }
  validar(xmlString) {
    console.log('🔍 Validando NFe contra regras da Receita Federal...\n');
    this.erros = [];
    this.avisos = [];
    try {
      // Parse básico do XML
      const xml = this.parseXML(xmlString);

      // Validações estruturais
      this.validarEstrutura(xml);

      // Validações de dados
      this.validarDados(xml);

      // Validações de valores
      this.validarValores(xml);

      // Validações de impostos
      this.validarImpostos(xml);
      const valido = this.erros.length === 0;
      console.log(valido ? '✅ NFe VÁLIDA' : '❌ NFe INVÁLIDA');
      console.log(`Erros: ${this.erros.length}`);
      console.log(`Avisos: ${this.avisos.length}\n`);
      return {
        valido,
        erros: this.erros,
        avisos: this.avisos
      };
    } catch (error) {
      console.error('❌ Erro ao validar:', error.message);
      return {
        valido: false,
        erros: [{
          codigo: 'ERRO_PARSE',
          mensagem: `Erro ao processar XML: ${error.message}`
        }],
        avisos: []
      };
    }
  }
  parseXML(xmlString) {
    // Extrair valores usando regex (mais simples que parser XML completo)
    const extrair = tag => {
      const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i');
      const match = xmlString.match(regex);
      return match ? match[1].trim() : null;
    };
    const extrairAttr = (tag, attr) => {
      const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 'i');
      const match = xmlString.match(regex);
      return match ? match[1].trim() : null;
    };
    return {
      versao: extrairAttr('infNFe', 'versao'),
      id: extrairAttr('infNFe', 'Id'),
      // IDE
      cUF: extrair('cUF'),
      natOp: extrair('natOp'),
      mod: extrair('mod'),
      serie: extrair('serie'),
      nNF: extrair('nNF'),
      dhEmi: extrair('dhEmi'),
      dhSaiEnt: extrair('dhSaiEnt'),
      tpNF: extrair('tpNF'),
      cMunFG: extrair('cMunFG'),
      tpAmb: extrair('tpAmb'),
      // Emitente
      emitCNPJ: extrair('emit>CNPJ') || extrair('CNPJ'),
      emitxNome: extrair('emit>xNome') || extrair('xNome'),
      emitIE: extrair('emit>IE') || extrair('IE'),
      emitCRT: extrair('CRT'),
      emitcMun: this.extrairPrimeiro(xmlString, 'cMun'),
      emitUF: this.extrairPrimeiro(xmlString, 'UF'),
      emitCEP: this.extrairPrimeiro(xmlString, 'CEP'),
      // Destinatário
      destCNPJ: this.extrairSegundo(xmlString, 'CNPJ'),
      destCPF: this.extrairSegundo(xmlString, 'CPF'),
      destxNome: this.extrairSegundo(xmlString, 'xNome'),
      destcMun: this.extrairSegundo(xmlString, 'cMun'),
      destUF: this.extrairSegundo(xmlString, 'UF'),
      // Totais
      vBC: extrair('vBC'),
      vICMS: extrair('vICMS'),
      vProd: extrair('ICMSTot>vProd') || extrair('vProd'),
      vNF: extrair('vNF'),
      vPIS: extrair('ICMSTot>vPIS'),
      vCOFINS: extrair('ICMSTot>vCOFINS'),
      // Assinatura
      temAssinatura: xmlString.includes('<Signature'),
      xml: xmlString
    };
  }
  extrairPrimeiro(xml, tag) {
    const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  }
  extrairSegundo(xml, tag) {
    const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'gi');
    const matches = xml.match(regex);
    if (matches && matches.length > 1) {
      return matches[1].replace(/<[^>]*>/g, '').trim();
    }
    return null;
  }
  validarEstrutura(xml) {
    // Versão
    if (!xml.versao || xml.versao !== '4.00') {
      this.erros.push({
        codigo: '215',
        campo: 'infNFe/@versao',
        mensagem: 'Versão deve ser 4.00',
        valor: xml.versao
      });
    }

    // Chave de acesso
    if (!xml.id) {
      this.erros.push({
        codigo: '217',
        campo: 'infNFe/@Id',
        mensagem: 'Chave de acesso não informada'
      });
    } else {
      const chave = xml.id.replace('NFe', '');
      if (chave.length !== 44) {
        this.erros.push({
          codigo: '218',
          campo: 'infNFe/@Id',
          mensagem: 'Chave de acesso deve ter 44 dígitos',
          valor: chave
        });
      }
    }

    // Modelo
    if (xml.mod !== '55') {
      this.erros.push({
        codigo: '219',
        campo: 'mod',
        mensagem: 'Modelo deve ser 55 (NFe)',
        valor: xml.mod
      });
    }
  }
  validarDados(xml) {
    // Data de emissão
    if (!xml.dhEmi) {
      this.erros.push({
        codigo: '225',
        campo: 'dhEmi',
        mensagem: 'Data de emissão não informada'
      });
    } else if (!this.validarDataISO(xml.dhEmi)) {
      this.erros.push({
        codigo: '225',
        campo: 'dhEmi',
        mensagem: 'Data de emissão inválida (formato: AAAA-MM-DDTHH:MM:SS-03:00)',
        valor: xml.dhEmi
      });
    }

    // CNPJ Emitente
    if (!xml.emitCNPJ) {
      this.erros.push({
        codigo: '203',
        campo: 'emit/CNPJ',
        mensagem: 'CNPJ do emitente não informado'
      });
    } else if (!this.validarCNPJ(xml.emitCNPJ)) {
      this.erros.push({
        codigo: '203',
        campo: 'emit/CNPJ',
        mensagem: 'CNPJ do emitente inválido',
        valor: xml.emitCNPJ
      });
    }

    // Código do município emitente
    if (!xml.emitcMun) {
      this.erros.push({
        codigo: '204',
        campo: 'emit/enderEmit/cMun',
        mensagem: 'Código do município do emitente não informado'
      });
    } else if (xml.emitcMun.length !== 7) {
      this.erros.push({
        codigo: '204',
        campo: 'emit/enderEmit/cMun',
        mensagem: 'Código do município deve ter 7 dígitos',
        valor: xml.emitcMun
      });
    }

    // CEP
    if (xml.emitCEP) {
      const cep = xml.emitCEP.replace(/\D/g, '');
      if (cep.length !== 8) {
        this.avisos.push({
          campo: 'emit/enderEmit/CEP',
          mensagem: 'CEP deve ter 8 dígitos',
          valor: xml.emitCEP
        });
      }
    }

    // Destinatário
    if (!xml.destCNPJ && !xml.destCPF) {
      this.erros.push({
        codigo: '205',
        campo: 'dest/CNPJ ou dest/CPF',
        mensagem: 'CNPJ ou CPF do destinatário não informado'
      });
    }
    if (xml.destCNPJ && !this.validarCNPJ(xml.destCNPJ)) {
      this.erros.push({
        codigo: '205',
        campo: 'dest/CNPJ',
        mensagem: 'CNPJ do destinatário inválido',
        valor: xml.destCNPJ
      });
    }
    if (xml.destCPF && !this.validarCPF(xml.destCPF)) {
      this.erros.push({
        codigo: '206',
        campo: 'dest/CPF',
        mensagem: 'CPF do destinatário inválido',
        valor: xml.destCPF
      });
    }
  }
  validarValores(xml) {
    // Valor dos produtos
    if (!xml.vProd) {
      this.erros.push({
        codigo: '401',
        campo: 'vProd',
        mensagem: 'Valor total dos produtos não informado'
      });
    } else {
      const vProd = parseFloat(xml.vProd);
      if (isNaN(vProd) || vProd <= 0) {
        this.erros.push({
          codigo: '401',
          campo: 'vProd',
          mensagem: 'Valor total dos produtos inválido',
          valor: xml.vProd
        });
      }
    }

    // Valor total da NFe
    if (!xml.vNF) {
      this.erros.push({
        codigo: '402',
        campo: 'vNF',
        mensagem: 'Valor total da NFe não informado'
      });
    } else {
      const vNF = parseFloat(xml.vNF);
      if (isNaN(vNF) || vNF <= 0) {
        this.erros.push({
          codigo: '402',
          campo: 'vNF',
          mensagem: 'Valor total da NFe inválido',
          valor: xml.vNF
        });
      }
    }

    // Validar consistência de valores
    if (xml.vProd && xml.vNF) {
      const vProd = parseFloat(xml.vProd);
      const vNF = parseFloat(xml.vNF);
      if (!isNaN(vProd) && !isNaN(vNF) && Math.abs(vNF - vProd) > 0.02) {
        this.avisos.push({
          campo: 'vNF',
          mensagem: `Valor total (${vNF}) difere do valor dos produtos (${vProd})`
        });
      }
    }
  }
  validarImpostos(xml) {
    // ICMS
    if (!xml.vBC && !xml.vICMS) {
      this.avisos.push({
        campo: 'ICMS',
        mensagem: 'Valores de ICMS não informados'
      });
    }

    // PIS/COFINS
    if (!xml.vPIS || !xml.vCOFINS) {
      this.avisos.push({
        campo: 'PIS/COFINS',
        mensagem: 'Valores de PIS/COFINS não informados'
      });
    }

    // Assinatura
    if (!xml.temAssinatura) {
      this.avisos.push({
        campo: 'Signature',
        mensagem: 'XML não possui assinatura digital'
      });
    }
  }
  validarDataISO(data) {
    const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;
    return regex.test(data);
  }
  validarCNPJ(cnpj) {
    cnpj = cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1+$/.test(cnpj)) return false;
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    const digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }
    let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != digitos.charAt(0)) return false;
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != digitos.charAt(1)) return false;
    return true;
  }
  validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = 11 - soma % 11;
    let digito1 = resto === 10 || resto === 11 ? 0 : resto;
    if (digito1 !== parseInt(cpf.charAt(9))) return false;
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = 11 - soma % 11;
    let digito2 = resto === 10 || resto === 11 ? 0 : resto;
    if (digito2 !== parseInt(cpf.charAt(10))) return false;
    return true;
  }
  gerarRelatorio(resultado) {
    console.log('\n' + '═'.repeat(70));
    console.log('📊 RELATÓRIO DE VALIDAÇÃO NFe');
    console.log('═'.repeat(70) + '\n');
    if (resultado.valido) {
      console.log('✅ NFe VÁLIDA - Pronta para transmissão\n');
    } else {
      console.log('❌ NFe INVÁLIDA - Corrija os erros abaixo\n');
      console.log('🔴 ERROS ENCONTRADOS:\n');
      resultado.erros.forEach((erro, index) => {
        console.log(`${index + 1}. [Código ${erro.codigo || 'N/A'}]`);
        console.log(`   Campo: ${erro.campo}`);
        console.log(`   Mensagem: ${erro.mensagem}`);
        if (erro.valor) console.log(`   Valor: ${erro.valor}`);
        console.log('');
      });
    }
    if (resultado.avisos.length > 0) {
      console.log('⚠️  AVISOS:\n');
      resultado.avisos.forEach((aviso, index) => {
        console.log(`${index + 1}. ${aviso.campo}: ${aviso.mensagem}`);
        if (aviso.valor) console.log(`   Valor: ${aviso.valor}`);
      });
      console.log('');
    }
    console.log('═'.repeat(70) + '\n');
  }
}
module.exports = ValidadorNFeReceita;

// Teste standalone
if (require.main === module) {
  const validador = new ValidadorNFeReceita();

  // Procurar XML de teste
  const arqsPath = path.join(__dirname, 'Arqs');
  let xmlEncontrado = false;
  if (fs.existsSync(arqsPath)) {
    const empresas = fs.readdirSync(arqsPath).filter(f => f.startsWith('empresa_'));
    for (const empresa of empresas) {
      const nfePath = path.join(arqsPath, empresa, 'NFe');
      if (fs.existsSync(nfePath)) {
        const arquivos = fs.readdirSync(nfePath).filter(f => f.endsWith('-nfe.xml'));
        if (arquivos.length > 0) {
          const xmlPath = path.join(nfePath, arquivos[0]);
          const xmlString = fs.readFileSync(xmlPath, 'utf8');
          console.log(`📄 Validando: ${arquivos[0]}\n`);
          const resultado = validador.validar(xmlString);
          validador.gerarRelatorio(resultado);
          xmlEncontrado = true;
          break;
        }
      }
    }
  }
  if (!xmlEncontrado) {
    console.log('⚠️  Nenhum XML encontrado para validar');
    console.log('   Emita uma NFe primeiro ou use: node testar_validador_xsd.js\n');
  }
}