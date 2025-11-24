# 🐛 Debug: Configurações Somem na Tela

## 🔍 PROBLEMA:
As configurações são salvas no banco corretamente, mas somem quando você recarrega a página.

## ✅ SOLUÇÃO IMPLEMENTADA:

### **1. Logs Detalhados Adicionados:**

Agora você verá no console do navegador (F12):
```
🔄 Carregando configurações...
✅ Configurações carregadas: Array(11)
  sefaz_ambiente: "2"
  sefaz_uf: "SP"
  certificado_tipo: "A1"
  certificado_senha: "suasenha"
  certificado_path: "Arqs/empresa_1/certificado.pfx"
  ...
🎨 Renderizando SystemSettings
📊 Total de configs: 11
🔍 getConfigValue(certificado_senha): "suasenha"
🔍 getConfigValue(certificado_path): "Arqs/empresa_1/certificado.pfx"
```

### **2. Debug Card Adicionado:**

Na página, você verá um card cinza com:
```
🐛 Debug: 11 configurações | certificado_path: "Arqs/..." | certificado_senha: "***"
```

### **3. Valores Padrão Adicionados:**

Todos os campos agora têm valores padrão (fallback):
- `getConfigValue('sefaz_ambiente') || '2'`
- `getConfigValue('sefaz_uf') || 'SP'`
- Etc.

---

## 🧪 COMO TESTAR:

### **Passo 1: Abrir Console do Navegador**
```
F12 → Console
```

### **Passo 2: Acessar Config. Sistema**
Veja os logs:
```
🔄 Carregando configurações...
✅ Configurações carregadas: Array(11)
```

### **Passo 3: Verificar se os Valores Aparecem**
- Os campos devem estar preenchidos
- O debug card deve mostrar os valores
- Console deve mostrar `getConfigValue` para cada campo

### **Passo 4: Se Ainda Estiver Vazio**

**Verificar no backend:**
```bash
node test_config.js
```

**Verificar no console:**
```javascript
// Cole no console do navegador:
console.log('Configs:', localStorage.getItem('configs'));
```

---

## 🔧 POSSÍVEIS CAUSAS:

### **1. Cache do Navegador**
```
Ctrl + Shift + R (hard reload)
```

### **2. Token Expirado**
```
Faça logout e login novamente
```

### **3. CORS ou Network**
```
Verifique se a API está respondendo:
http://localhost:3001/api/configuracoes
```

### **4. Estado React**
```
O estado pode não estar atualizando.
Veja os logs no console.
```

---

## 📊 LOGS ESPERADOS:

### **Console do Navegador:**
```
🔄 Carregando configurações...
✅ Configurações carregadas: Array(11)
  sefaz_ambiente: "2"
  certificado_senha: "minhasenha"
  certificado_path: "Arqs/empresa_1/certificado.pfx"
🎨 Renderizando SystemSettings
📊 Total de configs: 11
🔍 getConfigValue(certificado_senha): "minhasenha"
```

### **Terminal do Backend:**
```
📊 GET /api/configuracoes - Retornando 11 configurações
```

---

## ✅ RESULTADO ESPERADO:

1. ✅ Campos preenchidos com valores do banco
2. ✅ Debug card mostrando valores
3. ✅ Logs detalhados no console
4. ✅ Valores persistem após reload
5. ✅ Senha aparece como "***" no debug

---

## 🎯 SE AINDA NÃO FUNCIONAR:

1. Limpe o cache do navegador
2. Faça logout e login
3. Verifique os logs no console
4. Execute `node test_config.js`
5. Tire um print dos logs e me envie
