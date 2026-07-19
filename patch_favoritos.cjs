const fs = require('fs');
const path = './src/components/Favoritos.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(
  /urlsToTry\.push\(`https:\/\/icons\.brapi\.dev\/icons\/\$\{cleanTicker\}\.svg`\);\{cleanTicker\}\.png`\);/g,
  'urlsToTry.push(`https://icons.brapi.dev/icons/${cleanTicker}.svg`);'
);
content = content.replace(
  /urlsToTry\.push\(`https:\/\/s3-symbol-logo\.tradingview\.com\/\$\{cleanTicker\.toLowerCase\(\)\}--big\.svg`\);\n\s*urlsToTry\.push\(`https:\/\/icons\.brapi\.dev\/icons\/\$\{cleanTicker\}\.svg`\);/g,
  'urlsToTry.push(`https://icons.brapi.dev/icons/${cleanTicker}.svg`);\n    urlsToTry.push(`https://s3-symbol-logo.tradingview.com/${cleanTicker.toLowerCase()}--big.svg`);'
);
fs.writeFileSync(path, content, 'utf8');
