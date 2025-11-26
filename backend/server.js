const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const MigrationSystem = require('./migrations');
const nfeService = require('./nfe_service');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 5300;
const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-aqui';

// ===== FUNÇÃO PARA GARANTIR CEP COMO STRING =====
function sanitizeCEP(cep) {
  if (!cep) return '';
  // Converter para string e garantir 8 dígitos
  const cepString = String(cep).replace(/\D/g, '');
  return cepString.padStart(8, '0');
}

// Middlewares
app.use(cors());
app.use(express.json());

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const empresaId = req.params.empresaId || 'temp';
    const uploadDir = path.join(__dirname, 'Arqs', `empresa_${empresaId}`);

    // Criar diretório se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, {
        recursive: true
      });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fieldName = file.fieldname;
    const ext = path.extname(file.originalname);
    if (fieldName === 'certificado') {
      cb(null, `certificado${ext}`);
    } else if (fieldName === 'logo') {
      cb(null, `logo${ext}`);
    } else {
      cb(null, `${fieldName}_${Date.now()}${ext}`);
    }
  }
});
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'certificado') {
      // Aceitar apenas .pfx ou .p12
      if (file.mimetype === 'application/x-pkcs12' || path.extname(file.originalname).toLowerCase() === '.pfx' || path.extname(file.originalname).toLowerCase() === '.p12') {
        cb(null, true);
      } else {
        cb(new Error('Apenas arquivos .pfx ou .p12 são permitidos para certificado'));
      }
    } else if (file.fieldname === 'logo') {
      // Aceitar apenas imagens
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Apenas arquivos de imagem são permitidos para logo'));
      }
    } else {
      cb(null, true);
    }
  }
});

// Middleware para capturar erros do multer e retornar JSON
function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  next();
}

// Inicializar sistema de migrações APENAS UMA VEZ
const migrations = new MigrationSystem();

// Cache de conexões de banco por empresa
const companyDbCache = new Map();

// ===== INICIALIZAR BANCO PRINCIPAL =====
const mainDb = new Database('./principal.db');

// Criar tabelas principais
mainDb.exec(`
  CREATE TABLE IF NOT EXISTS empresas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT,
    cnpj TEXT UNIQUE NOT NULL,
    ie TEXT,
    im TEXT,
    cnae TEXT,
    crt TEXT DEFAULT '1',
    endereco TEXT,
    numero TEXT,
    complemento TEXT,
    bairro TEXT,
    cidade TEXT,
    estado TEXT,
    cep TEXT,
    codigo_municipio TEXT,
    telefone TEXT,
    email TEXT,
    logo_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    empresa_id INTEGER,
    tipo TEXT DEFAULT 'usuario',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
  );
`);

// Executar migrações (isso criará a tabela configuracoes com estrutura correta)
console.log('🔄 Executando migrações iniciais...');
migrations.runMainDbMigrations(mainDb);
migrations.runAllCompanyMigrations();
console.log('✅ Migrações concluídas');

// Criar/Resetar usuário admin padrão
const adminExists = mainDb.prepare('SELECT * FROM usuarios WHERE email = ?').get('admin@nfe.com');
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  mainDb.prepare('INSERT INTO usuarios (nome, email, senha, empresa_id, tipo) VALUES (?, ?, ?, ?, ?)').run('Administrador', 'admin@nfe.com', hashedPassword, null, 'super');
  console.log('✅ Usuário admin criado: admin@nfe.com / admin123');
}

