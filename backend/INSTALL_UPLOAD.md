# 📤 Instalação do Sistema de Upload

## Instalar Dependência

```bash
cd backend
npm install multer
npm start
```

## ✅ O que foi implementado:

### **1. Upload de Certificado Digital**
- Rota: `POST /api/empresas/:id/upload/certificado`
- Aceita: `.pfx` ou `.p12`
- Salva em: `Arqs/empresa_X/certificado.pfx`
- Atualiza configuração `certificado_path` automaticamente

### **2. Upload de Logo da Empresa**
- Rota: `POST /api/empresas/:id/upload/logo`
- Aceita: Imagens (jpg, png, gif, etc)
- Salva em: `Arqs/empresa_X/logo.ext`
- Atualiza campo `logo_path` na tabela empresas

### **3. Servir Arquivos Estáticos**
- URL: `http://localhost:3001/arqs/empresa_X/logo.png`
- Acesso direto aos arquivos salvos

## 📁 Estrutura de Pastas:

```
backend/
  Arqs/
    empresa_1/
      certificado.pfx    ← Certificado digital
      logo.png           ← Logo da empresa
      xml/               ← XMLs autorizados
      pdf/               ← DANFEs
      logs/              ← Logs de transmissão
      pendentes/         ← XMLs pendentes
```

## 🔒 Segurança:

- Limite de 10MB por arquivo
- Validação de tipo de arquivo
- Autenticação obrigatória
- Arquivos salvos fora do acesso público direto

## 🚀 Próximo Passo:

Criar componente de upload no frontend!
