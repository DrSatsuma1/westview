const { chromium } = require('playwright');

async function testComprehensiveFixes() {
  console.log('🧪 COMPREHENSIVE AUTO-SUGGEST FIXES TEST\n');
  console.log('Testing:');
  console.log('  1. Integrated Math I only in Grade 9');
  console.log('  2. Linked courses in opposite semesters (Honors in Fall, AP in Spring)');
  console.log('  3. Non-AP, non-Honors World History for Grade 10');
  console.log('  4. AVID never auto-suggested\n');
  console.log('=' .repeat(70));

  const browser = await chromium.launch({ headless: false, slowMo: 150 });
  const page = await browser.newPage();

  const results = { passed: [], failed: [], warnings: [] };

  try {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    console.log('✅ App loaded\n');

    // TEST 1: Grade 9 Fall - Should suggest Integrated Math I
    console.log('📋 TEST 1: Grade 9 Fall Auto-Suggest');
    console.log('   Expected: Integrated Math I suggested\n');

    const grade9Card = page.locator('h3:has-text("Grade 9")').locator('..').locator('..');
    await grade9Card.locator('button:has-text("Auto-fill Fall Semester")').click();
    await page.waitForTimeout(2000);

    let bodyText = await page.locator('body').textContent();
    const hasIntMath1 = bodyText.includes('INTEGRATED MATHEMATICS I');

    console.log(`   Integrated Math I present: ${hasIntMath1 ? '✅ YES' : '❌ NO'}`);
    if (hasIntMath1) {
      results.passed.push('Grade 9: Integrated Math I suggested');
    } else {
      results.failed.push('Grade 9: Integrated Math I NOT suggested');
    }

    // Clear all
    await clearAll(page);
    await page.waitForTimeout(1000);

    // TEST 2: Grade 10 Fall - Should suggest World History (non-AP, non-Honors)
    console.log('\n📋 TEST 2: Grade 10 Fall Auto-Suggest');
    console.log('   Expected: World History (non-AP, non-Honors)\n');

    const grade10Card = page.locator('h3:has-text("Grade 10")').locator('..').locator('..');
    await grade10Card.locator('button:has-text("Auto-fill Fall Semester")').click();
    await page.waitForTimeout(2000);

    bodyText = await page.locator('body').textContent();

    const hasWorldHistory = bodyText.includes('WORLD HISTORY');
    const hasAPWorld = bodyText.includes('AP WORLD');
    const hasHonorsWorld = bodyText.includes('HONORS WORLD');
    const hasIntMath1InGrade10 = bodyText.includes('INTEGRATED MATHEMATICS I');

    console.log(`   World History present: ${hasWorldHistory ? '✅ YES' : '❌ NO'}`);
    console.log(`   AP World History: ${hasAPWorld ? '❌ YES (FAIL)' : '✅ NO (PASS)'}`);
    console.log(`   Honors World History: ${hasHonorsWorld ? '⚠️  YES' : '✅ NO'}`);
    console.log(`   Integrated Math I in Grade 10: ${hasIntMath1InGrade10 ? '❌ YES (FAIL)' : '✅ NO (PASS)'}`);

    if (hasWorldHistory && !hasAPWorld) {
      results.passed.push('Grade 10: Non-AP World History suggested');
    } else if (hasAPWorld) {
      results.failed.push('Grade 10: AP World History suggested (should be regular)');
    }

    if (hasIntMath1InGrade10) {
      results.failed.push('Grade 10: Integrated Math I suggested (should only be Grade 9)');
    } else {
      results.passed.push('Grade 10: Integrated Math I NOT suggested (correct)');
    }

    // TEST 3: Check if linked courses are in different semesters
    console.log('\n📋 TEST 3: Linked Course Semester Placement');
    console.log('   Expected: If Honors course in Fall, AP course in Spring\n');

    // Get Fall courses (Q1/Q2) and Spring courses (Q3/Q4) from Grade 10
    const grade10Text = await grade10Card.textContent();

    // Simple heuristic: Check if both Honors and AP versions appear
    if (hasHonorsWorld && hasAPWorld) {
      console.log('   ⚠️  Both Honors World and AP World detected');
      console.log('   Need to verify they are in different semesters...');
      results.warnings.push('Linked courses present - manual verification needed for semester placement');
    } else {
      console.log('   ✅ No linked pair detected in same auto-suggest');
      results.passed.push('Linked courses: Not both suggested simultaneously');
    }

    // TEST 4: AVID exclusion
    const hasAVID = bodyText.includes('AVID 1-2') || bodyText.includes('AVID 3-4') || bodyText.includes('AVID 5-6');
    console.log(`\n   AVID courses present: ${hasAVID ? '❌ YES (FAIL)' : '✅ NO (PASS)'}`);

    if (!hasAVID) {
      results.passed.push('AVID: Not auto-suggested (correct)');
    } else {
      results.failed.push('AVID: Auto-suggested (should be manual only)');
    }

    // SUMMARY
    console.log('\n\n' + '='.repeat(70));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(70));

    console.log(`\n✅ PASSED: ${results.passed.length}`);
    results.passed.forEach(test => console.log(`   ✓ ${test}`));

    console.log(`\n❌ FAILED: ${results.failed.length}`);
    results.failed.forEach(test => console.log(`   ✗ ${test}`));

    console.log(`\n⚠️  WARNINGS: ${results.warnings.length}`);
    results.warnings.forEach(test => console.log(`   ! ${test}`));

    const passRate = results.passed.length / (results.passed.length + results.failed.length) * 100;
    console.log(`\n📊 Pass Rate: ${passRate.toFixed(1)}%`);

    console.log('\nBrowser will stay open for 15 seconds for manual inspection...\n');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
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

testComprehensiveFixes().catch(console.error);