// ===== FUNÇÃO OTIMIZADA PARA OBTER DB DA EMPRESA =====
function getCompanyDb(companyId) {
  if (companyDbCache.has(companyId)) {
    return companyDbCache.get(companyId);
  }
  const db = new Database(`./empresa_${companyId}.db`);
  db.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo_documento TEXT NOT NULL,
      documento TEXT NOT NULL,
      razao_social TEXT NOT NULL,
      nome_fantasia TEXT,
      ie TEXT,
      endereco TEXT,
      numero TEXT,
      complemento TEXT,
      bairro TEXT,
      cidade TEXT,
      uf TEXT,
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
  `);
  companyDbCache.set(companyId, db);
  return db;
}

// ===== MIDDLEWARE DE AUTENTICAÇÃO =====
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      error: 'Token não fornecido'
    });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        error: 'Token inválido'
      });
    }
    req.user = user;
    next();
  });
}

// ===== ROTAS DE AUTENTICAÇÃO =====
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, senha } = req.body;
    
    // Buscar usuário
    const user = mainDb.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar se usuário está ativo
    if (user.ativo === 0) {
      return res.status(403).json({ error: 'Usuário inativo. Entre em contato com o administrador.' });
    }

    // Verificar senha
    if (!bcrypt.compareSync(senha, user.senha)) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar se empresa está ativa (se não for super usuário)
    if (user.empresa_id) {
      const empresa = mainDb.prepare('SELECT ativo FROM empresas WHERE id = ?').get(user.empresa_id);
      if (empresa && empresa.ativo === 0) {
        return res.status(403).json({ error: 'Empresa inativa. Entre em contato com o suporte.' });
      }
    }

    // Garantir que tipo está definido
    const userTipo = user.tipo || (user.empresa_id === null ? 'super' : 'usuario');

    // Atualizar tipo se estiver vazio
    if (!user.tipo) {
      mainDb.prepare('UPDATE usuarios SET tipo = ? WHERE id = ?').run(userTipo, user.id);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, empresa_id: user.empresa_id, tipo: userTipo },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { senha: _, ...userWithoutPassword } = user;
    userWithoutPassword.tipo = userTipo;
    
    console.log(`✅ Login bem-sucedido: ${user.email} (${userTipo})`);
    
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== NOVAS ROTAS DE UPLOAD =====

// Upload de certificado digital
app.post('/api/empresas/:empresaId/upload/certificado', authenticateToken, upload.single('certificado'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado'
      });
    }
    const certificadoPath = `Arqs/empresa_${req.params.empresaId}/certificado${path.extname(req.file.originalname)}`;
    console.log(`📤 Certificado enviado para empresa ${req.params.empresaId}`);
    console.log(`📁 Salvo em: ${certificadoPath}`);

    // Atualizar caminho nas configurações DA EMPRESA
    const db = getCompanyDb(req.params.empresaId);
    try {
      db.prepare(`
        UPDATE configuracoes 
        SET certificado_path = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `).run(certificadoPath);
      console.log(`✅ Caminho atualizado no banco da empresa ${req.params.empresaId}`);
    } catch (error) {
      console.log('⚠️  Erro ao atualizar caminho, mas arquivo foi salvo:', error.message);
    }
    res.json({
      success: true,
      message: 'Certificado enviado com sucesso',
      path: certificadoPath,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('❌ Erro ao fazer upload do certificado:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Upload de logo da empresa
app.post('/api/empresas/:empresaId/upload/logo', authenticateToken, upload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado'
      });
    }
    const logoPath = `Arqs/empresa_${req.params.empresaId}/logo${path.extname(req.file.originalname)}`;
    console.log(`📤 Logo enviado para empresa ${req.params.empresaId}`);
    console.log(`📁 Salvo em: ${logoPath}`);

    // Atualizar caminho do logo na tabela empresas
    mainDb.prepare(`
      UPDATE empresas 
      SET logo_path = ?
      WHERE id = ?
    `).run(logoPath, req.params.empresaId);
    res.json({
      success: true,
      message: 'Logo enviado com sucesso',
      path: logoPath,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('❌ Erro ao fazer upload do logo:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Servir arquivos estáticos da pasta Arqs
app.use('/arqs', express.static(path.join(__dirname, 'Arqs')));

// ===== MIDDLEWARE GLOBAL DE ERRO (DEVE VIR ANTES DAS ROTAS) =====
app.use((err, req, res, next) => {
  console.error('❌ Erro capturado pelo middleware global:', err);

  // Se for erro do multer
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      error: err.message,
      code: err.code
    });
  }

  // Se for erro customizado com mensagem
  if (err.message) {
    return res.status(err.status || 500).json({
      success: false,
      error: err.message
    });
  }

  // Erro genérico
  return res.status(500).json({
    success: false,
    error: 'Erro interno do servidor'
  });
});

// ===== NOVA ROTA: TRANSMITIR NFE PARA SEFAZ =====
app.post('/api/empresas/:empresaId/nfes/:id/transmitir', authenticateToken, async (req, res) => {
  try {
    const db = getCompanyDb(req.params.empresaId);

    // Buscar NFe completa
    const nfe = db.prepare('SELECT * FROM nfes WHERE id = ?').get(req.params.id);
    if (!nfe) {
      return res.status(404).json({
        error: 'NFe não encontrada'
      });
    }

    // Buscar emitente
    const emitente = mainDb.prepare('SELECT * FROM empresas WHERE id = ?').get(req.params.empresaId);

    // Buscar destinatário
    const destinatario = db.prepare('SELECT * FROM clientes WHERE id = ?').get(nfe.cliente_id);

    // Buscar itens
    const items = db.prepare('SELECT * FROM nfe_itens WHERE nfe_id = ?').all(req.params.id);

    // Gerar XML e chave
    const {
      xml,
      chave
    } = nfeService.gerarXML(nfe, emitente, destinatario, items);

    // Assinar XML (PASSAR empresaId) - AWAIT pois agora é async
    const xmlAssinado = await nfeService.assinarXML(xml, req.params.empresaId);

    // Tentar enviar para SEFAZ (COM VALIDAÇÃO INTEGRADA)
    const resultado = await nfeService.enviarNFe(xmlAssinado, emitente.estado, req.params.empresaId);

    // Verificar se houve erro de validação
    if (resultado.modo === 'validacao') {
      return res.status(400).json({
        success: false,
        modo: 'validacao',
        mensagem: 'NFe com erros de validação',
        erros: resultado.erros,
        avisos: resultado.avisos,
        totalErros: resultado.erros.length,
        totalAvisos: resultado.avisos.length
      });
    }
    let statusSefaz = 'Processando';
    let mensagemSefaz = '';
    let modoOffline = false;
    let protocolo = null;
    let retorno = null;
    if (!resultado.online) {
      // Modo offline
      statusSefaz = 'Pendente';
      mensagemSefaz = resultado.mensagem;
      modoOffline = true;
      console.log('📝 NFe salva em modo offline');
    } else {
      // Processar resposta da SEFAZ
      retorno = resultado.data['soap:Envelope']?.['soap:Body']?.nfeResultMsg?.retEnviNFe;
      if (retorno) {
        const cStat = retorno.cStat;
        const xMotivo = retorno.xMotivo;
        console.log(`📊 Resposta SEFAZ - cStat: ${cStat}, xMotivo: ${xMotivo}`);

        // Verificar se lote foi processado
        if (cStat === 104 || cStat === '104') {
          // Lote processado, verificar protocolo
          const protNFe = retorno.protNFe?.infProt;
          if (protNFe) {
            const cStatNFe = protNFe.cStat;
            const xMotivoNFe = protNFe.xMotivo;
            console.log(`📋 Protocolo NFe - cStat: ${cStatNFe}, xMotivo: ${xMotivoNFe}`);
            if (cStatNFe === 100 || cStatNFe === '100') {
              // NFe AUTORIZADA!
              statusSefaz = 'Autorizada';
              mensagemSefaz = 'NFe autorizada com sucesso';
              protocolo = protNFe.nProt;
              console.log('✅ NFe AUTORIZADA! Protocolo:', protocolo);
            } else {
              // NFe REJEITADA
              statusSefaz = 'Rejeitada';
              mensagemSefaz = `Rejeição ${cStatNFe}: ${xMotivoNFe}`;
              console.log(`❌ NFe REJEITADA: ${mensagemSefaz}`);
            }
          } else {
            statusSefaz = 'Erro';
            mensagemSefaz = 'Erro ao processar resposta da SEFAZ';
          }
        } else {
          // Lote rejeitado
          statusSefaz = 'Rejeitada';
          mensagemSefaz = `${cStat}: ${xMotivo}`;
          console.log(`❌ Lote rejeitado: ${mensagemSefaz}`);
        }
      } else {
        statusSefaz = 'Erro';
        mensagemSefaz = 'Resposta inválida da SEFAZ';
      }
    }

    // Salvar arquivos
    const paths = nfeService.salvarArquivos(req.params.empresaId, nfe.numero, xmlAssinado, chave, modoOffline || statusSefaz === 'Rejeitada');

    // Atualizar NFe no banco
    db.prepare(`
      UPDATE nfes 
      SET status = ?, chave_acesso = ?, xml_path = ?
      WHERE id = ?
    `).run(statusSefaz, chave, paths.xmlPath, req.params.id);
    res.json({
      success: statusSefaz === 'Autorizada',
      status: statusSefaz,
      mensagem: mensagemSefaz,
      chave: chave,
      protocolo: protocolo || 'N/A',
      xmlPath: paths.xmlPath,
      logPath: paths.logPath,
      modoOffline: modoOffline,
      cStat: statusSefaz === 'Autorizada' ? '100' : retorno?.protNFe?.infProt?.cStat || '999',
      dhRecbto: retorno?.dhRecbto,
      detalhes: resultado.data
    });
  } catch (error) {
    console.error('❌ Erro na transmissão:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao transmitir NFe',
      details: error.message
    });
  }
});

// ===== NOVA ROTA: ABORTAR PROCESSAMENTO DE NFE =====
app.post('/api/empresas/:empresaId/nfes/:id/abortar', authenticateToken, async (req, res) => {
  try {
    const db = getCompanyDb(req.params.empresaId);

    // Buscar NFe
    const nfe = db.prepare('SELECT * FROM nfes WHERE id = ?').get(req.params.id);
    if (!nfe) {
      return res.status(404).json({
        error: 'NFe não encontrada'
      });
    }

    // Verificar se está em processamento
    if (nfe.status !== 'Processando') {
      return res.status(400).json({
        error: 'Apenas NFes em processamento podem ser abortadas',
        status: nfe.status
      });
    }

    // Atualizar status para Rejeitada
    db.prepare(`
      UPDATE nfes 
      SET status = 'Rejeitada'
      WHERE id = ?
    `).run(req.params.id);
    console.log(`⚠️  NFe #${nfe.numero} - Processamento abortado pelo usuário`);
    res.json({
      success: true,
      message: 'Processamento abortado com sucesso',
      novoStatus: 'Rejeitada'
    });
  } catch (error) {
    console.error('❌ Erro ao abortar NFe:', error);
    res.status(500).json({
      error: 'Erro ao abortar processamento',
      details: error.message
    });
  }
});

// ===== NOVA ROTA: CONSULTAR STATUS SEFAZ =====
app.get('/api/sefaz/status/:uf?', authenticateToken, async (req, res) => {
  try {
    const uf = req.params.uf || 'SP';
    // Pegar empresaId do usuário logado ou usar 1 como padrão
    const empresaId = req.user.empresa_id || 1;
    console.log(`🔍 Consultando status SEFAZ para empresa ${empresaId}`);
    const status = await nfeService.consultarStatus(uf, empresaId);
    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao consultar status',
      details: error.message
    });
  }
});

