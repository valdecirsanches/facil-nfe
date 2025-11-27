const fs = require('fs');
const path = require('path');
console.log('🔧 Corrigindo rota de detalhes do pedido...\n');
const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Backup
const backupPath = serverPath + '.backup-detalhes';
fs.writeFileSync(backupPath, serverContent);
console.log('✅ Backup criado:', backupPath);

// Procurar pela rota de buscar pedido por ID (linha ~2008)
// O problema é que o script anterior removeu partes da query deixando sintaxe inválida

// Padrão que pode estar quebrado:
const brokenPatterns = [/SELECT\s+p\.\*,\s+c\.razao_social as cliente_nome,\s+c\.documento as cliente_cnpj,\s+c\.email as cliente_email,\s+c\.telefone as cliente_telefone\s+FROM pedidos p/gi, /SELECT\s+p\.\*,\s+c\.razao_social as cliente_nome,\s+c\.documento as cliente_cnpj,\s+c\.email as cliente_email,\s+c\.telefone as cliente_telefone,\s+FROM pedidos p/gi, /SELECT\s+p\.\*,\s+c\.razao_social as cliente_nome,\s+c\.cnpj as cliente_cnpj,\s+c\.email as cliente_email,\s+c\.telefone as cliente_telefone,\s+FROM pedidos p/gi];

// Query correta
const correctQuery = `SELECT 
      p.*,
      c.razao_social as cliente_nome,
      c.documento as cliente_cnpj,
      c.email as cliente_email,
      c.telefone as cliente_telefone
    FROM pedidos p
    LEFT JOIN clientes c ON p.cliente_id = c.id
    WHERE p.id = ?`;

// Tentar encontrar e corrigir a rota
const routeRegex = /app\.get\(['"]\/api\/empresas\/:empresaId\/pedidos\/:id['"],\s*authenticateToken,\s*async\s*\(req,\s*res\)\s*=>\s*\{[\s\S]*?const pedido = db\.prepare\(`[\s\S]*?`\)\.get\(id\)/;
if (routeRegex.test(serverContent)) {
  console.log('✅ Rota encontrada, aplicando correção...');
  serverContent = serverContent.replace(routeRegex, `app.get('/api/empresas/:empresaId/pedidos/:id', authenticateToken, async (req, res) => {
  try {
    const { empresaId, id } = req.params
    const db = getCompanyDb(empresaId)
    
    const pedido = db.prepare(\`
      SELECT 
        p.*,
        c.razao_social as cliente_nome,
        c.documento as cliente_cnpj,
        c.email as cliente_email,
        c.telefone as cliente_telefone
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      WHERE p.id = ?
    \`).get(id)`);
} else {
  console.log('⚠️  Rota não encontrada com regex, tentando correção manual...');

  // Tentar corrigir vírgulas extras ou sintaxe quebrada
  serverContent = serverContent.replace(/,\s+FROM pedidos/gi, '\n    FROM pedidos');
  serverContent = serverContent.replace(/c\.cnpj as cliente_cnpj/g, 'c.documento as cliente_cnpj');
}

// Salvar
fs.writeFileSync(serverPath, serverContent);
console.log('✅ Correção aplicada!');
console.log('\n📝 Mudanças:');
console.log('   - Corrigida sintaxe SQL na rota de detalhes');
console.log('   - c.cnpj → c.documento');
console.log('   - Removidas vírgulas extras');
console.log('\n🚀 Reinicie o backend:');
console.log('   npm start');
console.log('\n💾 Backup salvo em:', backupPath);