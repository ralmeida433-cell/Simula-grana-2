import * as fs from 'fs';
import * as path from 'path';

function walk(dir: string) {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(file, 'utf8');
      const regex = /<p\b[^>]*>([\s\S]*?)<\/p>/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        if (match[1].includes('<div') || match[1].includes('<div ')) {
          console.log(`Found in ${file}:`);
          console.log(match[0].substring(0, 200) + '...');
        }
      }
    }
  });
  return results;
}

walk('./src');
