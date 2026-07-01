import fs from 'fs';
import path from 'path';

function getDirSize(dir) {
  let size = 0;
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        size += getDirSize(filePath);
      } else {
        size += stats.size;
      }
    }
  } catch (e) {}
  return size;
}

console.log('.git folder size:', (getDirSize('.git') / 1024 / 1024).toFixed(2), 'MB');
console.log('node_modules folder size:', (getDirSize('node_modules') / 1024 / 1024).toFixed(2), 'MB');
console.log('dist folder size:', (getDirSize('dist') / 1024 / 1024).toFixed(2), 'MB');
console.log('public folder size:', (getDirSize('public') / 1024 / 1024).toFixed(2), 'MB');
