const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Navigating to app...');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);

  console.log('\n=== Testing Auto-fill for Year 2 (Grade 10) Fall ===');

  // Find Auto-fill Fall buttons
  const autoFillButtons = await page.locator('button:has-text("Auto-fill Fall Semester")').all();
  console.log(`Found ${autoFillButtons.length} Auto-fill Fall buttons`);

  if (autoFillButtons.length >= 2) {
    // Click the button for Year 2 Fall (index 1: Y1 Fall=0, Y2 Fall=1, Y3 Fall=2, Y4 Fall=3)
    console.log('\nClicking Year 2 Fall button (index 1 = Grade 10)...');
    await autoFillButtons[1].click();
    await page.waitForTimeout(2000);

    // Get all course cards
    const courseCards = await page.locator('[class*="border-l"]').all();
    const allCourses = [];

    for (let i = 0; i < courseCards.length; i++) {
      const text = await courseCards[i].textContent();
      const firstLine = text.split('\n')[0].trim();
      if (firstLine) allCourses.push(firstLine);
    }

    console.log(`\nTotal course cards: ${allCourses.length}`);

    // Filter to Year 2 courses (look for typical Year 2 courses)
    const year2Keywords = ['ENGLISH 3', 'MATH', 'CHEMISTRY', 'WORLD HISTORY', 'ALGEBRA', 'GEOMETRY'];
    const year2Courses = allCourses.filter(name => {
      const upper = name.toUpperCase();
      return year2Keywords.some(kw => upper.includes(kw));
    });

    console.log('\n=== Year 2 Fall Courses ===');
    year2Courses.forEach((name, idx) => {
      console.log(`${idx + 1}. ${name.substring(0, 70)}`);
    });

    // Check if PE is suggested (it shouldn't be)
    const hasPE = allCourses.some(name => {
      const upper = name.toUpperCase();
      return upper.includes('AEROBICS') || upper.includes('ENS') ||
             upper.includes('WEIGHT') || upper.includes('PHYSICAL EDUCATION');
    });

    console.log(`\n=== Analysis ===`);
    console.log(`Year 2 courses found: ${year2Courses.length}`);
    console.log(`Expected: 4 (English 3-4, Math, Chemistry, World History)`);
    console.log(`Has PE: ${hasPE ? '❌ YES (should be NO)' : '✅ NO (correct)'}`);

    if (year2Courses.length === 4 && !hasPE) {
      console.log('\n✅ Year 2 Fall is CORRECT!');
    } else {
      console.log('\n❌ Year 2 Fall has issues:');
      if (year2Courses.length !== 4) {
        console.log(`  - Expected 4 courses, got ${year2Courses.length}`);
      }
      if (hasPE) {
        console.log('  - PE should NOT be suggested for Year 2');
      }
    }

    await page.screenshot({ path: 'year2-fall-test.png', fullPage: true });
  }

  console.log('\nClosing in 10 seconds...');
  await page.waitForTimeout(10000);
  await browser.close();
})();
