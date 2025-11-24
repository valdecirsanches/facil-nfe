const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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
    crt TEXT DEFAULT '1',
    endereco TEXT,
    numero TEXT,
    cidade TEXT,
    estado TEXT,
    cep TEXT,
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
    const {
      email,
      senha
    } = req.body;
    const user = mainDb.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(senha, user.senha)) {
      return res.status(401).json({
        error: 'Credenciais inválidas'
      });
    }
    const userTipo = user.tipo || (user.empresa_id === null ? 'super' : 'usuario');
    const token = jwt.sign({
      id: user.id,
      email: user.email,
      empresa_id: user.empresa_id,
      tipo: userTipo
    }, JWT_SECRET, {
      expiresIn: '24h'
    });
    const {
      senha: _,
      ...userWithoutPassword
    } = user;
    userWithoutPassword.tipo = userTipo;
    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// ===== NOVAS ROTAS DE UPLOAD =====

// Upload de certificado digital
app.post('/api/empresas/:empresaId/upload/certificado', authenticateToken, upload.single('certificado'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Nenhum arquivo enviado'
      });
    }
    const certificadoPath = `Arqs/empresa_${req.params.empresaId}/certificado${path.extname(req.file.originalname)}`;
    console.log(`📤 Certificado enviado para empresa ${req.params.empresaId}`);
    console.log(`📁 Salvo em: ${certificadoPath}`);

    // Atualizar caminho nas configurações DA EMPRESA
    const db = getCompanyDb(req.params.empresaId);
    try {
      const result = db.prepare(`
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
      error: error.message
    });
  }
});

// Upload de logo da empresa
app.post('/api/empresas/:empresaId/upload/logo', authenticateToken, upload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
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
      error: error.message
    });
  }
});

// Servir arquivos estáticos da pasta Arqs
app.use('/arqs', express.static(path.join(__dirname, 'Arqs')));

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

    // Assinar XML (PASSAR empresaId)
    const xmlAssinado = nfeService.assinarXML(xml, req.params.empresaId);

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
    if (!resultado.online) {
      // Modo offline
      statusSefaz = 'Pendente';
      mensagemSefaz = resultado.mensagem;
      modoOffline = true;
      console.log('📝 NFe salva em modo offline');
    } else {
      // Processar resposta da SEFAZ
      const retorno = resultado.data['soap:Envelope']?.['soap:Body']?.nfeResultMsg?.retEnviNFe;
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
      modoOffline: modoOffline
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
app.post('/api/empresas', authenticateToken, (req, res) => {
  try {
    // SANITIZAR CEP ANTES DE SALVAR
    const cepSanitizado = sanitizeCEP(req.body.cep);
    const result = mainDb.prepare(`
      INSERT INTO empresas (razao_social, nome_fantasia, cnpj, ie, crt, endereco, numero, cidade, estado, cep, telefone, email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.body.razao_social, req.body.nome_fantasia, req.body.cnpj, req.body.ie, req.body.crt || '1', req.body.endereco, req.body.numero, req.body.cidade, req.body.estado, cepSanitizado, req.body.telefone, req.body.email);
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
app.put('/api/empresas/:id', authenticateToken, (req, res) => {
  try {
    // SANITIZAR CEP ANTES DE SALVAR
    const cepSanitizado = sanitizeCEP(req.body.cep);
    mainDb.prepare(`
      UPDATE empresas 
      SET razao_social = ?, nome_fantasia = ?, cnpj = ?, ie = ?, crt = ?, endereco = ?, numero = ?, cidade = ?, estado = ?, cep = ?, telefone = ?, email = ?
      WHERE id = ?
    `).run(req.body.razao_social, req.body.nome_fantasia, req.body.cnpj, req.body.ie, req.body.crt || '1', req.body.endereco, req.body.numero, req.body.cidade, req.body.estado, cepSanitizado, req.body.telefone, req.body.email, req.params.id);
    res.json({
      success: true
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
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
app.post('/api/usuarios', authenticateToken, (req, res) => {
  try {
    const hashedPassword = bcrypt.hashSync(req.body.senha, 10);
    const tipo = req.body.tipo || 'usuario';
    const result = mainDb.prepare(`
      INSERT INTO usuarios (nome, email, senha, empresa_id, tipo)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.body.nome, req.body.email, hashedPassword, req.body.empresa_id, tipo);
    res.json({
      id: result.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
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
    if (nfe.status !== 'Processando') {
      return res.status(400).json({
        error: 'Apenas NFes com status "Processando" podem ser excluídas'
      });
    }
    db.prepare('DELETE FROM nfe_itens WHERE nfe_id = ?').run(req.params.id);
    db.prepare('DELETE FROM nfes WHERE id = ?').run(req.params.id);
    res.json({
      success: true,
      message: 'NFe excluída com sucesso'
    });
  } catch (error) {
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