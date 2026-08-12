import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => {
     console.log('PAGE ERROR:', error.message);
     console.log('STACK:', error.stack);
  });
  
  console.log('Navigating to http://localhost:3000/test-chat');
  await page.goto('http://localhost:3000/test-chat', { waitUntil: 'networkidle2' });
  console.log('Waiting 2 seconds...');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Clicking on page elements...');
  const buttons = await page.$$('button');
  for (let btn of buttons) {
      try { await btn.click(); } catch(e) {}
  }
  
  console.log('Waiting 2 seconds...');
  await new Promise(r => setTimeout(r, 2000));

  await browser.close();
})();
