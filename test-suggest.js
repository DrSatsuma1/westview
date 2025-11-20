const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate to app
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('\n=== Testing Auto-fill Functionality ===\n');

  // Find all "Auto-fill" buttons
  const fallButtons = await page.getByText('Auto-fill Fall Semester').all();
  const springButtons = await page.getByText('Auto-fill Spring Semester').all();

  console.log(`Found ${fallButtons.length} "Auto-fill Fall Semester" buttons`);
  console.log(`Found ${springButtons.length} "Auto-fill Spring Semester" buttons`);

  if (fallButtons.length === 0 || springButtons.length === 0) {
    console.error('ERROR: Could not find Auto-fill buttons');
    await browser.close();
    return;
  }

  // Click Grade 9 Fall button (first one)
  console.log('\nStep 1: Clicking Grade 9 Auto-fill Fall Semester...');
  await fallButtons[0].click();
  await page.waitForTimeout(2000);

  // Count course cards after Fall
  const coursesAfterFall = await page.locator('.bg-white.rounded-lg.p-3.cursor-move, .bg-gradient-to-br.from-blue-50.to-indigo-50').count();
  console.log(`Course cards after Fall auto-fill: ${coursesAfterFall}`);

  // Get text of all courses to see what was added
  const fallCourseTexts = await page.locator('.bg-white.rounded-lg.p-3.cursor-move, .bg-gradient-to-br.from-blue-50.to-indigo-50').allTextContents();
  console.log('\nCourses in Fall:');
  fallCourseTexts.forEach((text, i) => {
    const lines = text.split('\n').filter(l => l.trim());
    console.log(`  ${i + 1}. ${lines[0] || text.substring(0, 50)}`);
  });

  // Click Grade 9 Spring button (first one)
  console.log('\nStep 2: Clicking Grade 9 Auto-fill Spring Semester...');
  await springButtons[0].click();
  await page.waitForTimeout(2000);

  // Count course cards after Spring
  const coursesAfterSpring = await page.locator('.bg-white.rounded-lg.p-3.cursor-move, .bg-gradient-to-br.from-blue-50.to-indigo-50').count();
  console.log(`Course cards after Spring auto-fill: ${coursesAfterSpring}`);

  // Get text of all courses to see what was added
  const allCourseTexts = await page.locator('.bg-white.rounded-lg.p-3.cursor-move, .bg-gradient-to-br.from-blue-50.to-indigo-50').allTextContents();
  console.log('\nAll courses after Spring auto-fill:');
  allCourseTexts.forEach((text, i) => {
    const lines = text.split('\n').filter(l => l.trim());
    console.log(`  ${i + 1}. ${lines[0] || text.substring(0, 50)}`);
  });

  // Calculate how many courses were added in Spring
  const coursesAddedInSpring = coursesAfterSpring - coursesAfterFall;

  // Summary
  console.log('\n=== Summary ===');
  console.log(`Courses after Fall auto-fill: ${coursesAfterFall}`);
  console.log(`Courses after Spring auto-fill: ${coursesAfterSpring}`);
  console.log(`Courses ADDED in Spring: ${coursesAddedInSpring}`);

  console.log('\n=== Analysis ===');
  if (coursesAddedInSpring <= 1) {
    console.log(`❌ BUG CONFIRMED: Only ${coursesAddedInSpring} course(s) added in Spring`);
    console.log('Expected: Multiple courses should be added in Spring');
  } else {
    console.log(`✓ Spring auto-fill working: ${coursesAddedInSpring} courses added`);
  }

  // Check for duplicate English 1-2
  const englishCount = allCourseTexts.filter(t => t.includes('ENGLISH 1-2')).length;
  if (englishCount > 2) {
    console.log(`❌ BUG: English 1-2 appears ${englishCount} times (should be max 2 for yearlong)`);
  } else {
    console.log(`✓ English 1-2 count: ${englishCount} (correct)`);
  }

  // Take final screenshot
  await page.screenshot({ path: 'final-state.png', fullPage: true });
  console.log('\nScreenshot saved: final-state.png');

  // Keep browser open
  console.log('\nKeeping browser open for 15 seconds for inspection...');
  await page.waitForTimeout(15000);

  await browser.close();
})();
