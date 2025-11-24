#!/bin/bash

echo "🧹 LIMPANDO CACHE DO NODE.JS..."
echo ""

# Matar processos
echo "🛑 Matando processos Node.js..."
pkill -9 node
sleep 2

# Limpar cache do Node
echo "🗑️  Limpando cache..."
rm -rf node_modules/.cache
rm -rf .cache

# Limpar require cache (criar script JS)
cat > limpar_require_cache.js << 'EOF'
// Limpar cache do require
Object.keys(require.cache).forEach(key => {
  delete require.cache[key];
});
console.log('✅ Cache do require limpo');
EOF

echo ""
echo "🚀 Iniciando backend com código NOVO..."
echo ""

# Iniciar
npm start
