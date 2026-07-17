const yf = require('yahoo-finance2').default;
async function run() {
  const qs = await yf.quoteSummary('PETR4.SA', { modules: ['summaryDetail', 'financialData', 'defaultKeyStatistics', 'price', 'assetProfile', 'earnings'] });
  console.log(qs.financialData.totalRevenue, qs.financialData.totalCurrentAssets || 'null', qs.financialData.ebitda);
}
run();
