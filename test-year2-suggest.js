const { chromium } = require('playwright');

async function testYear2Suggestions() {
  console.log('🧪 TESTING YEAR 2 AUTO-SUGGEST BEHAVIOR\n');
  console.log('Testing what gets suggested for Grade 10 Fall with empty schedule\n');
  console.log('=' .repeat(70));

  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    console.log('✅ App loaded\n');

    // Click Auto-fill Fall for Grade 10
    console.log('📋 Clicking "Auto-fill Fall Semester" for Grade 10...\n');

    const grade10Card = page.locator('h3:has-text("Grade 10")').locator('..').locator('..');
    const fallButton = grade10Card.locator('button:has-text("Auto-fill Fall Semester")');

    await fallButton.click();
    await page.waitForTimeout(3000);

    // Get all text content from Grade 10 card to see what was added
    const grade10Text = await grade10Card.textContent();

    console.log('COURSES SUGGESTED IN GRADE 10 FALL:');
    console.log('='.repeat(70));

    // Look for specific course patterns
    const courses = {
      'English 3-4': grade10Text.includes('ENGLISH 3-4') || grade10Text.includes('English 3-4'),
      'World History (non-AP)': grade10Text.includes('WORLD HISTORY 1-2') && !grade10Text.includes('AP'),
      'AP World History': grade10Text.includes('AP WORLD HISTORY') || grade10Text.includes('AP World History'),
      'Honors World History': grade10Text.includes('HONORS WORLD HISTORY') || grade10Text.includes('Honors World History'),
      'Math': grade10Text.includes('MATHEMATICS') || grade10Text.includes('MATH') || grade10Text.includes('ALGEBRA') || grade10Text.includes('GEOMETRY'),
      'Science': grade10Text.includes('BIOLOGY') || grade10Text.includes('CHEMISTRY') || grade10Text.includes('PHYSICS'),
      'Foreign Language': grade10Text.includes('SPANISH') || grade10Text.includes('CHINESE') || grade10Text.includes('FRENCH'),
      'Fine Arts': grade10Text.includes('ART') || grade10Text.includes('MUSIC') || grade10Text.includes('DANCE') || grade10Text.includes('THEATER'),
      'PE': grade10Text.includes('PHYSICAL EDUCATION') || grade10Text.includes('PE'),
    };

    console.log('\nCourse Detection:');
    Object.entries(courses).forEach(([name, present]) => {
      console.log(`  ${present ? '✓' : '✗'} ${name}`);
    });

    // Check Fall vs Spring distribution
    console.log('\n\nQUARTER DISTRIBUTION:');
    console.log('='.repeat(70));

    // Count courses in each quarter by looking at the grid structure
    const allCourseCards = await page.locator('.border.rounded').allTextContents();
    console.log(`\nTotal course cards visible: ${allCourseCards.length}`);

    // Extract actual course names from the page
    console.log('\nActual courses visible on page:');
    const bodyText = await page.locator('body').textContent();

    // Look for common course patterns
    const coursePatterns = [
      'ENGLISH 3-4', 'English 3-4',
      'WORLD HISTORY', 'World History',
      'AP WORLD HISTORY', 'AP World History',
      'HONORS WORLD HISTORY', 'Honors World History',
      'MATHEMATICS', 'ALGEBRA', 'GEOMETRY',
      'BIOLOGY', 'CHEMISTRY', 'PHYSICS',
      'SPANISH', 'CHINESE', 'FRENCH',
      'PE', 'PHYSICAL EDUCATION'
    ];

    console.log('\nSearching for course names in page text:');
    coursePatterns.forEach(pattern => {
      if (bodyText.toUpperCase().includes(pattern.toUpperCase())) {
        console.log(`  ✓ Found: ${pattern}`);
      }
    });

    console.log('\n\nISSUES TO CHECK:');
    console.log('='.repeat(70));

    if (courses['AP World History']) {
      console.log('❌ ISSUE: AP World History suggested (should be non-AP World History)');
    } else {
      console.log('✓ Correct: AP World History NOT suggested');
    }

    if (courses['AP World History'] && !courses['Honors World History']) {
      console.log('❌ ISSUE: AP World suggested without Honors World (they are linked)');
    }

    if (courses['Math']) {
      console.log('⚠️  WARNING: Math in Fall (should default to Spring)');
    } else {
      console.log('✓ Correct: Math not in Fall (will be in Spring)');
    }

    console.log('\n\nBrowser will stay open for 15 seconds for manual inspection...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

testYear2Suggestions().catch(console.error);
