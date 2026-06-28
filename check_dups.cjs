const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules')) results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src');
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const ids = [...content.matchAll(/id:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  const counts = {};
  ids.forEach(id => counts[id] = (counts[id] || 0) + 1);
  const dups = Object.entries(counts).filter(([id, count]) => count > 1);
  if (dups.length > 0) console.log(file, dups);
});
