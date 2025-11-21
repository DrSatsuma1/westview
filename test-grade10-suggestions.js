const { chromium } = require('playwright');

async function testGrade10Suggestions() {
  console.log('🧪 TESTING GRADE 10 AUTO-SUGGEST COUNTS\n');
  console.log('Expected: 4 courses in Fall, 4 courses in Spring');
  console.log('=' .repeat(70));

  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    console.log('✅ App loaded\n');

    // Test Fall Semester
    console.log('📋 TEST 1: Grade 10 Fall Auto-Suggest');
    console.log('   Expected: 4 courses suggested\n');

    const grade10Card = page.locator('h3:has-text("Grade 10")').locator('..').locator('..');
    await grade10Card.locator('button:has-text("Auto-fill Fall Semester")').click();
    await page.waitForTimeout(3000);

    // Count courses in Q1 and Q2
    const q1Courses = await page.locator('h4:has-text("Q1")').locator('..').locator('..').locator('.rounded-lg.p-3.transition-all.border-l-4').count();
    const q2Courses = await page.locator('h4:has-text("Q2")').locator('..').locator('..').locator('.rounded-lg.p-3.transition-all.border-l-4').count();

    console.log(`   Q1 Courses: ${q1Courses}`);
    console.log(`   Q2 Courses: ${q2Courses}`);
    console.log(`   Total Fall: ${q1Courses + q2Courses} ${(q1Courses + q2Courses) === 4 ? '✅' : '❌ FAIL'}\n`);

    // Clear and test Spring
    const removeButtons = await page.locator('button:has-text("×")').all();
    for (const button of removeButtons) {
      try {
        await button.click({ timeout: 300 });
        await page.waitForTimeout(50);
      } catch (e) {}
    }
    await page.waitForTimeout(1000);

    console.log('📋 TEST 2: Grade 10 Spring Auto-Suggest');
    console.log('   Expected: 4 courses suggested\n');

    await grade10Card.locator('button:has-text("Auto-fill Spring Semester")').click();
    await page.waitForTimeout(3000);

    // Count courses in Q3 and Q4
    const q3Courses = await page.locator('h4:has-text("Q3")').locator('..').locator('..').locator('.rounded-lg.p-3.transition-all.border-l-4').count();
    const q4Courses = await page.locator('h4:has-text("Q4")').locator('..').locator('..').locator('.rounded-lg.p-3.transition-all.border-l-4').count();

    console.log(`   Q3 Courses: ${q3Courses}`);
    console.log(`   Q4 Courses: ${q4Courses}`);
    console.log(`   Total Spring: ${q3Courses + q4Courses} ${(q3Courses + q4Courses) === 4 ? '✅' : '❌ FAIL'}\n`);

    console.log('='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    console.log(`Fall Total: ${q1Courses + q2Courses}/4 courses`);
    console.log(`Spring Total: ${q3Courses + q4Courses}/4 courses`);

    console.log('\nBrowser will stay open for 15 seconds for inspection...\n');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

testGrade10Suggestions().catch(console.error);
