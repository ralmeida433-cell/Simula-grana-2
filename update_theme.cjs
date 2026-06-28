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
    
    // Replace bg-white with bg-white dark:bg-slate-900 contrast:bg-slate-800
    // But only if it doesn't already have dark:bg-
    content = content.replace(/className="([^"]*bg-white[^"]*)"/g, (match, p1) => {
      if (p1.includes('dark:bg-')) return match;
      return `className="${p1} dark:bg-slate-900 contrast:bg-slate-800"`;
    });

    // Replace text-slate-900 with text-slate-900 dark:text-slate-100 contrast:text-slate-100
    content = content.replace(/className="([^"]*text-slate-900[^"]*)"/g, (match, p1) => {
      if (p1.includes('dark:text-')) return match;
      return `className="${p1} dark:text-slate-100 contrast:text-slate-100"`;
    });

    // Replace text-slate-800 with text-slate-800 dark:text-slate-200 contrast:text-slate-200
    content = content.replace(/className="([^"]*text-slate-800[^"]*)"/g, (match, p1) => {
      if (p1.includes('dark:text-')) return match;
      return `className="${p1} dark:text-slate-200 contrast:text-slate-200"`;
    });

    // Replace border-slate-200 with border-slate-200 dark:border-slate-800 contrast:border-slate-700
    content = content.replace(/className="([^"]*border-slate-200[^"]*)"/g, (match, p1) => {
      if (p1.includes('dark:border-')) return match;
      return `className="${p1} dark:border-slate-800 contrast:border-slate-700"`;
    });

    // Replace border-slate-100 with border-slate-100 dark:border-slate-800 contrast:border-slate-700
    content = content.replace(/className="([^"]*border-slate-100[^"]*)"/g, (match, p1) => {
      if (p1.includes('dark:border-')) return match;
      return `className="${p1} dark:border-slate-800 contrast:border-slate-700"`;
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
