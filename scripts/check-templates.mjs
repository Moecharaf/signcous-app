import { readFileSync } from 'fs';
const d = 'C:/Users/User/Documents/Signcous2/signcous-app/src/components/product-builder/';

// Check for template literals in JSX that might have complex expressions
const files = ['CoroBuilder', 'PvcBuilder', 'AcrylicBuilder', 'FoamcoreBuilder'];

for (const b of files) {
  const content = readFileSync(d + b + '.tsx', 'utf8');
  const lines = content.split('\n');
  
  // Find template literals in JSX context
  const returnIdx = lines.findIndex((l, i) => i > 200 && l.trim() === 'return (');
  if (returnIdx < 0) continue;
  
  const jsxLines = lines.slice(returnIdx);
  const templateLiterals = jsxLines
    .map((l, i) => ({ line: returnIdx + i + 1, text: l }))
    .filter(({ text }) => text.includes('`') && !text.trim().startsWith('//'));
  
  console.log(`\n=== ${b}: ${templateLiterals.length} template literals in JSX ===`);
  templateLiterals.slice(0, 5).forEach(({ line, text }) => {
    console.log(`  L${line}: ${text.trim().substring(0, 100)}`);
  });
}
