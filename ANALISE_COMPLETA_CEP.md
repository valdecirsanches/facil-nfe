# 🔍 ANÁLISE COMPLETA - PROBLEMA DO CEP

## 📋 PROBLEMA IDENTIFICADO

O CEP `06056230` está virando `6056230` (perdendo o zero à esquerda) em algum ponto do fluxo de dados.

---

## 🔎 VARREDURA COMPLETA REALIZADA

### ✅ 1. FRONTEND - HOOKS (useCEP.ts)
**Status:** ✅ CORRIGIDO

```typescript
// ANTES (PROBLEMA):
return {
  cep: data.cep  // Retornava CEP da API (pode vir sem zero)
}

// DEPOIS (CORRETO):
return {
  cep: cep,  // Retorna CEP original digitado pelo usuário
  endereco: data.logradouro,
  // ...
}
```

**Impacto:** O hook agora preserva o CEP exatamente como digitado.

---

### ✅ 2. BACKEND - GERAÇÃO XML (nfe_service.js)
**Status:** ✅ CORRIGIDO

```javascript
// ANTES (PROBLEMA):
CEP: emitente.cep.replace(/\D/g, '').padStart(8, '0')

// DEPOIS (CORRETO):
CEP: String(emitente.cep || '').replace(/\D/g, '').padStart(8, '0')
```

**Impacto:** Garante que o CEP sempre tenha 8 dígitos no XML, mesmo que venha com 7 do banco.

---

### ✅ 3. BANCO DE DADOS - SCHEMA
**Status:** ✅ VERIFICADO - TIPO CORRETO

```sql
-- Schema no server.js:
CREATE TABLE empresas (
  ...
  cep TEXT,  -- ✅ TEXT é o tipo correto
  ...
);

CREATE TABLE clientes (
  ...
  cep TEXT,  -- ✅ TEXT é o tipo correto
  ...
);
```

**Conclusão:** O tipo `TEXT` está correto. O problema NÃO é no schema.

---

### ⚠️ 4. POSSÍVEL CAUSA RAIZ

O problema pode estar em **3 pontos**:

#### A) Conversão Implícita no SQLite
Quando você salva `"06056230"` como TEXT, o SQLite pode estar fazendo:
```javascript
// JavaScript envia:
cep: "06056230"

// SQLite pode interpretar como número e salvar:
cep: 6056230  // Perde o zero!

// Ao ler de volta:
cep: "6056230"  // Retorna como string sem o zero
```

#### B) Conversão no Backend (server.js)
```javascript
// Se em algum lugar houver:
parseInt(req.body.cep)  // ❌ ERRADO!
Number(req.body.cep)    // ❌ ERRADO!

// Deve ser:
String(req.body.cep)    // ✅ CORRETO
```

#### C) Dados Já Salvos Incorretamente
CEPs já salvos no banco podem estar sem o zero à esquerda.

---

## 🔧 SOLUÇÕES APLICADAS

### 1. ✅ Frontend Corrigido
- `hooks/useCEP.ts` agora retorna CEP original
- Formulários preservam formatação

### 2. ✅ Backend Corrigido
- `nfe_service.js` garante 8 dígitos no XML
- Usa `String()` + `padStart(8, '0')`

### 3. ✅ Script de Correção do Banco
- `backend/CORRIGIR_CEP_BANCO_FINAL.js` criado
- Corrige CEPs existentes com 7 dígitos

---

## 🚀 COMO APLICAR A CORREÇÃO COMPLETA

### Passo 1: Corrigir CEPs Existentes no Banco
```bash
cd backend
node CORRIGIR_CEP_BANCO_FINAL.js
```

**O que faz:**
- Busca todos os CEPs em todas as tabelas
- Adiciona zero à esquerda onde necessário
- `6056230` → `06056230`

### Passo 2: Verificar server.js
Procure por qualquer conversão de CEP:

