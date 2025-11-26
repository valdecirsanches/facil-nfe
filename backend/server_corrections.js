//===== CORREÇÕES PARA ADICIONAR AO SERVER.JS =====

// 1️⃣ IMPEDIR DOWNGRADE DE PLANO
// Substituir a rota PUT /api/empresas/:empresaId/plano existente por:

/*
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
*/

// 2️⃣ EXCLUIR EMPRESA (SUPER USUÁRIO)
// Adicionar esta rota após as rotas de empresas:

/*
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
*/

// 3️⃣ CORRIGIR LOGIN - VERIFICAR USUÁRIO ATIVO
// Substituir a rota POST /api/auth/login existente por:

/*
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
*/

console.log('📝 Correções documentadas. Aplicar manualmente ao server.js');