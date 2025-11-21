const { chromium } = require('playwright');

async function testLinkedValidation() {
  console.log('🧪 Testing Linked Course Validation\n');
  console.log('Testing that linked courses CANNOT be added alone...\n');
  console.log('=' .repeat(70));

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const results = {
    passed: [],
    failed: [],
    skipped: []
  };

  try {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    console.log('✅ App loaded\n');

    // Test validation: Try to add linked courses WITHOUT their required pairs
    // These should all show ERROR messages

    console.log('📚 Test 1: Try adding AVID 1-2 WITHOUT English 1-2');
    await testValidationError(page, results, 'AVID 1-2 without English', 9, 'Q1', 'Electives', 'AVID 1-2', 'must be taken with');

    console.log('\n🇪🇸 Test 2: Try adding AP Spanish WITHOUT Honors Spanish 7-8');
    await testValidationError(page, results, 'AP Spanish without Honors Spanish', 11, 'Q1', 'Foreign Language', 'AP SPANISH LANGUAGE', 'must be taken with');

    console.log('\n➗ Test 3: Try adding AP Calculus AB WITHOUT AP Pre-Calculus');
    await testValidationError(page, results, 'AP Calc AB without Pre-Calc', 11, 'Q1', 'Math', 'AP CALCULUS AB', 'must be taken with');

    console.log('\n🧬 Test 4: Try adding AP Biology WITHOUT Honors Biology');
    await testValidationError(page, results, 'AP Biology without Honors Bio', 10, 'Q1', 'Science - Biological', 'AP BIOLOGY 3-4', 'must be taken with');

    console.log('\n⚗️  Test 5: Try adding AP Chemistry WITHOUT Honors Chemistry');
    await testValidationError(page, results, 'AP Chemistry without Honors Chem', 10, 'Q1', 'Science - Physical', 'AP CHEMISTRY 3-4', 'must be taken with');

    console.log('\n🌍 Test 6: Try adding AP World History WITHOUT Honors World History');
    await testValidationError(page, results, 'AP World without Honors World', 9, 'Q1', 'History/Social Science', 'AP WORLD HISTORY', 'must be taken with');

    console.log('\n📊 Test 7: Try adding AP Statistics WITHOUT College Algebra or Statistics');
    await testValidationError(page, results, 'AP Statistics alone', 11, 'Q1', 'Math', 'AP STATISTICS', 'must be taken with');

    console.log('\n📷 Test 8: Try adding AP Studio 2D WITHOUT Studio Art Photography');
    await testValidationError(page, results, 'AP Studio 2D alone', 10, 'Q1', 'Fine Arts', 'AP STUDIO ART 2D', 'must be taken with');

    console.log('\n💻 Test 9: Try adding AP Computer Science A WITHOUT any partner course');
    await testValidationError(page, results, 'AP CS A alone', 10, 'Q1', 'CTE', 'AP COMPUTER SCIENCE A', 'must be taken with');

    console.log('\n⚛️  Test 10: Try adding AP Physics C E&M WITHOUT Mechanics');
    await testValidationError(page, results, 'AP Physics E&M without Mechanics', 11, 'Q1', 'Science - Physical', 'AP PHYSICS C: ELECTRICITY', 'must be taken with');

    // Print Summary
    console.log('\n\n' + '='.repeat(70));
    console.log('VALIDATION TEST RESULTS');
    console.log('='.repeat(70));

    console.log(`\n✅ Passed (Error shown correctly): ${results.passed.length}`);
    results.passed.forEach(test => console.log(`   ✓ ${test}`));

    console.log(`\n❌ Failed (No error shown): ${results.failed.length}`);
    results.failed.forEach(test => console.log(`   ✗ ${test}`));

    console.log(`\n⚠️  Skipped (Course not found): ${results.skipped.length}`);
    results.skipped.forEach(test => console.log(`   ! ${test}`));

    const totalTests = results.passed.length + results.failed.length;
    if (totalTests > 0) {
      const passRate = ((results.passed.length / totalTests) * 100).toFixed(1);
      console.log(`\n📊 Validation Pass Rate: ${passRate}% (${results.passed.length}/${totalTests})`);
    }

    console.log('\n✨ Validation tests verify that linked courses cannot be added alone.');
    console.log('   All tests should show error messages preventing the addition.\n');

    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

async function testValidationError(page, results, testName, grade, quarter, pathway, courseName, expectedErrorText) {
  try {
    // Find the specific quarter slot for this grade
    const gradeCards = await page.locator('div').filter({ hasText: new RegExp(`Grade ${grade}`, 'i') }).all();

    if (gradeCards.length === 0) {
      console.log(`   ⚠️  SKIPPED: Grade ${grade} card not found`);
      results.skipped.push(testName);
      return;
    }

    // Look for Add Course button in the page
    const addButtons = await page.locator('button:has-text("Add Course")').all();

    if (addButtons.length === 0) {
      console.log(`   ⚠️  SKIPPED: No Add Course buttons found`);
      results.skipped.push(testName);
      return;
    }

    // Click the first available Add Course button
    await addButtons[0].click();
    await page.waitForTimeout(500);

    // Select pathway
    const pathwayButton = page.locator(`button:has-text("${pathway}")`).first();
    const pathwayVisible = await pathwayButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (!pathwayVisible) {
      console.log(`   ⚠️  SKIPPED: Pathway "${pathway}" not found`);
      results.skipped.push(testName);
      // Close dialog
      const cancelButtons = await page.locator('button:has-text("Cancel")').all();
      if (cancelButtons.length > 0) await cancelButtons[0].click();
      return;
    }

    await pathwayButton.click();
    await page.waitForTimeout(500);

    // Find and select the course from dropdown
    const courseSelect = page.locator('select').first();
    const selectVisible = await courseSelect.isVisible({ timeout: 2000 }).catch(() => false);

    if (!selectVisible) {
      console.log(`   ⚠️  SKIPPED: Course dropdown not found`);
      results.skipped.push(testName);
      return;
    }

    const options = await courseSelect.locator('option').all();
    let courseFound = false;

    for (const option of options) {
      const text = await option.textContent();
      if (text && text.toUpperCase().includes(courseName.toUpperCase())) {
        await courseSelect.selectOption({ label: text });
        courseFound = true;
        break;
      }
    }

    if (!courseFound) {
      console.log(`   ⚠️  SKIPPED: Course "${courseName}" not in dropdown`);
      results.skipped.push(testName);
      // Close dialog
      const cancelButtons = await page.locator('button:has-text("Cancel")').all();
      if (cancelButtons.length > 0) await cancelButtons[0].click();
      return;
    }

    // Click "Add" button
    const addCourseButton = page.locator('button:has-text("Add")').first();
    await addCourseButton.click();
    await page.waitForTimeout(1000);

    // Check for error message
    const bodyText = await page.locator('body').textContent();
    const hasError = bodyText.includes(expectedErrorText);

    if (hasError) {
      console.log(`   ✅ PASSED: Error message shown correctly`);
      results.passed.push(testName);

      // Close error dialog if present
      const okButtons = await page.locator('button:has-text("OK")').all();
      if (okButtons.length > 0) await okButtons[0].click();
      await page.waitForTimeout(300);
    } else {
      // Check if course was added (shouldn't be)
      const courseAdded = bodyText.includes(courseName);
      if (courseAdded) {
        console.log(`   ❌ FAILED: Course was added without error (should be blocked)`);
        results.failed.push(testName);
        // Remove the course
        const removeButtons = await page.locator('button:has-text("×")').all();
        if (removeButtons.length > 0) {
          await removeButtons[removeButtons.length - 1].click();
          await page.waitForTimeout(300);
        }
      } else {
        console.log(`   ⚠️  UNCLEAR: No error shown, course not added either`);
        results.skipped.push(testName);
      }
    }

  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    results.failed.push(testName);
  }
}

testLinkedValidation().catch(console.error);
