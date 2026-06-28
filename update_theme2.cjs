const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src/components', function(filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Replace bg-slate-50 with bg-slate-50 dark:bg-slate-800 contrast:bg-slate-700
    content = content.replace(/className="([^"]*bg-slate-50[^"]*)"/g, (match, p1) => {
      if (p1.includes('dark:bg-')) return match;
      return `className="${p1} dark:bg-slate-800 contrast:bg-slate-700"`;
    });

    // Replace text-slate-700 with text-slate-700 dark:text-slate-300 contrast:text-slate-300
    content = content.replace(/className="([^"]*text-slate-700[^"]*)"/g, (match, p1) => {
      if (p1.includes('dark:text-')) return match;
      return `className="${p1} dark:text-slate-300 contrast:text-slate-300"`;
    });

    // Replace text-slate-600 with text-slate-600 dark:text-slate-400 contrast:text-slate-400
    content = content.replace(/className="([^"]*text-slate-600[^"]*)"/g, (match, p1) => {
      if (p1.includes('dark:text-')) return match;
      return `className="${p1} dark:text-slate-400 contrast:text-slate-400"`;
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
