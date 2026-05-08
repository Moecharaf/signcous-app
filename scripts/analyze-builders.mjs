import { readFileSync } from 'fs';

const dir = 'C:/Users/User/Documents/Signcous2/signcous-app/src/components/product-builder/';

// Check for common issues
const builders = ['AcrylicBuilder','AluminumBuilder','BootprintsBuilder','CoroBuilder','CustomMagnetBuilder'];
const working = ['PvcBuilder','GF2030Builder','WindowClingBuilder','HdpeBuilder','DryEraseBuilder'];

for (const b of [...builders, ...working]) {
  const content = readFileSync(dir + b + '.tsx', 'utf8');
  const lines = content.split('\n');
  
  // Find if file has regex patterns (actual /regex/ syntax)
  const hasRegex = lines.filter((l, i) => {
    // Look for lines with / that could be regex (not in comments, not JSX closing/self-closing tags)
    const trimmed = l.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return false;
    // Check for regex-like patterns: /something/ not preceded by < 
    const hasSlash = /(?<![<"'/])\/(?![/*>])/.test(l);
    return hasSlash && !l.includes('href=') && !l.includes('src=') && !l.includes('</') && !l.includes('/>');
  });
  
  // Count the CTA section
  const ctaStart = lines.findIndex(l => l.includes('STICKY CTA'));
  const totalLines = lines.length;
  
  console.log(`${b}: ${totalLines} lines, CTA at L${ctaStart+1}, regex-like lines: ${hasRegex.length}`);
  if (hasRegex.length > 0) {
    hasRegex.slice(0,3).forEach((l, i) => {
      const lineNum = lines.indexOf(l) + 1;
      console.log(`  L${lineNum}: ${l.trim().substring(0,90)}`);
    });
  }
}
