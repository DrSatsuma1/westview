const { chromium } = require('playwright');

async function testSimple() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    console.log('✅ App loaded');

    // Take screenshot before
    await page.screenshot({ path: 'before-autofill.png', fullPage: true });
    console.log('📸 Screenshot saved: before-autofill.png');

    // Find Grade 9 section
    const grade9 = page.locator('text=Grade 9').first();
    await grade9.scrollIntoViewIfNeeded();

    // Try to find and click the Auto-fill Fall button
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons total`);

    // Look for autofill button
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      if (text && text.includes('Auto-fill')) {
        console.log(`Button ${i}: "${text}"`);
      }
    }

    // Click the first Auto-fill Fall button
    const autofillButton = page.locator('button:has-text("Auto-fill Fall")').first();
    const isVisible = await autofillButton.isVisible();
    console.log(`Auto-fill Fall button visible: ${isVisible}`);

    if (isVisible) {
      await autofillButton.click();
      console.log('✅ Clicked Auto-fill Fall button');
      await page.waitForTimeout(2000);

      // Take screenshot after
      await page.screenshot({ path: 'after-autofill.png', fullPage: true });
      console.log('📸 Screenshot saved: after-autofill.png');

      // Count course cards
      const courseCards = await page.locator('.bg-white.rounded-lg.shadow-sm.p-3.border-l-4').count();
      console.log(`Found ${courseCards} course cards after autofill`);

      // Get all text content to see what was added
      const allText = await page.locator('body').textContent();
      const hasEnglish = allText.includes('English') || allText.includes('ENGLISH');
      const hasAVID = allText.includes('AVID');
      console.log(`Contains English courses: ${hasEnglish}`);
      console.log(`Contains AVID: ${hasAVID}`);
    }

    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testSimple();
