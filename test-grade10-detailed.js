const { chromium } = require('playwright');

async function testGrade10Detailed() {
  console.log('🧪 DETAILED GRADE 10 AUTO-SUGGEST ANALYSIS\n');
  console.log('=' .repeat(70));

  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    console.log('✅ App loaded\n');

    // Test Fall Semester
    console.log('📋 GRADE 10 FALL AUTO-SUGGEST');
    console.log('=' .repeat(70));

    const grade10Card = page.locator('h3:has-text("Grade 10")').locator('..').locator('..');
    await grade10Card.locator('button:has-text("Auto-fill Fall Semester")').click();
    await page.waitForTimeout(3000);

    // Get all course names in Q1
    const q1CourseCards = await page.locator('h4:has-text("Q1")').locator('..').locator('..').locator('.rounded-lg.p-3.transition-all.border-l-4');
    const q1Count = await q1CourseCards.count();

    console.log(`\nQ1 (${q1Count} courses):`);
    for (let i = 0; i < q1Count; i++) {
      const courseCard = q1CourseCards.nth(i);
      const courseName = await courseCard.locator('.font-bold.text-sm').first().textContent();
      const courseDetails = await courseCard.locator('.text-xs.text-gray-400').first().textContent();
      console.log(`  ${i + 1}. ${courseName.trim()}`);
      console.log(`     ${courseDetails.trim()}`);
    }

    // Get all course names in Q2
    const q2CourseCards = await page.locator('h4:has-text("Q2")').locator('..').locator('..').locator('.rounded-lg.p-3.transition-all.border-l-4');
    const q2Count = await q2CourseCards.count();

    console.log(`\nQ2 (${q2Count} courses):`);
    for (let i = 0; i < q2Count; i++) {
      const courseCard = q2CourseCards.nth(i);
      const courseName = await courseCard.locator('.font-bold.text-sm').first().textContent();
      const courseDetails = await courseCard.locator('.text-xs.text-gray-400').first().textContent();
      console.log(`  ${i + 1}. ${courseName.trim()}`);
      console.log(`     ${courseDetails.trim()}`);
    }

    console.log(`\nTotal Cards in Fall: ${q1Count + q2Count}`);
    console.log(`Expected: 4 unique courses (or 8 cards if all yearlong)\n`);

    console.log('\n' + '='.repeat(70));
    console.log('Browser will stay open for 15 seconds for inspection...\n');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

testGrade10Detailed().catch(console.error);
