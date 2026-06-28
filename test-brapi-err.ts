import axios from 'axios';
const test = async () => {
    try {
        await axios.get('https://brapi.dev/api/quote/ASDF123?token=DUMMY');
    } catch (e: any) {
        console.log("e.response.data =", JSON.stringify(e.response?.data, null, 2));
    }
}
test();
