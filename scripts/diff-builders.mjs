import { readFileSync } from 'fs';
const d = 'C:/Users/User/Documents/Signcous2/signcous-app/src/components/product-builder/';

const failing = ['AcrylicBuilder','AluminumBuilder','BootprintsBuilder','CoroBuilder','CustomMagnetBuilder'];
const working = ['PvcBuilder','FoamcoreBuilder','PolystyreneBuilder','GF2030Builder','JBondBuilder'];

const all = [...failing, ...working];

for (const b of all) {
  const c = readFileSync(d + b + '.tsx', 'utf8');
  const isWorking = working.includes(b);
  const markers = {
    hasLink: c.includes('from "next/link"'),
    hasBreadcrumb: c.includes('Breadcrumb') || c.includes('<nav aria-label'),
    hasSection: c.includes('<section'),
    hasImage: c.includes('from "next/image"'),
    hasAcrylicCanvas: c.includes('AcrylicCanvas'),
    hasFormatInches: c.includes('formatInches'),
    hasMm: c.includes('"4mm"') || c.includes('value="'),
    hasGrid: c.includes('grid-cols'),
    hasUseRef: c.includes('useRef'),
    hasUseMemo: c.includes('useMemo'),
    hasUseCallback: c.includes('useCallback'),
  };
  const flag = isWorking ? '✓' : '✗';
  const unique = Object.entries(markers).filter(([k,v]) => v).map(([k]) => k).join(', ');
  console.log(`${flag} ${b}: ${unique}`);
}
