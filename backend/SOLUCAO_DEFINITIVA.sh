#!/bin/bash

echo "🔧 SOLUÇÃO DEFINITIVA - LIMPANDO TUDO E REINICIANDO"
echo ""

# 1. Matar qualquer processo na porta 3001 ou 5300
echo "1️⃣ Matando processos nas portas 3001 e 5300..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5300 | xargs kill -9 2>/dev/null || true
sleep 2

# 2. Limpar cache do Node.js
echo "2️⃣ Limpando cache do Node.js..."
rm -rf node_modules/.cache 2>/dev/null || true
npm cache clean --force 2>/dev/null || true

# 3. Testar geração de XML
echo "3️⃣ Testando geração de XML..."
node TESTAR_XML_GERADO.js

echo ""
echo "✅ Teste concluído!"
echo ""
echo "Se o XML acima está correto (com .0000 e .00), então:"
echo "  1. Altere a porta no server.js para 5300"
echo "  2. Altere a porta no frontend para 5300"
echo "  3. Reinicie: npm start"
echo ""
