const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {

  // Get type of source from process.argv, default to url
  var type = process.argv.slice(2)[0] || 'url';

  // Create a browser instance
  const browser = await puppeteer.launch();

  // Create a new page
  const page = await browser.newPage();


  if (type === 'url') {

    // Web site URL to export as pdf
    const website_url = 'https://www.bannerbear.com/blog/how-to-download-images-from-a-website-using-puppeteer/';

    // Open URL in current page
    await page.goto(website_url, { waitUntil: 'networkidle0' });

  } else if (type === 'file') {

    //Get HTML content from HTML file
    const html = fs.readFileSync('sample.html', 'utf-8');
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

  } else {

    console.log(new Error(`HTML source "${type}" is unkown.`));
    await browser.close();
    return;
  }

  // To reflect CSS used for screens instead of print
  await page.emulateMediaType('screen');

  // Downlaod the PDF
  const pdf = await page.pdf({
    path: `result_${type}.pdf`,
    margin: { top: '100px', right: '50px', bottom: '100px', left: '50px' },
    printBackground: true,
    format: 'A4',
  });

  // Close the browser instance
  await browser.close();
  
})();