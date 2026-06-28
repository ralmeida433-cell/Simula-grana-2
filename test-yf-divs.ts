async function test() {
  try {
    const module = await import('yahoo-finance2');
    const yf = module.default;
    const result = await yf.historical('AAPL', { period1: '2023-01-01', events: 'dividends' });
    console.log(JSON.stringify(result, null, 2));
  } catch (e: any) {
    console.error(e.message);
  }
}
test();
