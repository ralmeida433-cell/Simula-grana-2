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

      // Replace border-slate-50 without dark:
      const regexBorder50 = /border-slate-50(?!\s+dark:border-slate-800)/g;
      if (regexBorder50.test(content)) {
        content = content.replace(regexBorder50, 'border-slate-50 dark:border-slate-800 contrast:border-slate-700');
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
