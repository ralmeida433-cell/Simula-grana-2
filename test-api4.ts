import axios from 'axios';
const test = async () => {
    try {
        const res = await axios.get('https://api.bcb.gov.br/dados/serie/bcdata.sgs.188/dados/ultimos/12?formato=json');
        console.log(res.data);
    } catch (e: any) { console.error(e.response ? e.response.data : e.message); }
}
test();
