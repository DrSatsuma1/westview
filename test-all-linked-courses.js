const { chromium } = require('playwright');

async function testAllLinkedCourses() {
  console.log('🧪 Testing ALL Linked Course Pairs\n');
  console.log('=' .repeat(70));

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  try {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    console.log('✅ App loaded\n');

    // Test 1: AVID Pairs (bidirectional)
    console.log('📚 Testing AVID Pairs...');
    await testPair(page, results, 'Grade 9 Fall', 9, 'Fall', 'English', 'ENGLISH 1-2', 'AVID 1-2');
    await clearAll(page);
    await testPair(page, results, 'Grade 10 Fall', 10, 'Fall', 'English', 'ENGLISH 3-4', 'AVID 3-4');
    await clearAll(page);
    await testPair(page, results, 'Grade 11 Fall', 11, 'Fall', 'History/Social Science', 'UNITED STATES HISTORY', 'AVID 5-6');
    await clearAll(page);

    // Test 2: Spanish Pair (bidirectional required)
    console.log('\n🇪🇸 Testing Spanish Pair...');
    await testManualAdd(page, results, 'Honors Spanish 7-8 → AP Spanish', 11, 'Fall', 'Foreign Language', 'HONORS SPANISH 7-8', 'AP SPANISH LANGUAGE');
    await clearAll(page);

    // Test 3: Pre-Calculus/Calculus (bidirectional required)
    console.log('\n➗ Testing Pre-Calculus/Calculus Pair...');
    await testManualAdd(page, results, 'AP Pre-Calculus → AP Calculus AB', 11, 'Fall', 'Math', 'AP PRE-CALCULUS', 'AP CALCULUS AB');
    await clearAll(page);

    // Test 4: British Lit/AP English Lit (bidirectional required)
    console.log('\n📖 Testing British Lit/AP English Lit Pair...');
    await testManualAdd(page, results, 'British Literature → AP English Lit', 11, 'Fall', 'English', 'BRITISH LITERATURE', 'AP ENGLISH LITERATURE');
    await clearAll(page);

    // Test 5: Honors American Lit/AP US History (bidirectional required)
    console.log('\n📜 Testing Honors American Lit/AP US History Pair...');
    await testManualAdd(page, results, 'Honors American Lit → AP US History', 11, 'Fall', 'English', 'HONORS AMERICAN LITERATURE', 'AP UNITED STATES HISTORY');
    await clearAll(page);

    // Test 6: Honors Biology/AP Biology (bidirectional required)
    console.log('\n🧬 Testing Honors Biology/AP Biology Pair...');
    await testManualAdd(page, results, 'Honors Biology → AP Biology 3-4', 9, 'Fall', 'Science - Biological', 'HONORS BIOLOGY', 'AP BIOLOGY 3-4');
    await clearAll(page);

    // Test 7: Honors Chemistry/AP Chemistry (bidirectional required)
    console.log('\n⚗️  Testing Honors Chemistry/AP Chemistry Pair...');
    await testManualAdd(page, results, 'Honors Chemistry → AP Chemistry 3-4', 10, 'Fall', 'Science - Physical', 'HONORS CHEMISTRY', 'AP CHEMISTRY 3-4');
    await clearAll(page);

    // Test 8: Honors World History/AP World History (bidirectional required)
    console.log('\n🌍 Testing Honors World History/AP World History Pair...');
    await testManualAdd(page, results, 'Honors World History → AP World History', 9, 'Fall', 'History/Social Science', 'HONORS WORLD HISTORY', 'AP WORLD HISTORY');
    await clearAll(page);

    // Test 9: College Algebra/AP Statistics (bidirectional required)
    console.log('\n📊 Testing College Algebra/AP Statistics Pair...');
    await testManualAdd(page, results, 'College Algebra → AP Statistics', 11, 'Fall', 'Math', 'COLLEGE ALGEBRA', 'AP STATISTICS');
    await clearAll(page);

    // Test 10: Statistics/AP Statistics (bidirectional required)
    console.log('\n📈 Testing Statistics/AP Statistics Pair...');
    await testManualAdd(page, results, 'Statistics → AP Statistics', 11, 'Fall', 'Math', 'STATISTICS', 'AP STATISTICS');
    await clearAll(page);

    // Test 11: Studio Art Digital Photography/AP Studio 2D (bidirectional required)
    console.log('\n📷 Testing Studio Art Photography/AP Studio 2D Pair...');
    await testManualAdd(page, results, 'Studio Art Photography → AP Studio 2D', 10, 'Fall', 'Fine Arts', 'STUDIO ART 1-2: DIGITAL PHOTOGRAPHY', 'AP STUDIO ART 2D');
    await clearAll(page);

    // Test 12: Studio Art Drawing/AP Studio Drawing (bidirectional required)
    console.log('\n🎨 Testing Studio Art Drawing/AP Studio Drawing Pair...');
    await testManualAdd(page, results, 'Studio Art Drawing → AP Studio Drawing', 10, 'Fall', 'Fine Arts', 'STUDIO ART 1-2: DRAWING', 'AP STUDIO ART');
    await clearAll(page);

    // Test 13: Studio Art Ceramics/AP Studio 3D (bidirectional required)
    console.log('\n🏺 Testing Studio Art Ceramics/AP Studio 3D Pair...');
    await testManualAdd(page, results, 'Studio Art Ceramics → AP Studio 3D', 10, 'Fall', 'Fine Arts', 'STUDIO ART 1-2: CERAMICS', 'AP STUDIO ART 3D');
    await clearAll(page);

    // Test 14: Dance Prop/Marching PE (bidirectional required)
    console.log('\n💃 Testing Dance Prop/Marching PE Pair...');
    await testManualAdd(page, results, 'Marching PE → Dance Prop', 9, 'Fall', 'Physical Education', 'MARCHING PE', 'DANCE PROP');
    await clearAll(page);

    // Test 15: AP Physics C Mechanics/E&M (sequential)
    console.log('\n⚛️  Testing AP Physics C Sequential Pair...');
    await testManualAdd(page, results, 'AP Physics C Mechanics → E&M', 11, 'Fall', 'Science - Physical', 'AP PHYSICS C: MECHANICS', 'AP PHYSICS C: ELECTRICITY');
    await clearAll(page);

    // Test 16: Computer Science/AP CS A (bidirectional)
    console.log('\n💻 Testing Computer Science/AP CS A Pair...');
    await testManualAdd(page, results, 'Computer Science → AP CS A', 10, 'Fall', 'CTE', 'COMPUTER SCIENCE', 'AP COMPUTER SCIENCE A');
    await clearAll(page);

    // Test 17: Data Structures/AP CS A (bidirectional)
    console.log('\n🗄️  Testing Data Structures/AP CS A Pair...');
    await testManualAdd(page, results, 'Data Structures → AP CS A', 11, 'Fall', 'CTE', 'DATA STRUCTURES', 'AP COMPUTER SCIENCE A');
    await clearAll(page);

    // Test 18: Studio Art Graphic Design/AP CS A (bidirectional)
    console.log('\n🎨 Testing Studio Art Graphic Design/AP CS A Pair...');
    await testManualAdd(page, results, 'Studio Art Graphic Design → AP CS A', 10, 'Fall', 'Fine Arts', 'STUDIO ART 1-2: GRAPHIC DESIGN', 'AP COMPUTER SCIENCE A');
    await clearAll(page);

    // Test 19: AP US Gov/Civics (one-way)
    console.log('\n🏛️  Testing AP US Gov/Civics Pair (one-way)...');
    await testManualAdd(page, results, 'AP US Gov → Civics (one-way)', 12, 'Fall', 'History/Social Science', 'AP UNITED STATES GOVERNMENT', 'CIVICS');
    await clearAll(page);

    // Test 20: Physics of Universe/AP Physics 1A-1B (one-way)
    console.log('\n🌌 Testing Physics of Universe/AP Physics 1A-1B Pair (one-way)...');
    await testManualAdd(page, results, 'Physics of Universe → AP Physics 1A-1B', 10, 'Fall', 'Science - Physical', 'PHYSICS OF THE UNIVERSE', 'AP PHYSICS 1A-1B');
    await clearAll(page);

    // Print Summary
    console.log('\n\n' + '='.repeat(70));
    console.log('FINAL RESULTS');
    console.log('='.repeat(70));

    console.log(`\n✅ Passed: ${results.passed.length}`);
    results.passed.forEach(test => console.log(`   ✓ ${test}`));

    console.log(`\n❌ Failed: ${results.failed.length}`);
    results.failed.forEach(test => console.log(`   ✗ ${test}`));

    console.log(`\n⚠️  Warnings: ${results.warnings.length}`);
    results.warnings.forEach(test => console.log(`   ! ${test}`));

    const totalTests = results.passed.length + results.failed.length;
    const passRate = ((results.passed.length / totalTests) * 100).toFixed(1);
    console.log(`\n📊 Pass Rate: ${passRate}% (${results.passed.length}/${totalTests})`);

    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

async function testPair(page, results, testName, grade, term, pathway, baseCourse, linkedCourse) {
  const gradeCard = page.locator(`h3:has-text("Grade ${grade}")`).locator('..').locator('..');
  const button = gradeCard.locator(`button:has-text("Auto-fill ${term} Semester")`);

  await button.click();
  await page.waitForTimeout(1500);

  const baseFound = await page.locator(`text="${baseCourse}"`).count() > 0 ||
                    await findCourseByPartialName(page, baseCourse);
  const linkedFound = await page.locator(`text="${linkedCourse}"`).count() > 0 ||
                      await findCourseByPartialName(page, linkedCourse);

  console.log(`   Base course: ${baseFound ? '✓' : '✗'}`);
  console.log(`   Linked course: ${linkedFound ? '✓' : '✗'}`);

  if (baseFound && linkedFound) {
    console.log(`   ✅ PASSED`);
    results.passed.push(testName);
  } else if (!baseFound) {
    console.log(`   ⚠️  SKIPPED: Base course not auto-suggested`);
    results.warnings.push(`${testName} - Base not suggested`);
  } else {
    console.log(`   ❌ FAILED: Linked course not added`);
    results.failed.push(testName);
  }
}

async function testManualAdd(page, results, testName, grade, term, pathway, baseCourse, linkedCourse) {
  // Click "Add Course" for the specified grade and term
  // Find all Add Course buttons and click the one for the right grade/term
  const allAddButtons = await page.locator('button:has-text("Add Course")').all();

  // Get grade section position (9=0, 10=1, 11=2, 12=3)
  const gradeIndex = grade - 9;
  // Each grade has 4 quarters, Fall = Q1/Q2 (0,1), Spring = Q3/Q4 (2,3)
  const quarterIndex = term === 'Fall' ? 0 : 2;
  const buttonIndex = (gradeIndex * 4) + quarterIndex;

  if (buttonIndex >= allAddButtons.length) {
    console.log(`   ⚠️  WARNING: Add Course button not found at index ${buttonIndex}`);
    results.warnings.push(`${testName} - Button not found`);
    return;
  }

  await allAddButtons[buttonIndex].click();
  await page.waitForTimeout(500);

  // Select pathway
  const pathwayButton = page.locator(`button:has-text("${pathway}")`).first();
  await pathwayButton.click();
  await page.waitForTimeout(500);

  // Find and select the base course from dropdown
  const courseSelect = page.locator('select').first();
  const options = await courseSelect.locator('option').all();

  let courseFound = false;
  for (const option of options) {
    const text = await option.textContent();
    if (text && text.toUpperCase().includes(baseCourse.toUpperCase())) {
      await courseSelect.selectOption({ label: text });
      courseFound = true;
      break;
    }
  }

  if (!courseFound) {
    console.log(`   ⚠️  WARNING: Base course "${baseCourse}" not found in dropdown`);
    results.warnings.push(`${testName} - Course not in catalog`);

    // Close the add course form
    const cancelButtons = await page.locator('button:has-text("Cancel")').all();
    if (cancelButtons.length > 0) {
      await cancelButtons[0].click();
      await page.waitForTimeout(300);
    }
    return;
  }

  // Click "Add" button
  const addCourseButton = page.locator('button:has-text("Add")').first();
  await addCourseButton.click();
  await page.waitForTimeout(1000);

  // Check if both courses are present
  const baseFound = await findCourseByPartialName(page, baseCourse);
  const linkedFound = await findCourseByPartialName(page, linkedCourse);

  console.log(`   Base course added: ${baseFound ? '✓' : '✗'}`);
  console.log(`   Linked course added: ${linkedFound ? '✓' : '✗'}`);

  if (baseFound && linkedFound) {
    console.log(`   ✅ PASSED`);
    results.passed.push(testName);
  } else if (!baseFound) {
    console.log(`   ❌ FAILED: Base course not added`);
    results.failed.push(testName);
  } else {
    console.log(`   ❌ FAILED: Linked course not automatically added`);
    results.failed.push(testName);
  }
}

async function findCourseByPartialName(page, courseName) {
  const bodyText = await page.locator('body').textContent();
  const upperText = bodyText.toUpperCase();
  const upperCourseName = courseName.toUpperCase();

  // Try exact match first
  if (upperText.includes(upperCourseName)) {
    return true;
  }

  // Try partial matches for common variations
  const words = upperCourseName.split(' ');
  if (words.length >= 2) {
    // Try first two words
    const partialName = words.slice(0, 2).join(' ');
    if (upperText.includes(partialName)) {
      return true;
    }
  }

  return false;
}

async function clearAll(page) {
  const removeButtons = await page.locator('button:has-text("×")').all();
  for (const button of removeButtons) {
    try {
      await button.click({ timeout: 300 });
      await page.waitForTimeout(50);
    } catch (e) {
      // Button might have been removed
    }
  }
  await page.waitForTimeout(500);
}

testAllLinkedCourses().catch(console.error);
