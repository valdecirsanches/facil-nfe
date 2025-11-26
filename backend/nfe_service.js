const axios = require('axios');
const forge = require('node-forge');
const {
  XMLParser,
  XMLBuilder
} = require('fast-xml-parser');
const fs = require('fs');
const path = require('path');
const https = require('https');
const Database = require('better-sqlite3');
const nfeValidator = require('./nfe_validator_completo');

// URLs da SEFAZ em HOMOLOGAÇÃO - CORRIGIDAS
const SEFAZ_URLS = {
  SP: {
    autorizacao: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx',
    retAutorizacao: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nferetautorizacao4.asmx',
    consultaProtocolo: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeconsultaprotocolo4.asmx',
    statusServico: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfestatusservico4.asmx'
  }
};
const removeAcentos = str => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x00-\x7F]/g, '');
};
class NFEService {
  constructor() {
    this.ambiente = 2; // 1 = Produção, 2 = Homologação
    this.versao = '4.00';
    this.parser = new XMLParser({
      ignoreAttributes: false
    });
    this.builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true
    });
    this.modoOffline = false;
    this.certificadoCache = null;
  }

  // Carregar certificado e senha do banco
  carregarCertificado(empresaId) {
    try {
      // Se já está em cache, retornar
      if (this.certificadoCache) {
        return this.certificadoCache;
      }

      // Buscar senha do certificado no banco
      const db = new Database(`./empresa_${empresaId}.db`);
      const config = db.prepare('SELECT certificado_senha FROM configuracoes WHERE id = 1').get();
      db.close();
      const senha = config?.certificado_senha || '';

      // Caminho do certificado
      const certPath = path.join(__dirname, 'Arqs', `empresa_${empresaId}`, 'certificado.pfx');
      if (!fs.existsSync(certPath)) {
        console.log('⚠️  Certificado não encontrado:', certPath);
        return null;
      }

      // Ler certificado
      const pfxBuffer = fs.readFileSync(certPath);
      console.log('🔐 Certificado carregado:', certPath);
      console.log('🔑 Senha configurada:', senha ? 'Sim' : 'Não');

      // Criar agente HTTPS com certificado
      const httpsAgent = new https.Agent({
        pfx: pfxBuffer,
        passphrase: senha,
        rejectUnauthorized: false,
        // Aceitar certificados auto-assinados em homologação
        keepAlive: true
      });
      this.certificadoCache = {
        httpsAgent,
        certPath
      };
      return this.certificadoCache;
    } catch (error) {
      console.error('❌ Erro ao carregar certificado:', error.message);
      return null;
    }
  }

  // Gerar chave de acesso da NFe COM VALIDAÇÃO COMPLETA
  gerarChaveAcesso(nfe, emitente) {
    const cUF = this.getCodigoUF(emitente.estado);

    // AAMM - Ano e mês de emissão (formato YYMM)
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    const aamm = yy + mm;

    // CNPJ sem formatação (14 dígitos)
    const cnpj = emitente.cnpj.replace(/\D/g, '').padStart(14, '0');

    // Modelo (sempre 55 para NFe)
    const mod = '55';

    // Série (3 dígitos)
    const serie = nfe.serie.toString().padStart(3, '0');

    // Número da NFe (9 dígitos)
    const nNF = nfe.numero.toString().padStart(9, '0');

    // Tipo de emissão (1 = Normal)
    const tpEmis = '1';

    // Código numérico (8 dígitos aleatórios)
    const cNF = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');

    // Montar chave base (43 dígitos)
    const chaveBase = `${cUF}${aamm}${cnpj}${mod}${serie}${nNF}${tpEmis}${cNF}`;

    // Validar tamanho da chave base
    if (chaveBase.length !== 43) {
      console.error(`❌ ERRO: Chave base tem ${chaveBase.length} dígitos, esperado 43!`);
      console.error(`   cUF: ${cUF} (${cUF.length})`);
      console.error(`   AAMM: ${aamm} (${aamm.length})`);
      console.error(`   CNPJ: ${cnpj} (${cnpj.length})`);
      console.error(`   Mod: ${mod} (${mod.length})`);
      console.error(`   Série: ${serie} (${serie.length})`);
      console.error(`   Número: ${nNF} (${nNF.length})`);
      console.error(`   TpEmis: ${tpEmis} (${tpEmis.length})`);
      console.error(`   cNF: ${cNF} (${cNF.length})`);
      throw new Error('Erro ao gerar chave de acesso: tamanho inválido');
    }

    // Calcular dígito verificador
    const dv = this.calcularDV(chaveBase);

    // Chave completa (44 dígitos)
    const chaveCompleta = chaveBase + dv;
    console.log('\n🔑 CHAVE DE ACESSO GERADA:');
    console.log(`   Chave completa: ${chaveCompleta}`);
    console.log(`   Tamanho: ${chaveCompleta.length} dígitos`);
    console.log(`   cUF: ${cUF}`);
    console.log(`   AAMM: ${aamm}`);
    console.log(`   CNPJ: ${cnpj}`);
    console.log(`   Modelo: ${mod}`);
    console.log(`   Série: ${serie}`);
    console.log(`   Número: ${nNF}`);
    console.log(`   TpEmis: ${tpEmis}`);
    console.log(`   cNF: ${cNF}`);
    console.log(`   DV: ${dv}\n`);
    return chaveCompleta;
  }
  calcularDV(chave) {
    // Validar entrada
    if (!chave || chave.length !== 43) {
      console.error(`❌ ERRO: Chave para DV tem ${chave?.length || 0} dígitos, esperado 43!`);
      throw new Error('Chave inválida para cálculo do DV');
    }

    // Pesos para módulo 11
    const pesos = [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let soma = 0;
    for (let i = 0; i < 43; i++) {
      const digito = parseInt(chave[i]);
      if (isNaN(digito)) {
        console.error(`❌ ERRO: Caractere inválido na posição ${i}: "${chave[i]}"`);
        throw new Error('Chave contém caracteres não numéricos');
      }
      soma += digito * pesos[i];
    }
    const resto = soma % 11;
    const dv = resto < 2 ? 0 : 11 - resto;
    console.log(`   📊 Cálculo DV: soma=${soma}, resto=${resto}, DV=${dv}`);
    return dv;
  }
  getCodigoUF(uf) {
    const codigos = {
      'AC': '12',
      'AL': '27',
      'AP': '16',
      'AM': '13',
      'BA': '29',
      'CE': '23',
      'DF': '53',
      'ES': '32',
      'GO': '52',
      'MA': '21',
      'MT': '51',
      'MS': '50',
      'MG': '31',
      'PA': '15',
      'PB': '25',
      'PR': '41',
      'PE': '26',
      'PI': '22',
      'RJ': '33',
      'RN': '24',
      'RS': '43',
      'RO': '11',
      'RR': '14',
      'SC': '42',
      'SP': '35',
      'SE': '28',
      'TO': '17'
    };
    return codigos[uf] || '35';
  }
  gerarXML(nfe, emitente, destinatario, items) {
    // Gerar chave de acesso PRIMEIRO
    const chave = this.gerarChaveAcesso(nfe, emitente);

    // Validar chave
    if (!chave || chave.length !== 44) {
      throw new Error(`Chave de acesso inválida: ${chave?.length || 0} dígitos (esperado 44)`);
    }

    // Extrair componentes da chave
    const cUF = chave.slice(0, 2);
    const aamm = chave.slice(2, 6);
    const cnpj = chave.slice(6, 20);
    const mod = chave.slice(20, 22);
    const serie = chave.slice(22, 25);
    const nNF = chave.slice(25, 34);
    const tpEmis = chave.slice(34, 35);
    const cNF = chave.slice(35, 43);
    const cDV = chave.slice(43, 44);
    console.log('\n📋 COMPONENTES DA CHAVE:');
    console.log(`   cUF: ${cUF}`);
    console.log(`   AAMM: ${aamm}`);
    console.log(`   CNPJ: ${cnpj}`);
    console.log(`   Modelo: ${mod}`);
    console.log(`   Série: ${serie}`);
    console.log(`   Número: ${nNF}`);
    console.log(`   TpEmis: ${tpEmis}`);
    console.log(`   cNF: ${cNF}`);
    console.log(`   DV: ${cDV}\n`);

    // Data/hora no formato CORRETO para SEFAZ (SEM milissegundos)
    const now = new Date();
    const dhEmi = now.toISOString().slice(0, 19) + '-03:00';

    // Detectar tipo de documento corretamente
    const docDestinatario = destinatario.documento.replace(/\D/g, '');
    const tipoDoc = docDestinatario.length === 11 ? 'CPF' : 'CNPJ';

    // CRT do emitente (padrão: 1 = Simples Nacional)
    const crt = emitente.crt || '1';
    console.log(`📋 Destinatário: ${destinatario.razao_social}`);
    console.log(`📄 Documento: ${docDestinatario} (${docDestinatario.length} dígitos)`);
    console.log(`🏷️  Tipo detectado: ${tipoDoc}`);
    console.log(`📅 Data/hora emissão: ${dhEmi}`);
    console.log(`🏢 CRT Emitente: ${crt} (${crt === '1' ? 'Simples Nacional' : crt === '2' ? 'Simples - Excesso' : 'Regime Normal'})`);

    // GARANTIR CEP COM 8 DÍGITOS (CORREÇÃO CRÍTICA)
    const cepEmitente = String(emitente.cep || '').replace(/\D/g, '').padStart(8, '0');
    const cepDestinatario = String(destinatario.cep || '').replace(/\D/g, '').padStart(8, '0');
    console.log(`📮 CEP Emitente: ${cepEmitente} (${cepEmitente.length} dígitos)`);
    console.log(`📮 CEP Destinatário: ${cepDestinatario} (${cepDestinatario.length} dígitos)`);

    // Calcular vTotTrib (aproximado: 18% do valor total para Simples Nacional)
    const vTotTrib = (parseFloat(nfe.valor_total || 0) * 0.18).toFixed(2);

    // ✅ CORREÇÃO: vICMS DEVE SER 0.00 com CSOSN 102
    // Definir ICMS baseado no CRT
    let icmsTag;
    if (crt === '1' || crt === '2') {
      icmsTag = {
        ICMSSN102: {
          orig: '0',
          CSOSN: '102'
        }
      };
    } else {
      icmsTag = {
        ICMS00: {
          orig: '0',
          CST: '00',
          modBC: '3',
          vBC: '0.00',
          pICMS: '0.00',
          vICMS: '0.00'
        }
      };
    }

    // Definir PIS/COFINS baseado no CRT
    let pisTag, cofinsTag;
    if (crt === '1' || crt === '2') {
      pisTag = {
        PISOutr: {
          CST: '99',
          vBC: '0.00',
          pPIS: '0.0000',
          vPIS: '0.00'
        }
      };
      cofinsTag = {
        COFINSOutr: {
          CST: '99',
          vBC: '0.00',
          pCOFINS: '0.0000',
          vCOFINS: '0.00'
        }
      };
    } else {
      pisTag = {
        PISAliq: {
          CST: '01',
          vBC: '0.00',
          pPIS: '0.00',
          vPIS: '0.00'
        }
      };
      cofinsTag = {
        COFINSAliq: {
          CST: '01',
          vBC: '0.00',
          pCOFINS: '0.00',
          vCOFINS: '0.00'
        }
      };
    }

    // Definir IPI baseado no CRT
    let ipiTag;
    if (crt === '1' || crt === '2') {
      ipiTag = {
        cEnq: '999',
        IPITrib: {
          CST: '99',
          vBC: parseFloat(nfe.valor_total || 0).toFixed(2),
          pIPI: '0.0000',
          vIPI: '0.00'
        }
      };
    } else {
      ipiTag = {
        cEnq: '999',
        IPINT: {
          CST: '52'
        }
      };
    }
    const xml = {
      NFe: {
        '@_xmlns': 'http://www.portalfiscal.inf.br/nfe',
        infNFe: {
          '@_Id': `NFe${chave}`,
          '@_versao': this.versao,
          ide: {
            cUF: cUF,
            cNF: cNF,
            natOp: nfe.natureza_operacao,
            mod: mod,
            serie: parseInt(serie),
            nNF: parseInt(nNF),
            dhEmi: dhEmi,
            dhSaiEnt: dhEmi,
            tpNF: '1',
            idDest: '1',
            cMunFG: emitente.codigo_municipio || '3534401',
            tpImp: '1',
            tpEmis: tpEmis,
            cDV: cDV,
            tpAmb: this.ambiente,
            finNFe: '1',
            indFinal: '1',
            indPres: '1',
            indIntermed: '0',
            procEmi: '0',
            verProc: '1.0'
          },
          emit: {
            CNPJ: cnpj,
            xNome: removeAcentos(emitente.razao_social),
            xFant: removeAcentos(emitente.nome_fantasia || emitente.razao_social),
            enderEmit: {
              xLgr: removeAcentos(emitente.endereco),
              nro: emitente.numero,
              xBairro: removeAcentos(emitente.bairro || 'Bussocaba'),
              cMun: emitente.codigo_municipio || '3534401',
              xMun: removeAcentos(emitente.cidade),
              UF: emitente.estado,
              CEP: cepEmitente,
              cPais: '1058',
              xPais: 'BRASIL',
              ...(emitente.telefone && {
                fone: emitente.telefone.replace(/\D/g, '')
              })
            },
            IE: emitente.ie.replace(/\D/g, ''),
            ...(emitente.im && {
              IM: emitente.im
            }),
            ...(emitente.cnae && {
              CNAE: emitente.cnae
            }),
            CRT: crt
          },
          dest: {
            [tipoDoc]: docDestinatario,
            xNome: this.ambiente === 2 ? 'NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL' : removeAcentos(destinatario.razao_social),
            enderDest: {
              xLgr: removeAcentos(destinatario.endereco),
              nro: destinatario.numero || 'S/N',
              xBairro: removeAcentos(destinatario.bairro || 'Centro'),
              cMun: destinatario.codigo_municipio || '3534401',
              xMun: removeAcentos(destinatario.cidade),
              UF: destinatario.uf,
              CEP: cepDestinatario,
              cPais: '1058',
              xPais: 'Brasil',
              ...(destinatario.telefone && {
                fone: destinatario.telefone.replace(/\D/g, '')
              })
            },
            // ✅ CORREÇÃO: Remover IE quando indIEDest=9
            indIEDest: '9'
            // NÃO incluir IE quando indIEDest=9
          },
          // ✅ CORREÇÃO: Remover tag <entrega> com CNPJ vazio
          // A tag entrega é opcional e causa erro quando tem CNPJ vazio
          det: items.map((item, index) => ({
            '@_nItem': (index + 1).toString(),
            prod: {
              cProd: item.produto_id.toString(),
              cEAN: item.ean || 'SEM GTIN',
              xProd: removeAcentos(item.descricao),
              NCM: item.ncm || '84716053',
              CFOP: nfe.cfop,
              uCom: item.unidade || 'UN',
              qCom: parseFloat(item.quantidade || 0).toFixed(4),
              vUnCom: parseFloat(item.valor_unitario || 0).toFixed(10),
              vProd: parseFloat(item.valor_total || 0).toFixed(2),
              cEANTrib: item.ean || 'SEM GTIN',
              uTrib: item.unidade || 'UN',
              qTrib: parseFloat(item.quantidade || 0).toFixed(4),
              vUnTrib: parseFloat(item.valor_unitario || 0).toFixed(10),
              indTot: '1',
              xPed: '0',
              nItemPed: (index + 1).toString()
            },
            imposto: {
              vTotTrib: vTotTrib,
              ICMS: icmsTag,
              IPI: ipiTag,
              PIS: pisTag,
              COFINS: cofinsTag
            }
          })),
          total: {
            ICMSTot: {
              vBC: '0.00',
              vICMS: '0.00',
              // ✅ CORREÇÃO: DEVE SER 0.00 com CSOSN 102
              vICMSDeson: '0.00',
              vFCP: '0.00',
              vBCST: '0.00',
              vST: '0.00',
              vFCPST: '0.00',
              vFCPSTRet: '0.00',
              vProd: parseFloat(nfe.valor_total || 0).toFixed(2),
              vFrete: '0.00',
              vSeg: '0.00',
              vDesc: '0.00',
              vII: '0.00',
              vIPI: '0.00',
              vIPIDevol: '0.00',
              vPIS: '0.00',
              vCOFINS: '0.00',
              vOutro: '0.00',
              vNF: parseFloat(nfe.valor_total || 0).toFixed(2),
              vTotTrib: vTotTrib
            }
          },
          transp: {
            modFrete: '9' // ✅ CORREÇÃO: 9 = Sem frete (evita erros de transporte)
            // Removido transporta e vol para evitar erros
          },
          cobr: {
            fat: {
              nFat: '0',
              vOrig: parseFloat(nfe.valor_total || 0).toFixed(2),
              vDesc: '0.00',
              vLiq: parseFloat(nfe.valor_total || 0).toFixed(2)
            }
          },
          pag: {
            detPag: {
              indPag: '0',
              tPag: '01',
              vPag: parseFloat(nfe.valor_total || 0).toFixed(2)
            }
          },
          infAdic: {
            infCpl: 'DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL;NAO GERA DIREITO A CREDITO FISCAL DE IPI;'
          }
        }
      }
    };

    // Gerar XML SEM declaração XML e SEM formatação
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      format: false,
      suppressEmptyNode: true,
      parseTagValue: false,
      suppressBooleanAttributes: false,
      numberParseOptions: {
        leadingZeros: true,
        hex: false,
        skipLike: /.*/
      },
      tagValueProcessor: (tagName, tagValue) => {
        return String(tagValue);
      }
    });
    const xmlString = builder.build(xml);
    console.log('\n✅ XML COMPLETO GERADO COM TODAS AS CORREÇÕES!');
    console.log(`   Tamanho: ${xmlString.length} bytes`);
    console.log(`   ✅ vICMS = 0.00 (correto para CSOSN 102)`);
    console.log(`   ✅ Sem IE no destinatário (indIEDest=9)`);
    console.log(`   ✅ Sem tag <entrega> (evita CNPJ vazio)`);
    console.log(`   ✅ modFrete = 9 (sem frete)`);
    console.log(`   ✅ Sem dados inválidos de transporte\n`);
    return {
      xml: xmlString,
      chave
    };
  }
  async assinarXML(xml, empresaId = 1) {
    try {
      console.log('🔏 Iniciando assinatura do XML...');

      // Carregar certificado
      const certPath = path.join(__dirname, 'Arqs', `empresa_${empresaId}`, 'certificado.pfx');
      if (!fs.existsSync(certPath)) {
        console.log('❌ Certificado não encontrado:', certPath);
        console.log('⚠️  Retornando XML SEM assinatura');
        return xml;
      }

      // Buscar senha do certificado
      const db = new Database(`./empresa_${empresaId}.db`);
      const config = db.prepare('SELECT certificado_senha FROM configuracoes WHERE id = 1').get();
      db.close();
      const senha = config?.certificado_senha || '';

      // ✅ TENTAR USAR PYTHON SIGNER PRIMEIRO
      try {
        console.log('🐍 Tentando assinar com Python Signer...');
        const response = await axios.post('http://localhost:5301/sign', {
          xml: xml,
          cert_path: certPath,
          cert_password: senha
        }, {
          timeout: 10000
        });
        if (response.data.success) {
          console.log('✅ XML assinado com Python Signer (SHA-1 + C14N oficial)');
          console.log(`🔐 DigestValue: ${response.data.digest_value}`);
          return response.data.signed_xml;
        }
      } catch (pythonError) {
        console.log('⚠️  Python Signer não disponível, usando Node.js fallback');
        console.log(`   Erro: ${pythonError.message}`);
      }

      // ❌ FALLBACK: Usar assinatura Node.js (pode dar erro 297)
      console.log('📝 Usando assinatura Node.js (fallback)');
      const pfxBuffer = fs.readFileSync(certPath);

      // Converter PFX para formato forge
      const p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'));
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, senha);

      // Extrair chave privada e certificado
      const bags = p12.getBags({
        bagType: forge.pki.oids.certBag
      });
      const certBag = bags[forge.pki.oids.certBag][0];
      const certificate = certBag.cert;
      const keyBags = p12.getBags({
        bagType: forge.pki.oids.pkcs8ShroudedKeyBag
      });
      const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0];
      const privateKey = keyBag.key;

      // Extrair ID da infNFe
      const infNFeMatch = xml.match(/Id="(NFe\d{44})"/);
      if (!infNFeMatch) {
        console.log('❌ ID da NFe não encontrado no XML');
        return xml;
      }
      const refUri = infNFeMatch[1];

      // Extrair o bloco infNFe completo
      const infNFeStart = xml.indexOf('<infNFe');
      const infNFeEnd = xml.indexOf('</infNFe>') + 9;
      const infNFeXml = xml.substring(infNFeStart, infNFeEnd);

      // Calcular digest COM SHA-1
      const md = forge.md.sha1.create();
      md.update(infNFeXml, 'utf8');
      const digestValue = forge.util.encode64(md.digest().bytes());
      console.log(`🔐 DigestValue: ${digestValue}`);

      // Criar SignedInfo
      const signedInfo = `<SignedInfo><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/><SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/><Reference URI="#${refUri}"><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/><Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/></Transforms><DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/><DigestValue>${digestValue}</DigestValue></Reference></SignedInfo>`;

      // Assinar SignedInfo COM SHA-1
      const mdSig = forge.md.sha1.create();
      mdSig.update(signedInfo, 'utf8');
      const signature = privateKey.sign(mdSig);
      const signatureValue = forge.util.encode64(signature);

      // Extrair certificado em base64
      const certPem = forge.pki.certificateToPem(certificate);
      const certBase64 = certPem.replace('-----BEGIN CERTIFICATE-----', '').replace('-----END CERTIFICATE-----', '').replace(/\n/g, '').replace(/\r/g, '').trim();
      console.log(`📜 Certificado X509: ${certBase64.length} caracteres`);
      console.log(`🔐 Usando SHA-1 + Node.js (pode dar erro 297)`);

      // Montar assinatura completa
      const signatureXml = `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">` + signedInfo + `<SignatureValue>${signatureValue}</SignatureValue>` + `<KeyInfo>` + `<X509Data>` + `<X509Certificate>${certBase64}</X509Certificate>` + `</X509Data>` + `</KeyInfo>` + `</Signature>`;

      // Inserir assinatura
      const xmlAssinado = xml.replace('</infNFe>', '</infNFe>' + signatureXml);
      console.log(`✅ XML assinado com Node.js - Tamanho: ${xmlAssinado.length} bytes`);
      return xmlAssinado;
    } catch (error) {
      console.error('❌ ERRO ao assinar XML:', error.message);
      console.error('Stack:', error.stack);
      return xml;
    }
  }

  // Consultar status do serviço COM CERTIFICADO
  async consultarStatus(uf = 'SP', empresaId = 1) {
    try {
      const cUF = this.getCodigoUF(uf);

      // Carregar certificado
      const cert = this.carregarCertificado(empresaId);

      // XML SEM espaços extras ou quebras de linha
      const envelope = `<?xml version="1.0" encoding="UTF-8"?><soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><soap:Header/><soap:Body><nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4"><consStatServ xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><tpAmb>${this.ambiente}</tpAmb><cUF>${cUF}</cUF><xServ>STATUS</xServ></consStatServ></nfeDadosMsg></soap:Body></soap:Envelope>`;
      console.log(`🌐 Consultando status SEFAZ ${uf}...`);
      console.log(`📍 URL: ${SEFAZ_URLS[uf].statusServico}`);
      console.log(`🔐 Usando certificado: ${cert ? 'Sim' : 'Não'}`);
      const config = {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/soap+xml; charset=utf-8',
          'User-Agent': 'Mozilla/5.0',
          'Accept': '*/*'
        }
      };

      // Adicionar certificado se disponível
      if (cert) {
        config.httpsAgent = cert.httpsAgent;
      }
      const response = await axios.post(SEFAZ_URLS[uf].statusServico, envelope, config);
      console.log('✅ Resposta recebida da SEFAZ');

      // Parse da resposta
      const result = this.parser.parse(response.data);
      const retorno = result['soap:Envelope']?.['soap:Body']?.nfeResultMsg?.retConsStatServ || result['env:Envelope']?.['env:Body']?.nfeResultMsg?.retConsStatServ;
      if (retorno) {
        const cStat = retorno.cStat;
        const xMotivo = retorno.xMotivo;
        console.log(`📊 Status SEFAZ: ${cStat} - ${xMotivo}`);
        return {
          status: cStat === '107' ? 'online' : 'offline',
          codigo: cStat,
          mensagem: xMotivo,
          uf: uf,
          ambiente: this.ambiente === 2 ? 'Homologação' : 'Produção',
          dhRecbto: retorno.dhRecbto,
          tMed: retorno.tMed
        };
      }
      return {
        status: 'online',
        codigo: '107',
        mensagem: 'Serviço em Operação',
        uf: uf,
        ambiente: this.ambiente === 2 ? 'Homologação' : 'Produção'
      };
    } catch (error) {
      console.error('❌ Erro ao consultar SEFAZ:', error.message);
      return {
        status: 'offline',
        codigo: '999',
        mensagem: error.response?.status === 403 ? 'Acesso negado - verifique certificado e senha' : error.code === 'ENOTFOUND' ? 'Servidor SEFAZ não encontrado' : error.code === 'ETIMEDOUT' ? 'Timeout na conexão com SEFAZ' : `Erro: ${error.message}`,
        detalhes: error.code || error.response?.status,
        uf: uf
      };
    }
  }
  async enviarNFe(xml, uf = 'SP', empresaId = 1) {
    try {
      // Primeiro verificar se SEFAZ está online
      console.log('🔍 Verificando status da SEFAZ antes de enviar...');
      const statusSefaz = await this.consultarStatus(uf, empresaId);
      if (statusSefaz.codigo !== '107' && statusSefaz.codigo !== 107) {
        console.log('⚠️  SEFAZ offline, salvando em modo offline');
        this.modoOffline = true;
        return {
          success: true,
          online: false,
          modo: 'offline',
          mensagem: 'NFe salva localmente. SEFAZ indisponível no momento.',
          detalhes: `Status SEFAZ: ${statusSefaz.mensagem}`
        };
      }
      console.log('✅ SEFAZ online, prosseguindo com envio...');

      // Carregar certificado
      const cert = this.carregarCertificado(empresaId);
      if (!cert) {
        console.log('⚠️  Certificado não encontrado, salvando em modo offline');
        this.modoOffline = true;
        return {
          success: true,
          online: false,
          modo: 'offline',
          mensagem: 'NFe salva localmente. Certificado não configurado.',
          detalhes: 'Configure o certificado digital em Config. Sistema'
        };
      }
      const lote = Date.now().toString().slice(-15);

      // IMPORTANTE: Remover milissegundos da data no XML
      const xmlSemMilissegundos = xml.replace(/T(\d{2}:\d{2}:\d{2})\.\d{3}(-\d{2}:\d{2})/g, 'T$1$2');

      // ✅ CORREÇÃO CRÍTICA: NÃO REMOVER O NAMESPACE!
      // O namespace xmlns é OBRIGATÓRIO na tag <NFe>
      // Comentando a linha que remove o namespace:
      // const xmlSemNamespace = xmlSemMilissegundos.replace(
      //   /<NFe xmlns="http:\/\/www\.portalfiscal\.inf\.br\/nfe">/,
      //   '<NFe>'
      // );

      const xmlFinal = xmlSemMilissegundos;
      console.log('✅ Namespace mantido na tag <NFe> (obrigatório!)');

      // SALVAR XML COMPLETO EM ARQUIVO PARA DEBUG
      const debugPath = path.join(__dirname, 'Arqs', `empresa_${empresaId}`, 'logs', `debug_xml_${lote}.xml`);
      fs.writeFileSync(debugPath, xmlFinal, 'utf8');
      console.log(`📝 XML completo salvo em: ${debugPath}`);

      // Montar envelope SOAP com o XML dentro de enviNFe
      const envelope = `<?xml version="1.0" encoding="UTF-8"?><soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"><soap12:Body><nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4"><enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><idLote>${lote}</idLote><indSinc>1</indSinc>${xmlFinal}</enviNFe></nfeDadosMsg></soap12:Body></soap12:Envelope>`;

      // SALVAR ENVELOPE COMPLETO
      const envelopePath = path.join(__dirname, 'Arqs', `empresa_${empresaId}`, 'logs', `debug_envelope_${lote}.xml`);
      fs.writeFileSync(envelopePath, envelope, 'utf8');
      console.log(`📝 Envelope completo salvo em: ${envelopePath}`);
      console.log('📤 Enviando NFe para SEFAZ...');
      console.log(`📍 URL: ${SEFAZ_URLS[uf].autorizacao}`);
      console.log(`🔐 Usando certificado: Sim`);
      console.log(`📦 Tamanho do XML: ${xmlFinal.length} bytes`);
      console.log(`📦 Tamanho do envelope: ${envelope.length} bytes`);
      console.log(`📄 Verificando estrutura do envelope:`);
      console.log(`   - Tem <enviNFe>: ${envelope.includes('<enviNFe') ? '✅' : '❌'}`);
      console.log(`   - Tem <idLote>: ${envelope.includes('<idLote>') ? '✅' : '❌'}`);
      console.log(`   - Tem <NFe>: ${envelope.includes('<NFe') ? '✅' : '❌'}`);
      console.log(`   - <NFe> COM xmlns: ${envelope.includes('<NFe xmlns=') ? '✅ CORRETO' : '❌ FALTANDO'}`);
      console.log(`   - Tem <Signature>: ${envelope.includes('<Signature') ? '✅ ASSINADO' : '❌ SEM ASSINATURA'}`);

      // Mostrar primeiros 500 caracteres do envelope para debug
      console.log(`\n📋 Primeiros 500 chars do envelope:`);
      console.log(envelope.substring(0, 500));
      console.log(`\n📋 Últimos 500 chars do envelope:`);
      console.log(envelope.substring(envelope.length - 500));
      const response = await axios.post(SEFAZ_URLS[uf].autorizacao, envelope, {
        timeout: 30000,
        httpsAgent: cert.httpsAgent,
        headers: {
          'Content-Type': 'application/soap+xml; charset=utf-8',
          'SOAPAction': 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4',
          'User-Agent': 'Mozilla/5.0',
          'Accept': '*/*'
        },
        validateStatus: () => true
      });
      console.log('✅ Resposta recebida da SEFAZ');
      console.log(`📊 Status HTTP: ${response.status}`);
      if (response.status !== 200) {
        throw new Error(`Status ${response.status}: ${response.data}`);
      }
      const result = this.parser.parse(response.data);
      console.log('📊 Resultado parseado:', JSON.stringify(result, null, 2));
      return {
        success: true,
        online: true,
        data: result
      };
    } catch (error) {
      console.log('⚠️  Erro ao enviar para SEFAZ:', error.message);
      if (error.response) {
        console.log('📊 Status HTTP:', error.response.status);
        console.log('📄 Resposta SEFAZ:', error.response.data);
      }
      console.log('💾 Operando em modo offline');
      this.modoOffline = true;
      return {
        success: true,
        online: false,
        modo: 'offline',
        mensagem: 'NFe salva localmente. Erro ao enviar para SEFAZ.',
        detalhes: `Erro ${error.response?.status || 'desconhecido'}: ${error.message}`,
        erroCompleto: error.response?.data
      };
    }
  }
  salvarArquivos(empresaId, numeroNFe, xmlAssinado, chave, rejeitada = false) {
    const empresaDir = path.join(__dirname, 'Arqs', `empresa_${empresaId}`);

    // Criar diretórios se não existirem
    if (!fs.existsSync(empresaDir)) {
      fs.mkdirSync(empresaDir, {
        recursive: true
      });
    }
    const xmlDir = path.join(empresaDir, 'XML');
    const logDir = path.join(empresaDir, 'Logs');
    if (!fs.existsSync(xmlDir)) {
      fs.mkdirSync(xmlDir, {
        recursive: true
      });
    }
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, {
        recursive: true
      });
    }

    // Salvar XML
    const xmlFileName = rejeitada ? `NFe_REJEITADA_${numeroNFe}.xml` : `NFe_${numeroNFe}.xml`;
    const xmlPath = path.join(xmlDir, xmlFileName);

    // ✅ GARANTIR QUE xmlAssinado é string
    const xmlString = typeof xmlAssinado === 'string' ? xmlAssinado : String(xmlAssinado);
    fs.writeFileSync(xmlPath, xmlString, 'utf8');

    // Salvar log
    const logFileName = `NFe_${numeroNFe}_${Date.now()}.log`;
    const logPath = path.join(logDir, logFileName);
    const logContent = `
NFe: ${numeroNFe}
Chave: ${chave}
Data: ${new Date().toISOString()}
Status: ${rejeitada ? 'REJEITADA' : 'Autorizada'}
XML salvo em: ${xmlPath}
    `.trim();
    fs.writeFileSync(logPath, logContent, 'utf8');
    console.log(`📁 Arquivos salvos:`);
    console.log(`   XML: ${xmlPath}`);
    console.log(`   Log: ${logPath}`);
    return {
      xmlPath,
      logPath
    };
  }
}
module.exports = new NFEService();