import Parser from 'rss-parser';

async function test() {
  const parser = new Parser();
  try {
    const feed = await parser.parseURL('https://news.google.com/rss/search?q=mercado+financeiro+bovespa&hl=pt-BR&gl=BR&ceid=BR:pt-419');
    console.log(feed.title);
    feed.items.slice(0, 5).forEach(item => {
      console.log(item.title + ':' + item.link);
      console.log(item.pubDate);
    });
  } catch (e) {
    console.error(e);
  }
}
test();
