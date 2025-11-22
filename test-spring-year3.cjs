// Test Spring Year 3 auto-fill bug
const { chromium } = require('playwright');

async function testSpringYear3() {
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

  console.log('\n=== Testing Auto-fill for all years ===');

  // Get all Auto-fill buttons
  const autoFillFallBtns = await page.locator('button:has-text("Auto-fill Fall")').all();
  const autoFillSpringBtns = await page.locator('button:has-text("Auto-fill Spring")').all();

  console.log(`Found ${autoFillFallBtns.length} Auto-fill Fall buttons`);
  console.log(`Found ${autoFillSpringBtns.length} Auto-fill Spring buttons`);

  // Click Auto-fill Fall for each grade (9, 10, 11, 12)
  for (let i = 0; i < autoFillFallBtns.length; i++) {
    console.log(`\nClicking Auto-fill Fall for Grade ${9 + i}...`);
    await autoFillFallBtns[i].click();
    await page.waitForTimeout(800);
  }

  // Click Auto-fill Spring for each grade
  for (let i = 0; i < autoFillSpringBtns.length; i++) {
    console.log(`Clicking Auto-fill Spring for Grade ${9 + i}...`);
    await autoFillSpringBtns[i].click();
    await page.waitForTimeout(800);
  }

  // Take screenshot
  await page.screenshot({ path: '/tmp/spring-year3-test.png', fullPage: true });

  // Count courses in each quarter
  console.log('\n=== Course counts per quarter ===');

  // Find Grade 11 section and count courses
  const grade11Section = await page.locator('text=Grade 11').first();
  console.log('Grade 11 found:', await grade11Section.isVisible());

  // Count all course cards (they have border-l-4 class)
  const allCourses = await page.locator('div.border-l-4').count();
  console.log(`Total course cards: ${allCourses}`);

  // Get quarter-by-quarter breakdown
  // Q1, Q2 are Fall; Q3, Q4 are Spring
  const q1Courses = await page.evaluate(() => {
    const q1Sections = document.querySelectorAll('[class*="Q1"]');
    return document.querySelectorAll('div.border-l-4').length;
  });

  // Look for specific year sections
  const yearData = await page.evaluate(() => {
    const results = {};
    // Find all grade sections
    const grades = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

    grades.forEach(grade => {
      const section = Array.from(document.querySelectorAll('h3')).find(h => h.textContent.includes(grade));
      if (section) {
        // Find the parent container
        const container = section.closest('div.bg-white');
        if (container) {
          const courseCards = container.querySelectorAll('div.border-l-4');
          results[grade] = courseCards.length;
        }
      }
    });

    return results;
  });

  console.log('\nCourses per grade:');
  for (const [grade, count] of Object.entries(yearData)) {
    console.log(`  ${grade}: ${count} courses`);
  }

  await browser.close();
  console.log('\nTest complete');
}

testSpringYear3().catch(console.error);
