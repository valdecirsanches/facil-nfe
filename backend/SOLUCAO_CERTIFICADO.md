#🔐 Solução: Certificado e Logo não Salvam

## 🎯 PROBLEMA IDENTIFICADO:

As configurações do certificado não estavam sendo salvas porque:
1. ❌ Faltava sistema de upload de arquivos
2. ❌ Campos de texto não são adequados para arquivos
3. ❌ Logo da empresa não tinha campo no banco

## ✅ SOLUÇÃO IMPLEMENTADA:

### **1. Sistema de Upload de Arquivos**

Instalado `multer` para upload:
```bash
cd backend
npm install multer
npm start
```

### **2. Novas Rotas Criadas:**

**Upload de Certificado:**
```
POST /api/empresas/:id/upload/certificado
- Aceita: .pfx ou .p12
- Salva em: Arqs/empresa_X/certificado.pfx
- Atualiza: configuracao 'certificado_path'
```

**Upload de Logo:**
```
POST /api/empresas/:id/upload/logo
- Aceita: imagens (jpg, png, gif, etc)
- Salva em: Arqs/empresa_X/logo.png
- Atualiza: empresas.logo_path
```

### **3. Campo Logo Adicionado:**

Tabela `empresas` agora tem:
```sql
logo_path TEXT
```

### **4. Estrutura de Pastas:**

```
backend/Arqs/empresa_1/
├── certificado.pfx    ← Certificado digital
├── logo.png           ← Logo da empresa
├── xml/               ← XMLs autorizados
├── pdf/               ← DANFEs
├── logs/              ← Logs
└── pendentes/         ← XMLs pendentes
```

## 🚀 PRÓXIMOS PASSOS:

1. ✅ Backend pronto com upload
2. ⏳ Criar componente de upload no frontend
3. ⏳ Testar upload de certificado
4. ⏳ Testar upload de logo

## 🔍 TESTAR SE ESTÁ FUNCIONANDO:

```bash
# 1. Verificar configurações atuais
node test_config.js

# 2. Ver estrutura de pastas
ls -la Arqs/empresa_1/

# 3. Verificar logs do servidor
# Deve mostrar:
# 📤 Upload de arquivos habilitado
# - Certificados: /api/empresas/:id/upload/certificado
# - Logos: /api/empresas/:id/upload/logo
```

## 📝 NOTAS:

- Limite de 10MB por arquivo
- Validação de tipo automática
- Arquivos salvos com segurança
- Caminho atualizado automaticamente no banco

## 🎯 RESULTADO ESPERADO:

Após implementar o frontend:
1. Usuário faz upload do certificado
2. Arquivo salvo em `Arqs/empresa_X/certificado.pfx`
3. Caminho salvo em `configuracoes.certificado_path`
4. Logo salvo em `Arqs/empresa_X/logo.png`
5. Caminho salvo em `empresas.logo_path`
6. Valores persistem após recarregar página
