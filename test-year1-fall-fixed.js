const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Navigating to app...');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);

  console.log('\n=== Testing Auto-fill for Year 1 (Grade 9) Fall ===');

  // Find "Auto-fill Fall Semester" buttons
  const autoFillButtons = await page.locator('button:has-text("Auto-fill Fall Semester")').all();
  console.log(`Found ${autoFillButtons.length} "Auto-fill Fall Semester" buttons`);

  if (autoFillButtons.length > 0) {
    // Click the FIRST one (Year 1 Fall)
    console.log('\nClicking FIRST Auto-fill Fall button (Year 1 Fall)...');
    await autoFillButtons[0].click();
    await page.waitForTimeout(2000);

    // Count course cards
    const courseCards = await page.locator('[class*="border-l"]').all();
    console.log(`\nTotal course cards on page: ${courseCards.length}`);

    // Get course names
    const courseNames = [];
    for (let i = 0; i < Math.min(20, courseCards.length); i++) {
      const text = await courseCards[i].textContent();
      const firstLine = text.split('\n')[0].trim();
      if (firstLine) courseNames.push(firstLine);
    }

    console.log('\n=== Courses found ===');
    courseNames.forEach((name, idx) => {
      console.log(`${idx + 1}. ${name.substring(0, 70)}`);
    });

    // Identify Year 1 courses
    const year1Keywords = ['ENGLISH', 'MATH', 'BIOLOGY', 'ENS', 'SCIENCE'];
    const year1Courses = courseNames.filter(name => {
      const upper = name.toUpperCase();
      return year1Keywords.some(kw => upper.includes(kw));
    });

    console.log(`\n=== Year 1 Fall Course Count: ${year1Courses.length} ===`);
    console.log('Expected: 4 (English, Math, Biology, ENS 3-4)');

    if (year1Courses.length === 2) {
      console.log('❌ ERROR: Only 2 courses suggested!');
      console.log('Missing: Math and/or Biology');
    } else if (year1Courses.length < 4) {
      console.log(`❌ ERROR: Only ${year1Courses.length} courses!`);
    } else {
      console.log('✅ Correct number of courses');
    }

    await page.screenshot({ path: 'year1-fall-result.png', fullPage: true });
  }

  console.log('\nClosing in 10 seconds...');
  await page.waitForTimeout(10000);
  await browser.close();
})();
