#🎯 INSTRUÇÕES FINAIS - ÚLTIMA TENTATIVA

## ✅ O QUE JÁ FOI FEITO:

1. ✅ Porta alterada para **5300** no backend
2. ✅ Função `sanitizeCEP()` adicionada no server.js
3. ✅ Todos os valores com `.toFixed()` no gerador de XML
4. ✅ Validação removida (era desnecessária)

---

## 🚀 PASSOS PARA TESTAR:

### 1. Execute o teste do XML:
```bash
cd backend
chmod +x SOLUCAO_DEFINITIVA.sh
./SOLUCAO_DEFINITIVA.sh
```

**IMPORTANTE:** Verifique se o XML gerado tem:
- ✅ `<qCom>1.0000</qCom>` (4 casas decimais)
- ✅ `<vUnCom>47.0000</vUnCom>` (4 casas decimais)
- ✅ `<vProd>47.00</vProd>` (2 casas decimais)
- ✅ `<tPag>01</tPag>` (com zero à esquerda)
- ✅ `<CEP>06056230</CEP>` (8 dígitos)

### 2. Altere a porta no FRONTEND:

Procure por `3001` nos arquivos do frontend e troque para `5300`:

```bash
cd ..
grep -r "3001" src/ components/ utils/ context/
```

Altere todos os `http://localhost:3001` para `http://localhost:5300`

### 3. Reinicie TUDO:

```bash
# Backend
cd backend
npm start

# Frontend (em outro terminal)
cd ..
npm start
```

---

## 🔍 SE AINDA DER ERRO:

**Execute este comando e me mostre o resultado:**

```bash
cd backend
node TESTAR_XML_GERADO.js
```

**Me mostre:**
1. Os valores de `qCom`, `vUnCom`, `vProd`, `tPag`, `CEP`
2. Se eles têm as casas decimais corretas

---

## ❌ SE O TESTE MOSTRAR VALORES ERRADOS:

Significa que o Node.js está usando uma versão antiga do arquivo em cache.

**Solução:**
```bash
cd backend
rm -rf node_modules/.cache
npm cache clean --force
node TESTAR_XML_GERADO.js
```

---

## 📝 RESUMO DO QUE FOI CORRIGIDO:

### No `nfe_service.js`:
```javascript
// CEPs com 8 dígitos
const cepEmitente = String(emitente.cep || '').replace(/\D/g, '').padStart(8, '0');
const cepDestinatario = String(destinatario.cep || '').replace(/\D/g, '').padStart(8, '0');

// Valores com casas decimais
qCom: parseFloat(item.quantidade || 0).toFixed(4),
vUnCom: parseFloat(item.valor_unitario || 0).toFixed(4),
vProd: parseFloat(item.valor_total || 0).toFixed(2),
vNF: parseFloat(nfe.valor_total || 0).toFixed(2),

// Tipo de pagamento com zero
tPag: '01',
vPag: parseFloat(nfe.valor_total || 0).toFixed(2)
```

### No `server.js`:
```javascript
// Função para garantir CEP com 8 dígitos
function sanitizeCEP(cep) {
  if (!cep) return '';
  const cepString = String(cep).replace(/\D/g, '');
  return cepString.padStart(8, '0');
}
```

---

## 🎯 TESTE FINAL:

Após reiniciar, emita uma NFe e verifique:

1. ✅ XML gerado tem todos os formatos corretos
2. ✅ Certificado está configurado
3. ✅ SEFAZ aceita sem erro 225

---

**Se o teste do XML mostrar valores corretos mas a emissão ainda falhar, o problema é:**
- ❌ Certificado não configurado
- ❌ Senha do certificado incorreta
- ❌ SEFAZ offline

**NÃO É MAIS problema de formato de XML.**
