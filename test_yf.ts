import yf from 'yahoo-finance2';
async function run() {
  const res = await yf.search('PETR4.SA');
  console.log(res.news.slice(0, 2));
}
run();
