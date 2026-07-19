const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf-8');

const startMarker = "app.get('/api/companies/:ticker/announcements', async (req, res) => {";
const endMarker = "app.post('/api/ai/generate', async (req, res) => {";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.log('Markers not found!');
  process.exit(1);
}

const newBlock = `app.get('/api/companies/:ticker/announcements', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  console.log(\`[Yahoo Finance] Buscando noticias para: \${ticker}\`);
  try {
    const yf = await getYahooFinance();
    if (!yf || !yf.search) throw new Error('Yahoo Finance indisponível');
    
    const result = await yf.search(ticker);
    const announcements = (result.news || []).map((item: any) => ({
      data: item.providerPublishTime ? new Date(item.providerPublishTime * 1000).toISOString() : new Date().toISOString(),
      empresa: ticker,
      ticker,
      fonte: item.publisher || 'Yahoo Finance',
      url: item.link || '',
      assunto: item.title || 'Notícia',
      resumo: null,
    }));
    
    res.json({ ticker, total: announcements.length, announcements });
  } catch (error: any) {
    console.error('[Noticias] Erro:', error.message);
    res.status(500).json({ 
      error: 'Erro ao buscar notícias',
      detalhe: error.message,
      ticker 
    });
  }
});

`;

const newContent = content.substring(0, startIndex) + newBlock + content.substring(endIndex);
fs.writeFileSync('server.ts', newContent);
console.log('Fixed announcements route!');
