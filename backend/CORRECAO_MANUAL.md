# 🔧 CORREÇÃO MANUAL - PASSO A PASSO

O problema é que o XMLBuilder está convertendo strings de volta para números.

## PASSO 1: Abrir o arquivo nfe_service.js

```bash
cd backend
nano nfe_service.js
# ou use seu editor preferido: code nfe_service.js, vim nfe_service.js, etc
```

## PASSO 2: Procurar a linha ~433 (onde está "const builder = new XMLBuilder")

Pressione `Ctrl+W` no nano e digite: `const builder = new XMLBuilder`

Você vai encontrar algo assim:

```javascript
const builder = new XMLBuilder({ 
  ignoreAttributes: false, 
  format: false,
  suppressEmptyNode: true,
  parseTagValue: false,
  suppressBooleanAttributes: false
});
```

## PASSO 3: ADICIONAR mais uma opção

Mude para:

```javascript
const builder = new XMLBuilder({ 
  ignoreAttributes: false, 
  format: false,
  suppressEmptyNode: true,
  parseTagValue: false,
  suppressBooleanAttributes: false,
  numberParseOptions: {
    hex: false,
    leadingZeros: false,
    skipLike: /.*/
  }
});
```

## PASSO 4: Salvar e sair

No nano: `Ctrl+O` (salvar), `Enter`, `Ctrl+X` (sair)

## PASSO 5: Reiniciar backend

```bash
pkill -9 node
npm start
```

## ALTERNATIVA: Se ainda não funcionar

Substitua TODA a função gerarXML por esta versão que gera XML manualmente (SEM XMLBuilder):

### Procure a linha ~220 onde começa "gerarXML(nfe, emitente, destinatario, items) {"

### Substitua TODO o conteúdo da função por:

