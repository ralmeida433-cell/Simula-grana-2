const fs = require('fs');
const path = './src/components/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center gap-3 transition-colors duration-200"/g, 'className="bg-white dark:bg-slate-900 contrast:bg-slate-800 border border-slate-200 dark:border-slate-800 contrast:border-slate-700 p-4 rounded-2xl shadow-sm flex items-center gap-3 transition-colors duration-200"');
fs.writeFileSync(path, content, 'utf8');
