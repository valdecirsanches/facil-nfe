const fs = require('fs')

const path = require('path')

console.log('🧹 LIMPANDO TODAS AS ROTAS DUPLICADAS...\n')

const serverPath = path.join(__dirname, 'server.js')

let content = fs.readFileSync(serverPath, 'utf8')

// Backup

const backupPath = serverPath + '.backup-' + Date.now()

fs.writeFileSync(backupPath, content)

console.log('✅ Backup criado:', backupPath)

// Contar duplicatas

const faturarCount = (content.match(/app\.put\(['"]\/api\/empresas\/:empresaId\/pedidos\/:id\/faturar['"]/g) || []).length

const desfaturarCount = (content.match(/app\.put\(['"]\/api\/empresas\/:empresaId\/pedidos\/:id\/desfaturar['"]/g) || []).length

console.log(`\n📊 Encontradas:`)

console.log(`   - ${faturarCount} rotas /faturar`)

console.log(`   - ${desfaturarCount} rotas /desfaturar`)

if (faturarCount <= 1 && desfaturarCount <= 1) {

  console.log('\n✅ Não há duplicatas!')

  process.exit(0)

}

console.log('\n🔧 Removendo duplicatas...')

// Estratégia: Encontrar TODAS as rotas de faturamento e remover

// Depois adicionar apenas UMA versão correta no final

const lines = content.split('\n')

const newLines = []

let skipUntilLine = -1

let insideFaturamentoRoute = false

let routeStartLine = -1

for (let i = 0; i < lines.length; i++) {

  const line = lines[i]

  

  // Detectar início de rota de faturamento

  if (line.includes("app.put('/api/empresas/:empresaId/pedidos/:id/faturar'") ||

      line.includes('app.put("/api/empresas/:empresaId/pedidos/:id/faturar"') ||

      line.includes("app.put('/api/empresas/:empresaId/pedidos/:id/desfaturar'") ||

      line.includes('app.put("/api/empresas/:empresaId/pedidos/:id/desfaturar"')) {

    

    if (!insideFaturamentoRoute) {

      insideFaturamentoRoute = true

      routeStartLine = i

      console.log(`   Removendo rota na linha ${i + 1}`)

    }

    continue

  }

  

  // Se estamos dentro de uma rota de faturamento, procurar o final

  if (insideFaturamentoRoute) {

    // Procurar o fechamento da rota (})

    if (line.trim() === '})') {

      insideFaturamentoRoute = false

      continue

    }

    // Pular todas as linhas da rota

    continue

  }

  

  newLines.push(line)

}

// Adicionar as rotas corretas no final (antes do app.listen)

const listenIndex = newLines.findIndex(line => line.includes('app.listen'))

if (listenIndex === -1) {

  console.log('❌ Não encontrei app.listen! Adicionando no final...')

  newLines.push('')

} else {

  console.log(`✅ Encontrei app.listen na linha ${listenIndex + 1}`)

}

const insertIndex = listenIndex === -1 ? newLines.length : listenIndex

// Rotas corretas

const rotasCorretas = `

// Faturar pedido (cria registro financeiro)

app.put('/api/empresas/:empresaId/pedidos/:id/faturar', authenticateToken, async (req, res) => {

  try {

    const { empresaId, id } = req.params

    const db = getDatabase(empresaId)

    // Verificar se pedido existe e está aprovado

    const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(id)

    if (!pedido) {

      return res.status(404).json({ error: 'Pedido não encontrado' })

    }

    if (pedido.status !== 'aprovado') {

      return res.status(400).json({ error: 'Apenas pedidos aprovados podem ser faturados' })

    }

    // Atualizar status do pedido

    db.prepare('UPDATE pedidos SET status = ? WHERE id = ?').run('faturado', id)

    // Criar registro financeiro

    const cliente = db.prepare('SELECT razao_social FROM clientes WHERE id = ?').get(pedido.cliente_id)

    

    db.prepare(\`

      INSERT INTO financeiro (

        tipo, descricao, cliente_fornecedor, valor,

        data_vencimento, status, forma_pagamento, pedido_id

      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)

    \`).run(

      'receber',

      \`Pedido \${pedido.numero}\`,

      cliente?.razao_social || 'Cliente',

      pedido.valor_final,

      pedido.data_entrega || new Date().toISOString().split('T')[0],

      'pendente',

      'A definir',

      id

    )

    res.json({ message: 'Pedido faturado com sucesso' })

  } catch (error) {

    console.error('Erro ao faturar pedido:', error)

    res.status(500).json({ error: 'Erro ao faturar pedido' })

  }

})

// Desfaturar pedido (remove registro financeiro)

app.put('/api/empresas/:empresaId/pedidos/:id/desfaturar', authenticateToken, async (req, res) => {

  try {

    const { empresaId, id } = req.params

    const db = getDatabase(empresaId)

    // Verificar se pedido existe e está faturado

    const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(id)

    if (!pedido) {

      return res.status(404).json({ error: 'Pedido não encontrado' })

    }

    if (pedido.status !== 'faturado') {

      return res.status(400).json({ error: 'Apenas pedidos faturados podem ser desfaturados' })

    }

    // Verificar se não tem NFe gerada

    const nfe = db.prepare('SELECT * FROM nfes WHERE pedido_id = ?').get(id)

    if (nfe) {

      return res.status(400).json({ error: 'Não é possível desfaturar pedido com NFe gerada' })

    }

    // Atualizar status do pedido

    db.prepare('UPDATE pedidos SET status = ? WHERE id = ?').run('aprovado', id)

    // Remover registro financeiro

    db.prepare('DELETE FROM financeiro WHERE pedido_id = ?').run(id)

    res.json({ message: 'Pedido desfaturado com sucesso' })

  } catch (error) {

    console.error('Erro ao desfaturar pedido:', error)

    res.status(500).json({ error: 'Erro ao desfaturar pedido' })

  }

})

`

newLines.splice(insertIndex, 0, rotasCorretas)

// Salvar

fs.writeFileSync(serverPath, newLines.join('\n'))

console.log('\n✅ Rotas duplicadas removidas!')

console.log('✅ Rotas corretas adicionadas!')

console.log('\n🚀 Reinicie o backend:')

console.log('   npm start')

console.log('\n💾 Backup salvo em:', backupPath)