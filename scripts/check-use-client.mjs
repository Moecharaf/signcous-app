import { readFileSync, readdirSync } from 'fs';
const d = 'C:/Users/User/Documents/Signcous2/signcous-app/src/components/product-builder/';
const files = readdirSync(d).filter(f => f.endsWith('.tsx') && f.includes('Builder'));

const failing = ['AcrylicBuilder','AluminumBuilder','BootprintsBuilder','CoroBuilder','CustomMagnetBuilder'];

for (const f of files) {
  const name = f.replace('.tsx','');
  const content = readFileSync(d + f, 'utf8');
  const lines = content.split('\n');
  const ucLine = lines.findIndex(l => l.includes('"use client"'));
  const isWorking = !failing.includes(name);
  console.log(`${isWorking ? '✓' : '✗'} ${name}: "use client" at L${ucLine+1}, L1="${lines[0].substring(0,50)}"`);
}
