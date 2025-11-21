const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Navigating to app...');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);

  console.log('\n=== Clicking Year 2 Fall Auto-fill ===');

  const autoFillButtons = await page.locator('button:has-text("Auto-fill Fall Semester")').all();

  if (autoFillButtons.length >= 2) {
    console.log('Clicking Year 2 Fall (button index 1 = Grade 10)...');
    await autoFillButtons[1].click();
    await page.waitForTimeout(2000);

    // Get ALL courses on the entire page
    const courseCards = await page.locator('[class*="border-l"]').all();
    console.log(`\nTotal course cards on page: ${courseCards.length}`);

    console.log('\n=== ALL COURSES ON PAGE ===');
    for (let i = 0; i < courseCards.length; i++) {
      const text = await courseCards[i].textContent();
      const firstLine = text.split('\n')[0].trim();
      console.log(`${i + 1}. ${firstLine}`);
    }

    await page.screenshot({ path: 'year2-debug.png', fullPage: true });
  }

  await page.waitForTimeout(10000);
  await browser.close();
})();
