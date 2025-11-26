import React, { useEffect, useState, createElement } from 'react';
import { toast, Toaster } from 'sonner';
import { Header } from '../components/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DatabaseIcon, DownloadIcon, InfoIcon, ServerIcon, AlertCircleIcon } from 'lucide-react';
import { db } from '../utils/database';
import { useAuth } from '../context/AuthContext';
export function DatabaseInfo() {
  const {
    isSuperUser
  } = useAuth();
  const [companies, setCompanies] = useState<any[]>([]);
  useEffect(() => {
    if (isSuperUser) {
      loadCompanies();
    }
  }, [isSuperUser]);
  const loadCompanies = async () => {
    try {
      await db.initialize();
      const data = await db.getCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };
  const exportData = async () => {
    try {
      const allData: any = {
        empresas: await db.getCompanies(),
        usuarios: await db.getUsers()
      };
      for (const company of companies) {
        allData[`empresa_${company.id}`] = {
          clientes: await db.getClients(company.id),
          produtos: await db.getProducts(company.id),
          transportadoras: await db.getCarriers(company.id),
          nfes: await db.getNFes(company.id)
        };
      }
      const dataStr = JSON.stringify(allData, null, 2);
      const dataBlob = new Blob([dataStr], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nfe_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Erro ao exportar dados');
    }
  };
  if (!isSuperUser) {
    return <div className="flex-1 bg-gray-50">
        <Header title="Estrutura do Banco de Dados" />
        <main className="p-8">
          <Card className="p-12 text-center">
            <InfoIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Acesso Restrito
            </h3>
            <p className="text-gray-600">
              Apenas super usuários podem acessar informações do banco de dados
            </p>
          </Card>
        </main>
      </div>;
  }
  return <div className="flex-1 bg-gray-50">
      <Header title="Migração para SQLite3 Profissional" />

      <main className="p-8">
        <div className="mb-6">
          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircleIcon size={24} className="text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-2">
                  Migração Necessária: IndexedDB → SQLite3
                </h3>
                <p className="text-sm text-yellow-800 mb-2">
                  Atualmente o sistema usa IndexedDB (banco do navegador). Para
                  produção profissional com SQLite3 real, você precisa
                  implementar um backend Node.js que gerencia os arquivos .db
                  físicos.
                </p>
                <p className="text-sm text-yellow-800">
                  Abaixo está a arquitetura completa e código pronto para
                  implementação.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <ServerIcon size={24} className="text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Arquitetura Recomendada
            </h3>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">
                1. Backend API (Node.js + Express + SQLite3)
              </h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>
                  Gerencia arquivos SQLite físicos: principal.db, empresa_1.db,
                  empresa_2.db...
                </li>
                <li>API REST com endpoints para todas operações CRUD</li>
                <li>Autenticação JWT para segurança</li>
                <li>CORS configurado para frontend React</li>
              </ul>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">
                2. Frontend React (atual)
              </h4>
              <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                <li>Mantém toda UI/UX existente</li>
                <li>Substitui utils/database.ts por chamadas HTTP à API</li>
                <li>Adiciona gerenciamento de token JWT</li>
              </ul>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">
                3. Deploy em Produção
              </h4>
              <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
                <li>Backend: VPS (DigitalOcean, AWS EC2, Heroku)</li>
                <li>Frontend: Vercel, Netlify ou mesmo VPS</li>
                <li>Backups automáticos dos arquivos .db</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Estrutura dos Bancos SQLite3
          </h3>

          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold text-gray-900 mb-2">
                📁 principal.db
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Banco principal com empresas e usuários
              </p>
              <div className="bg-white p-3 rounded font-mono text-xs space-y-2">
                <div>
                  <p className="font-bold text-green-600">
                    CREATE TABLE empresas (
                  </p>
                  <p className="ml-4">id INTEGER PRIMARY KEY AUTOINCREMENT,</p>
                  <p className="ml-4">razao_social TEXT NOT NULL,</p>
                  <p className="ml-4">nome_fantasia TEXT,</p>
                  <p className="ml-4">cnpj TEXT UNIQUE NOT NULL,</p>
                  <p className="ml-4">ie TEXT,</p>
                  <p className="ml-4">endereco TEXT,</p>
                  <p className="ml-4">numero TEXT,</p>
                  <p className="ml-4">cidade TEXT,</p>
                  <p className="ml-4">estado TEXT,</p>
                  <p className="ml-4">cep TEXT,</p>
                  <p className="ml-4">telefone TEXT,</p>
                  <p className="ml-4">email TEXT,</p>
                  <p className="ml-4">
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                  </p>
                  <p className="font-bold text-green-600">);</p>
                </div>
                <div className="pt-2 border-t">
                  <p className="font-bold text-green-600">
                    CREATE TABLE usuarios (
                  </p>
                  <p className="ml-4">id INTEGER PRIMARY KEY AUTOINCREMENT,</p>
                  <p className="ml-4">nome TEXT NOT NULL,</p>
                  <p className="ml-4">email TEXT UNIQUE NOT NULL,</p>
                  <p className="ml-4">senha TEXT NOT NULL,</p>
                  <p className="ml-4">empresa_id INTEGER,</p>
                  <p className="ml-4">
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  </p>
                  <p className="ml-4">
                    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
                  </p>
                  <p className="font-bold text-green-600">);</p>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold text-gray-900 mb-2">
                📁 empresa_1.db, empresa_2.db...
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Um banco por empresa com dados isolados
              </p>
              <div className="bg-white p-3 rounded font-mono text-xs space-y-2">
                <div>
                  <p className="font-bold text-blue-600">
                    CREATE TABLE clientes (...)
                  </p>
                  <p className="font-bold text-blue-600">
                    CREATE TABLE produtos (...)
                  </p>
                  <p className="font-bold text-blue-600">
                    CREATE TABLE transportadoras (...)
                  </p>
                  <p className="font-bold text-blue-600">
                    CREATE TABLE nfes (...)
                  </p>
                  <p className="font-bold text-blue-600">
                    CREATE TABLE nfe_itens (...)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Código Backend Completo (Node.js + Express + SQLite3)
          </h3>

          <div className="space-y-4">
            <div className="p-4 bg-gray-900 rounded-lg overflow-x-auto">
              <p className="text-green-400 text-xs mb-2"> // package.json</p>
              <pre className="text-gray-100 text-xs">{`{
  "name": "nfe-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "better-sqlite3": "^9.2.2",
    "cors": "^2.8.5",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1"
  }
}`}</pre>
            </div>

            <div className="p-4 bg-gray-900 rounded-lg overflow-x-auto">
              <p className="text-green-400 text-xs mb-2"> // server.js</p>
              <pre className="text-gray-100 text-xs">{`const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-aqui';

app.use(cors());
app.use(express.json());

// Inicializar banco principal
const mainDb = new Database('./principal.db');

// Criar tabelas principais
mainDb.exec(\`
  CREATE TABLE IF NOT EXISTS empresas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT,
    cnpj TEXT UNIQUE NOT NULL,
    ie TEXT,
    endereco TEXT,
    numero TEXT,
    cidade TEXT,
    estado TEXT,
    cep TEXT,
    telefone TEXT,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    empresa_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
  );
\`);

// Criar usuário admin padrão
const adminExists = mainDb.prepare('SELECT * FROM usuarios WHERE email = ?').get('admin@nfe.com');
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  mainDb.prepare('INSERT INTO usuarios (nome, email, senha, empresa_id) VALUES (?, ?, ?, ?)')
    .run('Administrador', 'admin@nfe.com', hashedPassword, null);
}

// Função para obter DB da empresa
function getCompanyDb(companyId) {
  const db = new Database(\`./empresa_\${companyId}.db\`);
  
  db.exec(\`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo_documento TEXT NOT NULL,
      documento TEXT NOT NULL,
      razao_social TEXT NOT NULL,
      nome_fantasia TEXT,
      endereco TEXT,
      bairro TEXT,
      cidade TEXT,
      estado TEXT,
      cep TEXT,
      telefone TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE NOT NULL,
      descricao TEXT NOT NULL,
      unidade TEXT NOT NULL,
      valor_unitario REAL NOT NULL,
      ncm TEXT,
      cfop TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transportadoras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      razao_social TEXT NOT NULL,
      cnpj TEXT,
      ie TEXT,
      endereco TEXT,
      cidade TEXT,
      estado TEXT,
      telefone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS nfes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT NOT NULL,
      serie TEXT DEFAULT '1',
      cliente_id INTEGER NOT NULL,
      data_emissao DATETIME DEFAULT CURRENT_TIMESTAMP,
      natureza_operacao TEXT NOT NULL,
      cfop TEXT NOT NULL,
      valor_total REAL NOT NULL,
      status TEXT DEFAULT 'Autorizada',
      chave_acesso TEXT,
      xml_path TEXT,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    );

    CREATE TABLE IF NOT EXISTS nfe_itens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nfe_id INTEGER NOT NULL,
      produto_id INTEGER NOT NULL,
      descricao TEXT NOT NULL,
      quantidade REAL NOT NULL,
      valor_unitario REAL NOT NULL,
      valor_total REAL NOT NULL,
      FOREIGN KEY (nfe_id) REFERENCES nfes(id),
      FOREIGN KEY (produto_id) REFERENCES produtos(id)
    );
  \`);
  
  return db;
}

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
}

// ===== ROTAS DE AUTENTICAÇÃO =====
app.post('/api/auth/login', (req, res) => {
  const { email, senha } = req.body;
  const user = mainDb.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
  
  if (!user || !bcrypt.compareSync(senha, user.senha)) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, empresa_id: user.empresa_id },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  const { senha: _, ...userWithoutPassword } = user;
  res.json({ token, user: userWithoutPassword });
});

// ===== ROTAS DE EMPRESAS =====
app.get('/api/empresas', authenticateToken, (req, res) => {
  const empresas = mainDb.prepare('SELECT * FROM empresas ORDER BY id DESC').all();
  res.json(empresas);
});

app.post('/api/empresas', authenticateToken, (req, res) => {
  const result = mainDb.prepare(\`
    INSERT INTO empresas (razao_social, nome_fantasia, cnpj, ie, endereco, numero, cidade, estado, cep, telefone, email)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  \`).run(
    req.body.razao_social, req.body.nome_fantasia, req.body.cnpj, req.body.ie,
    req.body.endereco, req.body.numero, req.body.cidade, req.body.estado,
    req.body.cep, req.body.telefone, req.body.email
  );
  
  // Criar banco da empresa
  getCompanyDb(result.lastInsertRowid);
  
  res.json({ id: result.lastInsertRowid });
});

// ===== ROTAS DE CLIENTES =====
app.get('/api/empresas/:empresaId/clientes', authenticateToken, (req, res) => {
  const db = getCompanyDb(req.params.empresaId);
  const clientes = db.prepare('SELECT * FROM clientes ORDER BY id DESC').all();
  res.json(clientes);
});

app.post('/api/empresas/:empresaId/clientes', authenticateToken, (req, res) => {
  const db = getCompanyDb(req.params.empresaId);
  const result = db.prepare(\`
    INSERT INTO clientes (tipo_documento, documento, razao_social, nome_fantasia, endereco, bairro, cidade, estado, cep, telefone, email)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  \`).run(
    req.body.tipo_documento, req.body.documento, req.body.razao_social, req.body.nome_fantasia,
    req.body.endereco, req.body.bairro, req.body.cidade, req.body.estado,
    req.body.cep, req.body.telefone, req.body.email
  );
  res.json({ id: result.lastInsertRowid });
});

// ... Adicionar rotas similares para produtos, transportadoras, nfes ...

app.listen(PORT, () => {
  console.log(\`🚀 Backend NFe rodando na porta \${PORT}\`);
  console.log(\`📁 Bancos SQLite: principal.db + empresa_X.db\`);
});`}</pre>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Adaptação do Frontend (utils/database.ts)
          </h3>

          <div className="p-4 bg-gray-900 rounded-lg overflow-x-auto">
            <p className="text-green-400 text-xs mb-2">
              {' '}
              // utils/database.ts - Versão API REST
            </p>
            <pre className="text-gray-100 text-xs">{`const API_URL = 'http://localhost:5300/api';

class DatabaseService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('api_token', token);
  }

  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('api_token');
    }
    return this.token;
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();
    const headers: any = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = \`Bearer \${token}\`;
    }

    const response = await fetch(\`\${API_URL}\${endpoint}\`, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(\`API Error: \${response.statusText}\`);
    }

    return response.json();
  }

  async authenticateUser(email: string, senha: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha })
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data.user;
  }

  async getCompanies() {
    return this.request('/empresas');
  }

  async createCompany(company: any) {
    const data = await this.request('/empresas', {
      method: 'POST',
      body: JSON.stringify(company)
    });
    return data.id;
  }

  async getClients(companyId: number) {
    return this.request(\`/empresas/\${companyId}/clientes\`);
  }

  // ... Adicionar métodos para todas operações ...
}

export const db = new DatabaseService();`}</pre>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Passos para Implementação
          </h3>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                1
              </span>
              <div>
                <p className="font-medium text-gray-900">Criar pasta backend</p>
                <p className="text-sm text-gray-600">
                  Copie o código do server.js e package.json
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                2
              </span>
              <div>
                <p className="font-medium text-gray-900">
                  Instalar dependências
                </p>
                <p className="text-sm text-gray-600 font-mono">npm install</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                3
              </span>
              <div>
                <p className="font-medium text-gray-900">Iniciar backend</p>
                <p className="text-sm text-gray-600 font-mono">npm start</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                4
              </span>
              <div>
                <p className="font-medium text-gray-900">Adaptar frontend</p>
                <p className="text-sm text-gray-600">
                  Substituir utils/database.ts pela versão API REST
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                5
              </span>
              <div>
                <p className="font-medium text-gray-900">Testar localmente</p>
                <p className="text-sm text-gray-600">
                  Backend na porta 3001, frontend na porta 3000
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                6
              </span>
              <div>
                <p className="font-medium text-gray-900">Deploy em produção</p>
                <p className="text-sm text-gray-600">
                  Backend em VPS, frontend em Vercel/Netlify
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">
            ✅ Vantagens do SQLite3 Real
          </h4>
          <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
            <li>Arquivos .db físicos fáceis de fazer backup</li>
            <li>Pode usar ferramentas como DB Browser for SQLite</li>
            <li>Migração simples entre ambientes</li>
            <li>Performance superior para produção</li>
            <li>Isolamento real entre empresas (arquivos separados)</li>
          </ul>
        </div>
      </main>
    </div>;
}