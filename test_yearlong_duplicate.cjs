const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false }); // Use headed mode to see what's happening
  const page = await browser.newPage();

  // Clear localStorage and set up a test scenario with an existing yearlong course
  await page.addInitScript(() => {
    localStorage.clear();

    // Pre-populate with a yearlong course (Integrated Math I) already in Grade 9
    const existingCourses = [
      { id: 1, courseId: 'INTEGRATED_MATHEMATICS_0010', year: '9', quarter: 'Q1' },
      { id: 2, courseId: 'INTEGRATED_MATHEMATICS_0010', year: '9', quarter: 'Q2' },
      { id: 3, courseId: 'INTEGRATED_MATHEMATICS_0010', year: '9', quarter: 'Q3' },
      { id: 4, courseId: 'INTEGRATED_MATHEMATICS_0010', year: '9', quarter: 'Q4' },
    ];
    localStorage.setItem('westview-courses', JSON.stringify(existingCourses));
  });

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(3000);

  console.log('=== Testing Yearlong Course Duplicate Validation ===\n');

  // Take initial screenshot
  await page.screenshot({ path: '/tmp/yearlong_test_initial.png', fullPage: true });
  console.log('1. Initial state captured - should have Integrated Math I in Grade 9');

  // Check if the course appears in the schedule
  const pageText = await page.textContent('body');
  const hasMath = pageText.includes('Integrated Math') || pageText.includes('INTEGRATED');
  console.log(`   Course visible in schedule: ${hasMath}`);

  // Now try to add the same course again via UI
  console.log('\n2. Attempting to add Integrated Math I again...');

  // Find an empty Add Course slot in Grade 9 (should be slot 2 since slot 1 has Math)
  const addCourseSlots = await page.locator('div:has-text("Add Course")').all();
  console.log(`   Found ${addCourseSlots.length} potential Add Course slots`);

  // Click the first actual Add Course slot
  for (const slot of addCourseSlots) {
    const text = await slot.textContent();
    if (text && text.includes('Add Course') && text.length < 30) {
      await slot.click();
      await page.waitForTimeout(500);
      console.log('   Clicked Add Course slot');
      break;
    }
  }

  await page.screenshot({ path: '/tmp/yearlong_test_2.png', fullPage: true });

  // Click Math pathway
  const mathBtn = await page.locator('button:has-text("Math")').first();
  if (await mathBtn.count() > 0) {
    await mathBtn.click();
    await page.waitForTimeout(500);
    console.log('   Selected Math pathway');
  }

  await page.screenshot({ path: '/tmp/yearlong_test_3.png', fullPage: true });

  // Select Integrated Math I from dropdown
  const select = await page.$('select');
  if (select) {
    const options = await select.$$eval('option', opts =>
      opts.map(o => ({ value: o.value, text: o.textContent }))
    );
    console.log('   Available courses:', options.slice(0, 10).map(o => o.text));

    // Find Integrated Math I
    const mathI = options.find(o =>
      o.text && (o.text.includes('Integrated Math') || o.text.includes('Integrated Mathematics I'))
    );

    if (mathI && mathI.value) {
      await select.selectOption(mathI.value);
      console.log(`   Selected: ${mathI.text}`);
    } else {
      console.log('   Could not find Integrated Math I in dropdown');
      // Try to select first math course
      const firstMath = options.find(o => o.value && o.text?.toLowerCase().includes('math'));
      if (firstMath) {
        await select.selectOption(firstMath.value);
        console.log(`   Selected fallback: ${firstMath.text}`);
      }
    }
  }

  await page.screenshot({ path: '/tmp/yearlong_test_4.png', fullPage: true });

  // Click the Add Course button
  const addBtn = await page.locator('button:has-text("Add Course")').first();
  if (await addBtn.count() > 0) {
    await addBtn.click();
    await page.waitForTimeout(1000);
    console.log('   Clicked Add Course button');
  }

  await page.screenshot({ path: '/tmp/yearlong_test_5.png', fullPage: true });

  // Check for error message
  console.log('\n3. Checking for validation error...');

  const bodyText = await page.textContent('body');

  // Look for duplicate error messages
  const errorPatterns = [
    'already in this semester',
    'already in your 4-year schedule',
    'already scheduled',
    'Enable "Allow Repeat Courses"',
    'This course is already'
  ];

  let foundError = false;
  for (const pattern of errorPatterns) {
    if (bodyText.includes(pattern)) {
      console.log(`   SUCCESS: Found error containing: "${pattern}"`);
      foundError = true;
      break;
    }
  }

  if (!foundError) {
    console.log('   FAILURE: No duplicate error message found');

    // Check if allowRepeatCourses might be enabled
    if (bodyText.includes('Allow Repeat') || bodyText.includes('repeat courses')) {
      console.log('   Note: "Allow Repeat Courses" option detected');
    }

    // Count how many times the course appears
    const mathCount = (bodyText.match(/Integrated Math/gi) || []).length;
    console.log(`   "Integrated Math" appears ${mathCount} times`);

    if (mathCount > 4) {
      console.log('   BUG CONFIRMED: Course was added despite being a duplicate');
    }
  }

  // Also look for red error banners
  const redBanners = await page.$$('[class*="bg-red"], [class*="text-red-"]');
  for (const banner of redBanners) {
    const bannerText = await banner.textContent();
    if (bannerText && bannerText.length < 200) {
      console.log(`   Red banner text: "${bannerText}"`);
    }
  }

  console.log('\n=== Test Complete ===');
  console.log('Screenshots saved to /tmp/yearlong_test_*.png');

  await browser.close();
})();
