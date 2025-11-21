const { chromium } = require('playwright');

async function testLinkedCourses() {
  console.log('🧪 Testing Linked Course Pairs...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);

    console.log('✅ App loaded\n');

    // Test 1: British Literature → AP English Literature (Grade 11)
    console.log('📚 Test 1: British Literature → AP English Literature');
    await testCoursePair(page, 11, 'fall', 'BRITISH_LITERATURE_0003', 'AP_ENGLISH', 'British Literature', 'AP English Literature');

    // Clear the schedule
    await clearSchedule(page);

    // Test 2: Honors World History → AP World History (Grade 9)
    console.log('\n🌍 Test 2: Honors World History → AP World History');
    await testCoursePair(page, 9, 'fall', 'HON_WORLD_0013', 'AP_WORLD_0013', 'Honors World History', 'AP World History');

    // Clear the schedule
    await clearSchedule(page);

    // Test 3: Computer Science → AP Computer Science A (Grade 10)
    console.log('\n💻 Test 3: Computer Science → AP Computer Science A');
    await testCoursePair(page, 10, 'fall', 'COMPUTER_SCIENCE_0009', 'AP_COMPUTER_0010', 'Computer Science', 'AP Computer Science A');

    // Clear the schedule
    await clearSchedule(page);

    // Test 4: Civics/Economics → AP US Government (Grade 12)
    console.log('\n🏛️  Test 4: Civics/Economics → AP US Government');
    await testCoursePair(page, 12, 'fall', 'CIVICS__0013', 'AP_UNITED_0013', 'Civics', 'AP United States Government');

    // Clear the schedule
    await clearSchedule(page);

    // Test 5: English 1-2 → AVID 1-2 (Grade 9)
    console.log('\n📖 Test 5: English 1-2 → AVID 1-2');
    await testCoursePair(page, 9, 'fall', 'HIGH_SCHOOL_0003', 'AVID_12_0015', 'English 1-2', 'AVID 1-2');

    // Clear the schedule
    await clearSchedule(page);

    // Test 6: AP Pre-Calculus → AP Calculus AB (Grade 11)
    console.log('\n➗ Test 6: AP Pre-Calculus → AP Calculus AB');
    await testCoursePair(page, 11, 'fall', 'AP_PRECALCULUS_0010', 'AP_CALCULUS_0010', 'AP Pre-Calculus', 'AP Calculus AB');

    console.log('\n\n✨ All tests completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    throw error;
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
}

async function testCoursePair(page, grade, term, baseCourseId, linkedCourseId, baseName, linkedName) {
  // Find the autofill button for the specified grade and term
  const gradeCard = page.locator(`div:has-text("Grade ${grade}")`).first();
  const autofillButton = term === 'fall'
    ? gradeCard.locator('button:has-text("Auto-fill Fall")').first()
    : gradeCard.locator('button:has-text("Auto-fill Spring")').first();

  console.log(`   Clicking Auto-fill ${term === 'fall' ? 'Fall' : 'Spring'} for Grade ${grade}...`);
  await autofillButton.click();
  await page.waitForTimeout(1500);

  // Check if base course exists
  const baseCourseExists = await page.locator(`text=${baseName}`).count() > 0;
  console.log(`   ${baseCourseExists ? '✓' : '✗'} Base course (${baseName}) found: ${baseCourseExists}`);

  // Check if linked course exists
  const linkedCourseExists = await page.locator(`text=${linkedName}`).count() > 0;
  console.log(`   ${linkedCourseExists ? '✓' : '✗'} Linked course (${linkedName}) found: ${linkedCourseExists}`);

  // Verify both courses appear in both Fall and Spring (yearlong courses)
  const fallCount = await gradeCard.locator('.grid > div').first().locator(`text=${baseName}`).count();
  const springCount = await gradeCard.locator('.grid > div').last().locator(`text=${baseName}`).count();

  if (baseCourseExists) {
    console.log(`   ${fallCount > 0 && springCount > 0 ? '✓' : '✗'} Base course appears in both semesters`);
  }

  if (linkedCourseExists) {
    const linkedFallCount = await gradeCard.locator('.grid > div').first().locator(`text=${linkedName}`).count();
    const linkedSpringCount = await gradeCard.locator('.grid > div').last().locator(`text=${linkedName}`).count();
    console.log(`   ${linkedFallCount > 0 && linkedSpringCount > 0 ? '✓' : '✗'} Linked course appears in both semesters`);
  }

  if (!baseCourseExists) {
    console.log(`   ⚠️  Base course not suggested for Grade ${grade} ${term}`);
  } else if (!linkedCourseExists) {
    console.log(`   ❌ FAILED: Base course exists but linked course was NOT added!`);
    throw new Error(`Linked course ${linkedName} was not added when ${baseName} was suggested`);
  } else {
    console.log(`   ✅ PASSED: Both courses added successfully`);
  }
}

async function clearSchedule(page) {
  console.log('   🧹 Clearing schedule...');

  // Click all X buttons to remove courses
  let removeButtons = await page.locator('button:has-text("×")').all();

  for (let button of removeButtons) {
    try {
      await button.click({ timeout: 500 });
      await page.waitForTimeout(100);
    } catch (e) {
      // Button might have been removed already
    }
  }

  await page.waitForTimeout(500);
}

testLinkedCourses().catch(console.error);
