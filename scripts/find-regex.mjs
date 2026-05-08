import { readFileSync } from 'fs';
const d = 'C:/Users/User/Documents/Signcous2/signcous-app/src/components/product-builder/';

// Compare CoroBuilder vs PvcBuilder to find what's different
const coro = readFileSync(d + 'CoroBuilder.tsx', 'utf8');
const pvc = readFileSync(d + 'PvcBuilder.tsx', 'utf8');

// Find lines in coro that aren't in pvc (after stripping whitespace)
const coroLines = coro.split('\n').map(l => l.trim());
const pvcLines = pvc.split('\n').map(l => l.trim());
const pvcSet = new Set(pvcLines);

console.log('=== Lines unique to CoroBuilder (not in PvcBuilder) ===');
let inReturn = false;
const fullCoroLines = coro.split('\n');
fullCoroLines.forEach((l, i) => {
  const t = l.trim();
  if (t.includes('return (')) inReturn = true;
  if (!inReturn) return;
  if (!pvcSet.has(t) && t.length > 10) {
    // Check for regex-like patterns
    if (/\/[^/*\s"'<>]/.test(t) && !t.includes('className') && !t.includes('href') && !t.includes('src=')) {
      console.log('POTENTIAL REGEX L' + (i+1) + ': ' + l);
    }
  }
});

// Also find regex patterns in non-JSX code (before return)
const beforeReturn = fullCoroLines.slice(0, fullCoroLines.findIndex(l => l.includes('return (')));
beforeReturn.forEach((l, i) => {
  const t = l.trim();
  if (t.startsWith('//') || t.startsWith('*')) return;
  if (/[^<]\/[^/*\s"'><]/.test(t) && !t.includes('className') && !t.includes('href')) {
    console.log('PRE-RETURN POTENTIAL L' + (i+1) + ': ' + l);
  }
});
