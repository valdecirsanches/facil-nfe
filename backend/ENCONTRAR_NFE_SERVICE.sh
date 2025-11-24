#!/bin/bash

echo "🔍 PROCURANDO TODAS AS CÓPIAS DE nfe_service.js..."
echo ""

find ~/Magic -name "nfe_service.js" -type f 2>/dev/null

echo ""
echo "📊 Verificando qual está sendo usado:"
echo ""

# Mostrar o caminho completo do arquivo atual
pwd
ls -lh nfe_service.js

echo ""
echo "🔍 Conteúdo da linha 377 (deve ter parseFloat e toFixed):"
sed -n '377p' nfe_service.js
