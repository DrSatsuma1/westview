// Test actual auto-fill behavior in the real app
const { chromium } = require('playwright');

async function testAutoFill() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Capture console logs
  page.on('console', msg => {
    if (msg.text().includes('[DEBUG]') || msg.text().includes('suggestion')) {
      console.log('BROWSER:', msg.text());
    }
  });

  console.log('Opening Westview Planner...');
  await page.goto('http://localhost:3001');
  await page.waitForLoadState('networkidle');

  // Clear localStorage for clean test
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Auto-fill Fall for Grade 11 only
  console.log('\n=== Auto-fill Fall for Grade 11 ===');
  const autoFillFallBtns = await page.locator('button:has-text("Auto-fill Fall")').all();
  await autoFillFallBtns[2].click(); // Grade 11 = index 2
  await page.waitForTimeout(1000);

  // Get courses after Fall auto-fill
  const fallCourses = await page.evaluate(() => {
    const result = [];
    document.querySelectorAll('div.border-l-4').forEach(card => {
      const nameEl = card.querySelector('.font-bold, [class*="font-medium"]');
      result.push(nameEl?.textContent || 'unknown');
    });
    return result;
  });

  console.log('Fall courses added:', fallCourses.length);
  fallCourses.forEach(c => console.log('  -', c));

  // Now auto-fill Spring for Grade 11
  console.log('\n=== Auto-fill Spring for Grade 11 ===');
  const autoFillSpringBtns = await page.locator('button:has-text("Auto-fill Spring")').all();
  await autoFillSpringBtns[2].click(); // Grade 11 = index 2
  await page.waitForTimeout(1000);

  // Get all courses after Spring auto-fill
  const allCourses = await page.evaluate(() => {
    const result = [];
    document.querySelectorAll('div.border-l-4').forEach(card => {
      const nameEl = card.querySelector('.font-bold, [class*="font-medium"]');
      result.push(nameEl?.textContent || 'unknown');
    });
    return result;
  });

  console.log('\nAll courses after Spring auto-fill:', allCourses.length);

  // Count unique courses
  const uniqueCourses = [...new Set(allCourses)];
  console.log('Unique courses:', uniqueCourses.length);
  uniqueCourses.forEach(c => console.log('  -', c));

  // Take screenshot
  await page.screenshot({ path: '/tmp/autofill-test.png', fullPage: true });
  console.log('\nScreenshot saved to /tmp/autofill-test.png');

  await browser.close();
}

testAutoFill().catch(console.error);
