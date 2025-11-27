const fs = require('fs');
const path = require('path');
console.log('🔧 Removendo rotas duplicadas de faturamento...\n');
const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Backup
const backupPath = serverPath + '.backup-duplicadas';
fs.writeFileSync(backupPath, serverContent);
console.log('✅ Backup criado:', backupPath);

// Contar quantas vezes as rotas aparecem
const faturarCount = (serverContent.match(/app\.put\(['"]\/api\/empresas\/:empresaId\/pedidos\/:id\/faturar['"]/g) || []).length;
const desfaturarCount = (serverContent.match(/app\.put\(['"]\/api\/empresas\/:empresaId\/pedidos\/:id\/desfaturar['"]/g) || []).length;
console.log(`\n📊 Rotas encontradas:`);
console.log(`   - /faturar: ${faturarCount} vezes`);
console.log(`   - /desfaturar: ${desfaturarCount} vezes`);
if (faturarCount <= 1 && desfaturarCount <= 1) {
  console.log('\n✅ Não há duplicatas! Tudo OK.');
  process.exit(0);
}
console.log('\n⚠️  Duplicatas encontradas! Removendo...');

// Estratégia: manter apenas a primeira ocorrência de cada rota
// Remover tudo entre a segunda ocorrência de "faturar" até o final de "desfaturar"

const lines = serverContent.split('\n');
let inFirstFaturar = false;
let inSecondFaturar = false;
let faturarOccurrences = 0;
let skipUntilLine = -1;
const newLines = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Detectar início de rota faturar
  if (line.includes("app.put('/api/empresas/:empresaId/pedidos/:id/faturar'") || line.includes('app.put("/api/empresas/:empresaId/pedidos/:id/faturar"')) {
    faturarOccurrences++;
    if (faturarOccurrences === 1) {
      // Primeira ocorrência - manter
      newLines.push(line);
      inFirstFaturar = true;
    } else {
      // Segunda ocorrência - começar a pular
      inSecondFaturar = true;
      console.log(`   Removendo rota duplicada na linha ${i + 1}`);
    }
    continue;
  }

  // Se estamos pulando a segunda rota, procurar o final dela
  if (inSecondFaturar) {
    // Procurar o final da segunda rota desfaturar (que vem depois)
    if (line.includes("app.put('/api/empresas/:empresaId/pedidos/:id/desfaturar'") || line.includes('app.put("/api/empresas/:empresaId/pedidos/:id/desfaturar"')) {
      // Encontrou início da segunda desfaturar, continuar pulando
      continue;
    }

    // Procurar o fechamento da rota (})
    if (line.trim() === '})' && skipUntilLine === -1) {
      // Primeiro fechamento após desfaturar
      skipUntilLine = i + 1;
    }
    if (i < skipUntilLine || skipUntilLine === -1) {
      // Ainda está dentro da rota duplicada, pular
      continue;
    } else {
      // Passou da rota duplicada, voltar a adicionar
      inSecondFaturar = false;
    }
  }
  newLines.push(line);
}
serverContent = newLines.join('\n');

// Salvar
fs.writeFileSync(serverPath, serverContent);
console.log('\n✅ Duplicatas removidas!');
console.log('\n🚀 Reinicie o backend:');
console.log('   npm start');
console.log('\n💾 Backup salvo em:', backupPath);