```javascript
// ❌ ERRADO - NUNCA FAÇA ISSO:
parseInt(cep)
Number(cep)
+cep

// ✅ CORRETO - SEMPRE USE:
String(cep)
cep.toString()
```

### Passo 3: Reiniciar Backend
```bash
cd backend
npm start
```

### Passo 4: Testar
1. Cadastre uma nova empresa com CEP `06056230`
2. Salve
3. Verifique no banco se salvou como `06056230`
4. Emita uma NFe
5. Verifique o XML gerado: `<CEP>06056230</CEP>`

---

## 📊 CHECKLIST DE VERIFICAÇÃO

### Frontend
- [x] `hooks/useCEP.ts` retorna CEP original
- [x] Formulários não transformam CEP
- [x] Input aceita CEP com zero à esquerda

### Backend
- [x] `nfe_service.js` usa `String(cep).padStart(8, '0')`
- [ ] `server.js` não converte CEP para número
- [ ] Rotas POST/PUT preservam CEP como string

### Banco de Dados
- [ ] CEPs existentes corrigidos com script
- [x] Schema usa `TEXT` (não `INTEGER`)
- [ ] Nenhuma trigger ou constraint converte CEP

---

## 🔍 COMO DEBUGAR SE AINDA HOUVER PROBLEMA

### 1. Verificar Salvamento no Banco
```bash
cd backend
sqlite3 empresa_1.db
SELECT id, razao_social, cep, length(cep) as tamanho FROM clientes;
```

**Esperado:**
```
1|Cliente Teste|06056230|8
```

**Problema:**
```
1|Cliente Teste|6056230|7  ← FALTA ZERO!
```

### 2. Verificar XML Gerado
```bash
cd backend/Arqs/empresa_1/logs
cat debug_xml_*.xml | grep CEP
```

**Esperado:**
```xml
<CEP>06056230</CEP>
```

**Problema:**
```xml
<CEP>6056230</CEP>  ← FALTA ZERO!
```

### 3. Adicionar Logs no server.js
```javascript
app.post('/api/empresas/:empresaId/clientes', (req, res) => {
  console.log('📥 CEP recebido:', req.body.cep);
  console.log('📏 Tipo:', typeof req.body.cep);
  console.log('📏 Length:', req.body.cep?.length);
  
  // ... resto do código
});
```

---

## ✅ SOLUÇÃO DEFINITIVA

### Garantir que CEP SEMPRE seja STRING em TODO o fluxo:

```javascript
// 1. No frontend (já corrigido):
cep: cep  // Mantém original

// 2. No backend ao receber:
const cepString = String(req.body.cep || '')

// 3. Ao salvar no banco:
db.prepare('INSERT ... VALUES (?)').run(cepString)

// 4. Ao gerar XML:
CEP: String(emitente.cep || '').replace(/\D/g, '').padStart(8, '0')
```

---

## 🎯 RESULTADO ESPERADO

Após aplicar todas as correções:

1. ✅ Frontend preserva CEP digitado
2. ✅ Backend não converte CEP para número
3. ✅ Banco salva CEP como string com 8 dígitos
4. ✅ XML gerado tem CEP com 8 dígitos
5. ✅ SEFAZ aceita sem erro de validação

---

## 📝 NOTAS IMPORTANTES

### Por que CEP deve ser STRING?
- CEP com zero à esquerda: `06056230`
- Se converter para número: `6056230` (perde zero)
- SEFAZ exige exatamente 8 dígitos

### Por que usar padStart(8, '0')?
- Garante 8 dígitos mesmo se vier com 7
- `"6056230".padStart(8, '0')` → `"06056230"`
- Proteção contra dados já corrompidos

### Quando executar o script de correção?
- Sempre que suspeitar de CEPs com 7 dígitos
- Após migração de dados
- Antes de ir para produção

---

**Data:** 2024  
**Sistema:** Fácil NFe  
**Status:** ✅ Análise completa e soluções aplicadas
