const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Navigating to app...');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);

  console.log('\n=== Testing Auto-Suggest for Year 9 Fall ===');

  // Take initial screenshot to see the page
  await page.screenshot({ path: 'initial-page.png', fullPage: true });
  console.log('Initial screenshot saved as initial-page.png');

  // Find all buttons on the page
  const allButtons = await page.locator('button').all();
  console.log(`Found ${allButtons.length} total buttons on page`);

  // Find buttons with Auto-Suggest text (try different variations)
  let autoSuggestButtons = await page.locator('button:has-text("Auto-Suggest")').all();
  if (autoSuggestButtons.length === 0) {
    autoSuggestButtons = await page.locator('button:has-text("Suggest")').all();
  }
  if (autoSuggestButtons.length === 0) {
    autoSuggestButtons = await page.locator('button:has-text("Auto")').all();
  }
  console.log(`Found ${autoSuggestButtons.length} Auto-Suggest buttons`);

  if (autoSuggestButtons.length > 0) {
    // Click the first one (should be Year 9 Fall)
    console.log('Clicking first Auto-Suggest button (Year 9 Fall)...');
    await autoSuggestButtons[0].click();
    await page.waitForTimeout(2000);

    // Get all course cards to see what was added
    const courseCards = await page.locator('[class*="border-l-"]').all();
    console.log(`\nTotal course cards found: ${courseCards.length}`);

    // Extract course names
    const courseNames = [];
    for (const card of courseCards) {
      const text = await card.textContent();
      // Try to extract just the course name (first line usually)
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length > 0) {
        courseNames.push(lines[0]);
      }
    }

    console.log('\nCourses added:');
    courseNames.forEach((name, i) => {
      console.log(`  ${i + 1}. ${name}`);
    });

    // Check for foreign languages
    const foreignLanguages = courseNames.filter(name =>
      name.includes('SPANISH') ||
      name.includes('CHINESE') ||
      name.includes('FRENCH') ||
      name.includes('GERMAN') ||
      name.includes('JAPANESE')
    );

    console.log('\nForeign Language courses found:');
    if (foreignLanguages.length === 0) {
      console.log('  None');
    } else {
      foreignLanguages.forEach(lang => console.log(`  - ${lang}`));
    }

    // Check for duplicates
    const uniqueLanguages = [...new Set(foreignLanguages.map(name => {
      if (name.includes('SPANISH')) return 'SPANISH';
      if (name.includes('CHINESE')) return 'CHINESE';
      if (name.includes('FRENCH')) return 'FRENCH';
      if (name.includes('GERMAN')) return 'GERMAN';
      if (name.includes('JAPANESE')) return 'JAPANESE';
      return 'UNKNOWN';
    }))];

    console.log('\n=== RESULT ===');
    if (uniqueLanguages.length > 1) {
      console.log('❌ BUG STILL EXISTS: Multiple different languages suggested!');
      console.log(`   Languages: ${uniqueLanguages.join(', ')}`);
    } else if (uniqueLanguages.length === 1) {
      console.log('✅ FIX VERIFIED: Only one language suggested!');
      console.log(`   Language: ${uniqueLanguages[0]}`);
    } else {
      console.log('ℹ️  No foreign languages suggested (might be expected)');
    }

    // Take a screenshot
    await page.screenshot({ path: 'autosuggest-test.png', fullPage: true });
    console.log('\nScreenshot saved as autosuggest-test.png');
  } else {
    console.log('No Auto-Suggest buttons found!');
  }

  console.log('\nWaiting 10 seconds before closing...');
  await page.waitForTimeout(10000);

  await browser.close();
})();
