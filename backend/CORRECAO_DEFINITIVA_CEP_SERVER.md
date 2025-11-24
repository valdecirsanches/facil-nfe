#🔧 CORREÇÃO DEFINITIVA - CEP NO SERVER.JS

## 🎯 PROBLEMA IDENTIFICADO

O CEP está sendo convertido para número em algum ponto, perdendo o zero à esquerda.

**Exemplo:**
- Frontend envia: `"06056230"` (string)
- Backend recebe: pode vir como `6056230` (número) ou `"06056230"` (string)
- SQLite salva: se vier como número, salva `6056230` (perde o zero)

---

## ✅ SOLUÇÃO

Adicionar **middleware de sanitização** no server.js que garante que CEP seja SEMPRE string antes de salvar no banco.

---

## 📝 CÓDIGO A ADICIONAR NO SERVER.JS

### 1. Adicionar Função de Sanitização (após os imports)

```javascript
// ===== FUNÇÃO PARA GARANTIR CEP COMO STRING =====
function sanitizeCEP(cep) {
  if (!cep) return '';
  // Converter para string e garantir 8 dígitos
  const cepString = String(cep).replace(/\D/g, '');
  return cepString.padStart(8, '0');
}
```

### 2. Aplicar em TODAS as Rotas de POST/PUT

