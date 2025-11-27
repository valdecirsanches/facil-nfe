const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Sistema de migração para preservar dados existentes
class MigrationSystem {
  constructor() {
    this.migrationsDir = './migrations_log';
    this.ensureMigrationsDir();
  }
  ensureMigrationsDir() {
    if (!fs.existsSync(this.migrationsDir)) {
      fs.mkdirSync(this.migrationsDir);
    }
  }
  getMigrationStatus(dbName) {
    const statusFile = path.join(this.migrationsDir, `${dbName}_migrations.json`);
    if (fs.existsSync(statusFile)) {
      return JSON.parse(fs.readFileSync(statusFile, 'utf8'));
    }
    return {
      applied: []
    };
  }
  saveMigrationStatus(dbName, status) {
    const statusFile = path.join(this.migrationsDir, `${dbName}_migrations.json`);
    fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
  }
  hasMigration(dbName, migrationName) {
    const status = this.getMigrationStatus(dbName);
    return status.applied.includes(migrationName);
  }
  markMigrationApplied(dbName, migrationName) {
    const status = this.getMigrationStatus(dbName);
    if (!status.applied.includes(migrationName)) {
      status.applied.push(migrationName);
      this.saveMigrationStatus(dbName, status);
    }
  }

  // Migração 1: Adicionar tabelas NCM e CFOP no banco principal
  migration_001_add_ncm_cfop_tables(db, dbName) {
    const migrationName = 'migration_001_add_ncm_cfop_tables';
    if (this.hasMigration(dbName, migrationName)) {
      console.log(`✓ ${migrationName} já aplicada em ${dbName}`);
      return;
    }
    console.log(`→ Aplicando ${migrationName} em ${dbName}...`);
    db.exec(`
      CREATE TABLE IF NOT EXISTS tbNCM (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        descricao TEXT,
        categoria TEXT,
        fim_vigencia DATE,
        inicio_vigencia DATE,
        ipi TEXT,
        uTrib TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS tbCFOP (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idDest INTEGER,
        finNFe INTEGER,
        descricao TEXT,
        texto TEXT,
        indNFe INTEGER NOT NULL DEFAULT 0,
        indComunica INTEGER NOT NULL DEFAULT 0,
        indTransp INTEGER NOT NULL DEFAULT 0,
        indDevol INTEGER NOT NULL DEFAULT 0,
        gera_credito INTEGER NOT NULL DEFAULT 0,
        isento_icms TEXT,
        cst_icms TEXT,
        cst_ipi TEXT,
        cst_pis TEXT,
        cst_cofins TEXT,
        operacao TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    this.markMigrationApplied(dbName, migrationName);
    console.log(`✓ ${migrationName} aplicada com sucesso em ${dbName}`);
  }

  // Migração 2: Adicionar campos ncm_id e cfop_id na tabela produtos
  migration_002_add_ncm_cfop_to_produtos(db, dbName) {
    const migrationName = 'migration_002_add_ncm_cfop_to_produtos';
    if (this.hasMigration(dbName, migrationName)) {
      console.log(`✓ ${migrationName} já aplicada em ${dbName}`);
      return;
    }
    console.log(`→ Aplicando ${migrationName} em ${dbName}...`);
    const tableInfo = db.prepare("PRAGMA table_info(produtos)").all();
    const hasNcmId = tableInfo.some(col => col.name === 'ncm_id');
    const hasCfopId = tableInfo.some(col => col.name === 'cfop_id');
    if (!hasNcmId) {
      db.exec(`ALTER TABLE produtos ADD COLUMN ncm_id INTEGER REFERENCES tbNCM(id);`);
      console.log('  ✓ Coluna ncm_id adicionada');
    }
    if (!hasCfopId) {
      db.exec(`ALTER TABLE produtos ADD COLUMN cfop_id INTEGER REFERENCES tbCFOP(id);`);
      console.log('  ✓ Coluna cfop_id adicionada');
    }
    this.markMigrationApplied(dbName, migrationName);
    console.log(`✓ ${migrationName} aplicada com sucesso em ${dbName}`);
  }

  // Migração 3: Adicionar transportadora_id na tabela clientes
  migration_003_add_transportadora_to_clientes(db, dbName) {
    const migrationName = 'migration_003_add_transportadora_to_clientes';
    if (this.hasMigration(dbName, migrationName)) {
      console.log(`✓ ${migrationName} já aplicada em ${dbName}`);
      return;
    }
    console.log(`→ Aplicando ${migrationName} em ${dbName}...`);
    const tableInfo = db.prepare("PRAGMA table_info(clientes)").all();
    const hasTransportadoraId = tableInfo.some(col => col.name === 'transportadora_id');
    if (!hasTransportadoraId) {
      db.exec(`ALTER TABLE clientes ADD COLUMN transportadora_id INTEGER REFERENCES transportadoras(id);`);
      console.log('  ✓ Coluna transportadora_id adicionada');
    }
    this.markMigrationApplied(dbName, migrationName);
    console.log(`✓ ${migrationName} aplicada com sucesso em ${dbName}`);
  }

  // Migração 4: Adicionar aliquota_icms na tabela produtos
  migration_004_add_aliquota_icms_to_produtos(db, dbName) {
    const migrationName = 'migration_004_add_aliquota_icms_to_produtos';
    if (this.hasMigration(dbName, migrationName)) {
      console.log(`✓ ${migrationName} já aplicada em ${dbName}`);
      return;
    }
    console.log(`→ Aplicando ${migrationName} em ${dbName}...`);
    const tableInfo = db.prepare("PRAGMA table_info(produtos)").all();
    const hasAliquotaIcms = tableInfo.some(col => col.name === 'aliquota_icms');
    if (!hasAliquotaIcms) {
      db.exec(`ALTER TABLE produtos ADD COLUMN aliquota_icms REAL DEFAULT 0;`);
      console.log('  ✓ Coluna aliquota_icms adicionada');
    }
    this.markMigrationApplied(dbName, migrationName);
    console.log(`✓ ${migrationName} aplicada com sucesso em ${dbName}`);
  }

  // Migração 5: Criar tabela de endereços de entrega
  migration_005_create_enderecos_entrega(db, dbName) {
    const migrationName = 'migration_005_create_enderecos_entrega';
    if (this.hasMigration(dbName, migrationName)) {
      console.log(`✓ ${migrationName} já aplicada em ${dbName}`);
      return;
    }
    console.log(`→ Aplicando ${migrationName} em ${dbName}...`);
    db.exec(`
      CREATE TABLE IF NOT EXISTS enderecos_entrega (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER NOT NULL,
        nome TEXT NOT NULL,
        cnpj_filial TEXT,
        endereco TEXT,
        numero TEXT,
        complemento TEXT,
        bairro TEXT,
        cidade TEXT,
        uf TEXT,
        cep TEXT,
        telefone TEXT,
        contato TEXT,
        padrao INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
      );
    `);
    console.log('  ✓ Tabela enderecos_entrega criada');
    this.markMigrationApplied(dbName, migrationName);
    console.log(`✓ ${migrationName} aplicada com sucesso em ${dbName}`);
  }

  // Migração 6: Adicionar campos de veículo e observações na transportadora
  migration_006_add_veiculo_to_transportadora(db, dbName) {
    const migrationName = 'migration_006_add_veiculo_to_transportadora';
    if (this.hasMigration(dbName, migrationName)) {
      console.log(`✓ ${migrationName} já aplicada em ${dbName}`);
      return;
    }
    console.log(`→ Aplicando ${migrationName} em ${dbName}...`);
    const tableInfo = db.prepare("PRAGMA table_info(transportadoras)").all();
    const columns = tableInfo.map(col => col.name);
    const fieldsToAdd = [{
      name: 'placa_veiculo',
      type: 'TEXT'
    }, {
      name: 'uf_veiculo',
      type: 'TEXT'
    }, {
      name: 'rntc',
      type: 'TEXT'
    }, {
      name: 'numero',
      type: 'TEXT'
    }, {
      name: 'complemento',
      type: 'TEXT'
    }, {
      name: 'bairro',
      type: 'TEXT'
    }, {
      name: 'cep',
      type: 'TEXT'
    }, {
      name: 'email',
      type: 'TEXT'
    }, {
      name: 'nome_motorista',
      type: 'TEXT'
    }, {
      name: 'uf',
      type: 'TEXT'
    }, {
      name: 'observacoes',
      type: 'TEXT'
    }];
    fieldsToAdd.forEach(field => {
      if (!columns.includes(field.name)) {
        db.exec(`ALTER TABLE transportadoras ADD COLUMN ${field.name} ${field.type};`);
        console.log(`  ✓ Coluna ${field.name} adicionada`);
      }
    });
    if (columns.includes('estado') && columns.includes('uf')) {
      db.exec(`UPDATE transportadoras SET uf = estado WHERE uf IS NULL;`);
      console.log('  ✓ Dados migrados de estado para uf');
    }
    this.markMigrationApplied(dbName, migrationName);
    console.log(`✓ ${migrationName} aplicada com sucesso em ${dbName}`);
  }

  // Migração 7: Adicionar tipo de usuário (admin/super)
  migration_007_add_user_type(db, dbName) {
    const migrationName = 'migration_007_add_user_type';
    if (this.hasMigration(dbName, migrationName)) {
      console.log(`✓ ${migrationName} já aplicada em ${dbName}`);
      return;
    }
    console.log(`→ Aplicando ${migrationName} em ${dbName}...`);
    const tableInfo = db.prepare("PRAGMA table_info(usuarios)").all();
    const hasTipo = tableInfo.some(col => col.name === 'tipo');
    if (!hasTipo) {
      db.exec(`ALTER TABLE usuarios ADD COLUMN tipo TEXT DEFAULT 'usuario';`);
      console.log('  ✓ Coluna tipo adicionada');
      db.exec(`UPDATE usuarios SET tipo = 'super' WHERE empresa_id IS NULL;`);
      console.log('  ✓ Usuários super atualizados');
    }
    this.markMigrationApplied(dbName, migrationName);
    console.log(`✓ ${migrationName} aplicada com sucesso em ${dbName}`);
  }

  // Migração 8: Adicionar transportadora_id na tabela enderecos_entrega
  migration_008_add_transportadora_to_enderecos(db, dbName) {
    const migrationName = 'migration_008_add_transportadora_to_enderecos';
    if (this.hasMigration(dbName, migrationName)) {
      console.log(`✓ ${migrationName} já aplicada em ${dbName}`);
      return;
    }
    console.log(`→ Aplicando ${migrationName} em ${dbName}...`);
    const tableInfo = db.prepare("PRAGMA table_info(enderecos_entrega)").all();
    const hasTransportadoraId = tableInfo.some(col => col.name === 'transportadora_id');
    if (!hasTransportadoraId) {
      db.exec(`ALTER TABLE enderecos_entrega ADD COLUMN transportadora_id INTEGER REFERENCES transportadoras(id);`);
      console.log('  ✓ Coluna transportadora_id adicionada em enderecos_entrega');
    }
    this.markMigrationApplied(dbName, migrationName);
    console.log(`✓ ${migrationName} aplicada com sucesso em ${dbName}`);
  }

  // Migração 9: Adicionar IE na tabela enderecos_entrega
  migration_009_add_ie_to_enderecos(db, dbName) {
    const migrationName = 'migration_009_add_ie_to_enderecos';
    if (this.hasMigration(dbName, migrationName)) {
      console.log(`✓ ${migrationName} já aplicada em ${dbName}`);
      return;
    }
    console.log(`→ Aplicando ${migrationName} em ${dbName}...`);
    const tableInfo = db.prepare("PRAGMA table_info(enderecos_entrega)").all();
    const hasIe = tableInfo.some(col => col.name === 'ie');
    if (!hasIe) {
      db.exec(`ALTER TABLE enderecos_entrega ADD COLUMN ie TEXT;`);
      console.log('  ✓ Coluna ie adicionada em enderecos_entrega');
    }
    this.markMigrationApplied(dbName, migrationName);
    console.log(`✓ ${migrationName} aplicada com sucesso em ${dbName}`);
  }

  // NOVA Migração 10: Criar tabela de configurações
  migration_010_create_configuracoes(db, dbName) {
    const migrationName = 'migration_010_create_configuracoes';
    if (this.hasMigration(dbName, migrationName)) {
      console.log(`✓ ${migrationName} já aplicada em ${dbName}`);
      return;
    }
    console.log(`→ Aplicando ${migrationName} em ${dbName}...`);
    db.exec(`
      CREATE TABLE IF NOT EXISTS configuracoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chave TEXT UNIQUE NOT NULL,
        valor TEXT,
        descricao TEXT,
        tipo TEXT DEFAULT 'string',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('  ✓ Tabela configuracoes criada');

    // Inserir configurações padrão
    const configsPadrao = [{
      chave: 'sefaz_ambiente',
      valor: '2',
      descricao: 'Ambiente SEFAZ (1=Produção, 2=Homologação)',
      tipo: 'number'
    }, {
      chave: 'sefaz_uf',
      valor: 'SP',
      descricao: 'UF da SEFAZ',
      tipo: 'string'
    }, {
      chave: 'certificado_tipo',
      valor: 'A1',
      descricao: 'Tipo de certificado (A1 ou A3)',
      tipo: 'string'
    }, {
      chave: 'certificado_senha',
      valor: '',
      descricao: 'Senha do certificado',
      tipo: 'password'
    }, {
      chave: 'certificado_path',
      valor: '',
      descricao: 'Caminho do arquivo .pfx',
      tipo: 'string'
    }, {
      chave: 'serie_nfe',
      valor: '1',
      descricao: 'Série padrão da NFe',
      tipo: 'number'
    }, {
      chave: 'proximo_numero',
      valor: '1',
      descricao: 'Próximo número de NFe',
      tipo: 'number'
    }, {
      chave: 'email_smtp_host',
      valor: '',
      descricao: 'Servidor SMTP',
      tipo: 'string'
    }, {
      chave: 'email_smtp_port',
      valor: '587',
      descricao: 'Porta SMTP',
      tipo: 'number'
    }, {
      chave: 'email_smtp_user',
      valor: '',
      descricao: 'Usuário SMTP',
      tipo: 'string'
    }, {
      chave: 'email_smtp_pass',
      valor: '',
      descricao: 'Senha SMTP',
      tipo: 'password'
    }];
    const insert = db.prepare(`
      INSERT OR IGNORE INTO configuracoes (chave, valor, descricao, tipo)
      VALUES (?, ?, ?, ?)
    `);
    configsPadrao.forEach(config => {
      insert.run(config.chave, config.valor, config.descricao, config.tipo);
    });
    console.log('  ✓ Configurações padrão inseridas');
    this.markMigrationApplied(dbName, migrationName);
    console.log(`✓ ${migrationName} aplicada com sucesso em ${dbName}`);
  }

   // NOVA Migração 10: Criar tabela de financeiro
  migration_011_create_financeiro(db, dbName) {
    const migrationName = 'migration_011_create_financeiro';
    if (this.hasMigration(dbName, migrationName)) {
      console.log(`✓ ${migrationName} já aplicada em ${dbName}`);
      return;
    }
    console.log(`→ Aplicando ${migrationName} em ${dbName}...`);
    db.exec(`
     CREATE TABLE IF NOT EXISTS financeiro (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT NOT NULL CHECK(tipo IN ('receber', 'pagar')),
        descricao TEXT NOT NULL,
        cliente_fornecedor TEXT NOT NULL,
        valor REAL NOT NULL,
        data_vencimento TEXT NOT NULL,
        data_pagamento TEXT,
        status TEXT NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente', 'pago', 'vencido', 'cancelado')),
        forma_pagamento TEXT,
        observacoes TEXT,
        pedido_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
      );
    `);
    console.log('  ✓ Tabela configuracoes criada');
    }

  // Migração 9: Adicionar IE na tabela enderecos_entrega
  migration_012_add_pedido_id_to_financeiro(db, dbName) {
    const migrationName = 'migration_011_add_pedido_id_to_financeiro';
    if (this.hasMigration(dbName, migrationName)) {
      console.log(`✓ ${migrationName} já aplicada em ${dbName}`);
      return;
    }
    console.log(`→ Aplicando ${migrationName} em ${dbName}...`);
    const tableInfo = db.prepare("PRAGMA table_info(financeiro)").all();
    const hasIe = tableInfo.some(col => col.name === 'pedido_id');
    if (!hasIe) {
      db.exec(`ALTER TABLE financeiro ADD COLUMN pedido_id INTEGER REFERENCES pedidos(id);`);
      console.log('  ✓ Coluna ie adicionada em financeiro');
    }
    this.markMigrationApplied(dbName, migrationName);
    console.log(`✓ ${migrationName} aplicada com sucesso em ${dbName}`);
  }

  migration_013_add_pedido_id_to_nfes(db, dbName) {
    const migrationName = 'migration_013_add_pedido_id_to_nfes';
    if (this.hasMigration(dbName, migrationName)) {
      console.log(`✓ ${migrationName} já aplicada em ${dbName}`);
      return;
    }
    console.log(`→ Aplicando ${migrationName} em ${dbName}...`);
    const tableInfo = db.prepare("PRAGMA table_info(nfes)").all();
    const hasIe = tableInfo.some(col => col.name === 'pedido_id');
    if (!hasIe) {
      db.exec(`ALTER TABLE nfes ADD COLUMN pedido_id INTEGER REFERENCES pedidos(id);`);
      console.log('  ✓ Coluna ie adicionada em nfes');
    }
    this.markMigrationApplied(dbName, migrationName);
    console.log(`✓ ${migrationName} aplicada com sucesso em ${dbName}`);
  }


  // Executar todas as migrações no banco principal
  runMainDbMigrations(db) {
    console.log('\n📦 Executando migrações no banco principal...');
    this.migration_001_add_ncm_cfop_tables(db, 'principal');
    this.migration_007_add_user_type(db, 'principal');
    this.migration_010_create_configuracoes(db, 'principal');
  }

  // Executar todas as migrações em um banco de empresa
  runCompanyDbMigrations(db, companyId) {
    const dbName = `empresa_${companyId}`;
    console.log(`\n📦 Executando migrações em ${dbName}...`);
    this.migration_002_add_ncm_cfop_to_produtos(db, dbName);
    this.migration_003_add_transportadora_to_clientes(db, dbName);
    this.migration_004_add_aliquota_icms_to_produtos(db, dbName);
    this.migration_005_create_enderecos_entrega(db, dbName);
    this.migration_006_add_veiculo_to_transportadora(db, dbName);
    this.migration_008_add_transportadora_to_enderecos(db, dbName);
    this.migration_009_add_ie_to_enderecos(db, dbName);
    // this.migration_010_create_configuracoes(db, dbName);

    this.migration_011_create_financeiro(db, dbName);
    this.migration_012_add_pedido_id_to_financeiro(db, dbName);
    this.migration_013_add_pedido_id_to_nfes(db, dbName);
  }

  // Executar migrações em todos os bancos de empresas existentes
  runAllCompanyMigrations() {
    console.log('\n🔄 Procurando bancos de empresas existentes...');
    const files = fs.readdirSync('./');
    const companyDbs = files.filter(f => f.startsWith('empresa_') && f.endsWith('.db'));
    if (companyDbs.length === 0) {
      console.log('  Nenhum banco de empresa encontrado.');
      return;
    }
    console.log(`  Encontrados ${companyDbs.length} banco(s) de empresa(s)`);
    companyDbs.forEach(dbFile => {
      const match = dbFile.match(/empresa_(\d+)\.db/);
      if (match) {
        const companyId = parseInt(match[1]);
        const db = new Database(dbFile);
        this.runCompanyDbMigrations(db, companyId);
        db.close();
      }
    });
  }
}
module.exports = MigrationSystem;