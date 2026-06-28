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

      // Replace dark:text-slate-500 without contrast:
      const regex500 = /dark:text-slate-500(?!\s+contrast:text-slate-)/g;
      if (regex500.test(content)) {
        content = content.replace(regex500, 'dark:text-slate-500 contrast:text-slate-400');
        modified = true;
      }

      // Replace dark:text-slate-400 without contrast:
      const regex400 = /dark:text-slate-400(?!\s+contrast:text-slate-)/g;
      if (regex400.test(content)) {
        content = content.replace(regex400, 'dark:text-slate-400 contrast:text-slate-300');
        modified = true;
      }

      // Also fix dark:bg-slate-800/50 missing contrast:bg-slate-700/50
      const regexBg800_50 = /dark:bg-slate-800\/50(?!\s+contrast:bg-slate-700\/50)/g;
      if (regexBg800_50.test(content)) {
        content = content.replace(regexBg800_50, 'dark:bg-slate-800/50 contrast:bg-slate-700/50');
        modified = true;
      }

      // Also fix dark:bg-slate-800/30 missing contrast:bg-slate-700/30
      const regexBg800_30 = /dark:bg-slate-800\/30(?!\s+contrast:bg-slate-700\/30)/g;
      if (regexBg800_30.test(content)) {
        content = content.replace(regexBg800_30, 'dark:bg-slate-800/30 contrast:bg-slate-700/30');
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
