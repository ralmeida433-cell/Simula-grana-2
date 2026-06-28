const fs = require('fs');
const glob = require('glob');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      content = content.replace(/contrast:bg-[a-z]+-[0-9]+\/[0-9]+/g, '');
      content = content.replace(/contrast:bg-[a-z]+-[0-9]+/g, '');
      content = content.replace(/contrast:border-[a-z]+-[0-9]+/g, '');
      content = content.replace(/contrast:text-[a-z]+-[0-9]+/g, '');
      content = content.replace(/contrast:shadow-[a-z]+-[0-9]+\/[0-9]+/g, '');
      content = content.replace(/contrast:[a-z]+:border-[a-z]+-[0-9]+\/[0-9]+/g, '');
      content = content.replace(/contrast:[a-z]+:shadow-[a-z]+-[0-9]+\/[0-9]+/g, '');
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir(path.join(__dirname, 'src'));
console.log('Done refactoring contrast classes.');
