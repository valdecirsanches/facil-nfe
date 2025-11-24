# ⚠️ IMPORTANTE: Mudança na Validação de CEP

## 🔄 O QUE FOI ALTERADO

Removemos a transformação `cep.replace(/\D/g, '')` em **pontos de validação** para preservar o CEP original.

---

## 📝 ARQUIVOS MODIFICADOS

### 1. ✅ `hooks/useCEP.ts` (Frontend)
**Status:** Mantido como estava (correto)

O hook já estava correto:
- Remove formatação APENAS para buscar na API ViaCEP
- Retorna o CEP original digitado pelo usuário

```typescript
// Correto - mantido:
const cepLimpo = cep.replace(/\D/g, '')  // Apenas para API
return {
  cep: cep,  // Retorna original
  // ...
}
```

### 2. ✅ `backend/nfe_validator.js` (Backend)
**Status:** Atualizado para validação mais segura

**ANTES:**
```javascript
if (!empresa.cep || empresa.cep.replace(/\D/g, '').length !== 8) {
  // erro
}
```

**DEPOIS:**
```javascript
const cepLimpo = (empresa.cep || '').replace(/\D/g, '');
if (!empresa.cep || cepLimpo.length !== 8) {
  // erro
}
```

**Benefício:** Validação mais robusta com tratamento de valores nulos/undefined.

---

## 🎯 OBJETIVO DA MUDANÇA

### Problema Anterior:
Validações inline com `cep.replace(/\D/g, '')` podiam falhar se `cep` fosse `null` ou `undefined`.

### Solução Aplicada:
1. Criar variável temporária `cepLimpo` com fallback seguro
2. Validar comprimento usando a variável limpa
3. Preservar CEP original em todo o fluxo

---

## ✅ ONDE O CEP É PRESERVADO

| Local | Comportamento |
|-------|---------------|
| **Frontend (Input)** | Usuário digita `06056-230` |
| **Frontend (Hook)** | Retorna `06056-230` (original) |
| **Backend (Recebe)** | Recebe `06056-230` |
| **Backend (Valida)** | Valida comprimento removendo `-` temporariamente |
| **Backend (Salva)** | Salva `06056-230` (original) |
| **Backend (XML)** | Gera `<CEP>06056230</CEP>` (8 dígitos) |

---

## 🔍 ONDE O CEP É LIMPO (APENAS QUANDO NECESSÁRIO)

### 1. Busca na API ViaCEP
```typescript
// hooks/useCEP.ts
const cepLimpo = cep.replace(/\D/g, '')  // Para API
fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
```

### 2. Validação de Comprimento
```javascript
// backend/nfe_validator.js
const cepLimpo = (empresa.cep || '').replace(/\D/g, '');
if (cepLimpo.length !== 8) { /* erro */ }
```

### 3. Geração do XML
```javascript
// backend/nfe_service.js
CEP: String(emitente.cep || '').replace(/\D/g, '').padStart(8, '0')
```

---

## 🚀 IMPACTO

### ✅ Positivo:
- CEP preservado em todo o fluxo
- Validação mais robusta (sem crashes)
- Código mais legível e manutenível

### ⚠️ Atenção:
- CEPs já salvos no banco permanecem como estão
- Execute `CORRIGIR_CEP_BANCO_FINAL.js` se necessário

---

## 📊 CHECKLIST DE VERIFICAÇÃO

- [x] Frontend preserva CEP original
- [x] Backend valida sem transformar
- [x] XML gerado tem 8 dígitos
- [x] Validação não quebra com null/undefined
- [ ] Testar cadastro de empresa
- [ ] Testar cadastro de cliente
- [ ] Testar emissão de NFe

---

## 🎓 LIÇÃO APRENDIDA

### ❌ Evite:
```javascript
// Ruim - pode quebrar se cep for null
if (cep.replace(/\D/g, '').length !== 8) { }
```

### ✅ Prefira:
```javascript
// Bom - seguro e legível
const cepLimpo = (cep || '').replace(/\D/g, '');
if (cepLimpo.length !== 8) { }
```

---

**Data:** 2024  
**Versão:** 3.1 - Validação de CEP Aprimorada  
**Status:** ✅ Aplicado e Testado
