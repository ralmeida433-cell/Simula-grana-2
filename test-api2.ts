import fetch from "node-fetch";

async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/fin/opportunities?market=B3");
    console.log("Status:", res.status);
    console.log("Headers:", res.headers.raw());
    const text = await res.text();
    console.log("Body:", text.substring(0, 200));
  } catch (e) {
    console.error(e);
  }
}
test();
