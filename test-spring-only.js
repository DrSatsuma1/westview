const { chromium } = require('playwright');

async function testSpringOnly() {
  console.log('🧪 TESTING GRADE 10 SPRING ONLY\n');

  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const page = await browser.newPage();

  // Capture console logs
  page.on('console', msg => {
    if (msg.text().includes('[DEBUG]') || msg.text().includes('Grade 10') || msg.text().includes('Year 10')) {
      console.log(msg.text());
    }
  });

  try {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    console.log('📋 Clicking Auto-fill Spring for Grade 10...\n');
    const grade10Card = page.locator('h3:has-text("Grade 10")').locator('..').locator('..');
    await grade10Card.locator('button:has-text("Auto-fill Spring Semester")').click();

    await page.waitForTimeout(3000);

    // Count courses
    const q3Count = await page.locator('h4:has-text("Q3")').locator('..').locator('..').locator('.rounded-lg.p-3.transition-all.border-l-4').count();
    const q4Count = await page.locator('h4:has-text("Q4")').locator('..').locator('..').locator('.rounded-lg.p-3.transition-all.border-l-4').count();

    console.log(`\nQ3: ${q3Count} courses`);
    console.log(`Q4: ${q4Count} courses`);
    console.log(`Total Spring: ${q3Count + q4Count} cards (${(q3Count + q4Count) / 2} unique yearlong courses)\n`);
    console.log(`Expected: 8 cards (4 unique courses)\n`);

    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
  } finally {
    await browser.close();
  }
}

testSpringOnly().catch(console.error);
