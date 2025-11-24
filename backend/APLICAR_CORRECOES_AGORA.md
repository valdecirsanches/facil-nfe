# 🔧 CORREÇÕES URGENTES - EXECUTE AGORA!

## ❌ PROBLEMA:
O backend está rodando com código antigo. As edições foram feitas mas o Node.js não foi reiniciado.

## ✅ SOLUÇÃO IMEDIATA:

### 1. PARE O BACKEND:
```bash
# Pressione Ctrl+C no terminal onde o backend está rodando
```

### 2. VERIFIQUE SE AS CORREÇÕES ESTÃO NO CÓDIGO:
```bash
cd backend
grep -n "padStart(8, '0')" nfe_service.js
grep -n "toFixed(2)" nfe_service.js
grep -n "toFixed(4)" nfe_service.js
grep -n "tPag: '01'" nfe_service.js
```

Se aparecer resultados, as correções estão no arquivo! ✅

### 3. REINICIE O BACKEND:
```bash
npm start
```

### 4. TESTE NOVAMENTE:
- Emita uma nova NFe
- O validador deve aprovar!

---

## 📋 CORREÇÕES QUE DEVEM ESTAR NO CÓDIGO:

### ✅ CEP (linha ~348 e ~363):
```javascript
CEP: emitente.cep.replace(/\D/g, '').padStart(8, '0'),
CEP: destinatario.cep.replace(/\D/g, '').padStart(8, '0'),
```

### ✅ Produtos (linha ~377):
```javascript
qCom: parseFloat(item.quantidade).toFixed(4),
vUnCom: parseFloat(item.valor_unitario).toFixed(4),
vProd: parseFloat(item.valor_total).toFixed(2),
qTrib: parseFloat(item.quantidade).toFixed(4),
vUnTrib: parseFloat(item.valor_unitario).toFixed(4),
```

### ✅ Totais (linha ~389):
```javascript
vBC: '0.00',
vICMS: '0.00',
// ... todos com .00
vProd: nfe.valor_total.toFixed(2),
vNF: nfe.valor_total.toFixed(2),
```

### ✅ Pagamento (linha ~410):
```javascript
tPag: '01',  // COM ZERO À ESQUERDA!
vPag: nfe.valor_total.toFixed(2)
```

---

## 🚨 SE AS CORREÇÕES NÃO ESTIVEREM NO ARQUIVO:

Execute este comando para aplicar TODAS as correções de uma vez:

```bash
cd backend
node << 'EOF'
const fs = require('fs');
let code = fs.readFileSync('nfe_service.js', 'utf8');

// Corrigir CEP
code = code.replace(
  /CEP: emitente\.cep\.replace\(\/\\D\/g, ''\)/g,
  "CEP: emitente.cep.replace(/\\D/g, '').padStart(8, '0')"
);
code = code.replace(
  /CEP: destinatario\.cep\.replace\(\/\\D\/g, ''\)/g,
  "CEP: destinatario.cep.replace(/\\D/g, '').padStart(8, '0')"
);

// Corrigir produtos
code = code.replace(
  /qCom: item\.quantidade\.toFixed\(4\)/g,
  "qCom: parseFloat(item.quantidade).toFixed(4)"
);
code = code.replace(
  /vUnCom: item\.valor_unitario\.toFixed\(4\)/g,
  "vUnCom: parseFloat(item.valor_unitario).toFixed(4)"
);
code = code.replace(
  /vProd: item\.valor_total\.toFixed\(2\)/g,
  "vProd: parseFloat(item.valor_total).toFixed(2)"
);

// Corrigir tPag
code = code.replace(/tPag: '1',/g, "tPag: '01',");

fs.writeFileSync('nfe_service.js', code);
console.log('✅ Correções aplicadas!');
EOF
```

Depois reinicie:
```bash
npm start
```

---

## 🎯 RESULTADO ESPERADO:

Após reiniciar, você deve ver:

```
🔍 Validando NFe antes de enviar...
✅ NFe validada com sucesso!
✅ SEFAZ online, prosseguindo com envio...
📤 Enviando NFe para SEFAZ...
```

**SEM ERROS DE VALIDAÇÃO!** 🎉
