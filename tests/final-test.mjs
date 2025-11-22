/**
 * Final Comprehensive Test Suite
 * Run: node tests/final-test.mjs
 */
import { chromium } from 'playwright';

const ISSUES = [];
const PASSES = [];

function logIssue(scenario, description, details = null) {
  ISSUES.push({ scenario, description, details });
  console.log(`❌ [${scenario}] ${description}`);
}

function logPass(scenario, description) {
  PASSES.push({ scenario, description });
  console.log(`✅ [${scenario}] ${description}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function findLockButton(page, index = 0) {
  const buttonsInfo = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    return Array.from(buttons).map((b, i) => ({
      index: i,
      hasLockSvg: b.innerHTML.includes('M12 15v2m') || b.innerHTML.includes('M8 11V7')
    }));
  });
  const lockButtons = buttonsInfo.filter(b => b.hasLockSvg);
  return lockButtons[index] ? page.locator('button').nth(lockButtons[index].index) : null;
}

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  console.log('\n' + '='.repeat(60));
  console.log('COMPREHENSIVE TEST SUITE');
  console.log('='.repeat(60) + '\n');

  // ============================================
  // TEST 1: Page Load
  // ============================================
  console.log('--- TEST 1: Page Load ---');
  await page.goto('http://localhost:3000');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await sleep(1000);

  const hasGrid = await page.locator('text=Grade 9').count() > 0;
  if (hasGrid) {
    logPass('Page Load', 'Schedule grid renders correctly');
  } else {
    logIssue('Page Load', 'Schedule grid not found');
  }

  // ============================================
  // TEST 2: Lock/Unlock Functionality
  // ============================================
  console.log('\n--- TEST 2: Lock/Unlock ---');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await sleep(1000);

  const lockBtn = await findLockButton(page, 0);
  if (lockBtn) {
    await lockBtn.click();
    await sleep(300);

    const state = await page.evaluate(() => localStorage.getItem('westview-locked-semesters'));
    if (state && state.includes('9-fall')) {
      logPass('Lock', 'Lock state persists to localStorage');

      // Check auto-fill disabled
      const autoFillBtn = page.locator('button:has-text("Auto-fill Fall")').first();
      const isDisabled = await autoFillBtn.isDisabled();
      if (isDisabled) {
        logPass('Lock', 'Auto-fill disabled when locked');
      } else {
        logIssue('Lock', 'Auto-fill NOT disabled when locked');
      }

      // Unlock
      await lockBtn.click();
      await sleep(300);
      const stateAfter = await page.evaluate(() => localStorage.getItem('westview-locked-semesters'));
      if (!stateAfter || stateAfter === '{}' || !stateAfter.includes('"9-fall":true')) {
        logPass('Lock', 'Unlock works correctly');
      } else {
        logIssue('Lock', 'Unlock did not clear state');
      }
    } else {
      logIssue('Lock', 'Lock state not persisting');
    }
  } else {
    logIssue('Lock', 'Could not find lock button');
  }

  // ============================================
  // TEST 3: Auto-fill
  // ============================================
  console.log('\n--- TEST 3: Auto-fill ---');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await sleep(1000);

  const autoFillBtn = page.locator('button:has-text("Auto-fill")').first();
  await autoFillBtn.click();
  await sleep(1500);

  const coursesAfterFill = await page.evaluate(() => {
    const data = localStorage.getItem('westview-courses');
    return data ? JSON.parse(data) : [];
  });

  if (coursesAfterFill.length > 0) {
    logPass('Auto-fill', `Added ${coursesAfterFill.length} course entries`);

    // Check yearlong courses have Q1+Q2 or Q3+Q4
    const quarters = coursesAfterFill.map(c => c.quarter);
    const hasQ1 = quarters.includes('Q1');
    const hasQ2 = quarters.includes('Q2');
    if (hasQ1 && hasQ2) {
      logPass('Auto-fill', 'Yearlong courses correctly span Q1+Q2');
    } else {
      logIssue('Auto-fill', 'Yearlong courses missing quarters', `Quarters: ${quarters.join(', ')}`);
    }
  } else {
    logIssue('Auto-fill', 'No courses added');
  }

  // ============================================
  // TEST 4: Undo
  // ============================================
  console.log('\n--- TEST 4: Undo ---');
  const undoBtn = page.locator('button:has-text("Undo")').first();
  const undoDisabled = await undoBtn.isDisabled();

  if (!undoDisabled) {
    await undoBtn.click();
    await sleep(500);

    const coursesAfterUndo = await page.evaluate(() => {
      const data = localStorage.getItem('westview-courses');
      return data ? JSON.parse(data) : [];
    });

    if (coursesAfterUndo.length < coursesAfterFill.length) {
      logPass('Undo', 'Undo reverted auto-fill');
    } else {
      logIssue('Undo', 'Undo did not remove courses');
    }
  } else {
    logIssue('Undo', 'Undo button disabled after auto-fill');
  }

  // ============================================
  // TEST 5: Progress Calculations
  // ============================================
  console.log('\n--- TEST 5: Progress Calculations ---');
  // Re-fill for progress test
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await sleep(1000);

  await page.locator('button:has-text("Auto-fill")').first().click();
  await sleep(1500);

  const creditDisplay = await page.evaluate(() => {
    const text = document.body.innerText;
    const match = text.match(/(\d+)\s*\/\s*230/);
    return match ? parseInt(match[1]) : null;
  });

  if (creditDisplay !== null) {
    if (creditDisplay > 0 && creditDisplay <= 230) {
      logPass('Progress', `Credits calculated: ${creditDisplay}/230`);
    } else {
      logIssue('Progress', `Credits out of range: ${creditDisplay}`);
    }
  } else {
    logIssue('Progress', 'Credit display not found');
  }

  // Check A-G progress visible
  const hasAG = await page.evaluate(() => document.body.innerText.includes('A-G') || document.body.innerText.includes('UC/CSU'));
  if (hasAG) {
    logPass('Progress', 'A-G progress visible');
  } else {
    logIssue('Progress', 'A-G progress not visible');
  }

  // ============================================
  // TEST 6: Drag-Drop
  // ============================================
  console.log('\n--- TEST 6: Drag-Drop ---');
  const draggables = await page.locator('[draggable="true"]').all();

  if (draggables.length > 0) {
    logPass('Drag-Drop', `${draggables.length} draggable elements present`);

    // Get initial state
    const before = await page.evaluate(() => {
      const data = localStorage.getItem('westview-courses');
      return data ? JSON.parse(data) : [];
    });
    const year9Before = before.filter(c => c.year === '9').length;
    const year10Before = before.filter(c => c.year === '10').length;

    // Attempt drag from Grade 9 to Grade 10
    const firstDraggable = draggables[0];
    const sourceBox = await firstDraggable.boundingBox();
    const grade10 = page.locator('text=Grade 10').first();
    const targetBox = await grade10.boundingBox();

    if (sourceBox && targetBox) {
      await page.mouse.move(sourceBox.x + 30, sourceBox.y + 10);
      await page.mouse.down();
      await sleep(100);
      await page.mouse.move(targetBox.x + 100, targetBox.y + 150, { steps: 20 });
      await sleep(100);
      await page.mouse.up();
      await sleep(500);

      const after = await page.evaluate(() => {
        const data = localStorage.getItem('westview-courses');
        return data ? JSON.parse(data) : [];
      });
      const year9After = after.filter(c => c.year === '9').length;
      const year10After = after.filter(c => c.year === '10').length;

      if (year10After > year10Before) {
        logPass('Drag-Drop', 'Course successfully moved to Grade 10');
      } else {
        // Drag might have failed due to Playwright limitations with drag-drop
        logIssue('Drag-Drop', 'Drag-drop did not move course (may be Playwright limitation)', `Before: Y9=${year9Before}, Y10=${year10Before}. After: Y9=${year9After}, Y10=${year10After}`);
      }
    }
  } else {
    logIssue('Drag-Drop', 'No draggable elements');
  }

  // ============================================
  // TEST 7: Manual Course Entry
  // ============================================
  console.log('\n--- TEST 7: Manual Course Entry ---');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await sleep(1000);

  // Click in grade 9 area
  const grade9 = page.locator('text=Grade 9').first();
  const g9Box = await grade9.boundingBox();

  if (g9Box) {
    // Click below header
    await page.mouse.click(g9Box.x + 150, g9Box.y + 250);
    await sleep(500);

    const selectCount = await page.locator('select').count();
    if (selectCount > 0) {
      logPass('Manual Entry', 'Add course form opened on slot click');
    } else {
      logIssue('Manual Entry', 'Add course form did not open');
    }
  }

  // ============================================
  // TEST 8: Clear All
  // ============================================
  console.log('\n--- TEST 8: Clear All ---');
  // First add courses
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await sleep(1000);

  await page.locator('button:has-text("Auto-fill")').first().click();
  await sleep(1000);

  const clearBtn = page.locator('button:has-text("Clear All")').first();
  if (await clearBtn.count() > 0) {
    await clearBtn.click();
    await sleep(500);

    const afterClear = await page.evaluate(() => {
      const data = localStorage.getItem('westview-courses');
      return data ? JSON.parse(data) : [];
    });

    if (afterClear.length === 0) {
      logPass('Clear All', 'All courses cleared');
    } else {
      logIssue('Clear All', `${afterClear.length} courses remain after clear`);
    }
  } else {
    logIssue('Clear All', 'Clear All button not found');
  }

  // ============================================
  // TEST 9: Persistence
  // ============================================
  console.log('\n--- TEST 9: Persistence ---');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await sleep(1000);

  await page.locator('button:has-text("Auto-fill")').first().click();
  await sleep(1000);

  const coursesBeforeReload = await page.evaluate(() => {
    const data = localStorage.getItem('westview-courses');
    return data ? JSON.parse(data).length : 0;
  });

  await page.reload();
  await sleep(1000);

  const coursesAfterReload = await page.evaluate(() => {
    const data = localStorage.getItem('westview-courses');
    return data ? JSON.parse(data).length : 0;
  });

  if (coursesBeforeReload === coursesAfterReload && coursesBeforeReload > 0) {
    logPass('Persistence', `${coursesAfterReload} courses persisted across reload`);
  } else {
    logIssue('Persistence', `Courses not persisted: ${coursesBeforeReload} → ${coursesAfterReload}`);
  }

  // ============================================
  // Console Errors
  // ============================================
  console.log('\n--- Console Errors ---');
  if (consoleErrors.length > 0) {
    logIssue('Console', `${consoleErrors.length} errors`, consoleErrors[0]);
  } else {
    logPass('Console', 'No console errors');
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Passed: ${PASSES.length}`);
  console.log(`Issues: ${ISSUES.length}`);

  if (ISSUES.length > 0) {
    console.log('\n--- ALL ISSUES ---');
    ISSUES.forEach((issue, i) => {
      console.log(`${i + 1}. [${issue.scenario}] ${issue.description}`);
      if (issue.details) console.log(`   → ${issue.details}`);
    });
  }

  console.log('\n--- ALL PASSES ---');
  PASSES.forEach(p => console.log(`✓ [${p.scenario}] ${p.description}`));

  await browser.close();

  return { issues: ISSUES, passes: PASSES };
}

runTests().catch(console.error);
