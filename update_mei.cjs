const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/calculators/MEICalculator.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/text-slate-400 font-bold/g, 'text-slate-400 dark:text-slate-500 contrast:text-slate-500 font-bold');

fs.writeFileSync(filePath, content);
console.log('Updated MEICalculator.tsx');
