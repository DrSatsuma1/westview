/**
 * Manual Testing Script for Refactored App
 *
 * Tests core functionality after hook extractions.
 * Run with: npx playwright test tests/manual-test.mjs
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const ISSUES = [];

function logIssue(scenario, description, details = null) {
  const issue = { scenario, description, details, timestamp: new Date().toISOString() };
  ISSUES.push(issue);
  console.log(`\n❌ ISSUE FOUND: ${description}`);
  if (details) console.log(`   Details: ${details}`);
}

function logPass(scenario, description) {
  console.log(`✅ PASS: [${scenario}] ${description}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('\n' + '='.repeat(60));
  console.log('STARTING MANUAL TESTS FOR REFACTORED APP');
  console.log('='.repeat(60) + '\n');

  // Clear localStorage before tests
  await page.goto(BASE_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await sleep(1000);

  // ============================================
  // TEST 1: Page loads without errors
  // ============================================
  console.log('\n--- TEST 1: Page Load ---');
  try {
    const title = await page.title();
    const hasScheduleGrid = await page.locator('text=Grade 9').count() > 0;

    if (!hasScheduleGrid) {
      logIssue('Page Load', 'Schedule grid not found - page may not be rendering');
    } else {
      logPass('Page Load', 'Page loads with schedule grid visible');
    }

    // Check for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await sleep(500);

    if (consoleErrors.length > 0) {
      logIssue('Page Load', 'Console errors detected', consoleErrors.join('; '));
    }
  } catch (e) {
    logIssue('Page Load', 'Failed to load page', e.message);
  }

  // ============================================
  // TEST 2: Auto-fill Grade 9 (empty schedule)
  // ============================================
  console.log('\n--- TEST 2: Auto-fill Grade 9 ---');
  try {
    // Look for auto-fill button
    const autoFillButton = page.locator('button:has-text("Auto-Fill")').first();
    const exists = await autoFillButton.count() > 0;

    if (!exists) {
      logIssue('Auto-fill', 'Auto-fill button not found');
    } else {
      await autoFillButton.click();
      await sleep(1500);

      // Check if courses were added
      const courseCards = await page.locator('[data-testid="course-card"], .course-card, [class*="course"]').count();
      if (courseCards === 0) {
        // Try another selector
        const anyCards = await page.locator('text=English').count();
        if (anyCards === 0) {
          logIssue('Auto-fill', 'No courses added after auto-fill click');
        } else {
          logPass('Auto-fill', 'Courses appear to be added');
        }
      } else {
        logPass('Auto-fill', `Auto-fill added ${courseCards} course elements`);
      }
    }
  } catch (e) {
    logIssue('Auto-fill', 'Auto-fill test failed', e.message);
  }

  // ============================================
  // TEST 3: Progress Sidebar Updates
  // ============================================
  console.log('\n--- TEST 3: Progress Sidebar ---');
  try {
    // Look for progress indicators
    const progressSection = await page.locator('text=Progress').first().count();
    const creditText = await page.locator('text=/\\d+.*credits?/i').first().count();

    if (progressSection === 0 && creditText === 0) {
      logIssue('Progress', 'No progress indicators visible');
    } else {
      logPass('Progress', 'Progress section visible');
    }
  } catch (e) {
    logIssue('Progress', 'Progress test failed', e.message);
  }

  // ============================================
  // TEST 4: Undo Functionality
  // ============================================
  console.log('\n--- TEST 4: Undo Stack ---');
  try {
    const undoButton = page.locator('button:has-text("Undo")').first();
    const exists = await undoButton.count() > 0;

    if (!exists) {
      logIssue('Undo', 'Undo button not found');
    } else {
      // Check if undo is enabled (should be after auto-fill)
      const isDisabled = await undoButton.isDisabled();
      if (isDisabled) {
        logIssue('Undo', 'Undo button is disabled after auto-fill action');
      } else {
        await undoButton.click();
        await sleep(500);
        logPass('Undo', 'Undo button clickable');
      }
    }
  } catch (e) {
    logIssue('Undo', 'Undo test failed', e.message);
  }

  // ============================================
  // TEST 5: Manual Course Add (Empty Slot Click)
  // ============================================
  console.log('\n--- TEST 5: Manual Course Add ---');
  try {
    // Clear and reload
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await sleep(1000);

    // Look for add course button or empty slot
    const addButton = page.locator('button:has-text("Add"), button:has-text("+")').first();
    const emptySlot = page.locator('[data-testid="empty-slot"], .empty-slot').first();

    let clicked = false;
    if (await addButton.count() > 0) {
      await addButton.click();
      clicked = true;
    } else if (await emptySlot.count() > 0) {
      await emptySlot.click();
      clicked = true;
    }

    if (!clicked) {
      logIssue('Manual Add', 'Could not find add course button or empty slot');
    } else {
      await sleep(500);
      // Check if course selection form appears
      const selectOrDropdown = await page.locator('select, [role="listbox"], .course-form').count();
      if (selectOrDropdown === 0) {
        logIssue('Manual Add', 'Course selection form did not appear after clicking add');
      } else {
        logPass('Manual Add', 'Course selection form appeared');
      }
    }
  } catch (e) {
    logIssue('Manual Add', 'Manual add test failed', e.message);
  }

  // ============================================
  // TEST 6: Drag-Drop Visual (check draggable attribute)
  // ============================================
  console.log('\n--- TEST 6: Drag-Drop Setup ---');
  try {
    // First add some courses via auto-fill
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await sleep(1000);

    const autoFillButton = page.locator('button:has-text("Auto-Fill")').first();
    if (await autoFillButton.count() > 0) {
      await autoFillButton.click();
      await sleep(1500);
    }

    // Check for draggable elements
    const draggables = await page.locator('[draggable="true"]').count();
    if (draggables === 0) {
      logIssue('Drag-Drop', 'No draggable elements found - drag functionality may be broken');
    } else {
      logPass('Drag-Drop', `Found ${draggables} draggable elements`);
    }
  } catch (e) {
    logIssue('Drag-Drop', 'Drag-drop test failed', e.message);
  }

  // ============================================
  // TEST 7: localStorage Persistence
  // ============================================
  console.log('\n--- TEST 7: Persistence ---');
  try {
    // Check if data persists after reload
    const coursesInStorage = await page.evaluate(() => {
      const data = localStorage.getItem('westview-courses');
      return data ? JSON.parse(data).length : 0;
    });

    if (coursesInStorage === 0) {
      logIssue('Persistence', 'No courses saved to localStorage');
    } else {
      await page.reload();
      await sleep(1000);

      const coursesAfterReload = await page.evaluate(() => {
        const data = localStorage.getItem('westview-courses');
        return data ? JSON.parse(data).length : 0;
      });

      if (coursesAfterReload !== coursesInStorage) {
        logIssue('Persistence', `Course count changed after reload: ${coursesInStorage} → ${coursesAfterReload}`);
      } else {
        logPass('Persistence', `${coursesInStorage} courses persisted across reload`);
      }
    }
  } catch (e) {
    logIssue('Persistence', 'Persistence test failed', e.message);
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total issues found: ${ISSUES.length}`);

  if (ISSUES.length > 0) {
    console.log('\nISSUES LIST:');
    ISSUES.forEach((issue, i) => {
      console.log(`\n${i + 1}. [${issue.scenario}] ${issue.description}`);
      if (issue.details) console.log(`   → ${issue.details}`);
    });
  } else {
    console.log('\n✅ All tests passed!');
  }

  await browser.close();

  // Return issues for external processing
  return ISSUES;
}

runTests().catch(console.error);
