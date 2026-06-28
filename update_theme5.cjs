const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      // Fix hover:bg-slate-50/50 dark:bg-slate-800/50 contrast:bg-slate-700/50
      const regexHover50 = /hover:bg-slate-50\/50 dark:bg-slate-800\/50 contrast:bg-slate-700\/50/g;
      if (regexHover50.test(content)) {
        content = content.replace(regexHover50, 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50 contrast:hover:bg-slate-700/50');
        modified = true;
      }

      // Fix hover:bg-slate-50/30 dark:bg-slate-800/30 contrast:bg-slate-700/30
      const regexHover30 = /hover:bg-slate-50\/30 dark:bg-slate-800\/30 contrast:bg-slate-700\/30/g;
      if (regexHover30.test(content)) {
        content = content.replace(regexHover30, 'hover:bg-slate-50/30 dark:hover:bg-slate-800/30 contrast:hover:bg-slate-700/30');
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory('./src');
