const fs = require('fs');

const code = fs.readFileSync('src/components/Pesquisa.tsx', 'utf8');

const regex = /const getAssetClass = \(assetData: any\) => \{[\s\S]*?return 'stock';\n  \};/;
const match = code.match(regex);
if (!match) {
  console.error("Function not found!");
  process.exit(1);
}

const newFunction = `const getAssetClass = (assetData: any) => {
    if (!assetData) return 'stock';
    const symbol = assetData.symbol.toUpperCase();
    const cleanSymbol = symbol.replace('.SA', '');
    const type = assetData.type;
    
    if (type === 'fund' || (cleanSymbol.endsWith('11') && !['BOVA11', 'IVVB11', 'SMAL11', 'HASH11', 'XINA11', 'LFTS11'].includes(cleanSymbol))) {
      return 'fii';
    }
    
    if (type === 'etf' || (cleanSymbol.endsWith('11') && ['BOVA11', 'IVVB11', 'SMAL11', 'HASH11', 'XINA11', 'LFTS11'].includes(cleanSymbol))) {
      return 'etf';
    }

    const industry = assetData.summaryProfile?.industry?.toUpperCase() || '';
    const sector = assetData.summaryProfile?.sector?.toUpperCase() || '';

    if (industry.includes('REIT') || sector.includes('REAL ESTATE') || ['O', 'PLD', 'AMT', 'EQIX', 'CCI', 'SPG', 'DLR', 'WY', 'EQR', 'AVB', 'PSA', 'VNO'].includes(cleanSymbol)) {
      return 'reit';
    }

    if (type === 'index' || ['^BVSP', 'IFIX', '^GSPC', '^IXIC', 'CDI', 'IPCA', '^NDX', '^DJI'].includes(cleanSymbol)) {
      return 'index';
    }

    return 'stock';
  };`;

const newCode = code.replace(regex, newFunction);
fs.writeFileSync('src/components/Pesquisa.tsx', newCode);
console.log("Successfully patched getAssetClass!");
