const {
  execSync
} = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * VALIDADOR XSD USANDO XMLLINT (NATIVO LINUX)
 * 
 * Usa o xmllint do sistema para validar contra schemas XSD oficiais da Receita
 * Mais robusto e confiável que bibliotecas JavaScript
 */

class ValidadorXSDXmllint {
  constructor() {
    this.schemasPath = path.join(__dirname, 'schemas');
    this.verificarXmllint();
    this.verificarSchemas();
  }
  verificarXmllint() {
    try {
      execSync('which xmllint', {
        stdio: 'ignore'
      });
      console.log('✅ xmllint encontrado no sistema\n');
    } catch (error) {
      console.error('❌ xmllint não encontrado!');
      console.error('   Instale com: sudo apt-get install libxml2-utils\n');
      throw new Error('xmllint não instalado');
    }
  }
  verificarSchemas() {
    const schemasNecessarios = ['nfe_v4.00.xsd', 'tiposBasico_v4.00.xsd', 'xmldsig-core-schema_v1.01.xsd'];
    console.log('📂 Verificando schemas XSD...\n');
    if (!fs.existsSync(this.schemasPath)) {
      console.error(`❌ Pasta schemas não encontrada: ${this.schemasPath}`);
      console.error('   Crie a pasta e baixe os XSDs da Receita Federal\n');
      throw new Error('Schemas não encontrados');
    }
    const schemasFaltando = [];
    schemasNecessarios.forEach(schema => {
      const caminhoCompleto = path.join(this.schemasPath, schema);
      if (fs.existsSync(caminhoCompleto)) {
        console.log(`✅ ${schema}`);
      } else {
        console.log(`❌ ${schema} - NÃO ENCONTRADO`);
        schemasFaltando.push(schema);
      }
    });
    console.log('');
    if (schemasFaltando.length > 0) {
      console.error('⚠️  Schemas faltando. Baixe do portal da NFe:');
      console.error('   https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=/fwLvmBKWi0=\n');
      throw new Error('Schemas incompletos');
    }
  }
  validar(xmlString, opcoes = {}) {
    console.log('🔍 Validando XML contra schema XSD oficial (xmllint)...\n');
    const {
      verbose = false
    } = opcoes;
    try {
      // Criar arquivo temporário com o XML
      const tempXmlPath = path.join(__dirname, 'temp_validacao.xml');
      fs.writeFileSync(tempXmlPath, xmlString, 'utf8');

      // Caminho do schema principal
      const schemaPath = path.join(this.schemasPath, 'nfe_v4.00.xsd');

      // Executar xmllint
      const comando = `xmllint --noout --schema "${schemaPath}" "${tempXmlPath}" 2>&1`;
      if (verbose) {
        console.log(`Executando: ${comando}\n`);
      }
      try {
        const output = execSync(comando, {
          encoding: 'utf8',
          maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        });

        // Limpar arquivo temporário
        fs.unlinkSync(tempXmlPath);

        // Se chegou aqui, validação passou
        console.log('✅ XML VÁLIDO segundo schema XSD\n');
        return {
          valido: true,
          erros: [],
          avisos: [],
          output: output
        };
      } catch (error) {
        // xmllint retorna erro quando validação falha
        const output = error.stdout || error.message;

        // Limpar arquivo temporário
        if (fs.existsSync(tempXmlPath)) {
          fs.unlinkSync(tempXmlPath);
        }

        // Parsear erros do xmllint
        const erros = this.parsearErrosXmllint(output);
        console.log('❌ XML INVÁLIDO segundo schema XSD');
        console.log(`   ${erros.length} erro(s) encontrado(s)\n`);
        return {
          valido: false,
          erros: erros,
          avisos: [],
          output: output
        };
      }
    } catch (error) {
      console.error('❌ Erro ao validar:', error.message);
      return {
        valido: false,
        erros: [{
          tipo: 'ERRO_SISTEMA',
          mensagem: error.message
        }],
        avisos: []
      };
    }
  }
  parsearErrosXmllint(output) {
    const erros = [];
    const linhas = output.split('\n');
    linhas.forEach(linha => {
      // Formato típico: "file.xml:123: element 'tag': error message"
      const match = linha.match(/temp_validacao\.xml:(\d+):\s*element\s+'([^']+)':\s*(.+)/);
      if (match) {
        erros.push({
          linha: parseInt(match[1]),
          elemento: match[2],
          mensagem: match[3].trim(),
          tipo: 'ERRO_SCHEMA'
        });
      } else if (linha.includes('fails to validate')) {
        // Linha de resumo, ignorar
      } else if (linha.trim() && !linha.includes('validates')) {
        // Outros erros
        erros.push({
          mensagem: linha.trim(),
          tipo: 'ERRO_VALIDACAO'
        });
      }
    });
    return erros;
  }
  gerarRelatorio(resultado) {
    console.log('\n' + '═'.repeat(70));
    console.log('📊 RELATÓRIO DE VALIDAÇÃO XSD (xmllint)');
    console.log('═'.repeat(70) + '\n');
    if (resultado.valido) {
      console.log('✅ XML VÁLIDO - Conforme schema XSD oficial da Receita\n');
      console.log('   O XML está estruturalmente correto e pronto para:');
      console.log('   1. Assinatura digital');
      console.log('   2. Transmissão para SEFAZ\n');
    } else {
      console.log('❌ XML INVÁLIDO - Não conforme schema XSD\n');
      if (resultado.erros.length > 0) {
        console.log('🔴 ERROS ENCONTRADOS:\n');
        resultado.erros.forEach((erro, index) => {
          console.log(`${index + 1}. [${erro.tipo}]`);
          if (erro.linha) console.log(`   Linha: ${erro.linha}`);
          if (erro.elemento) console.log(`   Elemento: ${erro.elemento}`);
          console.log(`   Mensagem: ${erro.mensagem}`);
          console.log('');
        });
        console.log('💡 DICAS PARA CORREÇÃO:\n');
        console.log('   - Verifique a estrutura do XML');
        console.log('   - Confira tipos de dados (números, datas)');
        console.log('   - Valide campos obrigatórios');
        console.log('   - Compare com exemplos válidos\n');
      }
    }
    console.log('═'.repeat(70) + '\n');
  }
  validarComDetalhes(xmlString) {
    // Validação XSD
    const resultadoXSD = this.validar(xmlString);

    // Validações adicionais (regras de negócio)
    const ValidadorNFe = require('./validador_nfe_receita');
    const validadorNFe = new ValidadorNFe();
    const resultadoNFe = validadorNFe.validar(xmlString);

    // Combinar resultados
    return {
      xsd: resultadoXSD,
      nfe: resultadoNFe,
      valido: resultadoXSD.valido && resultadoNFe.valido,
      erros: [...resultadoXSD.erros, ...resultadoNFe.erros],
      avisos: [...resultadoXSD.avisos, ...resultadoNFe.avisos]
    };
  }
}
module.exports = ValidadorXSDXmllint;

