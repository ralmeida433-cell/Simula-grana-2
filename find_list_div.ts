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
      const regex = /<(ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        // Check for children that are not <li> or whitespace or comments or curly braces (React expressions)
        // This is tricky with regex.
        // Let's just look for <div or <p or <h[1-6]
        if (match[2].match(/<(div|p|h[1-6]|ul|ol|table|section|article|aside|header|footer|blockquote|pre|form|fieldset|canvas|video|audio|hr)\b/)) {
          console.log(`Found block-level element in <${match[1]}> in ${file}:`);
          console.log(match[0].substring(0, 200) + '...');
        }
      }
    }
  });
  return results;
}

walk('./src');
