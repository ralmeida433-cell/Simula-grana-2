import fs from 'fs';
import path from 'path';

function checkSymlinks(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const name = path.join(dir, file);
    if (name.includes('node_modules') || name.includes('.git')) {
       continue;
    }
    try {
      const stats = fs.lstatSync(name);
      if (stats.isSymbolicLink()) {
        console.log('Found symlink:', name);
        try {
          const target = fs.readlinkSync(name);
          console.log('  points to:', target);
          if (!fs.existsSync(name)) {
            console.log('  WARNING: BROKEN SYMLINK!');
          }
        } catch (err) {
          console.log('  Error reading symlink:', err.message);
        }
      } else if (stats.isDirectory()) {
        checkSymlinks(name);
      }
    } catch (e) {}
  }
}

console.log('Checking for symlinks outside of node_modules and .git:');
checkSymlinks('.');
console.log('Done checking symlinks.');
