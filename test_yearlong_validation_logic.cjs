/**
 * Test the yearlong duplicate validation logic directly
 * by injecting JavaScript into the page to call the validation functions
 */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Pre-populate with a yearlong course
  await page.addInitScript(() => {
    localStorage.clear();
    const existingCourses = [
      { id: 1, courseId: 'INTEGRATED_MATHEMATICS_0010', year: '9', quarter: 'Q1' },
      { id: 2, courseId: 'INTEGRATED_MATHEMATICS_0010', year: '9', quarter: 'Q2' },
      { id: 3, courseId: 'INTEGRATED_MATHEMATICS_0010', year: '9', quarter: 'Q3' },
      { id: 4, courseId: 'INTEGRATED_MATHEMATICS_0010', year: '9', quarter: 'Q4' },
    ];
    localStorage.setItem('westview-courses', JSON.stringify(existingCourses));
  });

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(3000);

  console.log('=== Testing Yearlong Duplicate Validation ===\n');

  // Count initial course appearances
  const initialCount = await page.evaluate(() => {
    return document.body.innerHTML.match(/INTEGRATED_MATHEMATICS_0010/gi)?.length || 0;
  });
  console.log(`1. Initial course ID appearances in DOM: ${initialCount}`);

  // Count course cards directly
  const courseCardCount = await page.evaluate(() => {
    // Look for course cards that contain Integrated Math
    const cards = document.querySelectorAll('[draggable="true"]');
    let count = 0;
    cards.forEach(card => {
      if (card.textContent.includes('INTEGRA') || card.textContent.includes('Integrated')) {
        count++;
      }
    });
    return count;
  });
  console.log(`   Course cards with Integrated Math: ${courseCardCount}`);

  // Now simulate trying to add the same course via direct React state manipulation
  console.log('\n2. Testing validation by simulating add action...');

  // We can't directly call React functions, but we can test via the UI
  // Click on an empty slot in Grade 9
  const emptySlot = await page.locator('div:has-text("Add Course")').first();
  await emptySlot.click();
  await page.waitForTimeout(500);

  // Look for pathway buttons and click Math
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text === 'Math') {
      await btn.click();
      console.log('   Clicked Math pathway button');
      await page.waitForTimeout(500);
      break;
    }
  }

  // Now look for the select dropdown and check if it shows Math courses
  const select = await page.$('select');
  if (select) {
    const options = await select.$$eval('option', opts =>
      opts.map(o => ({ value: o.value, text: o.textContent }))
    );

    console.log(`   Dropdown has ${options.length} options`);

    // Find Integrated Math I
    const mathI = options.find(o =>
      o.value && o.value.includes('INTEGRATED_MATHEMATICS_0010')
    );

    if (mathI) {
      console.log(`   Found target course in dropdown: ${mathI.value}`);
      await select.selectOption(mathI.value);

      // Now click Add Course button
      const addBtn = await page.$('button:has-text("Add Course")');
      if (addBtn && await addBtn.isEnabled()) {
        await addBtn.click();
        console.log('   Clicked Add Course button');
        await page.waitForTimeout(1000);

        // Check for error message
        const errorText = await page.evaluate(() => {
          // Look for error messages in red banners
          const errorEls = document.querySelectorAll('[class*="bg-red"], [class*="text-red"]');
          for (const el of errorEls) {
            const text = el.textContent;
            if (text && text.length > 5 && text.length < 200) {
              return text;
            }
          }
          return null;
        });

        if (errorText) {
          console.log(`\n3. RESULT: Error message found: "${errorText}"`);
          console.log('   VALIDATION IS WORKING!');
        } else {
          // Check if course count increased
          const newCardCount = await page.evaluate(() => {
            const cards = document.querySelectorAll('[draggable="true"]');
            let count = 0;
            cards.forEach(card => {
              if (card.textContent.includes('INTEGRA') || card.textContent.includes('Integrated')) {
                count++;
              }
            });
            return count;
          });

          console.log(`\n3. RESULT: No error message found`);
          console.log(`   Course cards after add attempt: ${newCardCount}`);

          if (newCardCount > courseCardCount) {
            console.log('   BUG: Duplicate course was added!');
          } else if (newCardCount === courseCardCount) {
            console.log('   UNKNOWN: Course count unchanged, but no error shown');
          }
        }
      } else {
        console.log('   Add button not found or disabled');
      }
    } else {
      console.log('   Target course not found in dropdown');
      console.log('   Available Math courses:', options.filter(o => o.value?.includes('MATH') || o.text?.includes('Math')).map(o => o.text));
    }
  }

  await page.screenshot({ path: '/tmp/yearlong_validation_test.png', fullPage: true });

  await browser.close();
  console.log('\n=== Test Complete ===');
})();
