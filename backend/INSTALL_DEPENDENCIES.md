# Instalação de Dependências para Transmissão Real de NFe

## 📦 Instalar Pacotes Necessários

Execute no diretório `backend`:

```bash
npm install axios xml2js node-forge fast-xml-parser
```

## 🔧 Pacotes Instalados:

- **axios**: Cliente HTTP para comunicação com SEFAZ
- **xml2js**: Parser de XML
- **node-forge**: Criptografia e assinatura digital
- **fast-xml-parser**: Parser/Builder de XML rápido

## 🚀 Após Instalar:

```bash
npm start
```

## ✅ O que foi implementado:

1. **Geração de XML NFe 4.0** (padrão oficial)
2. **Chave de acesso** calculada corretamente
3. **Assinatura digital** (estrutura pronta para certificado A1)
4. **Comunicação SOAP** com webservices SEFAZ
5. **Ambiente de homologação** configurado
6. **Salvamento de arquivos** (XML, logs)
7. **Consulta de status** da SEFAZ

## 🌐 Endpoints SEFAZ Homologação:

- Autorização NFe
- Consulta Protocolo
- Status do Serviço
- Retorno de Autorização

## 📝 Próximos Passos para Produção:

1. Obter certificado digital A1 (.pfx)
2. Implementar assinatura com certificado
3. Configurar ambiente de produção
4. Validar com SEFAZ do seu estado
5. Testar em homologação antes de produção
