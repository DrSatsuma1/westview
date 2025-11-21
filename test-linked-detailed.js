const { chromium } = require('playwright');

async function testLinkedCoursesDetailed() {
  console.log('🧪 Testing Linked Course Pairs (Detailed Analysis)...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);

    console.log('✅ App loaded\n');

    // Test Grade 9 Fall - should get English 1-2 + AVID 1-2
    console.log('📊 Grade 9 Fall Auto-Suggest:');
    await analyzeAutoSuggest(page, 9, 'fall');

    await clearSchedule(page);
    await page.waitForTimeout(500);

    // Test Grade 10 Fall
    console.log('\n📊 Grade 10 Fall Auto-Suggest:');
    await analyzeAutoSuggest(page, 10, 'fall');

    await clearSchedule(page);
    await page.waitForTimeout(500);

    // Test Grade 11 Fall
    console.log('\n📊 Grade 11 Fall Auto-Suggest:');
    await analyzeAutoSuggest(page, 11, 'fall');

    await clearSchedule(page);
    await page.waitForTimeout(500);

    // Test Grade 12 Fall
    console.log('\n📊 Grade 12 Fall Auto-Suggest:');
    await analyzeAutoSuggest(page, 12, 'fall');

    console.log('\n\n✨ Analysis complete!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
}

async function analyzeAutoSuggest(page, grade, term) {
  const gradeCard = page.locator(`div:has-text("Grade ${grade}")`).first();
  const autofillButton = term === 'fall'
    ? gradeCard.locator('button:has-text("Auto-fill Fall")').first()
    : gradeCard.locator('button:has-text("Auto-fill Spring")').first();

  console.log(`   Clicking Auto-fill ${term === 'fall' ? 'Fall' : 'Spring'}...`);
  await autofillButton.click();
  await page.waitForTimeout(2000);

  // Get all course cards in this grade
  const courseCards = await gradeCard.locator('.bg-white.rounded-lg.shadow-sm.p-3.border-l-4').all();

  console.log(`   Found ${courseCards.length} courses\n`);

  const linkedPairs = {
    'English 1-2': 'AVID 1-2',
    'English 3-4': 'AVID 3-4',
    'United States History': 'AVID 5-6',
    'Honors World History': 'AP World History',
    'Physics of the Universe': 'AP Physics',
    'Honors Spanish 7-8': 'AP Spanish',
    'AP Physics C: Mechanics': 'AP Physics C: Electricity',
    'British Literature': 'AP English Literature',
    'Honors American Literature': 'AP United States History',
    'Civics': 'AP United States Government',
    'Computer Science': 'AP Computer Science A',
    'AP Pre-Calculus': 'AP Calculus AB',
    'College Algebra': 'Statistics',
    'Studio Art': 'AP Studio Art'
  };

  const courses = [];
  for (const card of courseCards) {
    const text = await card.textContent();
    // Extract course name (remove Q1/Q2/Q3/Q4 and remove button)
    const courseName = text.replace(/Q[1-4]/g, '').replace('×', '').trim();
    if (courseName && !courses.includes(courseName)) {
      courses.push(courseName);
    }
  }

  console.log('   Courses added:');
  courses.forEach(course => {
    console.log(`   - ${course}`);
  });

  // Check for linked pairs
  console.log('\n   Checking linked pairs:');
  let foundLinkedPairs = false;

  for (const [base, linked] of Object.entries(linkedPairs)) {
    const hasBase = courses.some(c => c.includes(base));
    const hasLinked = courses.some(c => c.includes(linked));

    if (hasBase) {
      foundLinkedPairs = true;
      if (hasLinked) {
        console.log(`   ✅ ${base} → ${linked} (BOTH FOUND)`);
      } else {
        console.log(`   ❌ ${base} found but ${linked} MISSING!`);
      }
    }
  }

  if (!foundLinkedPairs) {
    console.log('   ℹ️  No linked pair base courses were suggested for this grade/term');
  }
}

async function clearSchedule(page) {
  let removeButtons = await page.locator('button:has-text("×")').all();
  for (let button of removeButtons) {
    try {
      await button.click({ timeout: 300 });
      await page.waitForTimeout(50);
    } catch (e) {
      // Button might have been removed already
    }
  }
  await page.waitForTimeout(300);
}

testLinkedCoursesDetailed().catch(console.error);
