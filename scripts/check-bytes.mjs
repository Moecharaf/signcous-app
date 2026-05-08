import { readFileSync, readdirSync } from 'fs';
const d = 'C:/Users/User/Documents/Signcous2/signcous-app/src/components/product-builder/';
const files = readdirSync(d).filter(f => f.endsWith('.tsx') && f.includes('Builder'));

const failing = ['AcrylicBuilder','AluminumBuilder','BootprintsBuilder','CoroBuilder','CustomMagnetBuilder'];

for (const f of files) {
  const name = f.replace('.tsx','');
  if (!files.includes(f)) continue;
  const buf = readFileSync(d + f);
  // Check first 5 bytes for BOM or unusual chars
  const firstBytes = [...buf.slice(0,10)].map(b => b.toString(16).padStart(2,'0')).join(' ');
  const isWorking = !failing.includes(name);
  
  // Also check for \r\n vs \n
  const content = buf.toString('utf8');
  const hasCRLF = content.includes('\r\n');
  const hasCR = content.includes('\r');
  
  console.log(`${isWorking ? '✓' : '✗'} ${name}: bytes[0:10]=${firstBytes} CRLF=${hasCRLF} CR=${hasCR}`);
}
