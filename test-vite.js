import fs from 'fs';
import { createServer } from 'vite';

async function run() {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
  let template = fs.readFileSync('index.html', 'utf-8');
  template = await vite.transformIndexHtml('/', template);
  console.log(template.includes('<head>'));
  vite.close();
}
run();
