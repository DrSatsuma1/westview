const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  await page.goto('http://localhost:3001');
  await page.waitForTimeout(1000);

  // Click "Track AP Exams" button
  await page.click('button:has-text("Track AP Exams")');
  await page.waitForTimeout(500);

  // Scroll to test scores section
  await page.evaluate(() => {
    const el = document.getElementById('test-scores-section');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(500);

  // Take screenshot
  await page.screenshot({ path: '/tmp/westview_alignment.png', fullPage: true });
  console.log('Screenshot saved to /tmp/westview_alignment.png');

  // Get left positions of different sections for comparison
  const positions = await page.evaluate(() => {
    const results = {};

    // Get Grade 9 card left position
    const gradeCard = document.querySelector('[class*="Grade 9"], .grade-card, h2');
    if (gradeCard) {
      const rect = gradeCard.getBoundingClientRect();
      results.gradeCard = rect.left;
    }

    // Get test scores section
    const testSection = document.getElementById('test-scores-section');
    if (testSection) {
      const rect = testSection.getBoundingClientRect();
      results.testSection = rect.left;

      // Get first child box
      const firstBox = testSection.querySelector('div > div');
      if (firstBox) {
        results.testSectionFirstChild = firstBox.getBoundingClientRect().left;
      }
    }

    // Get college credits section
    const creditHeader = [...document.querySelectorAll('*')].find(el =>
      el.textContent?.includes('College Credits from Test Scores')
    );
    if (creditHeader) {
      const container = creditHeader.closest('[class*="max-w"]');
      if (container) {
        results.collegeCredits = container.getBoundingClientRect().left;
      }
    }

    return results;
  });

  console.log('\nLeft positions (should match):');
  console.log(JSON.stringify(positions, null, 2));

  await browser.close();
})();
