#🎯 SOLUÇÃO FINAL SIMPLES

## O PROBLEMA REAL:
Configurações não estão sendo salvas no banco `empresa_X.db`

## SOLUÇÃO DIRETA:

### 1️⃣ Criar tabela manualmente (AGORA):
```bash
cd backend
node -e "
const Database = require('better-sqlite3');
const fs = require('fs');

// Pegar todas as empresas
const mainDb = new Database('./principal.db');
const empresas = mainDb.prepare('SELECT id FROM empresas').all();
mainDb.close();

console.log('Criando tabela configuracoes em cada empresa...\n');

empresas.forEach(emp => {
  const db = new Database(\`./empresa_\${emp.id}.db\`);
  
  // Dropar tabela antiga se existir
  db.exec('DROP TABLE IF EXISTS configuracoes');
  
  // Criar tabela nova
  db.exec(\`
    CREATE TABLE configuracoes (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      sefaz_ambiente INTEGER DEFAULT 2,
      sefaz_uf TEXT DEFAULT 'SP',
      certificado_tipo TEXT DEFAULT 'A1',
      certificado_senha TEXT DEFAULT '',
      certificado_path TEXT DEFAULT '',
      serie_nfe INTEGER DEFAULT 1,
      proximo_numero INTEGER DEFAULT 1,
      email_smtp_host TEXT DEFAULT '',
      email_smtp_port INTEGER DEFAULT 587,
      email_smtp_user TEXT DEFAULT '',
      email_smtp_pass TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  \`);
  
  // Inserir registro padrão
  db.exec('INSERT INTO configuracoes (id) VALUES (1)');
  
  console.log(\`✅ Empresa \${emp.id}: tabela criada\`);
  db.close();
});

console.log('\n✅ PRONTO! Agora reinicie o backend.');
"
```

### 2️⃣ Reiniciar backend:
```bash
npm start
```

### 3️⃣ Testar:
1. Acesse Config. Sistema
2. Preencha campos
3. Salve
4. Recarregue (F5)
5. ✅ DEVE FUNCIONAR!

---

## SE NÃO FUNCIONAR:

Execute este teste e me envie o resultado:
```bash
node -e "
const Database = require('better-sqlite3');
const db = new Database('./empresa_1.db');

console.log('ANTES:');
const antes = db.prepare('SELECT * FROM configuracoes WHERE id = 1').get();
console.log(antes);

console.log('\nFAZENDO UPDATE...');
db.prepare('UPDATE configuracoes SET certificado_senha = ? WHERE id = 1').run('TESTE123');

console.log('\nDEPOIS:');
const depois = db.prepare('SELECT * FROM configuracoes WHERE id = 1').get();
console.log(depois);

db.close();
"
```
