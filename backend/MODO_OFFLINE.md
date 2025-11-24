#🔄 Modo Offline - Sistema NFe

## O que é o Modo Offline?

Quando a SEFAZ está indisponível (sem internet, servidor fora do ar, etc), o sistema **automaticamente** entra em **modo offline**.

## ✅ O que acontece no Modo Offline?

1. **NFe é gerada normalmente**
   - XML criado com todos os dados
   - Chave de acesso calculada
   - Assinatura digital aplicada

2. **Arquivos salvos localmente**
   - XML salvo em: `Arqs/empresa_X/pendentes/`
   - Log de transmissão criado
   - Status: "Pendente"

3. **Você pode:**
   - ✅ Visualizar a DANFE
   - ✅ Imprimir o documento
   - ✅ Baixar o XML
   - ✅ Reenviar quando a SEFAZ voltar

## 📁 Estrutura de Arquivos

```
backend/Arqs/empresa_1/
├── xml/              ← NFes autorizadas
├── pdf/              ← DANFEs geradas
├── logs/             ← Logs de transmissão
└── pendentes/        ← NFes aguardando envio (MODO OFFLINE)
    └── NFe000001_pendente.xml
```

## 🔄 Como Reenviar NFes Pendentes?

### Opção 1: Automático (Futuro)
O sistema verificará periodicamente e reenviará automaticamente.

### Opção 2: Manual
1. Acesse "Notas Emitidas"
2. Localize NFes com status "Pendente"
3. Clique em "Reenviar"

## 🌐 Quando o Modo Offline é Ativado?

- ❌ Sem conexão com internet
- ❌ SEFAZ fora do ar
- ❌ Timeout na comunicação
- ❌ Erro de DNS (ENOTFOUND)
- ❌ Firewall bloqueando

## ✅ Vantagens do Modo Offline

1. **Nunca perde dados** - Tudo salvo localmente
2. **Continua trabalhando** - Não precisa parar
3. **Reenvio fácil** - Quando SEFAZ voltar
4. **Logs completos** - Sabe exatamente o que aconteceu

## 🔧 Testando o Modo Offline

O modo offline está **ativo agora** porque:
- URL da SEFAZ não está acessível no ambiente de desenvolvimento
- Erro: `ENOTFOUND homologacao.nfe.fazenda.gov.br`

Isso é **normal** em desenvolvimento local!

## 📝 Status das NFes

- **Autorizada** ✅ - Enviada e aprovada pela SEFAZ
- **Pendente** ⏳ - Salva localmente, aguardando envio
- **Processando** 🔄 - Em processo de criação
- **Rejeitada** ❌ - SEFAZ rejeitou (erros nos dados)

## 🚀 Em Produção

Em produção com internet estável:
- Modo offline raramente será ativado
- SEFAZ geralmente está disponível 24/7
- Reenvio automático funcionará

## 💡 Dicas

1. **Sempre verifique** o status da NFe após emissão
2. **Reenvie pendentes** assim que possível
3. **Mantenha backups** da pasta `Arqs/`
4. **Monitore logs** para identificar problemas
