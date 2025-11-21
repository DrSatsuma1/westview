const { chromium } = require('playwright');

async function verifyLinkedCourses() {
  console.log('🧪 Verifying All Linked Course Pairs\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    const results = [];

    // Test Grade 9 Fall - English 1-2 → AVID 1-2
    console.log('📚 Grade 9 Fall: Testing English 1-2 → AVID 1-2');
    const g9Result = await testLinkedPair(page, 9, 'Fall', 'ENGLISH 1-2', 'AVID 1-');
    results.push({ grade: 9, term: 'Fall', ...g9Result });
    await clearAll(page);

    // Test Grade 10 Fall - English 3-4 → AVID 3-4
    console.log('\n📚 Grade 10 Fall: Testing English 3-4 → AVID 3-4');
    const g10Result = await testLinkedPair(page, 10, 'Fall', 'ENGLISH 3-4', 'AVID 3-4');
    results.push({ grade: 10, term: 'Fall', ...g10Result });
    await clearAll(page);

    // Test Grade 11 Fall - US History → AVID 5-6
    console.log('\n📚 Grade 11 Fall: Testing US History → AVID 5-6');
    const g11Result = await testLinkedPair(page, 11, 'Fall', 'UNITED STATES HISTORY', 'AVID 5-6');
    results.push({ grade: 11, term: 'Fall', ...g11Result });
    await clearAll(page);

    // Test multiple linked pairs by manually adding base courses
    console.log('\n\n🔧 Manual Testing: Adding base courses to trigger linked pairs\n');

    // Add Honors World History to trigger AP World History
    console.log('🌍 Testing: Honors World History → AP World History');
    await addCourseManually(page, 9, 'Fall', 'Honors World History');
    const hwResult = await checkForCourse(page, 'AP WORLD HISTORY');
    console.log(hwResult.found ? '   ✅ AP World History added!' : '   ❌ AP World History NOT found');

    await clearAll(page);

    // Add Physics of the Universe to trigger AP Physics 1A-1B
    console.log('\n⚛️  Testing: Physics of the Universe → AP Physics 1A-1B');
    await addCourseManually(page, 10, 'Fall', 'Physics of the Universe');
    const physResult = await checkForCourse(page, 'AP PHYSICS 1A-1B');
    console.log(physResult.found ? '   ✅ AP Physics 1A-1B added!' : '   ❌ AP Physics 1A-1B NOT found');

    await clearAll(page);

    // Add Honors Spanish 7-8 to trigger AP Spanish
    console.log('\n🇪🇸 Testing: Honors Spanish 7-8 → AP Spanish Language');
    await addCourseManually(page, 11, 'Fall', 'Honors Spanish 7-8');
    const spanResult = await checkForCourse(page, 'AP SPANISH LANGUAGE');
    console.log(spanResult.found ? '   ✅ AP Spanish Language added!' : '   ❌ AP Spanish Language NOT found');

    // Summary
    console.log('\n\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));

    const autofillTests = results.filter(r => r.base && r.linked);
    const passedAutofill = autofillTests.length;

    console.log(`\nAuto-fill Tests: ${passedAutofill}/${results.length} passed`);
    results.forEach(r => {
      const status = (r.base && r.linked) ? '✅' : '❌';
      console.log(`  ${status} Grade ${r.grade} ${r.term}: ${r.base ? 'Base found' : 'No base'}, ${r.linked ? 'Linked found' : 'No linked'}`);
    });

    console.log('\nManual Add Tests:');
    console.log(hwResult.found ? '  ✅ Honors World History → AP World History' : '  ❌ Honors World History → AP World History');
    console.log(physResult.found ? '  ✅ Physics of Universe → AP Physics 1A-1B' : '  ❌ Physics of Universe → AP Physics 1A-1B');
    console.log(spanResult.found ? '  ✅ Honors Spanish 7-8 → AP Spanish Language' : '  ❌ Honors Spanish 7-8 → AP Spanish Language');

    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

async function testLinkedPair(page, grade, term, baseText, linkedText) {
  const gradeSection = page.locator(`h3:has-text("Grade ${grade}")`).locator('..').locator('..');
  const button = gradeSection.locator(`button:has-text("Auto-fill ${term} Semester")`);

  await button.click();
  await page.waitForTimeout(1500);

  const baseFound = await page.locator(`text=${baseText}`).count() > 0;
  const linkedFound = await page.locator(`text=${linkedText}`).count() > 0;

  console.log(`   Base course (${baseText}): ${baseFound ? '✓ found' : '✗ not found'}`);
  console.log(`   Linked course (${linkedText}): ${linkedFound ? '✓ found' : '✗ not found'}`);

  if (baseFound && linkedFound) {
    console.log('   ✅ PASSED: Both courses present');
  } else if (baseFound && !linkedFound) {
    console.log('   ❌ FAILED: Base found but linked course missing!');
  } else if (!baseFound) {
    console.log('   ⚠️  Base course not auto-suggested for this grade/term');
  }

  return { base: baseFound, linked: linkedFound };
}

async function addCourseManually(page, grade, term, courseName) {
  // This would require clicking Add Course button and selecting the course
  // For now, just document that this would need to be implemented
  console.log(`   (Manual add not implemented - would add ${courseName} to Grade ${grade} ${term})`);
}

async function checkForCourse(page, courseText) {
  const found = await page.locator(`text=${courseText}`).count() > 0;
  return { found };
}

async function clearAll(page) {
  await page.locator('button:has-text("Clear All Courses")').click();
  await page.waitForTimeout(500);
}

verifyLinkedCourses().catch(console.error);
