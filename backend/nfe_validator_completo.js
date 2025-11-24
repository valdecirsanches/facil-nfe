const {
  XMLParser
} = require('fast-xml-parser');
class NFEValidatorCompleto {
  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false
    });
    this.erros = [];
    this.avisos = [];
  }
  validar(xml) {
    this.erros = [];
    this.avisos = [];
    try {
      const parsed = this.parser.parse(xml);
      const nfe = parsed.NFe;
      if (!nfe) {
        this.erros.push({
          campo: 'NFe',
          erro: 'Tag <NFe> não encontrada',
          solucao: 'Verifique a estrutura do XML'
        });
        return this.gerarRelatorio();
      }
      const infNFe = nfe.infNFe;
      if (!infNFe) {
        this.erros.push({
          campo: 'infNFe',
          erro: 'Tag <infNFe> não encontrada',
          solucao: 'Verifique a estrutura do XML'
        });
        return this.gerarRelatorio();
      }

      // Validações
      this.validarIde(infNFe.ide);
      this.validarEmit(infNFe.emit);
      this.validarDest(infNFe.dest);
      this.validarDet(infNFe.det);
      this.validarTotal(infNFe.total);
      this.validarTransp(infNFe.transp);
      this.validarPag(infNFe.pag);
      this.validarAssinatura(nfe.Signature);
      return this.gerarRelatorio();
    } catch (error) {
      this.erros.push({
        campo: 'XML',
        erro: `Erro ao parsear XML: ${error.message}`,
        solucao: 'Verifique se o XML está bem formado'
      });
      return this.gerarRelatorio();
    }
  }
  validarIde(ide) {
    if (!ide) {
      this.erros.push({
        campo: 'ide',
        erro: 'Tag <ide> não encontrada',
        solucao: 'Adicione as informações de identificação da NFe'
      });
      return;
    }

    // Validar campos obrigatórios
    const camposObrigatorios = ['cUF', 'cNF', 'natOp', 'mod', 'serie', 'nNF', 'dhEmi', 'tpNF', 'idDest', 'cMunFG', 'tpImp', 'tpEmis', 'cDV', 'tpAmb', 'finNFe', 'indFinal', 'indPres', 'procEmi', 'verProc'];
    camposObrigatorios.forEach(campo => {
      if (ide[campo] === undefined || ide[campo] === null || ide[campo] === '') {
        this.erros.push({
          campo: `ide.${campo}`,
          erro: `Campo obrigatório ausente`,
          solucao: `Preencha o campo ${campo}`
        });
      }
    });

    // Validar valores
    this.validarEnum('ide.mod', ide.mod, ['55'], 'Modelo deve ser 55 para NFe');
    this.validarEnum('ide.tpNF', ide.tpNF, ['0', '1'], '0=Entrada, 1=Saída');
    this.validarEnum('ide.idDest', ide.idDest, ['1', '2', '3'], '1=Interna, 2=Interestadual, 3=Exterior');
    this.validarEnum('ide.tpImp', ide.tpImp, ['0', '1', '2', '3', '4', '5'], 'Tipo de impressão inválido');
    this.validarEnum('ide.tpEmis', ide.tpEmis, ['1', '2', '3', '4', '5', '6', '7', '8', '9'], 'Tipo de emissão inválido');
    this.validarEnum('ide.tpAmb', ide.tpAmb, ['1', '2'], '1=Produção, 2=Homologação');
    this.validarEnum('ide.finNFe', ide.finNFe, ['1', '2', '3', '4'], 'Finalidade da NFe inválida');
    this.validarEnum('ide.indFinal', ide.indFinal, ['0', '1'], '0=Normal, 1=Consumidor Final');
    this.validarEnum('ide.indPres', ide.indPres, ['0', '1', '2', '3', '4', '5', '9'], 'Indicador de presença inválido');
    this.validarEnum('ide.procEmi', ide.procEmi, ['0', '1', '2', '3'], 'Processo de emissão inválido');

    // Validar tamanhos
    this.validarTamanho('ide.cUF', ide.cUF, 2, 2);
    this.validarTamanho('ide.cNF', ide.cNF, 8, 8);
    this.validarTamanho('ide.cDV', ide.cDV, 1, 1);
    this.validarTamanho('ide.cMunFG', ide.cMunFG, 7, 7);

    // Validar formato de data
    if (ide.dhEmi) {
      const formatoDataCorreto = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;
      if (!formatoDataCorreto.test(ide.dhEmi)) {
        this.erros.push({
          campo: 'ide.dhEmi',
          erro: `Formato de data inválido: ${ide.dhEmi}`,
          solucao: 'Use o formato: AAAA-MM-DDTHH:MM:SS-03:00'
        });
      }
    }

    // Validar consistência CFOP vs idDest
    // (será validado em det, mas podemos adicionar aviso aqui)
  }
  validarEmit(emit) {
    if (!emit) {
      this.erros.push({
        campo: 'emit',
        erro: 'Tag <emit> não encontrada',
        solucao: 'Adicione as informações do emitente'
      });
      return;
    }

    // Validar CNPJ
    if (emit.CNPJ) {
      const cnpj = String(emit.CNPJ).replace(/\D/g, '');
      if (cnpj.length !== 14) {
        this.erros.push({
          campo: 'emit.CNPJ',
          erro: `CNPJ com ${cnpj.length} dígitos (esperado 14)`,
          solucao: 'Verifique o CNPJ do emitente'
        });
      }
    } else {
      this.erros.push({
        campo: 'emit.CNPJ',
        erro: 'CNPJ do emitente ausente',
        solucao: 'Preencha o CNPJ do emitente'
      });
    }

    // Validar endereço
    if (emit.enderEmit) {
      this.validarTamanho('emit.enderEmit.cMun', emit.enderEmit.cMun, 7, 7);
      this.validarTamanho('emit.enderEmit.CEP', emit.enderEmit.CEP, 8, 8);
    }

    // Validar CRT
    this.validarEnum('emit.CRT', emit.CRT, ['1', '2', '3'], '1=Simples Nacional, 2=Simples Excesso, 3=Regime Normal');
  }
  validarDest(dest) {
    if (!dest) {
      this.erros.push({
        campo: 'dest',
        erro: 'Tag <dest> não encontrada',
        solucao: 'Adicione as informações do destinatário'
      });
      return;
    }

    // Validar documento (CNPJ ou CPF)
    if (!dest.CNPJ && !dest.CPF) {
      this.erros.push({
        campo: 'dest',
        erro: 'Destinatário sem CNPJ ou CPF',
        solucao: 'Preencha o CNPJ ou CPF do destinatário'
      });
    }
    if (dest.CNPJ) {
      const cnpj = String(dest.CNPJ).replace(/\D/g, '');
      if (cnpj.length !== 14) {
        this.erros.push({
          campo: 'dest.CNPJ',
          erro: `CNPJ com ${cnpj.length} dígitos (esperado 14)`,
          solucao: 'Verifique o CNPJ do destinatário'
        });
      }
    }
    if (dest.CPF) {
      const cpf = String(dest.CPF).replace(/\D/g, '');
      if (cpf.length !== 11) {
        this.erros.push({
          campo: 'dest.CPF',
          erro: `CPF com ${cpf.length} dígitos (esperado 11)`,
          solucao: 'Verifique o CPF do destinatário'
        });
      }
    }

    // Validar endereço
    if (dest.enderDest) {
      this.validarTamanho('dest.enderDest.cMun', dest.enderDest.cMun, 7, 7);
      this.validarTamanho('dest.enderDest.CEP', dest.enderDest.CEP, 8, 8);
    }

    // Validar indIEDest
    this.validarEnum('dest.indIEDest', dest.indIEDest, ['1', '2', '9'], '1=Contribuinte, 2=Isento, 9=Não Contribuinte');
  }
  validarDet(det) {
    if (!det) {
      this.erros.push({
        campo: 'det',
        erro: 'Tag <det> não encontrada',
        solucao: 'Adicione pelo menos um item na NFe'
      });
      return;
    }
    const itens = Array.isArray(det) ? det : [det];
    itens.forEach((item, index) => {
      const nItem = index + 1;

      // Validar produto
      if (!item.prod) {
        this.erros.push({
          campo: `det[${nItem}].prod`,
          erro: 'Informações do produto ausentes',
          solucao: `Preencha os dados do produto ${nItem}`
        });
        return;
      }
      const prod = item.prod;

      // Validar NCM
      if (prod.NCM) {
        const ncm = String(prod.NCM).replace(/\D/g, '');
        if (ncm.length !== 8) {
          this.erros.push({
            campo: `det[${nItem}].prod.NCM`,
            erro: `NCM com ${ncm.length} dígitos (esperado 8)`,
            solucao: `Verifique o NCM do produto ${nItem}`
          });
        }
      }

      // Validar CFOP
      if (prod.CFOP) {
        const cfop = String(prod.CFOP);
        if (cfop.length !== 4) {
          this.erros.push({
            campo: `det[${nItem}].prod.CFOP`,
            erro: `CFOP com ${cfop.length} dígitos (esperado 4)`,
            solucao: `Verifique o CFOP do produto ${nItem}`
          });
        }
      }

      // Validar valores numéricos
      this.validarNumerico(`det[${nItem}].prod.qCom`, prod.qCom, 4);
      this.validarNumerico(`det[${nItem}].prod.vUnCom`, prod.vUnCom, 4);
      this.validarNumerico(`det[${nItem}].prod.vProd`, prod.vProd, 2);

      // Validar impostos
      if (!item.imposto) {
        this.erros.push({
          campo: `det[${nItem}].imposto`,
          erro: 'Informações de impostos ausentes',
          solucao: `Preencha os impostos do produto ${nItem}`
        });
        return;
      }
      const imposto = item.imposto;

      // Validar presença de impostos obrigatórios
      if (!imposto.ICMS) {
        this.erros.push({
          campo: `det[${nItem}].imposto.ICMS`,
          erro: 'ICMS ausente',
          solucao: `Preencha o ICMS do produto ${nItem}`
        });
      }
      if (!imposto.PIS) {
        this.erros.push({
          campo: `det[${nItem}].imposto.PIS`,
          erro: 'PIS ausente',
          solucao: `Preencha o PIS do produto ${nItem}`
        });
      }
      if (!imposto.COFINS) {
        this.erros.push({
          campo: `det[${nItem}].imposto.COFINS`,
          erro: 'COFINS ausente',
          solucao: `Preencha o COFINS do produto ${nItem}`
        });
      }
    });
  }
  validarTotal(total) {
    if (!total || !total.ICMSTot) {
      this.erros.push({
        campo: 'total.ICMSTot',
        erro: 'Totalizadores ausentes',
        solucao: 'Preencha os totalizadores da NFe'
      });
      return;
    }
    const icmsTot = total.ICMSTot;

    // Validar valores obrigatórios
    const camposObrigatorios = ['vBC', 'vICMS', 'vICMSDeson', 'vFCP', 'vBCST', 'vST', 'vFCPST', 'vFCPSTRet', 'vProd', 'vFrete', 'vSeg', 'vDesc', 'vII', 'vIPI', 'vIPIDevol', 'vPIS', 'vCOFINS', 'vOutro', 'vNF'];
    camposObrigatorios.forEach(campo => {
      if (icmsTot[campo] === undefined || icmsTot[campo] === null) {
        this.erros.push({
          campo: `total.ICMSTot.${campo}`,
          erro: 'Campo obrigatório ausente',
          solucao: `Preencha o campo ${campo} (use 0.00 se não houver valor)`
        });
      }
    });

    // Validar formato de valores
    Object.keys(icmsTot).forEach(campo => {
      if (campo !== 'vTotTrib') {
        this.validarNumerico(`total.ICMSTot.${campo}`, icmsTot[campo], 2);
      }
    });
  }
  validarTransp(transp) {
    if (!transp) {
      this.erros.push({
        campo: 'transp',
        erro: 'Tag <transp> não encontrada',
        solucao: 'Adicione as informações de transporte'
      });
      return;
    }

    // Validar modFrete
    this.validarEnum('transp.modFrete', transp.modFrete, ['0', '1', '2', '3', '4', '9'], 'Modalidade de frete inválida');
  }
  validarPag(pag) {
    if (!pag) {
      this.erros.push({
        campo: 'pag',
        erro: 'Tag <pag> não encontrada',
        solucao: 'Adicione as informações de pagamento'
      });
      return;
    }
    const detPag = Array.isArray(pag.detPag) ? pag.detPag : [pag.detPag];
    detPag.forEach((det, index) => {
      if (!det) return;

      // Validar tPag
      const tiposPagamento = ['01', '02', '03', '04', '05', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '90', '99'];
      this.validarEnum(`pag.detPag[${index + 1}].tPag`, det.tPag, tiposPagamento, 'Tipo de pagamento inválido');

      // Validar vPag
      this.validarNumerico(`pag.detPag[${index + 1}].vPag`, det.vPag, 2);
    });
  }
  validarAssinatura(signature) {
    if (!signature) {
      this.avisos.push({
        campo: 'Signature',
        aviso: 'NFe não assinada',
        solucao: 'Configure o certificado digital para assinar a NFe'
      });
    }
  }

  // Métodos auxiliares
  validarEnum(campo, valor, valoresValidos, mensagem) {
    const valorStr = String(valor);
    if (!valoresValidos.includes(valorStr)) {
      this.erros.push({
        campo,
        erro: `Valor "${valorStr}" inválido. ${mensagem}`,
        solucao: `Use um dos valores: ${valoresValidos.join(', ')}`
      });
    }
  }
  validarTamanho(campo, valor, min, max) {
    if (valor === undefined || valor === null) return;
    const valorStr = String(valor);
    const tamanho = valorStr.length;
    if (tamanho < min || tamanho > max) {
      this.erros.push({
        campo,
        erro: `Tamanho ${tamanho} inválido (esperado: ${min === max ? min : `${min}-${max}`} dígitos)`,
        solucao: `Ajuste o valor para ter ${min === max ? min : `entre ${min} e ${max}`} dígitos`
      });
    }
  }
  validarNumerico(campo, valor, decimais) {
    if (valor === undefined || valor === null) return;
    const valorStr = String(valor);
    const regex = new RegExp(`^\\d+\\.\\d{${decimais}}$`);
    if (!regex.test(valorStr)) {
      this.erros.push({
        campo,
        erro: `Formato numérico inválido: ${valorStr}`,
        solucao: `Use o formato com ${decimais} casas decimais (ex: 10.${decimais === 2 ? '00' : '0000'})`
      });
    }
  }
  gerarRelatorio() {
    return {
      valido: this.erros.length === 0,
      erros: this.erros,
      avisos: this.avisos,
      totalErros: this.erros.length,
      totalAvisos: this.avisos.length
    };
  }
}
module.exports = new NFEValidatorCompleto();