const puppeteer = require('puppeteer');
const path = require('path');

async function generateOGImage() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new'
  });
  
  const page = await browser.newPage();
  
  // Set viewport to OG image dimensions
  await page.setViewport({
    width: 1200,
    height: 630,
    deviceScaleFactor: 2 // Retina quality
  });
  
  // Load the HTML file
  const htmlPath = path.join(__dirname, 'public', 'og-image.html');
  await page.goto(`file://${htmlPath}`, {
    waitUntil: 'networkidle0'
  });
  
  // Wait for any animations/fonts to load
  await new Promise(r => setTimeout(r, 500));
  
  // Take screenshot
  const outputPath = path.join(__dirname, 'public', 'og-image.png');
  await page.screenshot({
    path: outputPath,
    type: 'png',
    clip: {
      x: 0,
      y: 0,
      width: 1200,
      height: 630
    }
  });
  
  console.log(`OG image saved to: ${outputPath}`);
  
  await browser.close();
}

generateOGImage().catch(console.error);
