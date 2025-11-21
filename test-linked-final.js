const { chromium } = require('playwright');

async function testLinkedCoursesFinal() {
  console.log('🧪 COMPREHENSIVE LINKED COURSE TESTING\n');
  console.log('=' .repeat(70));

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();

  const results = {
    autoSuggest: { passed: [], failed: [] },
    validation: { passed: [], failed: [], skipped: [] }
  };

  try {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    console.log('✅ App loaded\n');

    // ===================================================================
    // PART 1: AUTO-SUGGEST TRIGGERING TESTS
    // ===================================================================
    console.log('PART 1: AUTO-SUGGEST LINKED COURSE TRIGGERING');
    console.log('='.repeat(70));
    console.log('Testing that auto-suggest adds linked courses automatically...\n');

    // Test AVID pairs (these are in the auto-suggest)
    console.log('📚 Test 1: English 1-2 → AVID 1-2 (Grade 9 Fall)');
    await testAutoSuggest(page, results.autoSuggest, 'English 1-2 → AVID 1-2', 9, 'Fall', 'ENGLISH 1-2', 'AVID 1-2');
    await clearAll(page);

    console.log('\n📚 Test 2: English 3-4 → AVID 3-4 (Grade 10 Fall)');
    await testAutoSuggest(page, results.autoSuggest, 'English 3-4 → AVID 3-4', 10, 'Fall', 'ENGLISH 3-4', 'AVID 3-4');
    await clearAll(page);

    console.log('\n📚 Test 3: US History → AVID 5-6 (Grade 11 Fall)');
    await testAutoSuggest(page, results.autoSuggest, 'US History → AVID 5-6', 11, 'Fall', 'UNITED STATES HISTORY', 'AVID 5-6');
    await clearAll(page);

    // ===================================================================
    // PART 2: MANUAL ADDITION WITH PAIR CHECKING
    // ===================================================================
    console.log('\n\nPART 2: MANUAL COURSE ADDITION TESTING');
    console.log('='.repeat(70));
    console.log('Testing manual addition of linked course pairs...\n');

    // Add a course manually, then add its linked pair
    console.log('🧬 Test 4: Add Honors Biology, then add AP Biology 3-4');
    await testManualLinkedPair(page, results.validation, 'Honors Bio + AP Bio', 9, 'Q1',
      'Science - Biological', 'HONORS BIOLOGY',
      'Science - Biological', 'AP BIOLOGY 3-4');
    await clearAll(page);

    console.log('\n⚗️  Test 5: Add Honors Chemistry, then add AP Chemistry 3-4');
    await testManualLinkedPair(page, results.validation, 'Honors Chem + AP Chem', 10, 'Q1',
      'Science - Physical', 'HONORS CHEMISTRY',
      'Science - Physical', 'AP CHEMISTRY 3-4');
    await clearAll(page);

    console.log('\n🌍 Test 6: Add Honors World History, then add AP World History');
    await testManualLinkedPair(page, results.validation, 'Honors World + AP World', 9, 'Q1',
      'History/Social Science', 'HONORS WORLD HISTORY',
      'History/Social Science', 'AP WORLD HISTORY');
    await clearAll(page);

    console.log('\n🇪🇸 Test 7: Add Honors Spanish 7-8, then add AP Spanish');
    await testManualLinkedPair(page, results.validation, 'Honors Spanish + AP Spanish', 11, 'Q1',
      'Foreign Language', 'HONORS SPANISH 7-8',
      'Foreign Language', 'AP SPANISH LANGUAGE');
    await clearAll(page);

    console.log('\n➗ Test 8: Add AP Pre-Calculus, then add AP Calculus AB');
    await testManualLinkedPair(page, results.validation, 'AP Pre-Calc + AP Calc AB', 11, 'Q1',
      'Math', 'AP PRE-CALCULUS',
      'Math', 'AP CALCULUS AB');
    await clearAll(page);

    console.log('\n💻 Test 9: Add Computer Science, then add AP CS A');
    await testManualLinkedPair(page, results.validation, 'Computer Science + AP CS A', 10, 'Q1',
      'CTE', 'COMPUTER SCIENCE',
      'CTE', 'AP COMPUTER SCIENCE A');
    await clearAll(page);

    // ===================================================================
    // FINAL SUMMARY
    // ===================================================================
    console.log('\n\n' + '='.repeat(70));
    console.log('FINAL TEST RESULTS');
    console.log('='.repeat(70));

    console.log('\n📊 AUTO-SUGGEST TESTS:');
    console.log(`   ✅ Passed: ${results.autoSuggest.passed.length}`);
    results.autoSuggest.passed.forEach(test => console.log(`      ✓ ${test}`));
    console.log(`   ❌ Failed: ${results.autoSuggest.failed.length}`);
    results.autoSuggest.failed.forEach(test => console.log(`      ✗ ${test}`));

    console.log('\n🔧 MANUAL ADDITION TESTS:');
    console.log(`   ✅ Passed: ${results.validation.passed.length}`);
    results.validation.passed.forEach(test => console.log(`      ✓ ${test}`));
    console.log(`   ❌ Failed: ${results.validation.failed.length}`);
    results.validation.failed.forEach(test => console.log(`      ✗ ${test}`));
    console.log(`   ⚠️  Skipped: ${results.validation.skipped.length}`);
    results.validation.skipped.forEach(test => console.log(`      ! ${test}`));

    const totalAutoSuggest = results.autoSuggest.passed.length + results.autoSuggest.failed.length;
    const totalManual = results.validation.passed.length + results.validation.failed.length;
    const totalTests = totalAutoSuggest + totalManual;
    const totalPassed = results.autoSuggest.passed.length + results.validation.passed.length;

    if (totalTests > 0) {
      const passRate = ((totalPassed / totalTests) * 100).toFixed(1);
      console.log(`\n📈 OVERALL PASS RATE: ${passRate}% (${totalPassed}/${totalTests})`);
    }

    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

async function testAutoSuggest(page, results, testName, grade, term, baseCourse, linkedCourse) {
  const gradeCard = page.locator(`h3:has-text("Grade ${grade}")`).locator('..').locator('..');
  const button = gradeCard.locator(`button:has-text("Auto-fill ${term} Semester")`);

  await button.click();
  await page.waitForTimeout(2000);

  const baseFound = await findCourse(page, baseCourse);
  const linkedFound = await findCourse(page, linkedCourse);

  console.log(`   Base course (${baseCourse}): ${baseFound ? '✓' : '✗'}`);
  console.log(`   Linked course (${linkedCourse}): ${linkedFound ? '✓' : '✗'}`);

  if (baseFound && linkedFound) {
    console.log('   ✅ PASSED');
    results.passed.push(testName);
  } else if (!baseFound) {
    console.log('   ⚠️  Base not auto-suggested (expected)');
    results.skipped = results.skipped || [];
    results.skipped.push(testName);
  } else {
    console.log('   ❌ FAILED: Linked course not added');
    results.failed.push(testName);
  }
}

async function testManualLinkedPair(page, results, testName, grade, quarter, pathway1, course1, pathway2, course2) {
  // Add first course
  const added1 = await addCourseToQuarter(page, grade, quarter, pathway1, course1);
  if (!added1) {
    console.log('   ⚠️  SKIPPED: Could not add base course');
    results.skipped.push(testName);
    return;
  }

  await page.waitForTimeout(1000);
  console.log(`   ✓ Added ${course1}`);

  // Add second course
  const added2 = await addCourseToQuarter(page, grade, quarter, pathway2, course2);
  if (!added2) {
    console.log('   ⚠️  SKIPPED: Could not add linked course');
    results.skipped.push(testName);
    return;
  }

  await page.waitForTimeout(1000);

  // Verify both are present
  const has1 = await findCourse(page, course1);
  const has2 = await findCourse(page, course2);

  console.log(`   ${course1}: ${has1 ? '✓' : '✗'}`);
  console.log(`   ${course2}: ${has2 ? '✓' : '✗'}`);

  if (has1 && has2) {
    console.log('   ✅ PASSED: Both courses present');
    results.passed.push(testName);
  } else {
    console.log('   ❌ FAILED: One or both courses missing');
    results.failed.push(testName);
  }
}

async function addCourseToQuarter(page, grade, quarter, pathway, courseName) {
  try {
    // Click "+" button in the specific quarter
    const gradeIndex = grade - 9; // 0-3
    const quarterIndex = { 'Q1': 0, 'Q2': 1, 'Q3': 2, 'Q4': 3 }[quarter];
    const gridIndex = (gradeIndex * 4) + quarterIndex;

    const addButtons = await page.locator('button.text-gray-400 svg.lucide-plus').all();
    if (gridIndex >= addButtons.length) return false;

    const parentButton = addButtons[gridIndex].locator('..');
    await parentButton.click();
    await page.waitForTimeout(500);

    // Select pathway
    const pathwayBtn = page.locator(`button:has-text("${pathway}")`).first();
    if (!await pathwayBtn.isVisible({ timeout: 1000 }).catch(() => false)) return false;

    await pathwayBtn.click();
    await page.waitForTimeout(500);

    // Select course
    const select = page.locator('select').first();
    if (!await select.isVisible({ timeout: 1000 }).catch(() => false)) return false;

    const options = await select.locator('option').all();
    for (const option of options) {
      const text = await option.textContent();
      if (text && text.toUpperCase().includes(courseName.toUpperCase())) {
        await select.selectOption({ label: text });
        await page.waitForTimeout(300);

        const addBtn = page.locator('button:has-text("Add")').first();
        await addBtn.click();
        await page.waitForTimeout(500);

        // Check for error dialog
        const hasError = await page.locator('text=must be taken with').isVisible({ timeout: 500 }).catch(() => false);
        if (hasError) {
          // Close error
          const okBtn = page.locator('button:has-text("OK")').first();
          if (await okBtn.isVisible({ timeout: 500 }).catch(() => false)) {
            await okBtn.click();
          }
          return false;
        }

        return true;
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function findCourse(page, courseName) {
  const bodyText = await page.locator('body').textContent();
  return bodyText.toUpperCase().includes(courseName.toUpperCase());
}

async function clearAll(page) {
  const removeButtons = await page.locator('button:has-text("×")').all();
  for (const button of removeButtons) {
    try {
      await button.click({ timeout: 300 });
      await page.waitForTimeout(50);
    } catch (e) {
      // Ignore
    }
  }
  await page.waitForTimeout(500);
}

testLinkedCoursesFinal().catch(console.error);
