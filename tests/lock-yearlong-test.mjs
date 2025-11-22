/**
 * Test Lock and Yearlong Course Entry
 */
import { chromium } from 'playwright';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');

  // Clear and reload
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await sleep(1000);

  console.log('=== LOCK TEST ===');

  // Find all buttons and identify lock buttons (icon-only, next to auto-fill)
  const buttons = await page.locator('button').all();
  let lockButton = null;

  for (const btn of buttons) {
    const text = await btn.innerText();
    const hasSvg = await btn.locator('svg').count();
    // Lock button: has SVG, no text
    if (hasSvg > 0 && text.trim() === '') {
      lockButton = btn;
      break;
    }
  }

  if (lockButton) {
    console.log('Found lock button, clicking...');
    await lockButton.click();
    await sleep(500);

    // Check localStorage
    const lockedState = await page.evaluate(() => {
      return localStorage.getItem('westview-locked-semesters');
    });
    console.log('Locked semesters: ' + lockedState);

    // Check button visual state
    const classes = await lockButton.getAttribute('class');
    const isRed = classes && classes.includes('red');
    console.log('Button turned red: ' + isRed);

    if (lockedState && lockedState !== '{}') {
      console.log('✅ Lock state persists');
    } else {
      console.log('❌ Lock state NOT persisting');
    }
  } else {
    console.log('❌ Could not find lock button');
  }

  console.log('\n=== YEARLONG COURSE ENTRY ===');

  // Clear and reload
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await sleep(1000);

  // Click on grade 9 area to open add form
  const grade9 = page.locator('text=Grade 9').first();
  const box = await grade9.boundingBox();

  if (box) {
    // Click below header where empty slot should be
    await page.mouse.click(box.x + 100, box.y + 200);
    await sleep(500);

    // Check for pathway buttons first
    const pathwayButtons = await page.locator('button').filter({ hasText: /^(English|Math|Science|History)$/ }).count();
    console.log('Pathway buttons visible: ' + pathwayButtons);

    if (pathwayButtons > 0) {
      // Click English pathway
      await page.locator('button:has-text("English")').first().click();
      await sleep(300);

      // Check for select/dropdown
      const selectCount = await page.locator('select').count();
      console.log('Select elements: ' + selectCount);

      if (selectCount > 0) {
        // Get options
        const options = await page.evaluate(() => {
          const select = document.querySelector('select');
          return select ? Array.from(select.options).map(o => o.text).slice(0, 3) : [];
        });
        console.log('First options: ' + JSON.stringify(options));

        // Try to select first real course option
        const select = page.locator('select').first();
        const optionValues = await page.evaluate(() => {
          const select = document.querySelector('select');
          return select ? Array.from(select.options).map(o => ({ value: o.value, text: o.text })).slice(0, 5) : [];
        });
        console.log('Option values: ' + JSON.stringify(optionValues));

        // Select second option (first is usually placeholder)
        if (optionValues.length > 1) {
          await select.selectOption({ index: 1 });
          await sleep(300);

          // Look for Add button
          const addButton = page.locator('button:has-text("Add")').first();
          if (await addButton.count() > 0) {
            await addButton.click();
            await sleep(500);

            // Check if course was added
            const courses = await page.evaluate(() => {
              const data = localStorage.getItem('westview-courses');
              return data ? JSON.parse(data) : [];
            });
            console.log('Courses added: ' + courses.length);

            // For yearlong, should have entries in both fall quarters (Q1, Q2)
            if (courses.length > 0) {
              const quarters = courses.map(c => c.quarter);
              console.log('Quarters: ' + JSON.stringify(quarters));

              const hasBothFallQuarters = quarters.includes('Q1') && quarters.includes('Q2');
              if (hasBothFallQuarters) {
                console.log('✅ Yearlong course correctly added to Q1 and Q2');
              } else {
                console.log('❌ Yearlong course NOT in both fall quarters');
              }
            }
          }
        }
      }
    } else {
      // Maybe form opened directly without pathways
      const selectCount = await page.locator('select').count();
      console.log('Direct select (no pathways): ' + selectCount);
    }
  }

  console.log('\n=== DRAG-DROP TEST ===');

  // First auto-fill to get some courses
  const autoFill = page.locator('button:has-text("Auto-fill")').first();
  if (await autoFill.count() > 0) {
    await autoFill.click();
    await sleep(1000);

    // Get draggable elements
    const draggables = await page.locator('[draggable="true"]').all();
    console.log('Draggable elements: ' + draggables.length);

    if (draggables.length > 0) {
      // Get initial course positions
      const coursesBefore = await page.evaluate(() => {
        const data = localStorage.getItem('westview-courses');
        return data ? JSON.parse(data) : [];
      });
      console.log('Courses before drag: ' + coursesBefore.length);

      // Attempt drag from Grade 9 to Grade 10
      const firstDraggable = draggables[0];
      const sourceBox = await firstDraggable.boundingBox();

      // Find Grade 10 area
      const grade10 = page.locator('text=Grade 10').first();
      const targetBox = await grade10.boundingBox();

      if (sourceBox && targetBox) {
        // Simulate drag
        await page.mouse.move(sourceBox.x + 50, sourceBox.y + 10);
        await page.mouse.down();
        await page.mouse.move(targetBox.x + 100, targetBox.y + 200, { steps: 10 });
        await page.mouse.up();
        await sleep(500);

        const coursesAfter = await page.evaluate(() => {
          const data = localStorage.getItem('westview-courses');
          return data ? JSON.parse(data) : [];
        });

        // Check if any course moved to year 10
        const year10Courses = coursesAfter.filter(c => c.year === '10');
        console.log('Courses in Grade 10 after drag: ' + year10Courses.length);

        if (year10Courses.length > 0) {
          console.log('✅ Drag-drop moved course to Grade 10');
        } else {
          console.log('⚠️ Drag-drop may not have worked (or course stayed in place)');
        }
      }
    }
  }

  await browser.close();
}

runTests().catch(console.error);
