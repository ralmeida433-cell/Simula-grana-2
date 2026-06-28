async function test() {
  const module = await import('yahoo-finance2') as any;
  const maybeInstance = module.default || module;
  const yf = typeof maybeInstance === 'function' ? new maybeInstance() : maybeInstance;
  
  try {
    // Try to get top US stocks by market cap
    // 'day_gainers' is default if scrIds is missing, let's try a predefined list or a custom screener
    const quotes = await yf.quote(['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'BRK-B', 'LLY', 'TSLA', 'V', 'JPM', 'UNH', 'WMT', 'MA', 'PG', 'JNJ', 'ORCL', 'HD', 'BAC', 'COST', 'CVX', 'MRK', 'ABBV', 'CRM', 'KO', 'PEP', 'NFLX', 'TMO', 'AMD', 'CSCO', 'MCD', 'ABT', 'TMUS', 'WFC', 'DIS', 'INTC', 'IBM', 'QCOM', 'TXN', 'CAT']);
    console.log("Quotes:");
    quotes.sort((a: any, b: any) => b.marketCap - a.marketCap).slice(0, 10).forEach((q: any) => console.log(`${q.symbol}: ${q.marketCap}`));
  } catch (e) {
    console.error(e);
  }
}
test();
