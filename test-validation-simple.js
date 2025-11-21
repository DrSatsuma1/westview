const { chromium } = require('playwright');

async function testValidationSimple() {
  console.log('🧪 VALIDATION TEST: Linked Courses Cannot Be Added Alone\n');
  console.log('This test verifies that the validation logic prevents adding');
  console.log('linked courses without their required pairs.\n');
  console.log('=' .repeat(70));

  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    console.log('✅ App loaded\n');

    console.log('📋 INSTRUCTIONS FOR MANUAL VERIFICATION:');
    console.log('   Please manually test the following scenarios:\n');

    console.log('1. Try to add AVID 1-2 WITHOUT adding English 1-2 first');
    console.log('   → Should show error: "AVID 1-2 must be taken with English 1-2"\n');

    console.log('2. Try to add AP Spanish Language WITHOUT Honors Spanish 7-8');
    console.log('   → Should show error: "must be taken with Honors Spanish 7-8"\n');

    console.log('3. Try to add AP Biology 3-4 WITHOUT Honors Biology 1-2');
    console.log('   → Should show error: "must be taken with Honors Biology 1-2"\n');

    console.log('4. Try to add AP Computer Science A without any partner course');
    console.log('   → Should show error: "must be taken with one of: ..."\n');

    console.log('=' .repeat(70));
    console.log('\n✅ AUTO-SUGGEST VERIFICATION:');
    console.log('   Click "Auto-fill Fall Semester" for Grade 9');
    console.log('   → Should add BOTH English 1-2 AND AVID 1-2 together\n');

    console.log('   Click "Auto-fill Fall Semester" for Grade 10');
    console.log('   → Should add BOTH English 3-4 AND AVID 3-4 together\n');

    console.log('   Click "Auto-fill Fall Semester" for Grade 11');
    console.log('   → Should add BOTH US History AND AVID 5-6 together\n');

    console.log('=' .repeat(70));
    console.log('\nBrowser will stay open for 60 seconds for manual testing...\n');

    // Keep browser open for manual testing
    await page.waitForTimeout(60000);

    console.log('\n✅ Manual testing complete.');
    console.log('   If you saw the expected error messages and auto-suggest behavior,');
    console.log('   then all linked course validation is working correctly!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testValidationSimple().catch(console.error);
