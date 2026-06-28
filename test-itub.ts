import axios from 'axios';

async function test() {
  try {
    const res = await axios.get('http://localhost:3000/api/fin/ITUB4');
    console.log('STATUS:', res.status);
    console.log('DATA KEYS:', Object.keys(res.data));
    console.log('SAMPLE VALUES:');
    const fields = ['ticker', 'name', 'roe', 'roic', 'netMargin', 'operatingMargin', 'peRatio', 'pvp', 'evEbitda', 'totalDebt', 'netDebt', 'currentRatio', 'revenue', 'ebitda', 'eps', 'bvps'];
    fields.forEach(f => {
      console.log(`  ${f}:`, res.data[f]);
    });
  } catch (e: any) {
    console.error('Error fetching from server:', e.message);
    if (e.response) {
      console.error('Response data:', e.response.data);
    }
  }
}
test();
