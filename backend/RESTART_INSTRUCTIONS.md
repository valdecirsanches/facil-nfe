# INSTRUÇÕES IMPORTANTES

## ⚠️ REINICIE O BACKEND AGORA

As migrações foram atualizadas mas ainda não foram aplicadas ao banco de dados.

**Execute agora:**

```bash
cd backend
npm start
```

Isso irá:
1. ✅ Criar tabelas tbNCM e tbCFOP no principal.db
2. ✅ Adicionar todos os campos faltantes nas transportadoras
3. ✅ Aplicar todas as migrações pendentes

**Você verá no console:**
```
📦 Executando migrações no banco principal...
→ Aplicando migration_001_add_ncm_cfop_tables...
✓ Tabelas tbNCM e tbCFOP criadas

📦 Executando migrações em empresa_1...
→ Aplicando migration_006_add_veiculo_to_transportadora...
✓ Coluna bairro adicionada
✓ Coluna cep adicionada
✓ Coluna email adicionada
✓ Coluna nome_motorista adicionada
```

## Após reiniciar o backend, os erros serão corrigidos:
- ❌ "no such table: main.tbCFOP" → ✅ Tabela criada
- ❌ "no such column: bairro" → ✅ Coluna adicionada