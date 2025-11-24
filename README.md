#🚀 Sistema NFe - Gestão de Notas Fiscais

## ⚠️ ERRO DE LOGIN? LEIA ISTO PRIMEIRO!

Se você está vendo este erro:
```
Authentication error: Error: Too few parameter values were provided
```

### ✅ SOLUÇÃO RÁPIDA (2 minutos)

```bash
cd backend
npm run fix
npm start
```

Depois recarregue a página de login (F5) e use:
- **Email:** admin@nfe.com
- **Senha:** admin123

---

## 📋 Setup Completo

### 1. Instalar Dependências

```bash
cd backend
npm install
```

### 2. Corrigir Banco de Dados

```bash
npm run fix
```

### 3. Iniciar Backend

```bash
npm start
```

### 4. Popular Dados de Teste (Opcional)

```bash
npm run seed
```

---

## 🎯 Funcionalidades

- ✅ Gestão de Empresas
- ✅ Gestão de Usuários (Super, Admin, Usuário)
- ✅ Gestão de Clientes com Endereços de Entrega
- ✅ Gestão de Produtos com NCM e CFOP
- ✅ Gestão de Transportadoras
- ✅ Emissão de NFe
- ✅ Listagem de NFes Emitidas

---

## 👥 Tipos de Usuário

| Tipo | Permissões |
|------|-----------|
| 🛡️ **Super Usuário** | Acesso total, gerencia empresas e todos os usuários |
| 🛡 **Administrador** | Gerencia usuários de sua empresa |
| ✓ **Usuário** | Usa funcionalidades da empresa |

---

## 🔐 Login Padrão

```
Email: admin@nfe.com
Senha: admin123
```

---

## 🛠️ Comandos Disponíveis

```bash
npm start      # Inicia o backend
npm run fix    # Corrige banco de dados
npm run seed   # Popula NCM e CFOP
npm run dev    # Desenvolvimento com auto-reload
```

---

## 📁 Estrutura de Bancos

```
backend/
├── principal.db      # Empresas, Usuários, NCM, CFOP
├── empresa_1.db      # Dados da Empresa 1
├── empresa_2.db      # Dados da Empresa 2
└── ...
```

---

## 🆘 Problemas Comuns

### Erro: "Too few parameter values"
```bash
cd backend
npm run fix
npm start
```

### Erro: "no such table: tbNCM"
```bash
cd backend
npm run seed
```

### Começar do Zero
```bash
cd backend
rm *.db
npm start
```

---

## 📚 Documentação

- `backend/START_HERE.md` - Guia de início rápido
- `backend/FIX_LOGIN_ERROR.md` - Solução detalhada do erro de login
- `backend/POPULATE_TABLES.md` - Como popular NCM e CFOP
- `backend/README_FINAL.md` - Documentação completa

---

## ✨ Pronto para Usar!

Após executar `npm run fix` e `npm start`, acesse o sistema e faça login com as credenciais padrão.

**Dúvidas?** Consulte os arquivos de documentação na pasta `backend/`.

---

**Sistema NFe v1.0** - Desenvolvido com React, TypeScript, Node.js e SQLite