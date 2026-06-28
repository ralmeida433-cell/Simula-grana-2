import axios from 'axios';

async function test() {
  const brapiToken = process.env.BRAPI_TOKEN;
  if (!brapiToken) {
    console.log('No token');
    return;
  }
  const baseUrl = `https://brapi.dev/api/quote/list?token=${brapiToken}&limit=100&sortBy=market_cap_basic&sortOrder=desc`;
  const response = await axios.get(baseUrl);
  const stocks = response.data.stocks || response.data.data || [];
  
  console.log("Top 5 by market_cap_basic:");
  stocks.slice(0, 5).forEach((s: any) => {
    console.log(`${s.stock}: ${s.market_cap_basic || s.market_cap}`);
  });
  
  console.log("\nSpecific stocks:");
  ['VALE3', 'PETR4', 'ITUB4', 'BBAS3', 'AZEV4'].forEach(ticker => {
    const s = stocks.find((x: any) => x.stock === ticker);
    if (s) {
      console.log(`${s.stock}: ${s.market_cap_basic || s.market_cap}`);
    } else {
      console.log(`${ticker}: Not found in top 100`);
    }
  });
}
test();