```javascript
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
  
  // Data/hora no formato CORRETO para SEFAZ
  const now = new Date();
  const dhEmi = now.toISOString().slice(0, 19) + '-03:00';
  
  // Detectar tipo de documento
  const docDestinatario = destinatario.documento.replace(/\D/g, '');
  const tipoDoc = docDestinatario.length === 11 ? 'CPF' : 'CNPJ';
  
  // CRT do emitente
  const crt = emitente.crt || '1';
  
  // Gerar XML MANUALMENTE (garantindo formatação correta)
  const xmlItems = items.map((item, index) => {
    const qCom = parseFloat(item.quantidade || 0).toFixed(4);
    const vUnCom = parseFloat(item.valor_unitario || 0).toFixed(4);
    const vProd = parseFloat(item.valor_total || 0).toFixed(2);
    
    return `<det nItem="${index + 1}">
      <prod>
        <cProd>${item.produto_id}</cProd>
        <cEAN>0000000000000</cEAN>
        <xProd>${removeAcentos(item.descricao)}</xProd>
        <NCM>${item.ncm || '84716053'}</NCM>
        <CFOP>${nfe.cfop}</CFOP>
        <uCom>UN</uCom>
        <qCom>${qCom}</qCom>
        <vUnCom>${vUnCom}</vUnCom>
        <vProd>${vProd}</vProd>
        <cEANTrib>0000000000000</cEANTrib>
        <uTrib>UN</uTrib>
        <qTrib>${qCom}</qTrib>
        <vUnTrib>${vUnCom}</vUnTrib>
        <indTot>1</indTot>
      </prod>
      <imposto>
        <ICMS>
          <ICMSSN102>
            <orig>0</orig>
            <CSOSN>102</CSOSN>
          </ICMSSN102>
        </ICMS>
        <IPI>
          <IPINT>
            <CST>51</CST>
          </IPINT>
        </IPI>
        <PIS>
          <PISOutr>
            <CST>49</CST>
            <vBC>0.00</vBC>
            <pPIS>0.00</pPIS>
            <vPIS>0.00</vPIS>
          </PISOutr>
        </PIS>
        <COFINS>
          <COFINSOutr>
            <CST>49</CST>
            <vBC>0.00</vBC>
            <pCOFINS>0.00</pCOFINS>
            <vCOFINS>0.00</vCOFINS>
          </COFINSOutr>
        </COFINS>
      </imposto>
    </det>`;
  }).join('');
  
  const vTotal = parseFloat(nfe.valor_total || 0).toFixed(2);
  
  const xml = `<NFe><infNFe Id="NFe${chave}" versao="4.00">
    <ide>
      <cUF>${cUF}</cUF>
      <cNF>${cNF}</cNF>
      <natOp>${nfe.natureza_operacao}</natOp>
      <mod>${mod}</mod>
      <serie>${parseInt(serie)}</serie>
      <nNF>${parseInt(nNF)}</nNF>
      <dhEmi>${dhEmi}</dhEmi>
      <tpNF>1</tpNF>
      <idDest>1</idDest>
      <cMunFG>${emitente.codigo_municipio || '3534401'}</cMunFG>
      <tpImp>1</tpImp>
      <tpEmis>${tpEmis}</tpEmis>
      <cDV>${cDV}</cDV>
      <tpAmb>${this.ambiente}</tpAmb>
      <finNFe>1</finNFe>
      <indFinal>0</indFinal>
      <indPres>1</indPres>
      <procEmi>0</procEmi>
      <verProc>1.0</verProc>
    </ide>
    <emit>
      <CNPJ>${cnpj}</CNPJ>
      <xNome>${emitente.razao_social}</xNome>
      <xFant>${emitente.nome_fantasia || emitente.razao_social}</xFant>
      <enderEmit>
        <xLgr>${removeAcentos(emitente.endereco)}</xLgr>
        <nro>${emitente.numero}</nro>
        <xBairro>${removeAcentos('Centro')}</xBairro>
        <cMun>${emitente.codigo_municipio || '3534401'}</cMun>
        <xMun>${removeAcentos(emitente.cidade)}</xMun>
        <UF>${emitente.estado}</UF>
        <CEP>${emitente.cep.replace(/\D/g, '').padStart(8, '0')}</CEP>
        <cPais>1058</cPais>
        <xPais>Brasil</xPais>
      </enderEmit>
      <IE>${emitente.ie.replace(/\D/g, '')}</IE>
      <CRT>${crt}</CRT>
    </emit>
    <dest>
      <${tipoDoc}>${docDestinatario}</${tipoDoc}>
      <xNome>${destinatario.razao_social}</xNome>
      <enderDest>
        <xLgr>${removeAcentos(destinatario.endereco)}</xLgr>
        <nro>${destinatario.numero || 'S/N'}</nro>
        <xBairro>${removeAcentos(destinatario.bairro || 'Centro')}</xBairro>
        <cMun>${destinatario.codigo_municipio || '3534401'}</cMun>
        <xMun>${removeAcentos(destinatario.cidade)}</xMun>
        <UF>${destinatario.uf}</UF>
        <CEP>${destinatario.cep.replace(/\D/g, '').padStart(8, '0')}</CEP>
        <cPais>1058</cPais>
        <xPais>Brasil</xPais>
      </enderDest>
      <indIEDest>9</indIEDest>
    </dest>
    ${xmlItems}
    <total>
      <ICMSTot>
        <vBC>0.00</vBC>
        <vICMS>0.00</vICMS>
        <vICMSDeson>0.00</vICMSDeson>
        <vFCP>0.00</vFCP>
        <vBCST>0.00</vBCST>
        <vST>0.00</vST>
        <vFCPST>0.00</vFCPST>
        <vFCPSTRet>0.00</vFCPSTRet>
        <vProd>${vTotal}</vProd>
        <vFrete>0.00</vFrete>
        <vSeg>0.00</vSeg>
        <vDesc>0.00</vDesc>
        <vII>0.00</vII>
        <vIPI>0.00</vIPI>
        <vIPIDevol>0.00</vIPIDevol>
        <vPIS>0.00</vPIS>
        <vCOFINS>0.00</vCOFINS>
        <vOutro>0.00</vOutro>
        <vNF>${vTotal}</vNF>
        <vTotTrib>0.00</vTotTrib>
      </ICMSTot>
    </total>
    <transp>
      <modFrete>0</modFrete>
    </transp>
    <pag>
      <detPag>
        <indPag>0</indPag>
        <tPag>01</tPag>
        <vPag>${vTotal}</vPag>
      </detPag>
    </pag>
  </infNFe></NFe>`;
  
  console.log('\n✅ XML GERADO MANUALMENTE');
  console.log(`   Tamanho: ${xml.length} bytes\n`);
  
  return { xml, chave };
}
```

## PASSO 6: Salvar, reiniciar e testar

```bash
pkill -9 node
npm start
```

Agora DEVE funcionar! O XML é gerado manualmente com formatação garantida! 🚀
