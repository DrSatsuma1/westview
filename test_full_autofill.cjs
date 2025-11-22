// Test full auto-fill (all years Fall, then all years Spring)
const { chromium } = require('playwright');

async function testFullAutoFill() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Opening Westview Planner...');
  await page.goto('http://localhost:3001');
  await page.waitForLoadState('networkidle');

  // Clear localStorage for clean test
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Auto-fill Fall for ALL years
  console.log('\n=== Auto-fill Fall for ALL years ===');
  const autoFillFallBtns = await page.locator('button:has-text("Auto-fill Fall")').all();
  for (let i = 0; i < autoFillFallBtns.length; i++) {
    console.log('Clicking Auto-fill Fall for Grade ' + (9 + i));
    await autoFillFallBtns[i].click();
    await page.waitForTimeout(800);
  }

  // Count courses per year after Fall
  const afterFall = await page.evaluate(() => {
    const grades = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
    const result = {};

    grades.forEach(grade => {
      const section = Array.from(document.querySelectorAll('h3')).find(h => h.textContent.includes(grade));
      if (section) {
        const container = section.closest('div.bg-white');
        if (container) {
          const cards = container.querySelectorAll('div.border-l-4');
          result[grade] = cards.length;
        }
      }
    });
    return result;
  });

  console.log('\nCourse cards per grade after Fall:');
  Object.entries(afterFall).forEach(([grade, count]) => {
    console.log('  ' + grade + ': ' + count + ' cards');
  });

  // Auto-fill Spring for ALL years
  console.log('\n=== Auto-fill Spring for ALL years ===');
  const autoFillSpringBtns = await page.locator('button:has-text("Auto-fill Spring")').all();
  for (let i = 0; i < autoFillSpringBtns.length; i++) {
    console.log('Clicking Auto-fill Spring for Grade ' + (9 + i));
    await autoFillSpringBtns[i].click();
    await page.waitForTimeout(800);
  }

  // Count courses per year after Spring
  const afterSpring = await page.evaluate(() => {
    const grades = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
    const result = {};

    grades.forEach(grade => {
      const section = Array.from(document.querySelectorAll('h3')).find(h => h.textContent.includes(grade));
      if (section) {
        const container = section.closest('div.bg-white');
        if (container) {
          const cards = container.querySelectorAll('div.border-l-4');
          result[grade] = cards.length;
        }
      }
    });
    return result;
  });

  console.log('\nCourse cards per grade after Spring:');
  Object.entries(afterSpring).forEach(([grade, count]) => {
    console.log('  ' + grade + ': ' + count + ' cards');
  });

  // Get detailed Grade 11 breakdown
  console.log('\n=== Grade 11 detailed breakdown ===');
  const grade11Details = await page.evaluate(() => {
    const grades = ['Grade 11'];
    const result = { fall: [], spring: [] };

    const section = Array.from(document.querySelectorAll('h3')).find(h => h.textContent.includes('Grade 11'));
    if (section) {
      const container = section.closest('div.bg-white');
      if (container) {
        // Find Q1/Q2 (Fall) and Q3/Q4 (Spring) columns
        const columns = container.querySelectorAll('div.flex-1');

        // The structure has 4 columns for Q1, Q2, Q3, Q4
        // Let's look at all cards and try to determine their position
        const cards = container.querySelectorAll('div.border-l-4');
        cards.forEach(card => {
          const nameEl = card.querySelector('.font-bold, [class*="font-medium"]');
          const name = nameEl?.textContent || 'unknown';

          // Check if card is in Fall or Spring section by looking at column headers
          const column = card.closest('[class*="flex-1"]');
          const parent = column?.parentElement;

          result.fall.push(name); // Simplified - just count all cards
        });
      }
    }
    return result;
  });

  console.log('Grade 11 courses:', grade11Details.fall.length);
  [...new Set(grade11Details.fall)].forEach(c => console.log('  -', c));

  // Take screenshot
  await page.screenshot({ path: '/tmp/full-autofill-test.png', fullPage: true });
  console.log('\nScreenshot saved to /tmp/full-autofill-test.png');

  await browser.close();
}

testFullAutoFill().catch(console.error);
