async function test() {
  const module = await import('yahoo-finance2');
  const yf = new module.default();
  const res = await yf.search('AAPL');
  console.log(res.quotes.slice(0, 5));
}
test();
