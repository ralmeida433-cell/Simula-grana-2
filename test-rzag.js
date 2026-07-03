async function test() {
  const res = await fetch('https://query1.finance.yahoo.com/v10/finance/quoteSummary/RZAG11.SA?modules=summaryProfile,price,quoteType');
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}
test();
