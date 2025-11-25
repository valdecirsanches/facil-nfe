const libxmljs = require('libxmljs2');
const fs = require('fs');
const path = require('path');

/**
 * VALIDADOR XSD OFICIAL DA RECEITA FEDERAL
 * 
 * Valida XMLs de NFe contra os schemas oficiais (XSD) da Receita
 * 
 * XSDs necessários (baixar do Portal da NFe):
 * - nfe_v4.00.xsd (schema principal)
 * - tiposBasico_v4.00.xsd (tipos básicos)
 * - xmldsig-core-schema_v1.01.xsd (assinatura digital)
 */

class ValidadorXSDOficial {
  constructor() {
    this.schemasPath = path.join(__dirname, 'schemas');
    this.schemas = {};
    this.carregarSchemas();
  }

  carregarSchemas() {
    console.log('📂 Carregando schemas XSD oficiais...\n');

    const arquivosXSD = [
      'nfe_v4.00.xsd',
      'tiposBasico_v4.00.xsd', 
      'xmldsig-core-schema_v1.01.xsd'
    ];

    arquivosXSD.forEach(arquivo => {
      const caminhoCompleto = path.join(this.schemasPath, arquivo);
      
      if (fs.existsSync(caminhoCompleto)) {
        try {
          const conteudoXSD = fs.readFileSync(caminhoCompleto, 'utf8');
          this.schemas[arquivo] = libxmljs.parseXml(conteudoXSD);
          console.log(`✅ ${arquivo} carregado`);
        } catch (error) {
          console.error(`❌ Erro ao carregar ${arquivo}:`, error.message);
        }
      } else {
        console.warn(`⚠️  ${arquivo} não encontrado em ${this.schemasPath}`);
      }
    });

    console.log('');
  }

  validar(xmlString) {
    console.log('🔍 Validando XML contra schema XSD oficial...\n');

    const erros = [];
    const avisos = [];

    try {
      // Parse do XML
      const xmlDoc = libxmljs.parseXml(xmlString);

      // Validar contra schema principal
      const schemaPrincipal = this.schemas['nfe_v4.00.xsd'];
      
      if (!schemaPrincipal) {
        return {
          valido: false,
          erros: ['Schema XSD não encontrado. Execute: npm install libxmljs2 e baixe os XSDs da Receita'],
          avisos: []
        };
      }

      const validacao = xmlDoc.validate(schemaPrincipal);

      if (!validacao) {
        // Coletar erros de validação
        xmlDoc.validationErrors.forEach(erro => {
          erros.push({
            linha: erro.line,
            coluna: erro.column,
            mensagem: erro.message,
            tipo: 'ERRO_SCHEMA'
          });
        });
      }

      // Validações adicionais específicas da NFe
      this.validacoesAdicionais(xmlDoc, erros, avisos);

      const valido = erros.length === 0;

      console.log(valido ? '✅ XML VÁLIDO' : '❌ XML INVÁLIDO');
      console.log(`Erros: ${erros.length}`);
      console.log(`Avisos: ${avisos.length}\n`);

      return {
        valido,
        erros,
        avisos
      };

    } catch (error) {
      console.error('❌ Erro ao validar XML:', error.message);
      
      return {
        valido: false,
        erros: [{
          mensagem: `Erro ao processar XML: ${error.message}`,
          tipo: 'ERRO_PARSE'
        }],
        avisos: []
      };
    }
  }

