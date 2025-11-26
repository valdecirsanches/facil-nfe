#!/usr/bin/env python3
"""
Script de teste para o Python Signer
"""

import requests
import json

# XML de teste simples
test_xml = '''<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe Id="NFe35251167570036000181550010000000011426495490" versao="4.00">
    <ide>
      <cUF>35</cUF>
      <cNF>42649549</cNF>
      <natOp>Venda</natOp>
      <mod>55</mod>
      <serie>1</serie>
      <nNF>1</nNF>
    </ide>
  </infNFe>
</NFe>'''

print("🧪 Testando Python Signer...")
print()

# Teste 1: Health check
print("1️⃣ Teste de Health Check:")
try:
    response = requests.get('http://localhost:5301/health', timeout=5)
    print(f"   Status: {response.status_code}")
    print(f"   Resposta: {response.json()}")
    print("   ✅ Health check OK!")
except Exception as e:
    print(f"   ❌ Erro: {e}")
    exit(1)

print()

# Teste 2: Assinatura
print("2️⃣ Teste de Assinatura:")
print("   ⚠️  Este teste vai falhar (certificado de exemplo)")
print("   Mas deve retornar erro específico, não timeout")

try:
    response = requests.post(
        'http://localhost:5301/sign',
        json={
            'xml': test_xml,
            'cert_path': '/tmp/fake_cert.pfx',
            'cert_password': 'test'
        },
        timeout=10
    )
    
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 404:
        print("   ✅ Resposta esperada: Certificado não encontrado")
    elif response.status_code == 500:
        data = response.json()
        print(f"   ⚠️  Erro: {data.get('error', 'Desconhecido')}")
    else:
        print(f"   Resposta: {response.json()}")
        
except requests.exceptions.Timeout:
    print("   ❌ TIMEOUT! Python Signer não está respondendo rápido o suficiente")
except Exception as e:
    print(f"   ❌ Erro: {e}")

print()
print("✅ Testes concluídos!")
print()
print("📝 Se o health check passou mas a assinatura deu timeout,")
print("   o problema pode ser:")
print("   1. XML muito grande")
print("   2. Processamento lento")
print("   3. Timeout do Node.js muito curto")
