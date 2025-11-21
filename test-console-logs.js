const { chromium } = require('playwright');

async function testConsoleLogs() {
  console.log('🧪 CAPTURING CONSOLE LOGS FROM AUTO-SUGGEST\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture console logs
  page.on('console', msg => {
    if (msg.text().includes('[DEBUG]')) {
      console.log(msg.text());
    }
  });

  try {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    console.log('\n📋 Clicking Auto-fill Fall for Grade 10...\n');
    const grade10Card = page.locator('h3:has-text("Grade 10")').locator('..').locator('..');
    await grade10Card.locator('button:has-text("Auto-fill Fall Semester")').click();

    await page.waitForTimeout(5000);

    console.log('\nTest complete. Check logs above.\n');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
  } finally {
    await browser.close();
  }
}

testConsoleLogs().catch(console.error);
