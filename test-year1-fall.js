const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();

  console.log('Navigating to app...');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(3000);

  console.log('\n=== Testing Auto-Suggest for Year 1 (Grade 9) Fall ===');

  // Take initial screenshot
  await page.screenshot({ path: 'before-autosuggest.png', fullPage: true });

  // Find Auto-Suggest buttons - try different selectors
  let autoSuggestButtons = await page.locator('button', { hasText: 'Auto-Suggest' }).all();

  if (autoSuggestButtons.length === 0) {
    autoSuggestButtons = await page.locator('button:has-text("Suggest")').all();
  }

  console.log(`Found ${autoSuggestButtons.length} Auto-Suggest buttons`);

  if (autoSuggestButtons.length > 0) {
    // Click the FIRST button (should be Year 1 Fall)
    console.log('\nClicking FIRST Auto-Suggest button (Year 1 Fall)...');
    await autoSuggestButtons[0].click();
    await page.waitForTimeout(3000);

    // Take screenshot after clicking
    await page.screenshot({ path: 'after-autosuggest-year1-fall.png', fullPage: true });

    // Count course cards
    const courseCards = await page.locator('[class*="border-l"]').all();
    console.log(`\nTotal course cards found: ${courseCards.length}`);

    // Get text from cards to identify courses
    const courseNames = [];
    for (let i = 0; i < courseCards.length; i++) {
      const text = await courseCards[i].textContent();
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length > 0) {
        const courseName = lines[0].trim();
        courseNames.push(courseName);
      }
    }

    console.log('\n=== Courses in schedule ===');
    courseNames.forEach((name, idx) => {
      console.log(`${idx + 1}. ${name.substring(0, 60)}`);
    });

    // Count courses by checking for specific keywords
    const year1Courses = courseNames.filter(name => {
      const upper = name.toUpperCase();
      return upper.includes('ENGLISH') ||
             upper.includes('MATH') ||
             upper.includes('BIOLOGY') ||
             upper.includes('ENS') ||
             upper.includes('SCIENCE') ||
             upper.includes('HISTORY');
    });

    console.log(`\n=== Year 1 Fall Courses Count: ${year1Courses.length} ===`);
    console.log('Expected: 4 courses (English, Math, Science, ENS)');

    if (year1Courses.length < 4) {
      console.log('❌ ERROR: Only ' + year1Courses.length + ' courses suggested!');
      console.log('Missing courses. Expected:');
      console.log('  - English 1-2');
      console.log('  - Math (Integrated Math I)');
      console.log('  - Biology');
      console.log('  - ENS 3-4');
    } else {
      console.log('✅ Correct number of courses');
    }

  } else {
    console.log('❌ No Auto-Suggest buttons found!');
  }

  console.log('\nKeeping browser open for 30 seconds...');
  await page.waitForTimeout(30000);

  await browser.close();
})();
