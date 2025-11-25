#!/bin/bash

echo "🚀 CONFIGURANDO AMBIENTE DE DESENVOLVIMENTO"
echo ""

# 1. Configurar Git
echo "1️⃣ Configurando Git..."
cd /home/sanches/Magic/nfe/src

if [ ! -d ".git" ]; then
    git init
    echo "✅ Git inicializado"
else
    echo "✅ Git já está inicializado"
fi

# Criar .gitignore se não existir
if [ ! -f ".gitignore" ]; then
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
backend/node_modules/

# Build
build/
dist/

# Environment
.env
backend/.env

# Database
*.db
backend/*.db

# Logs
*.log
backend/Arqs/*/logs/

# Certificates (NUNCA commitar certificados!)
backend/Arqs/*/certificado.pfx
backend/Arqs/*/certificado.pem

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
EOF
    echo "✅ .gitignore criado"
else
    echo "✅ .gitignore já existe"
fi

# Commit inicial
if [ -z "$(git log 2>/dev/null)" ]; then
    git add .
    git commit -m "Estado inicial - Sistema NFe funcionando"
    echo "✅ Commit inicial criado"
else
    echo "✅ Já existem commits"
fi

# 2. Instalar nodemon no backend
echo ""
echo "2️⃣ Instalando nodemon para reload automático..."
cd backend

if ! grep -q "nodemon" package.json; then
    npm install --save-dev nodemon
    echo "✅ Nodemon instalado"
else
    echo "✅ Nodemon já está instalado"
fi

# 3. Atualizar package.json com script dev
echo ""
echo "3️⃣ Configurando scripts de desenvolvimento..."

# Backup do package.json
cp package.json package.json.backup

# Adicionar script dev se não existir
if ! grep -q '"dev"' package.json; then
    # Usar node para editar JSON corretamente
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.scripts = pkg.scripts || {};
    pkg.scripts.dev = 'nodemon server.js';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
    echo "✅ Script 'dev' adicionado ao package.json"
else
    echo "✅ Script 'dev' já existe"
fi

echo ""
echo "✅ CONFIGURAÇÃO CONCLUÍDA!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1️⃣ Iniciar backend com reload automático:"
echo "   cd /home/sanches/Magic/nfe/src/backend"
echo "   npm run dev"
echo ""
echo "2️⃣ Iniciar frontend (em outro terminal):"
echo "   cd /home/sanches/Magic/nfe/src"
echo "   npm start"
echo ""
echo "3️⃣ Quando eu fizer modificações:"
echo "   - Copie o arquivo editado"
echo "   - Cole no seu projeto"
echo "   - Git mostrará as mudanças: git diff"
echo "   - Commit: git add . && git commit -m 'Descrição'"
echo ""
echo "🎉 Ambiente configurado com sucesso!"
