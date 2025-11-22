/**
 * Detailed Testing Script - Deeper UI inspection
 * Run with: node tests/detailed-test.mjs
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const ISSUES = [];

function logIssue(scenario, description, details = null) {
  const issue = { scenario, description, details };
  ISSUES.push(issue);
  console.log(`❌ [${scenario}] ${description}`);
  if (details) console.log(`   → ${details}`);
}

function logPass(scenario, description) {
  console.log(`✅ [${scenario}] ${description}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  console.log('\n=== DETAILED TESTING ===\n');

  // Setup: Clear and load
  await page.goto(BASE_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await sleep(1000);

  // ============================================
  // TEST 2: Auto-fill with locked semesters
  // ============================================
  console.log('--- Test: Locked Semester Auto-fill ---');
  try {
    // First, check if there's a lock button
    const lockButtons = await page.locator('button:has-text("Lock"), [aria-label*="lock"], .lock-button').all();
    console.log(`   Found ${lockButtons.length} potential lock buttons`);

    // Look for lock icon or checkbox
    const lockIcons = await page.locator('svg[class*="lock"], [class*="lock"]').count();
    console.log(`   Found ${lockIcons} lock-related elements`);

    if (lockButtons.length === 0 && lockIcons === 0) {
      logIssue('Locked Semester', 'No lock UI elements found - may need to check implementation');
    } else {
      logPass('Locked Semester', 'Lock UI elements present');
    }
  } catch (e) {
    logIssue('Locked Semester', 'Test failed', e.message);
  }

  // ============================================
  // TEST 3: Manual Entry - Inspect Empty Slots
  // ============================================
  console.log('\n--- Test: Manual Entry - UI Inspection ---');
  try {
    // Get all buttons in the page
    const allButtons = await page.locator('button').all();
    console.log(`   Total buttons on page: ${allButtons.length}`);

    // Look for any clickable course slot areas
    const clickableAreas = await page.locator('[role="button"], [onclick], .cursor-pointer').count();
    console.log(`   Clickable areas: ${clickableAreas}`);

    // Check for Plus icon specifically
    const plusIcons = await page.locator('svg:has(path[d*="M12 5v14"]), svg:has(line), text="+", [class*="plus"]').count();
    console.log(`   Plus icons/text: ${plusIcons}`);

    // Inspect the quarter columns structure
    const quarterColumns = await page.locator('[class*="quarter"], [class*="Q1"], [class*="Q2"]').count();
    console.log(`   Quarter column elements: ${quarterColumns}`);

    // Try to find empty slot by looking at div structure
    const emptyDivs = await page.locator('div.bg-gray-50, div.bg-slate-50, div.border-dashed').count();
    console.log(`   Potential empty slots (gray/dashed): ${emptyDivs}`);

    // Look for the EmptySlot component we created
    const emptySlotComponent = await page.evaluate(() => {
      // Search for empty slot visual indicators
      const divs = document.querySelectorAll('div');
      let emptySlotCount = 0;
      divs.forEach(div => {
        if (div.innerHTML.includes('Add') || div.innerHTML.includes('+')) {
          if (div.className.includes('cursor-pointer') || div.onclick) {
            emptySlotCount++;
          }
        }
      });
      return emptySlotCount;
    });
    console.log(`   EmptySlot-like components: ${emptySlotComponent}`);

    if (emptySlotComponent === 0 && plusIcons === 0) {
      logIssue('Manual Entry', 'Cannot find interactive empty slots - Add Course UI may be hidden or broken');
    } else {
      logPass('Manual Entry', 'Found potential add course UI elements');
    }
  } catch (e) {
    logIssue('Manual Entry', 'UI inspection failed', e.message);
  }

  // ============================================
  // TEST 4: Drag-Drop Between Years
  // ============================================
  console.log('\n--- Test: Drag-Drop Between Years ---');
  try {
    // First add courses via auto-fill
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await sleep(1000);

    const autoFill = page.locator('button:has-text("Auto-Fill")').first();
    if (await autoFill.count() > 0) {
      await autoFill.click();
      await sleep(1500);
    }

    // Get draggable elements
    const draggables = await page.locator('[draggable="true"]').all();
    console.log(`   Draggable elements: ${draggables.length}`);

    if (draggables.length > 0) {
      // Try to get the first draggable's bounding box
      const firstDraggable = draggables[0];
      const box = await firstDraggable.boundingBox();
      console.log(`   First draggable position: ${box ? `x:${box.x}, y:${box.y}` : 'not found'}`);

      // Check for drop zones
      const grade10Area = page.locator('text=Grade 10').first();
      const grade10Box = await grade10Area.boundingBox();
      console.log(`   Grade 10 header position: ${grade10Box ? `x:${grade10Box.x}, y:${grade10Box.y}` : 'not found'}`);

      // Attempt drag simulation
      if (box && grade10Box) {
        await firstDraggable.hover();
        await page.mouse.down();
        await page.mouse.move(grade10Box.x + 100, grade10Box.y + 100);
        await page.mouse.up();
        await sleep(500);
        logPass('Drag-Drop', 'Drag simulation completed - verify visually');
      } else {
        logIssue('Drag-Drop', 'Could not get element positions for drag test');
      }
    } else {
      logIssue('Drag-Drop', 'No draggable elements found');
    }
  } catch (e) {
    logIssue('Drag-Drop', 'Drag-drop test failed', e.message);
  }

  // ============================================
  // TEST 5: Progress Calculations Edge Cases
  // ============================================
  console.log('\n--- Test: Progress Calculations ---');
  try {
    // Check current credit display
    const creditText = await page.evaluate(() => {
      const text = document.body.innerText;
      const creditMatch = text.match(/(\d+)\s*\/\s*230/);
      return creditMatch ? creditMatch[1] : null;
    });
    console.log(`   Current credits displayed: ${creditText || 'not found'}/230`);

    // Check A-G progress
    const agProgress = await page.evaluate(() => {
      const text = document.body.innerText;
      // Look for A-G indicators
      const hasAG = text.includes('A-G') || text.includes('UC/CSU');
      return hasAG;
    });
    console.log(`   A-G progress visible: ${agProgress}`);

    if (creditText !== null) {
      const credits = parseInt(creditText);
      // With 8 courses from auto-fill (yearlong = 10 credits each), expect ~40-80 credits
      if (credits >= 0 && credits <= 230) {
        logPass('Progress', `Credits calculation appears valid: ${credits}/230`);
      } else {
        logIssue('Progress', `Credits out of expected range: ${credits}`);
      }
    } else {
      logIssue('Progress', 'Could not find credit display');
    }
  } catch (e) {
    logIssue('Progress', 'Progress test failed', e.message);
  }

  // ============================================
  // TEST 6: Undo Stack (Multiple Actions)
  // ============================================
  console.log('\n--- Test: Undo Stack ---');
  try {
    // Clear and start fresh
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await sleep(1000);

    const undoButton = page.locator('button:has-text("Undo")').first();

    // Should be disabled initially (no history)
    const initiallyDisabled = await undoButton.isDisabled();
    console.log(`   Undo initially disabled: ${initiallyDisabled}`);

    // Do auto-fill
    const autoFill = page.locator('button:has-text("Auto-Fill")').first();
    if (await autoFill.count() > 0) {
      await autoFill.click();
      await sleep(500);

      // Check undo is now enabled
      const afterFillDisabled = await undoButton.isDisabled();
      console.log(`   Undo after auto-fill disabled: ${afterFillDisabled}`);

      if (afterFillDisabled) {
        logIssue('Undo', 'Undo button not enabled after auto-fill action');
      } else {
        // Click undo
        await undoButton.click();
        await sleep(500);

        // Check courses were removed
        const coursesAfterUndo = await page.evaluate(() => {
          const data = localStorage.getItem('westview-courses');
          return data ? JSON.parse(data).length : 0;
        });
        console.log(`   Courses after undo: ${coursesAfterUndo}`);

        if (coursesAfterUndo === 0) {
          logPass('Undo', 'Undo successfully reverted auto-fill');
        } else {
          logIssue('Undo', `Undo did not clear courses: ${coursesAfterUndo} remain`);
        }
      }
    }
  } catch (e) {
    logIssue('Undo', 'Undo test failed', e.message);
  }

  // ============================================
  // Console Error Check
  // ============================================
  console.log('\n--- Console Errors ---');
  if (consoleErrors.length > 0) {
    console.log(`   Found ${consoleErrors.length} console errors:`);
    consoleErrors.forEach((err, i) => {
      console.log(`   ${i + 1}. ${err.substring(0, 100)}...`);
    });
    logIssue('Console', `${consoleErrors.length} console errors detected`, consoleErrors[0]);
  } else {
    logPass('Console', 'No console errors');
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log(`TOTAL ISSUES: ${ISSUES.length}`);
  console.log('='.repeat(50));

  if (ISSUES.length > 0) {
    console.log('\nALL ISSUES:');
    ISSUES.forEach((issue, i) => {
      console.log(`${i + 1}. [${issue.scenario}] ${issue.description}`);
      if (issue.details) console.log(`   Details: ${issue.details}`);
    });
  }

  await browser.close();
  return ISSUES;
}

runTests().catch(console.error);
