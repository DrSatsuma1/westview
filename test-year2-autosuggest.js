const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Navigating to app...');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);

  console.log('\n=== Testing Auto-Suggest for Year 2 (Grade 10) Fall ===');

  // Find all Auto-Suggest buttons
  const autoSuggestButtons = await page.locator('button:has-text("Auto-Suggest")').all();
  console.log(`Found ${autoSuggestButtons.length} Auto-Suggest buttons`);

  // Click the button for Year 2 Fall (should be around index 2-3)
  // Let's find it by looking for Grade 10 or Year 2 context
  if (autoSuggestButtons.length >= 3) {
    console.log('\nClicking Auto-Suggest for Year 2 Fall (button index 2)...');
    await autoSuggestButtons[2].click(); // Assuming: 0=Y1 Fall, 1=Y1 Spring, 2=Y2 Fall
    await page.waitForTimeout(2000);

    // Get all course cards
    const allText = await page.locator('body').textContent();

    // Look for Year 2 / Grade 10 section
    console.log('\n=== Searching for Year 2 courses ===');

    // Find courses by looking for course patterns
    const courses = [];

    // Check for English
    if (allText.includes('ENGLISH 3-4')) courses.push('English 3-4');
    if (allText.includes('ENGLISH')) courses.push('English (generic)');

    // Check for Math
    if (allText.includes('ALGEBRA')) courses.push('Algebra');
    if (allText.includes('GEOMETRY')) courses.push('Geometry');
    if (allText.includes('MATH')) courses.push('Math (generic)');

    // Check for Science
    if (allText.includes('CHEMISTRY')) courses.push('Chemistry');
    if (allText.includes('BIOLOGY')) courses.push('Biology');
    if (allText.includes('PHYSICS')) courses.push('Physics');

    // Check for History
    if (allText.includes('WORLD HISTORY')) courses.push('World History');
    if (allText.includes('HISTORY')) courses.push('History (generic)');

    // Check for PE
    if (allText.includes('AEROBICS')) courses.push('Aerobics');
    if (allText.includes('ENS')) courses.push('ENS');
    if (allText.includes('WEIGHT')) courses.push('Weight Training');

    console.log('Courses found in page:');
    courses.forEach(c => console.log(`  - ${c}`));

    // Take screenshot
    await page.screenshot({ path: 'year2-autosuggest.png', fullPage: true });
    console.log('\nScreenshot saved as year2-autosuggest.png');

    // Try to count actual course cards in Grade 10 section
    console.log('\n=== Looking for course cards ===');
    const courseCards = await page.locator('[class*="border-l-"]').all();
    console.log(`Total course cards found on page: ${courseCards.length}`);

    // Get text from first few cards
    for (let i = 0; i < Math.min(15, courseCards.length); i++) {
      const cardText = await courseCards[i].textContent();
      const firstLine = cardText.split('\n')[0].trim();
      console.log(`  Card ${i}: ${firstLine.substring(0, 50)}...`);
    }
  } else {
    console.log('Not enough Auto-Suggest buttons found!');
  }

  console.log('\nWaiting 15 seconds before closing...');
  await page.waitForTimeout(15000);

  await browser.close();
})();
