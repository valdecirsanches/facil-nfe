#🎯 REGRAS DO DESTINATÁRIO - NFe 4.0

## ✅ Tag `<indIEDest>` - Indicador da IE do Destinatário

| Código | Descrição | Quando Usar |
|--------|-----------|-------------|
| **1** | Contribuinte ICMS | Destinatário PJ **COM** Inscrição Estadual |
| **2** | Contribuinte isento | Destinatário PJ **ISENTO** de IE |
| **9** | Não Contribuinte | Destinatário PF (CPF) **OU** PJ **SEM** IE |

### 📋 Regras de Uso:

**Para Pessoa Física (CPF):**
```xml
<dest>
  <CPF>12345678901</CPF>
  <xNome>João da Silva</xNome>
  ...
  <indIEDest>9</indIEDest>
</dest>
```

**Para Pessoa Jurídica SEM IE:**
```xml
<dest>
  <CNPJ>12345678000190</CNPJ>
  <xNome>Empresa LTDA</xNome>
  ...
  <indIEDest>9</indIEDest>
</dest>
```

**Para Pessoa Jurídica COM IE:**
```xml
<dest>
  <CNPJ>12345678000190</CNPJ>
  <xNome>Empresa LTDA</xNome>
  ...
  <IE>123456789</IE>
  <indIEDest>1</indIEDest>
</dest>
```

**Para Pessoa Jurídica ISENTA:**
```xml
<dest>
  <CNPJ>12345678000190</CNPJ>
  <xNome>Empresa LTDA</xNome>
  ...
  <IE>ISENTO</IE>
  <indIEDest>2</indIEDest>
</dest>
```

---

## ✅ Ordem Correta das Tags de Impostos

**ORDEM OBRIGATÓRIA segundo o Schema XSD:**

```xml
<imposto>
  <ICMS>...</ICMS>
  <IPI>...</IPI>
  <II>...</II>           <!-- Opcional -->
  <ISSQN>...</ISSQN>     <!-- Opcional -->
  <PIS>...</PIS>
  <PISST>...</PISST>     <!-- Opcional -->
  <COFINS>...</COFINS>
  <COFINSST>...</COFINSST> <!-- Opcional -->
  <ICMSUFDest>...</ICMSUFDest> <!-- Opcional -->
</imposto>
```

### ⚠️ IMPORTANTE:
- A ordem **DEVE** ser respeitada
- Tags opcionais podem ser omitidas
- Mas se presentes, devem estar na ordem correta

---

## 📊 Exemplo Completo - Destinatário PJ sem IE:

```xml
<dest>
  <CNPJ>30511823000142</CNPJ>
  <xNome>OSAEL SANTOS OLIVEIRA LTDA</xNome>
  <enderDest>
    <xLgr>Rua Dália Formosa</xLgr>
    <nro>112</nro>
    <xBairro>Santa Maria</xBairro>
    <cMun>3550308</cMun>
    <xMun>Osasco</xMun>
    <UF>SP</UF>
    <CEP>06150495</CEP>
    <cPais>1058</cPais>
    <xPais>Brasil</xPais>
  </enderDest>
  <indIEDest>9</indIEDest>
</dest>
```

---

## 🎯 Lógica de Decisão:

```
SE destinatário é PF (CPF):
  → indIEDest = 9
  → NÃO incluir tag <IE>

SE destinatário é PJ (CNPJ):
  SE tem IE válida:
    → indIEDest = 1
    → incluir <IE>número</IE>
  
  SE é isento de IE:
    → indIEDest = 2
    → incluir <IE>ISENTO</IE>
  
  SE não tem IE:
    → indIEDest = 9
    → NÃO incluir tag <IE>
```

---

## ✅ Checklist de Validação:

- [ ] Tipo de documento correto (CPF ou CNPJ)
- [ ] indIEDest correto (1, 2 ou 9)
- [ ] Tag `<IE>` presente quando indIEDest = 1 ou 2
- [ ] Tag `<IE>` ausente quando indIEDest = 9
- [ ] Ordem dos impostos correta (ICMS → IPI → PIS → COFINS)
- [ ] Todos os campos obrigatórios preenchidos

---

## 🚀 Implementação no Sistema:

O sistema agora:
- ✅ Detecta automaticamente CPF vs CNPJ
- ✅ Usa indIEDest = 9 para todos (padrão mais comum)
- ✅ Ordem correta dos impostos (ICMS, IPI, PIS, COFINS)
- ✅ Não inclui tag `<IE>` no destinatário (padrão)

**Para casos especiais (destinatário com IE), será necessário ajuste manual no XML.**
