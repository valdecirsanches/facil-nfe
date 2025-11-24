# Backend NFe - SQLite3

Backend API REST para sistema de emissão de NFe com SQLite3.

## 🚀 Instalação

```bash
npm install
```

## ▶️ Executar

```bash
# Desenvolvimento (com auto-reload)
npm run dev

# Produção
npm start
```

## 📁 Estrutura de Arquivos

Após iniciar o servidor, serão criados automaticamente:

- `principal.db` - Banco principal (empresas + usuários)
- `empresa_1.db`, `empresa_2.db`... - Um banco por empresa

## 🔐 Credenciais Padrão

- **Email:** admin@nfe.com
- **Senha:** admin123

## 📡 Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login

### Empresas
- `GET /api/empresas` - Listar empresas
- `GET /api/empresas/:id` - Buscar empresa
- `POST /api/empresas` - Criar empresa
- `PUT /api/empresas/:id` - Atualizar empresa

### Usuários
- `GET /api/usuarios` - Listar usuários
- `POST /api/usuarios` - Criar usuário
- `PUT /api/usuarios/:id` - Atualizar usuário

### Clientes (por empresa)
- `GET /api/empresas/:empresaId/clientes`
- `POST /api/empresas/:empresaId/clientes`
- `PUT /api/empresas/:empresaId/clientes/:id`

### Produtos (por empresa)
- `GET /api/empresas/:empresaId/produtos`
- `POST /api/empresas/:empresaId/produtos`
- `PUT /api/empresas/:empresaId/produtos/:id`

### Transportadoras (por empresa)
- `GET /api/empresas/:empresaId/transportadoras`
- `POST /api/empresas/:empresaId/transportadoras`
- `PUT /api/empresas/:empresaId/transportadoras/:id`

### NFes (por empresa)
- `GET /api/empresas/:empresaId/nfes`
- `GET /api/empresas/:empresaId/nfes/:id`
- `POST /api/empresas/:empresaId/nfes`

## 🔒 Autenticação

Todas as rotas (exceto login) requerem token JWT no header:

```
Authorization: Bearer SEU_TOKEN_AQUI
```

## 🛠️ Variáveis de Ambiente

Crie um arquivo `.env`:

```
PORT=3001
JWT_SECRET=seu-secret-super-seguro
NODE_ENV=development
```

## 📦 Deploy

### VPS (DigitalOcean, AWS, etc)

1. Faça upload dos arquivos
2. Instale dependências: `npm install`
3. Configure `.env` com secret seguro
4. Use PM2 para manter rodando:
   ```bash
   npm install -g pm2
   pm2 start server.js --name nfe-backend
   pm2 save
   ```

### Backup dos Bancos

Os arquivos `.db` são físicos, basta fazer backup regular:

```bash
# Backup manual
cp *.db /caminho/backup/

# Backup automático (cron)
0 2 * * * cp /caminho/backend/*.db /caminho/backup/$(date +\%Y\%m\%d)/
```