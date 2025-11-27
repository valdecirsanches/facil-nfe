const fs = require('fs');
const path = require('path');
console.log('🔧 Corrigindo rota de pedidos no server.js...\n');
const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Backup
fs.writeFileSync(serverPath + '.backup', serverContent);
console.log('✅ Backup criado: server.js.backup');

// Procurar e corrigir a rota de listar pedidos
const oldQuery1 = `SELECT 
        p.*,
        c.razao_social as cliente_nome,
        c.cnpj as cliente_cnpj,
        u.nome as aprovado_por_nome
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN usuarios u ON p.aprovado_por = u.id`;
const newQuery1 = `SELECT 
        p.*,
        c.razao_social as cliente_nome,
        c.documento as cliente_cnpj
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id`;

// Também corrigir variações possíveis
const oldQuery2 = `c.cnpj as cliente_cnpj`;
const newQuery2 = `c.documento as cliente_cnpj`;
serverContent = serverContent.replace(oldQuery1, newQuery1);
serverContent = serverContent.replace(/c\.cnpj as cliente_cnpj/g, 'c.documento as cliente_cnpj');
serverContent = serverContent.replace(/u\.nome as aprovado_por_nome/g, '');
serverContent = serverContent.replace(/LEFT JOIN usuarios u ON p\.aprovado_por = u\.id/g, '');

// Salvar
fs.writeFileSync(serverPath, serverContent);
console.log('✅ server.js corrigido!');
console.log('\n📝 Mudanças aplicadas:');
console.log('   - c.cnpj → c.documento');
console.log('   - Removido JOIN com tabela usuarios');
console.log('\n🚀 Reinicie o backend:');
console.log('   npm start');
console.log('\n💾 Backup salvo em: server.js.backup');