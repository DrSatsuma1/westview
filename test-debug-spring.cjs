// Debug why Spring Year 3 only gets 3 courses
const { chromium } = require('playwright');

async function debugSpring() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Capture console logs from the browser
  page.on('console', msg => {
    if (msg.text().includes('[DEBUG]')) {
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

  // First auto-fill Fall for all years
  const autoFillFallBtns = await page.locator('button:has-text("Auto-fill Fall")').all();
  for (let i = 0; i < autoFillFallBtns.length; i++) {
    await autoFillFallBtns[i].click();
    await page.waitForTimeout(600);
  }

  // Now specifically check what's in Grade 11 before Spring auto-fill
  const grade11Courses = await page.evaluate(() => {
    // Access the React component's state (if exposed)
    // For now, let's just count visible courses
    const sections = document.querySelectorAll('h3');
    let grade11Section = null;
    for (const section of sections) {
      if (section.textContent.includes('Grade 11')) {
        grade11Section = section.closest('div.bg-white');
        break;
      }
    }

    if (grade11Section) {
      const cards = grade11Section.querySelectorAll('div.border-l-4');
      return Array.from(cards).map(card => {
        const nameEl = card.querySelector('.font-bold');
        return nameEl ? nameEl.textContent : 'unknown';
      });
    }
    return [];
  });

  console.log('\n=== Grade 11 courses after Fall auto-fill ===');
  console.log(grade11Courses);

  // Now auto-fill Spring for Year 3 (index 2)
  const autoFillSpringBtns = await page.locator('button:has-text("Auto-fill Spring")').all();
  console.log('\n=== Clicking Auto-fill Spring for Grade 11 ===');
  await autoFillSpringBtns[2].click(); // Grade 11 = index 2
  await page.waitForTimeout(1000);

  // Check what's in Grade 11 after Spring auto-fill
  const grade11AfterSpring = await page.evaluate(() => {
    const sections = document.querySelectorAll('h3');
    let grade11Section = null;
    for (const section of sections) {
      if (section.textContent.includes('Grade 11')) {
        grade11Section = section.closest('div.bg-white');
        break;
      }
    }

    if (grade11Section) {
      const cards = grade11Section.querySelectorAll('div.border-l-4');
      return Array.from(cards).map(card => {
        const nameEl = card.querySelector('.font-bold');
        const pathwayEl = card.querySelector('.text-xs.text-gray-500');
        return {
          name: nameEl ? nameEl.textContent : 'unknown',
          pathway: pathwayEl ? pathwayEl.textContent : 'unknown'
        };
      });
    }
    return [];
  });

  console.log('\n=== Grade 11 courses after Spring auto-fill ===');
  console.log(grade11AfterSpring);

  // Count by quarter
  const quarterCounts = await page.evaluate(() => {
    const result = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
    const sections = document.querySelectorAll('h3');
    let grade11Section = null;
    for (const section of sections) {
      if (section.textContent.includes('Grade 11')) {
        grade11Section = section.closest('div.bg-white');
        break;
      }
    }

    if (grade11Section) {
      // Find quarter columns
      const quarterHeaders = grade11Section.querySelectorAll('[class*="Q1"], [class*="Q2"], [class*="Q3"], [class*="Q4"]');
      // Count courses under each quarter
      const columns = grade11Section.querySelectorAll('div.flex-1');
    }
    return result;
  });

  console.log('\nQuarter counts:', quarterCounts);

  await page.screenshot({ path: '/tmp/debug-spring-year3.png', fullPage: true });
  console.log('\nScreenshot saved');

  await browser.close();
}

debugSpring().catch(console.error);
