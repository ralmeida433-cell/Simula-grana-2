import fs from 'fs';
import path from 'path';

function getFiles(dir, files_ = []) {
  const files = fs.readdirSync(dir);
  for (const i in files) {
    const name = path.join(dir, files[i]);
    if (name.includes('node_modules') || name.includes('.git')) {
       continue;
    }
    try {
      const stats = fs.statSync(name);
      if (stats.isDirectory()) {
        getFiles(name, files_);
      } else {
        files_.push({ path: name, size: stats.size });
      }
    } catch (e) {}
  }
  return files_;
}

const allFiles = getFiles('.');
allFiles.sort((a, b) => b.size - a.size);

console.log('TOP 30 LARGEST FILES (excluding node_modules and .git):');
allFiles.slice(0, 30).forEach(f => {
  console.log(`${(f.size / 1024 / 1024).toFixed(2)} MB - ${f.path}`);
});
