const fs = require('fs');
const content = fs.readFileSync('./server.js', 'utf8');
const lines = content.split('\n');
console.log('🔍 Verificando linhas 110-120:\n');
for (let i = 109; i < 120; i++) {
  const lineNum = i + 1;
  const marker = lineNum === 113 ? '>>> ' : '    ';
  console.log(`${marker}${lineNum}: ${lines[i]}`);
}