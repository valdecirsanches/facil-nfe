#!/bin/bash

echo "🔍 VERIFICANDO LINHAS COM parseFloat..."
echo ""

grep -n "qCom:" nfe_service.js | head -5

echo ""
echo "🔍 VERIFICANDO LINHAS COM vProd:"
echo ""

grep -n "vProd:" nfe_service.js | head -5

echo ""
echo "🔍 VERIFICANDO LINHAS COM tPag:"
echo ""

grep -n "tPag:" nfe_service.js | head -5
