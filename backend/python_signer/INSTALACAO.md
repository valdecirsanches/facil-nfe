#🐍 INSTALAÇÃO DO MICROSERVIÇO PYTHON

## 📋 PRÉ-REQUISITOS:

```bash
# Python 3.8 ou superior
python3 --version

# pip
pip3 --version
```

---

## 🚀 INSTALAÇÃO:

### **1. Criar ambiente virtual:**
```bash
cd ~/Magic/nfe/src/backend/python_signer
python3 -m venv venv
source venv/bin/activate
```

### **2. Instalar dependências:**
```bash
pip install -r requirements.txt
```

### **3. Testar instalação:**
```bash
python3 signer.py
```

Deve aparecer:
```
🐍 Python NFe Signer rodando na porta 5301
📡 Endpoint: http://localhost:5301/sign
```

---

## ✅ TESTAR O SERVIÇO:

```bash
# Em outro terminal
curl http://localhost:5301/health
```

Deve retornar:
```json
{"status":"ok","service":"NFe Python Signer"}
```

---

## 🔧 INTEGRAÇÃO COM NODE.JS:

O Node.js vai chamar este serviço para assinar o XML:

```javascript
// backend/nfe_service.js
async assinarXMLComPython(xml, empresaId) {
  const certPath = path.join(__dirname, 'Arqs', `empresa_${empresaId}`, 'certificado.pfx');
  
  const response = await axios.post('http://localhost:5301/sign', {
    xml: xml,
    cert_path: certPath,
    cert_password: senha
  });
  
  return response.data.signed_xml;
}
```

---

## 📊 VANTAGENS:

1. ✅ **signxml** é biblioteca madura e testada
2. ✅ **C14N** implementado corretamente
3. ✅ **SHA-1** compatível com SEFAZ
4. ✅ **100% de compatibilidade** com outros apps

---

## 🆘 TROUBLESHOOTING:

### **Erro: lxml não instala**
```bash
# Ubuntu/Debian
sudo apt-get install python3-dev libxml2-dev libxslt1-dev

# Fedora/CentOS
sudo yum install python3-devel libxml2-devel libxslt-devel
```

### **Erro: cryptography não instala**
```bash
# Ubuntu/Debian
sudo apt-get install build-essential libssl-dev libffi-dev

# Fedora/CentOS
sudo yum install gcc openssl-devel libffi-devel
```

---

## 🎯 PRÓXIMOS PASSOS:

1. ✅ Instale o Python signer
2. ✅ Teste com `curl`
3. ✅ Integre com Node.js
4. ✅ Emita NFe
5. ✅ **DEVE SER AUTORIZADA!** 🎉
