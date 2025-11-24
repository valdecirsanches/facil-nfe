#!/bin/bash

echo "🔄 REINICIANDO BACKEND COMPLETAMENTE..."
echo ""

# Matar TODOS os processos Node.js
echo "🛑 Matando processos Node.js..."
pkill -9 node
sleep 2

# Verificar se ainda há processos
if pgrep node > /dev/null; then
    echo "⚠️  Ainda há processos Node.js rodando!"
    ps aux | grep node
else
    echo "✅ Todos os processos Node.js foram encerrados"
fi

echo ""
echo "🚀 Iniciando backend novamente..."
echo ""

# Iniciar backend
npm start
