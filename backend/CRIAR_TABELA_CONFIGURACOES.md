#🔧 CRIAR TABELA DE CONFIGURAÇÕES

## 🎯 PROBLEMA:
A tabela `configuracoes` não existe no banco de dados `principal.db`, por isso os valores não são salvos.

## ✅ SOLUÇÃO:

### **Opção 1: Script Automático (RECOMENDADO)**
```bash
cd backend
node create_configuracoes_table.js
```

Isso vai:
1. ✅ Criar a tabela `configuracoes`
2. ✅ Inserir 11 configurações padrão
3. ✅ Mostrar o resultado

### **Opção 2: Reiniciar o Backend**
O `server.js` foi atualizado para criar a tabela automaticamente.

```bash
cd backend
npm start
```

Na inicialização você verá:
```
➕ Criando configurações padrão...
✅ Configurações padrão criadas
```

---

## 📊 ESTRUTURA DA TABELA:

```sql
CREATE TABLE configuracoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chave TEXT UNIQUE NOT NULL,
  valor TEXT,
  descricao TEXT,
  tipo TEXT DEFAULT 'string',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📋 CONFIGURAÇÕES PADRÃO:

| Chave | Valor Padrão | Descrição |
|-------|--------------|-----------|
| sefaz_ambiente | 2 | Ambiente SEFAZ (1=Produção, 2=Homologação) |
| sefaz_uf | SP | UF da SEFAZ |
| certificado_tipo | A1 | Tipo de certificado (A1 ou A3) |
| certificado_senha | (vazio) | Senha do certificado |
| certificado_path | (vazio) | Caminho do arquivo .pfx |
| serie_nfe | 1 | Série padrão da NFe |
| proximo_numero | 1 | Próximo número de NFe |
| email_smtp_host | (vazio) | Servidor SMTP |
| email_smtp_port | 587 | Porta SMTP |
| email_smtp_user | (vazio) | Usuário SMTP |
| email_smtp_pass | (vazio) | Senha SMTP |

---

## 🧪 VERIFICAR SE FUNCIONOU:

```bash
node test_config.js
```

Deve mostrar:
```
📊 Total de configurações: 11
sefaz_ambiente: 2
sefaz_uf: SP
...
```

---

## 🎯 PRÓXIMOS PASSOS:

1. ✅ Execute `node create_configuracoes_table.js`
2. ✅ Reinicie o backend (`npm start`)
3. ✅ Acesse "Config. Sistema" no frontend
4. ✅ Preencha os campos
5. ✅ Clique em "Salvar"
6. ✅ Recarregue (F5)
7. ✅ **AGORA OS VALORES VÃO PERSISTIR!**

---

## 💡 POR QUE ISSO ACONTECEU?

A tabela `configuracoes` não foi criada nas migrações iniciais. Agora está corrigido e o `server.js` cria automaticamente na inicialização.