// ===== ROTAS DE EMPRESAS =====
app.get('/api/empresas', authenticateToken, (req, res) => {
  try {
    const empresas = mainDb.prepare('SELECT * FROM empresas ORDER BY id DESC').all();
    res.json(empresas);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
app.get('/api/empresas/:id', authenticateToken, (req, res) => {
  try {
    const empresa = mainDb.prepare('SELECT * FROM empresas WHERE id = ?').get(req.params.id);
    if (!empresa) {
      return res.status(404).json({
        error: 'Empresa não encontrada'
      });
    }
    res.json(empresa);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// ===== NOVA ROTA: BUSCAR DADOS DE CNPJ (PROXY PARA RECEITAWS) =====
app.get('/api/cnpj/:cnpj/dados', async (req, res) => {
  try {
    const cnpj = req.params.cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14) {
      return res.status(400).json({
        error: 'CNPJ deve ter 14 dígitos'
      });
    }
    console.log(`🔍 Buscando dados do CNPJ: ${cnpj}`);

    // Fetch from ReceitaWS API using axios
    const response = await axios.get(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'NFe System/1.0'
      }
    });
    const data = response.data;
    if (data.status === 'ERROR') {
      console.log(`❌ ReceitaWS retornou erro: ${data.message}`);
      return res.status(404).json({
        error: data.message || 'CNPJ não encontrado'
      });
    }
    console.log(`✅ Dados encontrados para: ${data.nome}`);
    res.json(data);
  } catch (error) {
    console.error('❌ Erro ao buscar CNPJ:', error.message);
    if (error.response?.status === 429) {
      return res.status(429).json({
        error: 'Limite de requisições atingido. Tente novamente em alguns minutos.'
      });
    }
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return res.status(504).json({
        error: 'Tempo esgotado ao buscar dados. Tente novamente.'
      });
    }
    res.status(500).json({
      error: 'Erro ao buscar dados do CNPJ. Preencha manualmente.',
      details: error.message
    });
  }
});

// ===== NOVA ROTA: BUSCAR EMPRESA POR CNPJ (SEM AUTENTICAÇÃO) =====
app.get('/api/empresas/cnpj/:cnpj', (req, res) => {
  try {
    const cnpj = req.params.cnpj.replace(/\D/g, '');
    const empresa = mainDb.prepare('SELECT * FROM empresas WHERE cnpj = ?').get(cnpj);
    if (!empresa) {
      return res.status(404).json({
        error: 'Empresa não encontrada'
      });
    }
    res.json(empresa);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// ===== NOVA ROTA: BUSCAR USUÁRIOS DE UMA EMPRESA (SEM AUTENTICAÇÃO) =====
app.get('/api/empresas/:id/usuarios', (req, res) => {
  try {
    const usuarios = mainDb.prepare('SELECT id, nome, email, tipo, created_at FROM usuarios WHERE empresa_id = ?').all(req.params.id);
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
app.post('/api/empresas', (req, res) => {
  try {
    // SANITIZAR CEP ANTES DE SALVAR
    const cepSanitizado = sanitizeCEP(req.body.cep);
    const result = mainDb.prepare(`
      INSERT INTO empresas (razao_social, nome_fantasia, cnpj, ie, im, cnae, crt, endereco, numero, complemento, bairro, cidade, estado, cep, codigo_municipio, telefone, email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.body.razao_social, req.body.nome_fantasia, req.body.cnpj, req.body.ie, req.body.im || null, req.body.cnae || null, req.body.crt || '1', req.body.endereco, req.body.numero, req.body.complemento || null, req.body.bairro, req.body.cidade, req.body.estado, cepSanitizado, req.body.codigo_municipio || null, req.body.telefone || null, req.body.email || null);

    // Criar banco da empresa
    getCompanyDb(result.lastInsertRowid);
    res.json({
      id: result.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
app.put('/api/empresas/:empresaId/plano', authenticateToken, (req, res) => {
  try {
    const { plano_id } = req.body;
    
    if (!plano_id) {
      return res.status(400).json({ error: 'plano_id é obrigatório' });
    }

    // Verificar se plano existe
    const novoPlano = mainDb.prepare('SELECT * FROM planos WHERE id = ?').get(plano_id);
    if (!novoPlano) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }

    // Buscar empresa e plano atual
    const empresa = mainDb.prepare(`
      SELECT e.*, p.preco_mensal as preco_atual, p.nome as plano_atual_nome
      FROM empresas e
      LEFT JOIN planos p ON e.plano_id = p.id
      WHERE e.id = ?
    `).get(req.params.empresaId);
    
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    // IMPEDIR DOWNGRADE
    if (empresa.preco_atual && novoPlano.preco_mensal < empresa.preco_atual) {
      return res.status(400).json({ 
        error: 'Downgrade não permitido',
        mensagem: `Não é possível fazer downgrade do plano ${empresa.plano_atual_nome} para ${novoPlano.nome}. Entre em contato com o suporte.`,
        planoAtual: empresa.plano_atual_nome,
        planoSolicitado: novoPlano.nome
      });
    }

    const hoje = new Date();
    const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

    // DELETAR faturas pendentes do mês atual antes de criar nova
    const deletedCount = mainDb.prepare(`
      DELETE FROM faturas 
      WHERE empresa_id = ? 
        AND mes_referencia = ? 
        AND status = 'pendente'
    `).run(req.params.empresaId, mesAtual);

    if (deletedCount.changes > 0) {
      console.log(`🗑️  ${deletedCount.changes} fatura(s) pendente(s) do mês atual deletada(s)`);
    }

    // Atualizar plano da empresa
    mainDb.prepare('UPDATE empresas SET plano_id = ? WHERE id = ?')
      .run(plano_id, req.params.empresaId);

    console.log(`✅ Empresa ${req.params.empresaId} atualizada para plano ${novoPlano.nome}`);

    // Gerar nova fatura se o plano não for gratuito
    let fatura = null;
    if (novoPlano.preco_mensal > 0) {
      const dataVencimento = new Date();
      dataVencimento.setDate(dataVencimento.getDate() + 10);
      const dataVencimentoStr = dataVencimento.toISOString().split('T')[0];

      const result = mainDb.prepare(`
        INSERT INTO faturas (empresa_id, plano_id, valor, mes_referencia, data_vencimento, status)
        VALUES (?, ?, ?, ?, ?, 'pendente')
      `).run(req.params.empresaId, plano_id, novoPlano.preco_mensal, mesAtual, dataVencimentoStr);

      fatura = {
        id: result.lastInsertRowid,
        valor: novoPlano.preco_mensal,
        data_vencimento: dataVencimentoStr
      };

      console.log(`💰 Nova fatura #${fatura.id} gerada: R$ ${novoPlano.preco_mensal} - Vencimento: ${dataVencimentoStr}`);
    }

    res.json({ 
      success: true, 
      plano: novoPlano.nome,
      fatura: fatura,
      faturasDeletadas: deletedCount.changes
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar plano:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/empresas/:id', authenticateToken, (req, res) => {
  try {
    // Apenas super usuário pode excluir
    if (req.user.tipo !== 'super') {
      return res.status(403).json({ error: 'Apenas super usuários podem excluir empresas' });
    }

    const empresaId = req.params.id;
    
    // Buscar empresa
    const empresa = mainDb.prepare('SELECT * FROM empresas WHERE id = ?').get(empresaId);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    console.log(`🗑️  Iniciando exclusão da empresa ${empresaId}: ${empresa.razao_social}`);

    // 1. Deletar usuários da empresa
    const usuariosDeletados = mainDb.prepare('DELETE FROM usuarios WHERE empresa_id = ?').run(empresaId);
    console.log(`   ✅ ${usuariosDeletados.changes} usuário(s) deletado(s)`);

    // 2. Deletar faturas da empresa
    const faturasDeletadas = mainDb.prepare('DELETE FROM faturas WHERE empresa_id = ?').run(empresaId);
    console.log(`   ✅ ${faturasDeletadas.changes} fatura(s) deletada(s)`);

    // 3. Deletar banco de dados da empresa
    const fs = require('fs');
    const dbPath = `./empresa_${empresaId}.db`;
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log(`   ✅ Banco de dados deletado: ${dbPath}`);
    }

    // 4. Deletar pasta de arquivos da empresa
    const arqsPath = `./Arqs/empresa_${empresaId}`;
    if (fs.existsSync(arqsPath)) {
      fs.rmSync(arqsPath, { recursive: true, force: true });
      console.log(`   ✅ Pasta de arquivos deletada: ${arqsPath}`);
    }

    // 5. Remover do cache
    if (companyDbCache.has(empresaId)) {
      companyDbCache.get(empresaId).close();
      companyDbCache.delete(empresaId);
      console.log(`   ✅ Cache removido`);
    }

    // 6. Deletar empresa
    mainDb.prepare('DELETE FROM empresas WHERE id = ?').run(empresaId);
    console.log(`   ✅ Empresa deletada do banco principal`);

    console.log(`✅ Empresa ${empresa.razao_social} excluída completamente`);

    res.json({ 
      success: true, 
      message: 'Empresa excluída com sucesso',
      empresa: empresa.razao_social,
      deletados: {
        usuarios: usuariosDeletados.changes,
        faturas: faturasDeletadas.changes
      }
    });
  } catch (error) {
    console.error('❌ Erro ao excluir empresa:', error);
    res.status(500).json({ error: error.message });
  }
});



// ===== ROTAS DE USUÁRIOS =====
app.get('/api/usuarios', authenticateToken, (req, res) => {
  try {
    const usuarios = mainDb.prepare('SELECT id, nome, email, empresa_id, tipo, created_at FROM usuarios ORDER BY id DESC').all();
    const usuariosComTipo = usuarios.map(u => ({
      ...u,
      tipo: u.tipo || (u.empresa_id === null ? 'super' : 'usuario')
    }));
    res.json(usuariosComTipo);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
app.post('/api/usuarios', (req, res) => {
  try {
    const hashedPassword = bcrypt.hashSync(req.body.senha, 10);
    const tipo = req.body.tipo || 'usuario';
    const ativo = req.body.ativo !== undefined ? req.body.ativo : 1;
    const result = mainDb.prepare(`
      INSERT INTO usuarios (nome, email, senha, empresa_id, tipo, ativo)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.body.nome, req.body.email, hashedPassword, req.body.empresa_id, tipo, ativo);
    res.json({
      id: result.lastInsertRowid
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({
        error: 'Este e-mail já está cadastrado'
      });
    } else {
      res.status(500).json({
        error: error.message
      });
    }
  }
});
app.put('/api/usuarios/:id', authenticateToken, (req, res) => {
  try {
    if (req.body.senha) {
      const hashedPassword = bcrypt.hashSync(req.body.senha, 10);
      mainDb.prepare(`
        UPDATE usuarios 
        SET nome = ?, email = ?, senha = ?, empresa_id = ?, tipo = ?
        WHERE id = ?
      `).run(req.body.nome, req.body.email, hashedPassword, req.body.empresa_id, req.body.tipo || 'usuario', req.params.id);
    } else {
      mainDb.prepare(`
        UPDATE usuarios 
        SET nome = ?, email = ?, empresa_id = ?, tipo = ?
        WHERE id = ?
      `).run(req.body.nome, req.body.email, req.body.empresa_id, req.body.tipo || 'usuario', req.params.id);
    }
    res.json({
      success: true
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// ===== ROTAS DE NCM (COM BUSCA) =====
app.get('/api/ncm/search', authenticateToken, (req, res) => {
  try {
    const q = req.query.q || '';
    const limit = parseInt(req.query.limit) || 50;
    const ncms = mainDb.prepare(`
      SELECT * FROM tbNCM 
      WHERE CAST(id AS TEXT) = ? 
         OR CAST(id AS TEXT) LIKE ? 
         OR LOWER(descricao) LIKE LOWER(?) 
         OR LOWER(categoria) LIKE LOWER(?)
      ORDER BY 
        CASE 
          WHEN CAST(id AS TEXT) = ? THEN 0
          WHEN CAST(id AS TEXT) LIKE ? THEN 1
          ELSE 2
        END,
        descricao 
      LIMIT ?
    `).all(q, `${q}%`, `%${q}%`, `%${q}%`, q, `${q}%`, limit);
    res.json(ncms);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// ===== ROTAS DE CFOP (COM BUSCA) =====
app.get('/api/cfop/search', authenticateToken, (req, res) => {
  try {
    const q = req.query.q || '';
    const limit = parseInt(req.query.limit) || 50;
    const cfops = mainDb.prepare(`
      SELECT * FROM tbCFOP 
      WHERE CAST(id AS TEXT) = ? 
         OR CAST(id AS TEXT) LIKE ? 
         OR LOWER(texto) LIKE LOWER(?) 
         OR LOWER(descricao) LIKE LOWER(?)
      ORDER BY 
        CASE 
          WHEN CAST(id AS TEXT) = ? THEN 0
          WHEN CAST(id AS TEXT) LIKE ? THEN 1
          ELSE 2
        END,
        id 
      LIMIT ?
    `).all(q, `${q}%`, `%${q}%`, `%${q}%`, q, `${q}%`, limit);
    res.json(cfops);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// ===== ROTAS DE TRANSPORTADORAS =====
app.get('/api/empresas/:empresaId/transportadoras/search', authenticateToken, (req, res) => {
  try {
    const db = getCompanyDb(req.params.empresaId);
    const q = req.query.q || '';
    const limit = parseInt(req.query.limit) || 50;
    const transportadoras = db.prepare(`
      SELECT * FROM transportadoras 
      WHERE razao_social LIKE ? OR cnpj LIKE ? OR cidade LIKE ?
      ORDER BY razao_social 
      LIMIT ?
    `).all(`%${q}%`, `%${q}%`, `%${q}%`, limit);
    res.json(transportadoras);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
app.get('/api/empresas/:empresaId/transportadoras', authenticateToken, (req, res) => {
  try {
    const db = getCompanyDb(req.params.empresaId);
    const transportadoras = db.prepare('SELECT * FROM transportadoras ORDER BY id DESC').all();
    res.json(transportadoras);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
app.post('/api/empresas/:empresaId/transportadoras', authenticateToken, (req, res) => {
  try {
    const db = getCompanyDb(req.params.empresaId);

    // SANITIZAR CEP ANTES DE SALVAR
    const cepSanitizado = sanitizeCEP(req.body.cep);
    const result = db.prepare(`
      INSERT INTO transportadoras (razao_social, cnpj, ie, endereco, numero, complemento, bairro, cidade, uf, cep, telefone, email, nome_motorista, placa_veiculo, uf_veiculo, rntc, observacoes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.body.razao_social, req.body.cnpj, req.body.ie, req.body.endereco, req.body.numero, req.body.complemento, req.body.bairro, req.body.cidade, req.body.uf, cepSanitizado, req.body.telefone, req.body.email, req.body.nome_motorista, req.body.placa_veiculo, req.body.uf_veiculo, req.body.rntc, req.body.observacoes);
    res.json({
      id: result.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
app.put('/api/empresas/:empresaId/transportadoras/:id', authenticateToken, (req, res) => {
  try {
    const db = getCompanyDb(req.params.empresaId);

    // SANITIZAR CEP ANTES DE SALVAR
    const cepSanitizado = sanitizeCEP(req.body.cep);
    db.prepare(`
      UPDATE transportadoras 
      SET razao_social = ?, cnpj = ?, ie = ?, endereco = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, uf = ?, cep = ?, telefone = ?, email = ?, nome_motorista = ?, placa_veiculo = ?, uf_veiculo = ?, rntc = ?, observacoes = ?
      WHERE id = ?
    `).run(req.body.razao_social, req.body.cnpj, req.body.ie, req.body.endereco, req.body.numero, req.body.complemento, req.body.bairro, req.body.cidade, req.body.uf, cepSanitizado, req.body.telefone, req.body.email, req.body.nome_motorista, req.body.placa_veiculo, req.body.uf_veiculo, req.body.rntc, req.body.observacoes, req.params.id);
    res.json({
      success: true
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// ===== ROTAS DE CLIENTES =====
app.get('/api/empresas/:empresaId/clientes/search', authenticateToken, (req, res) => {
  try {
    const db = getCompanyDb(req.params.empresaId);
    const q = req.query.q || '';
    const limit = parseInt(req.query.limit) || 50;
    const clientes = db.prepare(`
      SELECT * FROM clientes 
      WHERE razao_social LIKE ? OR documento LIKE ? OR CAST(id AS TEXT) LIKE ?
      ORDER BY razao_social 
      LIMIT ?
    `).all(`%${q}%`, `%${q}%`, `%${q}%`, limit);
    res.json(clientes);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
app.get('/api/empresas/:empresaId/clientes', authenticateToken, (req, res) => {
  try {
    const db = getCompanyDb(req.params.empresaId);
    const clientes = db.prepare('SELECT * FROM clientes ORDER BY id DESC').all();
    res.json(clientes);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
app.post('/api/empresas/:empresaId/clientes', authenticateToken, (req, res) => {
  try {
    const db = getCompanyDb(req.params.empresaId);

    // SANITIZAR CEP ANTES DE SALVAR
    const cepSanitizado = sanitizeCEP(req.body.cep);
    const result = db.prepare(`
      INSERT INTO clientes (tipo_documento, documento, razao_social, nome_fantasia, ie, endereco, numero, complemento, bairro, cidade, uf, cep, telefone, email, transportadora_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.body.tipo_documento, req.body.documento, req.body.razao_social, req.body.nome_fantasia, req.body.ie, req.body.endereco, req.body.numero, req.body.complemento, req.body.bairro, req.body.cidade, req.body.uf, cepSanitizado, req.body.telefone, req.body.email, req.body.transportadora_id);
    res.json({
      id: result.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
app.put('/api/empresas/:empresaId/clientes/:id', authenticateToken, (req, res) => {
  try {
    const db = getCompanyDb(req.params.empresaId);

    // SANITIZAR CEP ANTES DE SALVAR
    const cepSanitizado = sanitizeCEP(req.body.cep);
    db.prepare(`
      UPDATE clientes 
      SET tipo_documento = ?, documento = ?, razao_social = ?, nome_fantasia = ?, ie = ?,
          endereco = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, uf = ?, cep = ?, telefone = ?, email = ?, transportadora_id = ?
      WHERE id = ?
    `).run(req.body.tipo_documento, req.body.documento, req.body.razao_social, req.body.nome_fantasia, req.body.ie, req.body.endereco, req.body.numero, req.body.complemento, req.body.bairro, req.body.cidade, req.body.uf, cepSanitizado, req.body.telefone, req.body.email, req.body.transportadora_id, req.params.id);
    res.json({
      success: true
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// ===== ROTAS DE ENDEREÇOS DE ENTREGA =====
app.get('/api/empresas/:empresaId/clientes/:clienteId/enderecos', authenticateToken, (req, res) => {
  try {
    const db = getCompanyDb(req.params.empresaId);
    const enderecos = db.prepare('SELECT * FROM enderecos_entrega WHERE cliente_id = ? ORDER BY padrao DESC, id DESC').all(req.params.clienteId);
    res.json(enderecos);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
app.post('/api/empresas/:empresaId/clientes/:clienteId/enderecos', authenticateToken, (req, res) => {
  try {
    const db = getCompanyDb(req.params.empresaId);
    if (req.body.padrao) {
      db.prepare('UPDATE enderecos_entrega SET padrao = 0 WHERE cliente_id = ?').run(req.params.clienteId);
    }

    // SANITIZAR CEP ANTES DE SALVAR
    const cepSanitizado = sanitizeCEP(req.body.cep);
    const result = db.prepare(`
      INSERT INTO enderecos_entrega (cliente_id, nome, cnpj_filial, ie, endereco, numero, complemento, bairro, cidade, uf, cep, telefone, contato, transportadora_id, padrao)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.params.clienteId, req.body.nome, req.body.cnpj_filial, req.body.ie, req.body.endereco, req.body.numero, req.body.complemento, req.body.bairro, req.body.cidade, req.body.uf, cepSanitizado, req.body.telefone, req.body.contato, req.body.transportadora_id, req.body.padrao ? 1 : 0);
    res.json({
      id: result.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
app.put('/api/empresas/:empresaId/clientes/:clienteId/enderecos/:id', authenticateToken, (req, res) => {
  try {
    const db = getCompanyDb(req.params.empresaId);
    if (req.body.padrao) {
      db.prepare('UPDATE enderecos_entrega SET padrao = 0 WHERE cliente_id = ?').run(req.params.clienteId);
    }

    // SANITIZAR CEP ANTES DE SALVAR
    const cepSanitizado = sanitizeCEP(req.body.cep);
    db.prepare(`
      UPDATE enderecos_entrega 
      SET nome = ?, cnpj_filial = ?, ie = ?, endereco = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, uf = ?, cep = ?, telefone = ?, contato = ?, transportadora_id = ?, padrao = ?
      WHERE id = ?
    `).run(req.body.nome, req.body.cnpj_filial, req.body.ie, req.body.endereco, req.body.numero, req.body.complemento, req.body.bairro, req.body.cidade, req.body.uf, cepSanitizado, req.body.telefone, req.body.contato, req.body.transportadora_id, req.body.padrao ? 1 : 0, req.params.id);
    res.json({
      success: true
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// ===== ROTAS DE PRODUTOS =====
app.get('/api/empresas/:empresaId/produtos/search', authenticateToken, (req, res) => {
  try {
    const db = getCompanyDb(req.params.empresaId);
    const q = req.query.q || '';
    const limit = parseInt(req.query.limit) || 50;
    const produtos = db.prepare(`
      SELECT * FROM produtos 
      WHERE descricao LIKE ? OR codigo LIKE ?
      ORDER BY descricao 
      LIMIT ?
    `).all(`%${q}%`, `%${q}%`, limit);
    res.json(produtos);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
app.get('/api/empresas/:empresaId/produtos', authenticateToken, (req, res) => {
  try {
    const db = getCompanyDb(req.params.empresaId);
    const produtos = db.prepare('SELECT * FROM produtos ORDER BY id DESC').all();
    res.json(produtos);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
app.post('/api/empresas/:empresaId/produtos', authenticateToken, (req, res) => {
  try {
    const db = getCompanyDb(req.params.empresaId);
    const result = db.prepare(`
      INSERT INTO produtos (codigo, descricao, unidade, valor_unitario, ncm, cfop, ncm_id, cfop_id, aliquota_icms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.body.codigo, req.body.descricao, req.body.unidade, req.body.valor_unitario, req.body.ncm, req.body.cfop, req.body.ncm_id, req.body.cfop_id, req.body.aliquota_icms || 0);
    res.json({
      id: result.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
app.put('/api/empresas/:empresaId/produtos/:id', authenticateToken, (req, res) => {
  try {
    const db = getCompanyDb(req.params.empresaId);
    db.prepare(`
      UPDATE produtos 
      SET codigo = ?, descricao = ?, unidade = ?, valor_unitario = ?, ncm = ?, cfop = ?, ncm_id = ?, cfop_id = ?, aliquota_icms = ?
      WHERE id = ?
    `).run(req.body.codigo, req.body.descricao, req.body.unidade, req.body.valor_unitario, req.body.ncm, req.body.cfop, req.body.ncm_id, req.body.cfop_id, req.body.aliquota_icms || 0, req.params.id);
    res.json({
      success: true
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// ===== ROTAS DE NFES (manter as existentes e adicionar as novas) =====
app.get('/api/empresas/:empresaId/nfes', authenticateToken, (req, res) => {
  try {
    const db = getCompanyDb(req.params.empresaId);
    const nfes = db.prepare(`
      SELECT n.*, c.razao_social as cliente_nome
      FROM nfes n
      LEFT JOIN clientes c ON n.cliente_id = c.id
      ORDER BY n.id DESC
    `).all();
    res.json(nfes);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
app.get('/api/empresas/:empresaId/nfes/:id', authenticateToken, (req, res) => {
  try {
    const db = getCompanyDb(req.params.empresaId);
    const nfe = db.prepare(`
      SELECT n.*, c.*,
             c.razao_social as cliente_razao_social,
             c.documento as cliente_documento,
             c.endereco as cliente_endereco,
             c.bairro as cliente_bairro,
             c.cidade as cliente_cidade,
             c.uf as cliente_estado,
             c.cep as cliente_cep
      FROM nfes n
      LEFT JOIN clientes c ON n.cliente_id = c.id
      WHERE n.id = ?
    `).get(req.params.id);
    if (!nfe) {
      return res.status(404).json({
        error: 'NFe não encontrada'
      });
    }
    const items = db.prepare(`
      SELECT * FROM nfe_itens WHERE nfe_id = ?
    `).all(req.params.id);
    const cliente = {
      razao_social: nfe.cliente_razao_social,
      documento: nfe.cliente_documento,
      endereco: nfe.cliente_endereco,
      bairro: nfe.cliente_bairro,
      cidade: nfe.cliente_cidade,
      estado: nfe.cliente_estado,
      cep: nfe.cliente_cep
    };
    res.json({
      id: nfe.id,
      numero: nfe.numero,
      serie: nfe.serie,
      data_emissao: nfe.data_emissao,
      natureza_operacao: nfe.natureza_operacao,
      cfop: nfe.cfop,
      valor_total: nfe.valor_total,
      status: nfe.status,
      chave_acesso: nfe.chave_acesso,
      cliente,
      items
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
app.post('/api/empresas/:empresaId/nfes', authenticateToken, (req, res) => {
  try {
    const db = getCompanyDb(req.params.empresaId);
    const result = db.prepare(`
      INSERT INTO nfes (numero, serie, cliente_id, natureza_operacao, cfop, valor_total, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.body.numero, req.body.serie || '1', req.body.cliente_id, req.body.natureza_operacao, req.body.cfop, req.body.valor_total, req.body.status || 'Processando');
    const nfeId = result.lastInsertRowid;
    const insertItem = db.prepare(`
      INSERT INTO nfe_itens (nfe_id, produto_id, descricao, quantidade, valor_unitario, valor_total)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const item of req.body.items) {
      insertItem.run(nfeId, item.produto_id, item.descricao, item.quantidade, item.valor_unitario, item.valor_total);
    }
    res.json({
      id: nfeId
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
app.delete('/api/empresas/:empresaId/nfes/:id', authenticateToken, (req, res) => {
  try {
    const db = getCompanyDb(req.params.empresaId);
    const nfe = db.prepare('SELECT * FROM nfes WHERE id = ?').get(req.params.id);
    if (!nfe) {
      return res.status(404).json({
        error: 'NFe não encontrada'
      });
    }

    // Permitir exclusão de NFes com status "Processando" ou "Rejeitada"
    if (nfe.status !== 'Processando' && nfe.status !== 'Rejeitada') {
      return res.status(400).json({
        error: 'Apenas NFes com status "Processando" ou "Rejeitada" podem ser excluídas',
        status: nfe.status
      });
    }

    // Deletar itens primeiro (foreign key)
    db.prepare('DELETE FROM nfe_itens WHERE nfe_id = ?').run(req.params.id);

    // Deletar NFe
    db.prepare('DELETE FROM nfes WHERE id = ?').run(req.params.id);
    console.log(`🗑️  NFe #${nfe.numero} (${nfe.status}) excluída com sucesso`);
    res.json({
      success: true,
      message: 'NFe excluída com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao excluir NFe:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// ===== ROTAS DE CONFIGURAÇÕES (POR EMPRESA) =====
app.get('/api/empresas/:empresaId/configuracoes', authenticateToken, (req, res) => {
  try {
    console.log(`\n📥 GET /api/empresas/${req.params.empresaId}/configuracoes`);
    const db = getCompanyDb(req.params.empresaId);

    // Verificar se tabela existe
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='configuracoes'
    `).get();
    if (!tableExists) {
      console.log('⚠️  Tabela configuracoes não existe, criando...');
      db.exec(`
        CREATE TABLE IF NOT EXISTS configuracoes (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          sefaz_ambiente INTEGER DEFAULT 2,
          sefaz_uf TEXT DEFAULT 'SP',
          certificado_tipo TEXT DEFAULT 'A1',
          certificado_senha TEXT DEFAULT '',
          certificado_path TEXT DEFAULT '',
          serie_nfe INTEGER DEFAULT 1,
          proximo_numero INTEGER DEFAULT 1,
          csosn_padrao TEXT DEFAULT '102',
          email_smtp_host TEXT DEFAULT '',
          email_smtp_port INTEGER DEFAULT 587,
          email_smtp_user TEXT DEFAULT '',
          email_smtp_pass TEXT DEFAULT '',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      db.exec('INSERT INTO configuracoes (id) VALUES (1)');
      console.log('✅ Tabela criada e registro inserido');
    }
    const config = db.prepare('SELECT * FROM configuracoes WHERE id = 1').get();
    if (!config) {
      console.log('⚠️  Registro não encontrado, criando...');
      db.exec('INSERT INTO configuracoes (id) VALUES (1)');
      const newConfig = db.prepare('SELECT * FROM configuracoes WHERE id = 1').get();
      console.log('✅ Registro criado:', newConfig);
      return res.json(newConfig);
    }
    console.log('✅ Configurações encontradas:', {
      sefaz_ambiente: config.sefaz_ambiente,
      certificado_senha: config.certificado_senha ? '***' : '(vazio)',
      email_smtp_host: config.email_smtp_host || '(vazio)'
    });
    res.json(config);
  } catch (error) {
    console.error('❌ Erro ao buscar configurações:', error);
    res.status(500).json({
      error: error.message
    });
  }
});
app.put('/api/empresas/:empresaId/configuracoes', authenticateToken, (req, res) => {
  try {
    console.log(`\n💾 PUT /api/empresas/${req.params.empresaId}/configuracoes`);
    console.log('📦 Body recebido:', {
      sefaz_ambiente: req.body.sefaz_ambiente,
      sefaz_uf: req.body.sefaz_uf,
      certificado_senha: req.body.certificado_senha ? '***' : '(vazio)',
      certificado_path: req.body.certificado_path || '(vazio)',
      email_smtp_host: req.body.email_smtp_host || '(vazio)'
    });
    const db = getCompanyDb(req.params.empresaId);
    const {
      sefaz_ambiente,
      sefaz_uf,
      certificado_tipo,
      certificado_senha,
      certificado_path,
      serie_nfe,
      proximo_numero,
      csosn_padrao,
      email_smtp_host,
      email_smtp_port,
      email_smtp_user,
      email_smtp_pass
    } = req.body;
    console.log('🔄 Executando UPDATE...');
    const result = db.prepare(`
      UPDATE configuracoes 
      SET 
        sefaz_ambiente = ?,
        sefaz_uf = ?,
        certificado_tipo = ?,
        certificado_senha = ?,
        certificado_path = ?,
        serie_nfe = ?,
        proximo_numero = ?,
        csosn_padrao = ?,
        email_smtp_host = ?,
        email_smtp_port = ?,
        email_smtp_user = ?,
        email_smtp_pass = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(sefaz_ambiente, sefaz_uf, certificado_tipo, certificado_senha, certificado_path, serie_nfe, proximo_numero, csosn_padrao, email_smtp_host, email_smtp_port, email_smtp_user, email_smtp_pass);
    console.log('📊 Resultado do UPDATE:', {
      changes: result.changes,
      lastInsertRowid: result.lastInsertRowid
    });
    if (result.changes === 0) {
      console.log('⚠️  Nenhuma linha foi atualizada!');

      // Verificar se registro existe
      const exists = db.prepare('SELECT id FROM configuracoes WHERE id = 1').get();
      if (!exists) {
        console.log('❌ Registro id=1 não existe! Criando...');
        db.exec('INSERT INTO configuracoes (id) VALUES (1)');

        // Tentar UPDATE novamente
        const retry = db.prepare(`
          UPDATE configuracoes 
          SET 
            sefaz_ambiente = ?,
            sefaz_uf = ?,
            certificado_tipo = ?,
            certificado_senha = ?,
            certificado_path = ?,
            serie_nfe = ?,
            proximo_numero = ?,
            csosn_padrao = ?,
            email_smtp_host = ?,
            email_smtp_port = ?,
            email_smtp_user = ?,
            email_smtp_pass = ?
          WHERE id = 1
        `).run(sefaz_ambiente, sefaz_uf, certificado_tipo, certificado_senha, certificado_path, serie_nfe, proximo_numero, csosn_padrao, email_smtp_host, email_smtp_port, email_smtp_user, email_smtp_pass);
        console.log('🔄 Retry UPDATE:', retry);
      }
    }

    // Buscar configurações atualizadas
    const updated = db.prepare('SELECT * FROM configuracoes WHERE id = 1').get();
    console.log('✅ Configurações após UPDATE:', {
      sefaz_ambiente: updated.sefaz_ambiente,
      certificado_senha: updated.certificado_senha ? '***' : '(vazio)',
      email_smtp_host: updated.email_smtp_host || '(vazio)'
    });
    res.json({
      success: true,
      message: 'Configurações atualizadas com sucesso',
      config: updated
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar configurações:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      error: error.message
    });
  }
});

// ===== ROTAS DE PLANOS =====
app.get('/api/planos', (req, res) => {
  try {
    const planos = mainDb.prepare('SELECT * FROM planos WHERE ativo = 1 ORDER BY preco_mensal ASC').all();
    res.json(planos);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
app.get('/api/planos/:id', (req, res) => {
  try {
    const plano = mainDb.prepare('SELECT * FROM planos WHERE id = ?').get(req.params.id);
    if (!plano) {
      return res.status(404).json({
        error: 'Plano não encontrado'
      });
    }
    res.json(plano);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// ===== ROTA: ATUALIZAR PLANO DA EMPRESA =====
app.put('/api/empresas/:empresaId/plano', authenticateToken, (req, res) => {
  try {
    const {
      plano_id
    } = req.body;
    if (!plano_id) {
      return res.status(400).json({
        error: 'plano_id é obrigatório'
      });
    }

    // Verificar se plano existe
    const plano = mainDb.prepare('SELECT * FROM planos WHERE id = ?').get(plano_id);
    if (!plano) {
      return res.status(404).json({
        error: 'Plano não encontrado'
      });
    }

    // Buscar empresa
    const empresa = mainDb.prepare('SELECT * FROM empresas WHERE id = ?').get(req.params.empresaId);
    if (!empresa) {
      return res.status(404).json({
        error: 'Empresa não encontrada'
      });
    }
    const hoje = new Date();
    const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

    // DELETAR faturas pendentes do mês atual antes de criar nova
    const deletedCount = mainDb.prepare(`
      DELETE FROM faturas 
      WHERE empresa_id = ? 
        AND mes_referencia = ? 
        AND status = 'pendente'
    `).run(req.params.empresaId, mesAtual);
    if (deletedCount.changes > 0) {
      console.log(`🗑️  ${deletedCount.changes} fatura(s) pendente(s) do mês atual deletada(s)`);
    }

    // Atualizar plano da empresa
    mainDb.prepare('UPDATE empresas SET plano_id = ? WHERE id = ?').run(plano_id, req.params.empresaId);
    console.log(`✅ Empresa ${req.params.empresaId} atualizada para plano ${plano.nome}`);

    // Gerar nova fatura se o plano não for gratuito
    let fatura = null;
    if (plano.preco_mensal > 0) {
      // Data de vencimento: 10 dias após a mudança
      const dataVencimento = new Date();
      dataVencimento.setDate(dataVencimento.getDate() + 10);
      const dataVencimentoStr = dataVencimento.toISOString().split('T')[0];

      // Criar fatura
      const result = mainDb.prepare(`
        INSERT INTO faturas (empresa_id, plano_id, valor, mes_referencia, data_vencimento, status)
        VALUES (?, ?, ?, ?, ?, 'pendente')
      `).run(req.params.empresaId, plano_id, plano.preco_mensal, mesAtual, dataVencimentoStr);
      fatura = {
        id: result.lastInsertRowid,
        valor: plano.preco_mensal,
        data_vencimento: dataVencimentoStr
      };
      console.log(`💰 Nova fatura #${fatura.id} gerada: R$ ${plano.preco_mensal} - Vencimento: ${dataVencimentoStr}`);
    }
    res.json({
      success: true,
      plano: plano.nome,
      fatura: fatura,
      faturasDeletadas: deletedCount.changes
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar plano:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// ===== CRIAR TABELA DE FATURAS =====
mainDb.exec(`
  CREATE TABLE IF NOT EXISTS faturas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER NOT NULL,
    plano_id INTEGER NOT NULL,
    valor REAL NOT NULL,
    mes_referencia TEXT NOT NULL,
    status TEXT DEFAULT 'pendente',
    data_vencimento TEXT NOT NULL,
    data_pagamento TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id),
    FOREIGN KEY (plano_id) REFERENCES planos(id)
  );
`);

// ===== CRIAR TABELA DE CONFIGURAÇÕES GLOBAIS =====
mainDb.exec(`
  CREATE TABLE IF NOT EXISTS configuracoes_globais (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    pix_chave TEXT,
    pix_tipo TEXT DEFAULT 'cnpj',
    pix_nome_recebedor TEXT,
    pix_cidade TEXT,
    stripe_public_key TEXT,
    stripe_secret_key TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Inserir configuração padrão se não existir
const configGlobal = mainDb.prepare('SELECT * FROM configuracoes_globais WHERE id = 1').get();
if (!configGlobal) {
  mainDb.prepare(`
    INSERT INTO configuracoes_globais (id, pix_nome_recebedor, pix_cidade)
    VALUES (1, 'SISTEMA NFE LTDA', 'SAO PAULO')
  `).run();
  console.log('✅ Configurações globais criadas');
}

// ===== ROTA: OBTER CONFIGURAÇÕES GLOBAIS =====
app.get('/api/configuracoes-globais', authenticateToken, (req, res) => {
  try {
    // Apenas super usuário pode ver
    if (req.user.tipo !== 'super') {
      return res.status(403).json({
        error: 'Acesso negado'
      });
    }
    const config = mainDb.prepare('SELECT * FROM configuracoes_globais WHERE id = 1').get();
    res.json(config || {});
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// ===== ROTA: ATUALIZAR CONFIGURAÇÕES GLOBAIS =====
app.put('/api/configuracoes-globais', authenticateToken, (req, res) => {
  try {
    // Apenas super usuário pode atualizar
    if (req.user.tipo !== 'super') {
      return res.status(403).json({
        error: 'Acesso negado'
      });
    }
    const {
      pix_chave,
      pix_tipo,
      pix_nome_recebedor,
      pix_cidade,
      stripe_public_key,
      stripe_secret_key
    } = req.body;
    mainDb.prepare(`
      UPDATE configuracoes_globais 
      SET pix_chave = ?, pix_tipo = ?, pix_nome_recebedor = ?, pix_cidade = ?,
          stripe_public_key = ?, stripe_secret_key = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(pix_chave, pix_tipo, pix_nome_recebedor, pix_cidade, stripe_public_key, stripe_secret_key);
    res.json({
      success: true
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// ===== ROTAS DE FATURAS =====
app.get('/api/faturas', authenticateToken, (req, res) => {
  try {
    const {
      empresa_id
    } = req.query;
    let query = `
      SELECT f.*, e.razao_social as empresa_nome, p.nome as plano_nome
      FROM faturas f
      LEFT JOIN empresas e ON f.empresa_id = e.id
      LEFT JOIN planos p ON f.plano_id = p.id
    `;
    const params = [];
    if (empresa_id) {
      query += ' WHERE f.empresa_id = ?';
      params.push(empresa_id);
    }
    query += ' ORDER BY f.created_at DESC';
    const faturas = mainDb.prepare(query).all(...params);
    res.json(faturas);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
app.post('/api/faturas', authenticateToken, (req, res) => {
  try {
    const {
      empresa_id,
      plano_id,
      valor,
      mes_referencia,
      data_vencimento
    } = req.body;
    const result = mainDb.prepare(`
      INSERT INTO faturas (empresa_id, plano_id, valor, mes_referencia, data_vencimento)
      VALUES (?, ?, ?, ?, ?)
    `).run(empresa_id, plano_id, valor, mes_referencia, data_vencimento);
    res.json({
      id: result.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
app.put('/api/faturas/:id/pagar', authenticateToken, (req, res) => {
  try {
    mainDb.prepare(`
      UPDATE faturas 
      SET status = 'pago', data_pagamento = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id);
    res.json({
      success: true
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// ===== ROTA: GERAR PIX PARA FATURA (MELHORADA) =====
app.post('/api/faturas/:id/gerar-pix', authenticateToken, (req, res) => {
  try {
    const fatura = mainDb.prepare('SELECT * FROM faturas WHERE id = ?').get(req.params.id);
    if (!fatura) {
      return res.status(404).json({
        error: 'Fatura não encontrada'
      });
    }
    if (fatura.status === 'pago') {
      return res.status(400).json({
        error: 'Fatura já está paga'
      });
    }

    // Buscar configurações PIX
    const config = mainDb.prepare('SELECT * FROM configuracoes_globais WHERE id = 1').get();
    if (!config || !config.pix_chave) {
      return res.status(400).json({
        error: 'Chave PIX não configurada. Entre em contato com o administrador.'
      });
    }

    // Gerar código PIX EMV (formato padrão brasileiro)
    const pixPayload = {
      pixKey: config.pix_chave,
      description: `Fatura ${fatura.mes_referencia}`,
      merchantName: config.pix_nome_recebedor || 'SISTEMA NFE',
      merchantCity: config.pix_cidade || 'SAO PAULO',
      amount: fatura.valor.toFixed(2),
      txid: `FAT${fatura.id}${Date.now()}`
    };

    // Gerar código PIX (simplificado - em produção usar biblioteca oficial)
    const pixCode = generatePixCode(pixPayload);

    // Salvar código PIX na fatura
    mainDb.prepare(`
      UPDATE faturas 
      SET pix_code = ?, pix_gerado_em = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(pixCode, req.params.id);
    console.log(`💳 PIX gerado para fatura #${req.params.id}`);
    res.json({
      success: true,
      pixCode: pixCode,
      pixKey: config.pix_chave,
      pixTipo: config.pix_tipo,
      valor: fatura.valor,
      vencimento: fatura.data_vencimento,
      beneficiario: config.pix_nome_recebedor
    });
  } catch (error) {
    console.error('❌ Erro ao gerar PIX:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Função auxiliar para gerar código PIX EMV
function generatePixCode(payload) {
  // Simplificado - em produção usar biblioteca oficial como 'pix-utils'
  const {
    pixKey,
    description,
    merchantName,
    merchantCity,
    amount,
    txid
  } = payload;

  // Formato EMV básico
  const pixKeyField = `0014br.gov.bcb.pix01${pixKey.length.toString().padStart(2, '0')}${pixKey}`;
  const descField = description ? `02${description.length.toString().padStart(2, '0')}${description}` : '';
  return `00020126${pixKeyField.length.toString().padStart(2, '0')}${pixKeyField}${descField}52040000530398654${amount.length.toString().padStart(2, '0')}${amount}5802BR59${merchantName.length.toString().padStart(2, '0')}${merchantName}60${merchantCity.length.toString().padStart(2, '0')}${merchantCity}62${(txid.length + 4).toString().padStart(2, '0')}05${txid.length.toString().padStart(2, '0')}${txid}6304`;
}

// ===== ROTA: VERIFICAR LIMITES DO PLANO =====
app.get('/api/empresas/:empresaId/limites', authenticateToken, (req, res) => {
  try {
    const empresa = mainDb.prepare(`
      SELECT e.*, p.nome as plano_nome, p.limite_nfes, p.limite_produtos, p.limite_faturamento
      FROM empresas e
      LEFT JOIN planos p ON e.plano_id = p.id
      WHERE e.id = ?
    `).get(req.params.empresaId);
    if (!empresa) {
      return res.status(404).json({
        error: 'Empresa não encontrada'
      });
    }

    // Buscar uso atual
    const db = getCompanyDb(req.params.empresaId);
    const nfesEmitidas = db.prepare('SELECT COUNT(*) as count FROM nfes WHERE strftime("%Y-%m", data_emissao) = strftime("%Y-%m", "now")').get();
    const produtosCadastrados = db.prepare('SELECT COUNT(*) as count FROM produtos').get();
    res.json({
      plano: {
        nome: empresa.plano_nome,
        limite_nfes: empresa.limite_nfes,
        limite_produtos: empresa.limite_produtos,
        limite_faturamento: empresa.limite_faturamento
      },
      uso: {
        nfes_mes: nfesEmitidas.count,
        produtos: produtosCadastrados.count
      },
      disponivel: {
        nfes: empresa.limite_nfes === -1 ? -1 : empresa.limite_nfes - nfesEmitidas.count,
        produtos: empresa.limite_produtos === -1 ? -1 : empresa.limite_produtos - produtosCadastrados.count
      }
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// ===== INICIAR SERVIDOR =====
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ===================================');
  console.log(`   Backend NFe rodando na porta ${PORT}`);
  console.log('🚀 ===================================');
  console.log('');
  console.log('📁 Bancos de dados SQLite:');
  console.log('   - principal.db (empresas + usuários + NCM + CFOP + CONFIGS)');
  console.log('   - empresa_X.db (dados por empresa)');
  console.log('');
  console.log('🔐 Usuário padrão:');
  console.log('   Email: admin@nfe.com');
  console.log('   Senha: admin123');
  console.log('');
  console.log('📡 API disponível em:');
  console.log(`   http://localhost:${PORT}/api`);
  console.log('');
  console.log('📤 Upload de arquivos habilitado');
  console.log('   - Certificados: /api/empresas/:id/upload/certificado');
  console.log('   - Logos: /api/empresas/:id/upload/logo');
  console.log('');
  console.log('🌐 Ambiente SEFAZ: HOMOLOGAÇÃO');
  console.log('');
});