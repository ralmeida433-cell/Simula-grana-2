import axios from 'axios';

async function test() {
  try {
    const res = await axios.get('http://localhost:3000/api/fin/AAPL');
    console.log("revenue:", res.data.revenue);
    console.log("revenueGrowth:", res.data.revenueGrowth);
    console.log("currentRatio:", res.data.currentRatio);
    console.log("earningsGrowth:", res.data.earningsGrowth);
    console.log("operatingMargins:", res.data.operatingMargins);
  } catch (e: any) {
    console.error(e.message);
  }
}
test();
