const fs = require('fs');
const path = require('path');
class NFEValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  // Criar estrutura de pastas por empresa
  static ensureCompanyFolders(companyId) {
    const basePath = path.join(__dirname, 'Arqs', `empresa_${companyId}`);
    const folders = ['xml', 'pdf', 'logs'];
    folders.forEach(folder => {
      const folderPath = path.join(basePath, folder);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, {
          recursive: true
        });
      }
    });
    return {
      xml: path.join(basePath, 'xml'),
      pdf: path.join(basePath, 'pdf'),
      logs: path.join(basePath, 'logs')
    };
  }

  // Validar dados da empresa emitente
  validateEmitente(empresa) {
    if (!empresa) {
      this.errors.push({
        code: 'E001',
        field: 'emitente',
        message: 'Dados da empresa emitente não informados',
        severity: 'error'
      });
      return false;
    }
    if (!empresa.cnpj || empresa.cnpj.replace(/\D/g, '').length !== 14) {
      this.errors.push({
        code: 'E002',
        field: 'emitente.cnpj',
        message: 'CNPJ da empresa emitente inválido',
        severity: 'error'
      });
    }
    if (!empresa.ie) {
      this.errors.push({
        code: 'E003',
        field: 'emitente.ie',
        message: 'Inscrição Estadual da empresa emitente não informada',
        severity: 'error'
      });
    }
    if (!empresa.endereco || !empresa.cidade || !empresa.estado) {
      this.errors.push({
        code: 'E004',
        field: 'emitente.endereco',
        message: 'Endereço completo da empresa emitente obrigatório',
        severity: 'error'
      });
    }
    if (!empresa.cep || empresa.cep.replace(/\D/g, '').length !== 8) {
      this.errors.push({
        code: 'E005',
        field: 'emitente.cep',
        message: 'CEP da empresa emitente inválido',
        severity: 'error'
      });
    }
    return this.errors.length === 0;
  }

  // Validar dados do destinatário
  validateDestinatario(cliente) {
    if (!cliente) {
      this.errors.push({
        code: 'D001',
        field: 'destinatario',
        message: 'Dados do destinatário não informados',
        severity: 'error'
      });
      return false;
    }
    const doc = cliente.documento?.replace(/\D/g, '') || '';
    if (cliente.tipo_documento === 'cnpj' && doc.length !== 14) {
      this.errors.push({
        code: 'D002',
        field: 'destinatario.cnpj',
        message: 'CNPJ do destinatário inválido',
        severity: 'error'
      });
    }
    if (cliente.tipo_documento === 'cpf' && doc.length !== 11) {
      this.errors.push({
        code: 'D003',
        field: 'destinatario.cpf',
        message: 'CPF do destinatário inválido',
        severity: 'error'
      });
    }
    if (!cliente.razao_social || cliente.razao_social.trim().length < 3) {
      this.errors.push({
        code: 'D004',
        field: 'destinatario.razao_social',
        message: 'Razão Social/Nome do destinatário inválido',
        severity: 'error'
      });
    }
    if (!cliente.endereco || !cliente.cidade || !cliente.uf) {
      this.errors.push({
        code: 'D005',
        field: 'destinatario.endereco',
        message: 'Endereço completo do destinatário obrigatório',
        severity: 'error'
      });
    }
    if (!cliente.cep || cliente.cep.replace(/\D/g, '').length !== 8) {
      this.warnings.push({
        code: 'D006',
        field: 'destinatario.cep',
        message: 'CEP do destinatário inválido ou não informado',
        severity: 'warning'
      });
    }
    return this.errors.length === 0;
  }

  // Validar produtos
  validateProdutos(produtos) {
    if (!produtos || produtos.length === 0) {
      this.errors.push({
        code: 'P001',
        field: 'produtos',
        message: 'NFe deve conter pelo menos um produto',
        severity: 'error'
      });
      return false;
    }
    produtos.forEach((produto, index) => {
      if (!produto.descricao || produto.descricao.trim().length < 3) {
        this.errors.push({
          code: 'P002',
          field: `produtos[${index}].descricao`,
          message: `Produto ${index + 1}: Descrição inválida ou não informada`,
          severity: 'error'
        });
      }
      if (!produto.quantidade || produto.quantidade <= 0) {
        this.errors.push({
          code: 'P003',
          field: `produtos[${index}].quantidade`,
          message: `Produto ${index + 1}: Quantidade deve ser maior que zero`,
          severity: 'error'
        });
      }
      if (!produto.valor_unitario || produto.valor_unitario <= 0) {
        this.errors.push({
          code: 'P004',
          field: `produtos[${index}].valor_unitario`,
          message: `Produto ${index + 1}: Valor unitário deve ser maior que zero`,
          severity: 'error'
        });
      }

      // Validar NCM (8 dígitos)
      const ncm = produto.ncm?.toString().replace(/\D/g, '') || '';
      if (ncm.length !== 8) {
        this.warnings.push({
          code: 'P005',
          field: `produtos[${index}].ncm`,
          message: `Produto ${index + 1}: NCM deve ter 8 dígitos`,
          severity: 'warning'
        });
      }

      // Validar CFOP (4 dígitos)
      const cfop = produto.cfop?.toString().replace(/\D/g, '') || '';
      if (cfop.length !== 4) {
        this.errors.push({
          code: 'P006',
          field: `produtos[${index}].cfop`,
          message: `Produto ${index + 1}: CFOP deve ter 4 dígitos`,
          severity: 'error'
        });
      }
    });
    return this.errors.filter(e => e.field?.startsWith('produtos')).length === 0;
  }

  // Validar dados fiscais
  validateDadosFiscais(nfe) {
    if (!nfe.natureza_operacao || nfe.natureza_operacao.trim().length < 3) {
      this.errors.push({
        code: 'F001',
        field: 'natureza_operacao',
        message: 'Natureza da operação não informada',
        severity: 'error'
      });
    }
    const cfop = nfe.cfop?.toString().replace(/\D/g, '') || '';
    if (cfop.length !== 4) {
      this.errors.push({
        code: 'F002',
        field: 'cfop',
        message: 'CFOP da nota deve ter 4 dígitos',
        severity: 'error'
      });
    }
    if (!nfe.valor_total || nfe.valor_total <= 0) {
      this.errors.push({
        code: 'F003',
        field: 'valor_total',
        message: 'Valor total da nota deve ser maior que zero',
        severity: 'error'
      });
    }

    // Validar série
    if (!nfe.serie || nfe.serie.trim() === '') {
      this.warnings.push({
        code: 'F004',
        field: 'serie',
        message: 'Série da NFe não informada, usando padrão "1"',
        severity: 'warning'
      });
    }
    return this.errors.filter(e => e.field?.startsWith('F')).length === 0;
  }

  // Validar certificado digital
  validateCertificado(certificado) {
    if (!certificado || !certificado.pfx) {
      this.errors.push({
        code: 'C001',
        field: 'certificado',
        message: 'Certificado digital A1 não configurado',
        severity: 'error',
        solution: 'Configure o certificado em Configurações > Certificado Digital'
      });
      return false;
    }
    if (!certificado.senha) {
      this.errors.push({
        code: 'C002',
        field: 'certificado.senha',
        message: 'Senha do certificado não informada',
        severity: 'error',
        solution: 'Informe a senha do certificado em Configurações'
      });
      return false;
    }

    // Verificar validade (simulado)
    const dataValidade = new Date(certificado.validade || '2024-12-31');
    const hoje = new Date();
    if (dataValidade < hoje) {
      this.errors.push({
        code: 'C003',
        field: 'certificado.validade',
        message: 'Certificado digital vencido',
        severity: 'error',
        solution: 'Renove seu certificado digital'
      });
      return false;
    }
    const diasRestantes = Math.floor((dataValidade - hoje) / (1000 * 60 * 60 * 24));
    if (diasRestantes < 30) {
      this.warnings.push({
        code: 'C004',
        field: 'certificado.validade',
        message: `Certificado vence em ${diasRestantes} dias`,
        severity: 'warning',
        solution: 'Providencie a renovação do certificado'
      });
    }
    return true;
  }

  // Validação completa
  validate(nfeData) {
    this.errors = [];
    this.warnings = [];

    // Validar todas as seções
    this.validateEmitente(nfeData.emitente);
    this.validateDestinatario(nfeData.destinatario);
    this.validateProdutos(nfeData.produtos);
    this.validateDadosFiscais(nfeData);
    this.validateCertificado(nfeData.certificado);
    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      summary: {
        totalErrors: this.errors.length,
        totalWarnings: this.warnings.length,
        canProceed: this.errors.length === 0
      }
    };
  }

  // Salvar log de validação
  static saveValidationLog(companyId, nfeNumber, validation) {
    const folders = NFEValidator.ensureCompanyFolders(companyId);
    const logFile = path.join(folders.logs, `validacao_${nfeNumber}_${Date.now()}.json`);
    const logData = {
      timestamp: new Date().toISOString(),
      nfeNumber,
      validation,
      companyId
    };
    fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));
    return logFile;
  }
}
module.exports = NFEValidator;