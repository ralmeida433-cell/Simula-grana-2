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
  
  // Let's see what the actual top 10 are when sorted by market_cap
  const sortedByMarketCap = [...stocks].sort((a: any, b: any) => {
    const capA = a.market_cap || a.market_cap_basic || 0;
    const capB = b.market_cap || b.market_cap_basic || 0;
    return capB - capA;
  });

  console.log("Top 10 by actual market_cap:");
  sortedByMarketCap.slice(0, 10).forEach((s: any) => {
    console.log(`${s.stock}: ${s.market_cap || s.market_cap_basic}`);
  });
}
test();