  validacoesAdicionais(xmlDoc, erros, avisos) {
    // Validar estrutura básica
    const nfe = xmlDoc.get('//NFe');
    if (!nfe) {
      erros.push({
        mensagem: 'Tag <NFe> não encontrada',
        tipo: 'ESTRUTURA'
      });
      return;
    }

    // Validar chave de acesso
    const chave = xmlDoc.get('//infNFe/@Id');
    if (chave) {
      const chaveValor = chave.value().replace('NFe', '');
      if (chaveValor.length !== 44) {
        erros.push({
          mensagem: 'Chave de acesso deve ter 44 dígitos',
          tipo: 'CHAVE_ACESSO',
          campo: 'infNFe/@Id'
        });
      }
    }

    // Validar datas
    const dhEmi = xmlDoc.get('//dhEmi');
    if (dhEmi) {
      const dataEmissao = dhEmi.text();
      if (!this.validarDataISO(dataEmissao)) {
        erros.push({
          mensagem: 'Data de emissão inválida (formato: AAAA-MM-DDTHH:MM:SS-03:00)',
          tipo: 'DATA',
          campo: 'dhEmi',
          valor: dataEmissao
        });
      }
    }

    // Validar valores numéricos
    const vNF = xmlDoc.get('//vNF');
    if (vNF) {
      const valor = parseFloat(vNF.text());
      if (isNaN(valor) || valor <= 0) {
        erros.push({
          mensagem: 'Valor total da NFe inválido',
          tipo: 'VALOR',
          campo: 'vNF',
          valor: vNF.text()
        });
      }
    }

    // Validar CNPJ/CPF
    const cnpjEmit = xmlDoc.get('//emit/CNPJ');
    if (cnpjEmit && !this.validarCNPJ(cnpjEmit.text())) {
      erros.push({
        mensagem: 'CNPJ do emitente inválido',
        tipo: 'DOCUMENTO',
        campo: 'emit/CNPJ',
        valor: cnpjEmit.text()
      });
    }

    // Validar código de município
    const cMunEmit = xmlDoc.get('//emit/enderEmit/cMun');
    if (cMunEmit) {
      const codMun = cMunEmit.text();
      if (codMun.length !== 7) {
        erros.push({
          mensagem: 'Código do município deve ter 7 dígitos',
          tipo: 'MUNICIPIO',
          campo: 'emit/enderEmit/cMun',
          valor: codMun
        });
      }
    }

    // Validar assinatura digital
    const signature = xmlDoc.get('//Signature');
    if (!signature) {
      avisos.push({
        mensagem: 'XML não possui assinatura digital',
        tipo: 'ASSINATURA'
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

    // Validar dígitos verificadores
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    const digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado != digitos.charAt(0)) return false;

    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }

    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado != digitos.charAt(1)) return false;

    return true;
  }

  gerarRelatorioDetalhado(resultado) {
    console.log('\n' + '═'.repeat(70));
    console.log('📊 RELATÓRIO DE VALIDAÇÃO XSD');
    console.log('═'.repeat(70) + '\n');

    if (resultado.valido) {
      console.log('✅ XML VÁLIDO - Pronto para transmissão\n');
    } else {
      console.log('❌ XML INVÁLIDO - Corrija os erros abaixo\n');
      
      console.log('🔴 ERROS ENCONTRADOS:\n');
      resultado.erros.forEach((erro, index) => {
        console.log(`${index + 1}. [${erro.tipo}]`);
        console.log(`   Mensagem: ${erro.mensagem}`);
        if (erro.campo) console.log(`   Campo: ${erro.campo}`);
        if (erro.valor) console.log(`   Valor: ${erro.valor}`);
        if (erro.linha) console.log(`   Linha: ${erro.linha}, Coluna: ${erro.coluna}`);
        console.log('');
      });
    }

    if (resultado.avisos.length > 0) {
      console.log('⚠️  AVISOS:\n');
      resultado.avisos.forEach((aviso, index) => {
        console.log(`${index + 1}. [${aviso.tipo}] ${aviso.mensagem}`);
      });
      console.log('');
    }

    console.log('═'.repeat(70) + '\n');
  }
}

// Exportar para uso no nfe_service.js
module.exports = ValidadorXSDOficial;

// Teste standalone
if (require.main === module) {
  const validador = new ValidadorXSDOficial();
  
  // Exemplo de uso
  const xmlTeste = fs.readFileSync('./Arqs/empresa_1/pendentes/NFe000060_pendente.xml', 'utf8');
  
  const resultado = validador.validar(xmlTeste);
  validador.gerarRelatorioDetalhado(resultado);
}
