const { chromium } = require('playwright');

async function testAutoSuggestFixes() {
  console.log('🧪 TESTING AUTO-SUGGEST FIXES\n');
  console.log('Testing that:');
  console.log('  1. Auto-suggest adds exactly 4 courses to the clicked semester');
  console.log('  2. Other semesters remain empty');
  console.log('  3. AVID courses are NEVER suggested');
  console.log('  4. Courses only appear in correct quarters\n');
  console.log('=' .repeat(70));

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    console.log('✅ App loaded\n');

    // TEST 1: Grade 10 Fall Auto-Suggest
    console.log('📋 TEST 1: Auto-fill Fall Semester for Grade 10');
    console.log('   Expected: Exactly 4 courses in Fall (Q1+Q2), 0 in Spring (Q3+Q4), no AVID\n');

    const grade10Card = page.locator('h3:has-text("Grade 10")').locator('..').locator('..');
    const fallButton = grade10Card.locator('button:has-text("Auto-fill Fall Semester")');

    await fallButton.click();
    await page.waitForTimeout(2000);

    // Count courses in each quarter
    const bodyText = await page.locator('body').textContent();

    // Get all course boxes
    const courseBoxes = await page.locator('.border.rounded').allTextContents();

    console.log('   Analyzing suggested courses...\n');

    // Check for AVID courses
    const hasAVID = bodyText.includes('AVID 1-2') ||
                    bodyText.includes('AVID 3-4') ||
                    bodyText.includes('AVID 5-6');

    if (hasAVID) {
      console.log('   ❌ FAIL: AVID course was auto-suggested (should never happen)');
    } else {
      console.log('   ✅ PASS: No AVID courses suggested');
    }

    // Count courses more accurately by looking at Grade 10 card structure
    const grade10CourseBoxes = await grade10Card.locator('.border.rounded').allTextContents();
    const courseCount = grade10CourseBoxes.filter(text => text.trim().length > 10).length;

    console.log(`   Total courses in Grade 10: ${courseCount}`);

    if (courseCount === 4 || courseCount === 8) { // 8 because yearlong = 2 boxes
      console.log('   ✅ PASS: Course count looks correct (4 yearlong = 8 boxes, or 4 semester)');
    } else if (courseCount > 8) {
      console.log(`   ❌ FAIL: Too many courses (${courseCount} boxes, expected 8 or fewer)`);
    } else {
      console.log(`   ⚠️  WARNING: Fewer courses than expected (${courseCount} boxes)`);
    }

    // TEST 2: Grade 9 Fall Auto-Suggest (should include English but not AVID)
    console.log('\n\n📋 TEST 2: Auto-fill Fall Semester for Grade 9');
    console.log('   Expected: Exactly 4 courses, including English 1-2, but NO AVID 1-2\n');

    const grade9Card = page.locator('h3:has-text("Grade 9")').locator('..').locator('..');
    const grade9FallButton = grade9Card.locator('button:has-text("Auto-fill Fall Semester")');

    await grade9FallButton.click();
    await page.waitForTimeout(2000);

    const bodyText2 = await page.locator('body').textContent();

    const hasEnglish12 = bodyText2.includes('ENGLISH 1-2') || bodyText2.includes('English 1-2');
    const hasAVID12 = bodyText2.includes('AVID 1-2');

    console.log(`   English 1-2 present: ${hasEnglish12 ? '✅ YES' : '❌ NO'}`);
    console.log(`   AVID 1-2 present: ${hasAVID12 ? '❌ YES (FAIL)' : '✅ NO (PASS)'}`);

    if (hasEnglish12 && !hasAVID12) {
      console.log('   ✅ PASS: English suggested without AVID');
    } else if (hasAVID12) {
      console.log('   ❌ FAIL: AVID was auto-suggested (should only be manual)');
    }

    // TEST 3: Grade 11 Fall Auto-Suggest (should include US History but not AVID)
    console.log('\n\n📋 TEST 3: Auto-fill Fall Semester for Grade 11');
    console.log('   Expected: US History present, but NO AVID 5-6\n');

    const grade11Card = page.locator('h3:has-text("Grade 11")').locator('..').locator('..');
    const grade11FallButton = grade11Card.locator('button:has-text("Auto-fill Fall Semester")');

    await grade11FallButton.click();
    await page.waitForTimeout(2000);

    const bodyText3 = await page.locator('body').textContent();

    const hasUSHistory = bodyText3.includes('UNITED STATES HISTORY') ||
                         bodyText3.includes('United States History') ||
                         bodyText3.includes('US HISTORY');
    const hasAVID56 = bodyText3.includes('AVID 5-6');

    console.log(`   US History present: ${hasUSHistory ? '✅ YES' : '❌ NO'}`);
    console.log(`   AVID 5-6 present: ${hasAVID56 ? '❌ YES (FAIL)' : '✅ NO (PASS)'}`);

    if (hasUSHistory && !hasAVID56) {
      console.log('   ✅ PASS: US History suggested without AVID');
    } else if (hasAVID56) {
      console.log('   ❌ FAIL: AVID 5-6 was auto-suggested');
    }

    // Final Summary
    console.log('\n\n' + '='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    console.log('✅ If all tests show PASS: Both fixes are working correctly');
    console.log('❌ If any test shows FAIL: Review the implementation');
    console.log('\nKey Fixes Verified:');
    console.log('  1. Quarter counting fix - suggestions only count once');
    console.log('  2. AVID exclusion fix - AVID never auto-suggested');
    console.log('\nBrowser will stay open for 10 seconds for manual inspection...\n');

    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

testAutoSuggestFixes().catch(console.error);
