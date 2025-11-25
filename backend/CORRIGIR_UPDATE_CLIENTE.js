const fs = require('fs');

console.log('🔧 CORRIGINDO ROTA PUT /clientes/:id NO BACKEND\n');
console.log('═'.repeat(70));

const filePath = './server.js';
let content = fs.readFileSync(filePath, 'utf8');

// Backup
fs.writeFileSync('./server.js.backup_update_cliente', content, 'utf8');
console.log('💾 Backup criado: server.js.backup_update_cliente\n');

// Procurar e substituir a rota PUT de clientes
const oldPattern = `app.put('/api/empresas/:empresaId/clientes/:id', authenticateToken, (req, res) => {
  try {
    const db = getCompanyDb(req.params.empresaId);
    
    // SANITIZAR CEP ANTES DE SALVAR
    const cepSanitizado = sanitizeCEP(req.body.cep);
    
    db.prepare(\`
      UPDATE clientes 
      SET tipo_documento = ?, documento = ?, razao_social = ?, nome_fantasia = ?, ie = ?,
          endereco = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, uf = ?, cep = ?, telefone = ?, email = ?, transportadora_id = ?
      WHERE id = ?
    \`).run(
      req.body.tipo_documento, req.body.documento, req.body.razao_social, req.body.nome_fantasia, req.body.ie,
      req.body.endereco, req.body.numero, req.body.complemento, req.body.bairro, req.body.cidade, req.body.uf,
      cepSanitizado, req.body.telefone, req.body.email, req.body.transportadora_id, req.params.id
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});`;

const newPattern = `app.put('/api/empresas/:empresaId/clientes/:id', authenticateToken, (req, res) => {
  try {
    const db = getCompanyDb(req.params.empresaId);
    
    console.log('📝 Atualizando cliente:', req.params.id);
    console.log('📦 Dados recebidos:', {
      cidade: req.body.cidade,
      uf: req.body.uf,
      codigo_municipio: req.body.codigo_municipio
    });
    
    // SANITIZAR CEP ANTES DE SALVAR
    const cepSanitizado = sanitizeCEP(req.body.cep);
    
    db.prepare(\`
      UPDATE clientes 
      SET tipo_documento = ?, documento = ?, razao_social = ?, nome_fantasia = ?, ie = ?,
          endereco = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, uf = ?, cep = ?, codigo_municipio = ?, telefone = ?, email = ?, transportadora_id = ?
      WHERE id = ?
    \`).run(
      req.body.tipo_documento, req.body.documento, req.body.razao_social, req.body.nome_fantasia, req.body.ie,
      req.body.endereco, req.body.numero, req.body.complemento, req.body.bairro, req.body.cidade, req.body.uf,
      cepSanitizado, req.body.codigo_municipio, req.body.telefone, req.body.email, req.body.transportadora_id, req.params.id
    );
    
    console.log('✅ Cliente atualizado com sucesso!');
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao atualizar cliente:', error);
    res.status(500).json({ error: error.message });
  }
});`;

if (content.includes(oldPattern)) {
  content = content.replace(oldPattern, newPattern);
  fs.writeFileSync(filePath, content, 'utf8');
  
  console.log('✅ Rota PUT /clientes/:id corrigida!\n');
  console.log('📝 Mudanças aplicadas:');
  console.log('   1. ✅ Adicionado codigo_municipio na query UPDATE');
  console.log('   2. ✅ Adicionado logs para debug');
  console.log('   3. ✅ Ordem dos parâmetros corrigida\n');
  console.log('🔄 REINICIE O BACKEND AGORA:');
  console.log('   pkill -9 node');
  console.log('   npm start\n');
} else {
  console.log('⚠️  Padrão não encontrado. Verifique se o arquivo já foi modificado.\n');
}

console.log('═'.repeat(70) + '\n');
