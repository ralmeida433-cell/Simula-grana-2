const fs = require('fs');
const filepath = 'src/components/calculators/GrahamCalculator.tsx';

let content = fs.readFileSync(filepath, 'utf8');
content = content.replace(/indigo/g, 'emerald');

fs.writeFileSync(filepath, content);
console.log('Replaced all indigo with emerald in GrahamCalculator.tsx');
