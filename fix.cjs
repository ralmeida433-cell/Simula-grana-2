const fs = require('fs');
let code = fs.readFileSync('src/components/Pesquisa.tsx', 'utf8');
code = code.replace(
  "    const cleanSymbol = symbol.replace('.SA', '');\n    const symbol = assetData.symbol.toUpperCase();",
  "    const symbol = assetData.symbol.toUpperCase();\n    const cleanSymbol = symbol.replace('.SA', '');"
);
fs.writeFileSync('src/components/Pesquisa.tsx', code);
