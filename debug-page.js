const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Navigating to app...');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(5000);

  // Get page title
  const title = await page.title();
  console.log('Page title:', title);

  // Get all buttons
  const allButtons = await page.locator('button').all();
  console.log(`\nTotal buttons found: ${allButtons.length}`);

  // Get text from first 20 buttons
  for (let i = 0; i < Math.min(20, allButtons.length); i++) {
    const text = await allButtons[i].textContent();
    console.log(`Button ${i}: "${text.trim().substring(0, 50)}"`);
  }

  // Check if there's any text containing "Auto" or "Suggest"
  const bodyText = await page.locator('body').textContent();
  const hasAuto = bodyText.includes('Auto');
  const hasSuggest = bodyText.includes('Suggest');
  console.log(`\nPage contains "Auto": ${hasAuto}`);
  console.log(`Page contains "Suggest": ${hasSuggest}`);

  // Search for specific text patterns
  if (bodyText.includes('Suggest')) {
    console.log('\nFound "Suggest" in page. Context:');
    const idx = bodyText.indexOf('Suggest');
    console.log(bodyText.substring(idx - 50, idx + 100));
  }

  await page.screenshot({ path: 'debug-page.png', fullPage: true });
  console.log('\nScreenshot saved as debug-page.png');

  await page.waitForTimeout(10000);
  await browser.close();
})();
