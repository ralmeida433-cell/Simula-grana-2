import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    
    page.on('console', msg => {
        if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
        else console.log('BROWSER LOG:', msg.text());
    });
    
    page.on('pageerror', error => {
        console.log('BROWSER PAGE ERROR:', error.message);
    });

    page.on('requestfailed', request => {
        console.log('BROWSER REQUEST FAILED:', request.url(), request.failure()?.errorText);
    });

    console.log("Navigating to localhost:3000...");
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 }).catch(e => console.log('GOTO ERROR:', e.message));
    
    // Check if #root is empty
    const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML || 'NO ROOT');
    console.log("Root length:", rootHtml.length);
    if(rootHtml.length < 50) {
      console.log("Root content:", rootHtml);
    }

    await browser.close();
})();