#### Rota: POST /api/empresas
```javascript
app.post('/api/empresas', authenticateToken, (req, res) => {
  try {
    // SANITIZAR CEP ANTES DE SALVAR
    const cepSanitizado = sanitizeCEP(req.body.cep);
    
    const result = mainDb.prepare(`
      INSERT INTO empresas (razao_social, nome_fantasia, cnpj, ie, crt, endereco, numero, cidade, estado, cep, telefone, email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.body.razao_social, req.body.nome_fantasia, req.body.cnpj, req.body.ie, req.body.crt || '1',
      req.body.endereco, req.body.numero, req.body.cidade, req.body.estado,
      cepSanitizado, // <-- USAR CEP SANITIZADO
      req.body.telefone, req.body.email
    );
    
    getCompanyDb(result.lastInsertRowid);
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### Rota: PUT /api/empresas/:id
```javascript
app.put('/api/empresas/:id', authenticateToken, (req, res) => {
  try {
    // SANITIZAR CEP ANTES DE SALVAR
    const cepSanitizado = sanitizeCEP(req.body.cep);
    
    mainDb.prepare(`
      UPDATE empresas 
      SET razao_social = ?, nome_fantasia = ?, cnpj = ?, ie = ?, crt = ?, endereco = ?, numero = ?, cidade = ?, estado = ?, cep = ?, telefone = ?, email = ?
      WHERE id = ?
    `).run(
      req.body.razao_social, req.body.nome_fantasia, req.body.cnpj, req.body.ie, req.body.crt || '1',
      req.body.endereco, req.body.numero, req.body.cidade, req.body.estado,
      cepSanitizado, // <-- USAR CEP SANITIZADO
      req.body.telefone, req.body.email, req.params.id
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### Rota: POST /api/empresas/:empresaId/clientes
```javascript
app.post('/api/empresas/:empresaId/clientes', authenticateToken, (req, res) => {
  try {
    const db = getCompanyDb(req.params.empresaId);
    
    // SANITIZAR CEP ANTES DE SALVAR
    const cepSanitizado = sanitizeCEP(req.body.cep);
    
    const result = db.prepare(`
      INSERT INTO clientes (tipo_documento, documento, razao_social, nome_fantasia, ie, endereco, numero, complemento, bairro, cidade, uf, cep, telefone, email, transportadora_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.body.tipo_documento, req.body.documento, req.body.razao_social, req.body.nome_fantasia, req.body.ie,
      req.body.endereco, req.body.numero, req.body.complemento, req.body.bairro, req.body.cidade, req.body.uf,
      cepSanitizado, // <-- USAR CEP SANITIZADO
      req.body.telefone, req.body.email, req.body.transportadora_id
    );
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### Rota: PUT /api/empresas/:empresaId/clientes/:id
```javascript
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
    `).run(
      req.body.tipo_documento, req.body.documento, req.body.razao_social, req.body.nome_fantasia, req.body.ie,
      req.body.endereco, req.body.numero, req.body.complemento, req.body.bairro, req.body.cidade, req.body.uf,
      cepSanitizado, // <-- USAR CEP SANITIZADO
      req.body.telefone, req.body.email, req.body.transportadora_id, req.params.id
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### Rotas de Transportadoras (POST e PUT)
```javascript
// POST transportadoras
const cepSanitizado = sanitizeCEP(req.body.cep);
// ... usar cepSanitizado no INSERT

// PUT transportadoras
const cepSanitizado = sanitizeCEP(req.body.cep);
// ... usar cepSanitizado no UPDATE
```

#### Rotas de Endereços de Entrega (POST e PUT)
```javascript
// POST enderecos_entrega
const cepSanitizado = sanitizeCEP(req.body.cep);
// ... usar cepSanitizado no INSERT

// PUT enderecos_entrega
const cepSanitizado = sanitizeCEP(req.body.cep);
// ... usar cepSanitizado no UPDATE
```

---

## 🎯 RESULTADO ESPERADO

### Antes:
```
Frontend → "06056230" (string)
Backend → 6056230 (número)
SQLite → 6056230 (perde zero)
XML → <CEP>6056230</CEP> ❌
```

### Depois:
```
Frontend → "06056230" (string)
Backend → sanitizeCEP() → "06056230" (string garantida)
SQLite → "06056230" (mantém zero)
XML → <CEP>06056230</CEP> ✅
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] 1. Adicionar função `sanitizeCEP()` no início do server.js
- [ ] 2. Aplicar em POST /api/empresas
- [ ] 3. Aplicar em PUT /api/empresas/:id
- [ ] 4. Aplicar em POST /api/empresas/:empresaId/clientes
- [ ] 5. Aplicar em PUT /api/empresas/:empresaId/clientes/:id
- [ ] 6. Aplicar em POST /api/empresas/:empresaId/transportadoras
- [ ] 7. Aplicar em PUT /api/empresas/:empresaId/transportadoras/:id
- [ ] 8. Aplicar em POST /api/empresas/:empresaId/clientes/:clienteId/enderecos
- [ ] 9. Aplicar em PUT /api/empresas/:empresaId/clientes/:clienteId/enderecos/:id
- [ ] 10. Executar `node CORRIGIR_CEP_BANCO_FINAL.js` para corrigir dados existentes
- [ ] 11. Reiniciar backend: `npm start`
- [ ] 12. Testar cadastro de empresa/cliente
- [ ] 13. Verificar XML gerado

---

## 🚀 PASSOS PARA APLICAR

```bash
# 1. Executar diagnóstico
cd backend
node DIAGNOSTICO_CEP_COMPLETO.js

# 2. Aplicar correções no server.js (manual)
# - Adicionar função sanitizeCEP
# - Aplicar em todas as rotas POST/PUT que salvam CEP

# 3. Corrigir dados existentes
node CORRIGIR_CEP_BANCO_FINAL.js

# 4. Reiniciar backend
npm start

# 5. Testar
# - Cadastrar nova empresa com CEP 06056230
# - Emitir NFe
# - Verificar XML: <CEP>06056230</CEP>
```

---

## ⚠️ IMPORTANTE

Esta correção garante que:
1. ✅ CEP sempre será string no banco
2. ✅ CEP sempre terá 8 dígitos (adiciona zeros à esquerda)
3. ✅ Não importa como o frontend envia (string ou número)
4. ✅ XML sempre terá CEP correto

---

**Data:** 2024  
**Status:** 🔴 AGUARDANDO IMPLEMENTAÇÃO  
**Prioridade:** 🔥 CRÍTICA - Bloqueia emissão de NFe
