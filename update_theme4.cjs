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

      // Replace bg-slate-50/50 without dark:
      const regexBg50_50 = /bg-slate-50\/50(?!\s+dark:bg-slate-800\/50)/g;
      if (regexBg50_50.test(content)) {
        content = content.replace(regexBg50_50, 'bg-slate-50/50 dark:bg-slate-800/50 contrast:bg-slate-700/50');
        modified = true;
      }

      // Replace bg-slate-50/30 without dark:
      const regexBg50_30 = /bg-slate-50\/30(?!\s+dark:bg-slate-800\/30)/g;
      if (regexBg50_30.test(content)) {
        content = content.replace(regexBg50_30, 'bg-slate-50/30 dark:bg-slate-800/30 contrast:bg-slate-700/30');
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
