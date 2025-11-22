// Test BAND continuation rule
const { chromium } = require('playwright');

async function testBandRule() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Opening Westview Planner...');
  await page.goto('http://localhost:3001');
  await page.waitForLoadState('networkidle');

  // Clear localStorage for clean test
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Auto-fill Fall for ALL years
  console.log('\n=== Auto-fill ALL years (Fall + Spring) ===');
  const autoFillFallBtns = await page.locator('button:has-text("Auto-fill Fall")').all();
  for (let i = 0; i < autoFillFallBtns.length; i++) {
    await autoFillFallBtns[i].click();
    await page.waitForTimeout(600);
  }

  const autoFillSpringBtns = await page.locator('button:has-text("Auto-fill Spring")').all();
  for (let i = 0; i < autoFillSpringBtns.length; i++) {
    await autoFillSpringBtns[i].click();
    await page.waitForTimeout(600);
  }

  // Check for BAND in each grade
  console.log('\n=== Checking for BAND in each grade ===');
  const bandByGrade = await page.evaluate(() => {
    const grades = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
    const result = {};

    grades.forEach(grade => {
      const section = Array.from(document.querySelectorAll('h3')).find(h => h.textContent.includes(grade));
      if (section) {
        const container = section.closest('div.bg-white');
        if (container) {
          const cards = container.querySelectorAll('div.border-l-4');
          const hasBand = Array.from(cards).some(card => {
            const nameEl = card.querySelector('.font-bold, [class*="font-medium"]');
            return nameEl && nameEl.textContent.toUpperCase().includes('BAND');
          });

          // Get Fine Arts courses
          const fineArts = Array.from(cards)
            .map(card => {
              const nameEl = card.querySelector('.font-bold, [class*="font-medium"]');
              const pathwayEl = card.querySelector('.text-xs');
              return {
                name: nameEl?.textContent || '',
                pathway: pathwayEl?.textContent || ''
              };
            })
            .filter(c => c.name.toUpperCase().includes('BAND') ||
                        c.name.toUpperCase().includes('ORCHESTRA') ||
                        c.name.toUpperCase().includes('DRAMA') ||
                        c.name.toUpperCase().includes('ART'));

          result[grade] = {
            hasBand,
            fineArtsCourses: fineArts.map(c => c.name)
          };
        }
      }
    });
    return result;
  });

  Object.entries(bandByGrade).forEach(([grade, data]) => {
    console.log(`${grade}: BAND = ${data.hasBand ? 'YES' : 'NO'}`);
    console.log(`  Fine Arts courses: ${data.fineArtsCourses.join(', ') || 'none'}`);
  });

  // Verify rule: No BAND in Grade 11/12 if no BAND in Grade 9/10
  const grade9HasBand = bandByGrade['Grade 9']?.hasBand;
  const grade10HasBand = bandByGrade['Grade 10']?.hasBand;
  const grade11HasBand = bandByGrade['Grade 11']?.hasBand;
  const grade12HasBand = bandByGrade['Grade 12']?.hasBand;

  console.log('\n=== BAND Rule Verification ===');
  console.log('Prior years have BAND:', grade9HasBand || grade10HasBand);
  console.log('Grade 11 has BAND:', grade11HasBand);
  console.log('Grade 12 has BAND:', grade12HasBand);

  if (!(grade9HasBand || grade10HasBand) && (grade11HasBand || grade12HasBand)) {
    console.log('\n❌ BUG: BAND suggested in Year 3/4 without prior years');
  } else if ((grade9HasBand || grade10HasBand) && (grade11HasBand || grade12HasBand)) {
    console.log('\n✓ CORRECT: BAND continues in Year 3/4 (taken in prior years)');
  } else if (!(grade9HasBand || grade10HasBand) && !(grade11HasBand || grade12HasBand)) {
    console.log('\n✓ CORRECT: No BAND in Year 3/4 (not taken in prior years)');
  } else {
    console.log('\n✓ CORRECT: BAND only in Year 1/2');
  }

  await page.screenshot({ path: '/tmp/band-rule-test.png', fullPage: true });
  console.log('\nScreenshot saved to /tmp/band-rule-test.png');

  await browser.close();
}

testBandRule().catch(console.error);
