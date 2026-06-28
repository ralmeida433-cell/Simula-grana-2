import axios from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

async function test() {
  try {
    const token = process.env.BRAPI_TOKEN;
    const res = await axios.get(`https://brapi.dev/api/quote/VALE3?modules=summaryProfile,financialData,defaultKeyStatistics&dividends=true&token=${token}`);
    fs.writeFileSync('brapi-vale3-modules.json', JSON.stringify(res.data, null, 2));
    console.log('Saved to brapi-vale3-modules.json');
  } catch (e: any) {
    console.error(e.message);
  }
}
test();
