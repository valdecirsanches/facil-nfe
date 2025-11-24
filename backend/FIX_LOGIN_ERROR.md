#🔧 CORREÇÃO DO ERRO DE LOGIN

## ❌ Erro Atual
```
Authentication error: Error: Too few parameter values were provided
```

## 🔍 Causa
O banco de dados foi criado antes da migração que adiciona o campo `tipo` na tabela `usuarios`. O usuário admin existe sem o campo `tipo`, causando erro no login.

## ✅ SOLUÇÃO RÁPIDA

### Passo 1: Pare o backend (se estiver rodando)
```bash
Ctrl+C
```

### Passo 2: Execute o script de correção
```bash
cd backend
npm run fix
```

**Você verá:**
```
🔧 Corrigindo banco de dados...

→ Adicionando coluna tipo...
✓ Coluna tipo adicionada

→ Atualizando usuários...
  ✓ Usuário admin@nfe.com: tipo = super

✓ Admin atualizado: admin@nfe.com / admin123 (tipo: super)

📊 Usuários no banco:
  - admin@nfe.com (super)

✅ Banco de dados corrigido com sucesso!
```

### Passo 3: Inicie o backend
```bash
npm start
```

### Passo 4: Faça login
```
Email: admin@nfe.com
Senha: admin123
```

## 🎯 O QUE O SCRIPT FAZ

1. ✅ Adiciona coluna `tipo` se não existir
2. ✅ Atualiza todos os usuários sem tipo:
   - `empresa_id = null` → `tipo = 'super'`
   - `empresa_id != null` → `tipo = 'usuario'`
3. ✅ Garante que admin@nfe.com seja `tipo = 'super'`
4. ✅ Reseta senha do admin para `admin123`

## 📝 ALTERNATIVA: Deletar e Recriar

Se preferir começar do zero:

```bash
# Deletar banco antigo
rm principal.db

# Iniciar backend (cria banco novo)
npm start
```

O backend criará automaticamente:
- Banco de dados limpo
- Usuário admin com tipo correto
- Todas as tabelas necessárias

## ✨ PRONTO!

Após executar `npm run fix`, o login funcionará perfeitamente! 🚀