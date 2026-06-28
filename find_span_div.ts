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
      const regex = /<span\b(?![^>]*\/>)[^>]*>([\s\S]*?)<\/span>/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        if (match[1].match(/<(div|p|h[1-6]|ul|ol|li|table|section|article|aside|header|footer|blockquote|pre|form|fieldset|canvas|video|audio|hr)\b/)) {
          console.log(`Found block-level element in <span> in ${file}:`);
          console.log(match[0].substring(0, 200) + '...');
        }
      }
    }
  });
  return results;
}

walk('./src');
