#🔧 CORREÇÃO: Erro de Coluna Faltante em Transportadoras

## ❌ Problema

```
sqlite3.OperationalError: table transportadoras has no column named bairro
```

Este erro ocorre quando você tenta cadastrar uma transportadora em um banco de empresa que foi criado antes da migração que adiciona as novas colunas.

---

## ✅ SOLUÇÃO RÁPIDA

Execute o script de correção:

```bash
cd backend
npm run fix-transportadoras
```

**O que o script faz:**
- ✅ Encontra todos os bancos de empresas (`empresa_*.db`)
- ✅ Verifica se a tabela `transportadoras` existe
- ✅ Adiciona as colunas faltantes:
  - `bairro`
  - `numero`
  - `complemento`
  - `cep`
  - `email`
  - `uf`
  - `nome_motorista`
  - `placa_veiculo`
  - `uf_veiculo`
  - `rntc`
  - `observacoes`
- ✅ Migra dados de `estado` para `uf`

---

## 📋 PASSO A PASSO

### 1. Parar o servidor (se estiver rodando)
```bash
Ctrl+C
```

### 2. Executar correção
```bash
npm run fix-transportadoras
```

**Você verá:**
```
🔧 CORREÇÃO: Adicionando colunas faltantes em transportadoras

📊 Encontrados 2 banco(s) de empresa(s)

📦 Processando empresa_1.db (Empresa ID: 1)
  📋 Colunas existentes: id, razao_social, cnpj, ie, endereco, cidade, estado, telefone, created_at
  ✅ Coluna bairro adicionada
  ✅ Coluna numero adicionada
  ✅ Coluna complemento adicionada
  ✅ Coluna cep adicionada
  ✅ Coluna email adicionada
  ✅ Coluna uf adicionada
  ✅ Coluna nome_motorista adicionada
  ✅ Coluna placa_veiculo adicionada
  ✅ Coluna uf_veiculo adicionada
  ✅ Coluna rntc adicionada
  ✅ Coluna observacoes adicionada
  ✅ 11 coluna(s) adicionada(s) com sucesso
  📊 Total de colunas: 20

✅ CORREÇÃO CONCLUÍDA!
```

### 3. Reiniciar o servidor
```bash
npm start
```

### 4. Testar cadastro de transportadora
- Acesse o sistema
- Vá em "Transportadoras"
- Tente cadastrar uma nova transportadora
- Deve funcionar normalmente agora! ✅

---

## 🔍 VERIFICAR SE FUNCIONOU

Após executar a correção, você pode verificar as colunas:

```bash
sqlite3 empresa_1.db "PRAGMA table_info(transportadoras);"
```

Deve mostrar todas as 20 colunas.

---

## 🚨 SE O PROBLEMA PERSISTIR

### Opção 1: Recriar o banco da empresa (PERDE DADOS!)
```bash
rm empresa_1.db
npm start
```
O banco será recriado com todas as colunas corretas.

### Opção 2: Migração manual
```bash
sqlite3 empresa_1.db
```

Depois execute:
```sql
ALTER TABLE transportadoras ADD COLUMN bairro TEXT;
ALTER TABLE transportadoras ADD COLUMN numero TEXT;
ALTER TABLE transportadoras ADD COLUMN complemento TEXT;
ALTER TABLE transportadoras ADD COLUMN cep TEXT;
ALTER TABLE transportadoras ADD COLUMN email TEXT;
ALTER TABLE transportadoras ADD COLUMN uf TEXT;
ALTER TABLE transportadoras ADD COLUMN nome_motorista TEXT;
ALTER TABLE transportadoras ADD COLUMN placa_veiculo TEXT;
ALTER TABLE transportadoras ADD COLUMN uf_veiculo TEXT;
ALTER TABLE transportadoras ADD COLUMN rntc TEXT;
ALTER TABLE transportadoras ADD COLUMN observacoes TEXT;
.quit
```

---

## 📚 ENTENDENDO O PROBLEMA

**Por que aconteceu?**

1. O banco `empresa_1.db` foi criado antes da migração 006
2. A migração 006 adiciona as novas colunas na tabela `transportadoras`
3. O sistema de migrações só roda ao iniciar o servidor
4. Se o banco já existia, a migração pode não ter sido aplicada

**Como evitar no futuro?**

- Sempre reinicie o servidor após atualizar o código
- As migrações são executadas automaticamente ao iniciar
- Novos bancos de empresas já são criados com todas as colunas

---

## ✅ RESULTADO ESPERADO

Após a correção, você poderá cadastrar transportadoras com todos os campos:

**Dados da Empresa:**
- Razão Social
- CNPJ
- IE
- Telefone
- E-mail

**Endereço:**
- CEP
- Endereço
- Número
- Complemento
- Bairro
- Cidade
- UF

**Motorista e Veículo:**
- Nome do Motorista
- Placa do Veículo
- UF do Veículo
- RNTC

**Observações:**
- Campo de texto livre

---

**Execute `npm run fix-transportadoras` AGORA para corrigir!** 🚀