# 🔍 VERIFICAR DADOS DE NCM

## ❌ Problema: Busca "CAVALO" não encontra resultados

### Causa Provável
As tabelas NCM e CFOP estão vazias. Você precisa popular os dados de teste.

### ✅ SOLUÇÃO

**Execute este comando:**

```bash
cd backend
npm run seed
```

**Você verá:**
```
🌱 Populando tabelas NCM e CFOP...

📦 Inserindo NCMs...
  ✓ NCM 1010 - CAVALOS VIVOS
  ✓ NCM 1011 - CAVALOS REPRODUTORES DE RAÇA PURA

📋 Inserindo CFOPs...
  ✓ CFOP 5102 - Venda de mercadoria

🔍 Testando buscas...
Busca NCM "CAVALO": 2 resultados
  - 1010: CAVALOS VIVOS
  - 1011: CAVALOS REPRODUTORES DE RAÇA PURA

✅ Dados inseridos com sucesso!
```

### Depois do seed:
1. Recarregue a página de produtos
2. Busque "CAVALO" no campo NCM
3. Verá 2 resultados

---

## 📝 ADICIONAR MAIS NCMs

Para adicionar mais dados, edite `backend/seed_ncm_cfop.js` e adicione novos itens nos arrays `ncmExamples` e `cfopExamples`.