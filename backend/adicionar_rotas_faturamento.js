const fs = require('fs');
const path = require('path');
console.log('🔧 Adicionando rotas de faturamento ao server.js...\n');
const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Backup
const backupPath = serverPath + '.backup-faturamento';
fs.writeFileSync(backupPath, serverContent);
console.log('✅ Backup criado:', backupPath);

// Procurar onde adicionar as rotas (após a rota de aprovar pedido)
const routesToAdd = `

// Faturar pedido (cria registro financeiro)
app.put('/api/empresas/:empresaId/pedidos/:id/faturar', authenticateToken, async (req, res) => {
  try {
    const { empresaId, id } = req.params
    const db = getCompanyDb(empresaId)
    
    // Buscar pedido
    const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(id)
    
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado' })
    }
    
    if (pedido.status !== 'aprovado') {
      return res.status(400).json({ error: 'Apenas pedidos aprovados podem ser faturados' })
    }
    
    // Buscar cliente
    const cliente = db.prepare('SELECT razao_social FROM clientes WHERE id = ?').get(pedido.cliente_id)
    
    // Criar registro financeiro (contas a receber)
    const insertFinanceiro = db.prepare(\`
      INSERT INTO financeiro (
        tipo, descricao, cliente_fornecedor, valor, 
        data_vencimento, status, forma_pagamento, 
        pedido_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    \`)
    
    const dataVencimento = pedido.data_entrega || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    insertFinanceiro.run(
      'receber',
      \`Pedido \${pedido.numero}\`,
      cliente?.razao_social || 'Cliente',
      pedido.valor_final,
      dataVencimento,
      'pendente',
      'A definir',
      id
    )
    
    // Atualizar status do pedido
    db.prepare('UPDATE pedidos SET status = ? WHERE id = ?').run('faturado', id)
    
    res.json({ message: 'Pedido faturado com sucesso' })
  } catch (error) {
    console.error('Erro ao faturar pedido:', error)
    res.status(500).json({ error: error.message })
  }
})

// Desfaturar pedido (remove registro financeiro)
app.put('/api/empresas/:empresaId/pedidos/:id/desfaturar', authenticateToken, async (req, res) => {
  try {
    const { empresaId, id } = req.params
    const db = getCompanyDb(empresaId)
    
    // Buscar pedido
    const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(id)
    
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado' })
    }
    
    if (pedido.status !== 'faturado') {
      return res.status(400).json({ error: 'Apenas pedidos faturados podem ser desfaturados' })
    }
    
    // Verificar se há NFe gerada
    const nfe = db.prepare('SELECT id FROM nfes WHERE pedido_id = ?').get(id)
    if (nfe) {
      return res.status(400).json({ error: 'Não é possível desfaturar pedido com NFe gerada' })
    }
    
    // Remover registro financeiro
    db.prepare('DELETE FROM financeiro WHERE pedido_id = ?').run(id)
    
    // Voltar status do pedido para aprovado
    db.prepare('UPDATE pedidos SET status = ? WHERE id = ?').run('aprovado', id)
    
    res.json({ message: 'Pedido desfaturado com sucesso' })
  } catch (error) {
    console.error('Erro ao desfaturar pedido:', error)
    res.status(500).json({ error: error.message })
  }
})
`;

// Encontrar onde inserir (após a rota de rejeitar pedido)
const insertAfter = /app\.put\(['"]\/api\/empresas\/:empresaId\/pedidos\/:id\/rejeitar['"][\s\S]*?\}\s*\)\s*\n/;
if (insertAfter.test(serverContent)) {
  serverContent = serverContent.replace(insertAfter, match => match + routesToAdd);
  console.log('✅ Rotas de faturamento adicionadas');
} else {
  console.log('⚠️  Não foi possível encontrar o local exato, adicionando no final das rotas de pedidos');
  // Adicionar antes do final do arquivo
  const beforeEnd = serverContent.lastIndexOf('// Iniciar servidor');
  if (beforeEnd > 0) {
    serverContent = serverContent.slice(0, beforeEnd) + routesToAdd + '\n' + serverContent.slice(beforeEnd);
  }
}

// Salvar
fs.writeFileSync(serverPath, serverContent);
console.log('\n✅ Rotas adicionadas com sucesso!');
console.log('\n📝 Rotas criadas:');
console.log('   - PUT /api/empresas/:id/pedidos/:id/faturar');
console.log('   - PUT /api/empresas/:id/pedidos/:id/desfaturar');
console.log('\n🔧 Funcionalidades:');
console.log('   - Faturar: cria registro em "financeiro" (contas a receber)');
console.log('   - Desfaturar: remove registro financeiro e volta status para "aprovado"');
console.log('\n🚀 Reinicie o backend:');
console.log('   npm start');
console.log('\n💾 Backup salvo em:', backupPath);