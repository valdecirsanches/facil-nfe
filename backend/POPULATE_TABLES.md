# 🌱 Popular Tabelas NCM e CFOP

## ⚠️ IMPORTANTE: Execute estes comandos na ordem

### 1️⃣ Primeiro: Inicie o backend (se ainda não iniciou)

```bash
cd backend
npm start
```

**Aguarde ver no console:**
```
📦 Executando migrações no banco principal...
→ Aplicando migration_001_add_ncm_cfop_tables...
✓ Tabelas tbNCM e tbCFOP criadas
```

### 2️⃣ Segundo: Pare o backend (Ctrl+C)

### 3️⃣ Terceiro: Execute o script de população

```bash
npm run seed
```

**Você verá:**
```
🌱 Populando tabelas NCM e CFOP...

Tabelas encontradas: tbNCM, tbCFOP

📦 Inserindo NCMs...
  ✓ NCM 1010 - CAVALOS VIVOS
  ✓ NCM 1011 - CAVALOS REPRODUTORES DE RAÇA PURA
  ✓ NCM 1012 - ASININOS VIVOS
  ✓ NCM 8471 - MÁQUINAS AUTOMÁTICAS PARA PROCESSAMENTO DE DADOS
  ✓ NCM 8473 - PARTES E ACESSÓRIOS PARA MÁQUINAS

📋 Inserindo CFOPs...
  ✓ CFOP 5102 - Venda de mercadoria adquirida ou recebida de terceiros
  ✓ CFOP 5103 - Venda de produção do estabelecimento
  ✓ CFOP 5104 - Venda de mercadoria com ST
  ✓ CFOP 5405 - Venda ST substituído
  ✓ CFOP 6102 - Venda interestadual

✅ Dados inseridos com sucesso!
   Total de NCMs: 5
   Total de CFOPs: 5

🔍 Testando buscas...

Busca NCM "CAVALO": 2 resultados
  - 1010: CAVALOS VIVOS
  - 1011: CAVALOS REPRODUTORES DE RAÇA PURA

Busca CFOP "5102": 1 resultados
  - 5102: Venda de mercadoria adquirida ou recebida de terceiros

✨ Concluído!
```

### 4️⃣ Quarto: Reinicie o backend

```bash
npm start
```

## ✅ Pronto!

Agora você pode:
- ✅ Buscar NCM "CAVALO" e encontrar resultados
- ✅ Buscar CFOP "5102" e encontrar o resultado
- ✅ Usar SearchableSelect em Produtos e NFe

## 📝 Adicionar Mais Dados

Para adicionar mais NCMs e CFOPs, edite o arquivo `seed_ncm_cfop.js` e adicione novos itens nos arrays `ncmExamples` e `cfopExamples`.