import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const dir = 'C:\\Users\\User\\Documents\\Signcous2\\signcous-app\\src\\components\\product-builder';
const files = readdirSync(dir).filter(f => f.endsWith('.tsx'));

let fixed = 0;
for (const file of files) {
  const fpath = join(dir, file);
  const content = readFileSync(fpath, 'utf8');
  if (content.includes('\u2713')) {
    const updated = content.replace(/\u2713\s*/g, '');
    writeFileSync(fpath, updated, 'utf8');
    console.log(`Fixed: ${file}`);
    fixed++;
  }
}
console.log(`Done: ${fixed} files fixed`);
