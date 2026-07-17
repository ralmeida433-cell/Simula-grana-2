async function run() {
  const params = {
    model: "gemini-3.1-pro-preview",
    contents: "Say hello",
  };
  const res = await fetch('http://127.0.0.1:3000/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ params })
  });
  const data = await res.json();
  console.log(data);
}
run();