// Teste standalone
if (require.main === module) {
  const validador = new ValidadorXSDXmllint();

  // Procurar XML de teste
  const arqsPath = path.join(__dirname, 'Arqs');
  let xmlEncontrado = false;
  if (fs.existsSync(arqsPath)) {
    const empresas = fs.readdirSync(arqsPath).filter(f => f.startsWith('empresa_'));
    for (const empresa of empresas) {
      // Procurar em pendentes primeiro
      const pendentesPath = path.join(arqsPath, empresa, 'pendentes');
      if (fs.existsSync(pendentesPath)) {
        const arquivos = fs.readdirSync(pendentesPath).filter(f => f.endsWith('.xml'));
        if (arquivos.length > 0) {
          const xmlPath = path.join(pendentesPath, arquivos[0]);
          const xmlString = fs.readFileSync(xmlPath, 'utf8');
          console.log(`📄 Validando: ${arquivos[0]}\n`);
          const resultado = validador.validar(xmlString);
          validador.gerarRelatorio(resultado);
          xmlEncontrado = true;
          break;
        }
      }

      // Se não encontrou em pendentes, procurar em NFe
      if (!xmlEncontrado) {
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
  }
  if (!xmlEncontrado) {
    console.log('⚠️  Nenhum XML encontrado para validar');
    console.log('   Emita uma NFe primeiro\n');
  }
}