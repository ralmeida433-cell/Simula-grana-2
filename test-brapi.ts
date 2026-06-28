import axios from 'axios';

async function test() {
  const brapiToken = process.env.BRAPI_TOKEN;
  if (!brapiToken) {
    console.log('No token');
    return;
  }
  const res = await axios.get(`https://brapi.dev/api/quote/list?token=${brapiToken}&limit=5`);
  console.log(JSON.stringify(res.data.stocks[0], null, 2));
}
test();
