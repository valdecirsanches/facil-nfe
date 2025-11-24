# 🚀 INÍCIO RÁPIDO - Sistema NFe

## ⚠️ ERRO DE LOGIN? EXECUTE ISTO PRIMEIRO!

Se você está vendo o erro:
```
Authentication error: Error: Too few parameter values were provided
```

**SOLUÇÃO:**
```bash
cd backend
npm run fix
npm start
```

---

## 📋 SETUP INICIAL

### 1️⃣ Instalar Dependências
```bash
cd backend
npm install
```

### 2️⃣ Corrigir Banco de Dados (se já existe)
```bash
npm run fix
```

### 3️⃣ Iniciar Backend
```bash
npm start
```

### 4️⃣ Popular Tabelas NCM e CFOP (opcional)
```bash
# Em outro terminal
npm run seed
```

---

## 🔐 LOGIN PADRÃO

```
Email: admin@nfe.com
Senha: admin123
```

---

## 📁 ESTRUTURA DO PROJETO

```
backend/
├── principal.db          # Banco principal (empresas, usuários, NCM, CFOP)
├── empresa_1.db          # Banco da empresa 1 (clientes, produtos, NFes)
├── empresa_2.db          # Banco da empresa 2
└── ...

frontend/
└── (React app)
```

---

## 🛠️ COMANDOS ÚTEIS

```bash
# Iniciar backend
npm start

# Corrigir banco de dados
npm run fix

# Popular NCM e CFOP
npm run seed

# Desenvolvimento com auto-reload
npm run dev
```

---

## 🎯 TIPOS DE USUÁRIO

- **🛡️ Super Usuário** - Acesso total, gerencia tudo
- **🛡 Administrador** - Gerencia usuários de sua empresa
- **✓ Usuário** - Usa funcionalidades da empresa

---

## ✅ CHECKLIST DE SETUP

- [ ] `npm install` executado
- [ ] `npm run fix` executado (se banco já existe)
- [ ] `npm start` rodando sem erros
- [ ] Login com admin@nfe.com funcionando
- [ ] `npm run seed` executado (opcional)

---

## 🆘 PROBLEMAS COMUNS

### Erro: "Too few parameter values"
```bash
npm run fix
```

### Erro: "no such table: tbNCM"
```bash
npm run seed
```

### Erro: "no such column: bairro"
```bash
# Reinicie o backend para aplicar migrações
npm start
```

### Começar do Zero
```bash
rm *.db
npm start
```

---

## 🎉 PRONTO!

Seu sistema NFe está configurado e pronto para uso! 🚀

**Próximos passos:**
1. Faça login com admin@nfe.com
2. Cadastre uma empresa
3. Cadastre usuários
4. Comece a emitir NFes!