import axios from 'axios';

async function test() {
  try {
    const res = await axios.get('https://economia.awesomeapi.com.br/last/USD-BRL');
    console.log(res.status, typeof res.data);
  } catch (e) {
    console.log('USD BRL error:', e.message);
  }
}
test();
