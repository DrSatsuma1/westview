const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:3001');
  await page.waitForTimeout(2000);

  // Take a screenshot of the full page
  await page.screenshot({ path: '/tmp/westview_full.png', fullPage: true });

  // Check for AP Award Icons in course cards
  // Look for trophy, award, star icons that might indicate AP award
  const apAwardIcons = await page.$$eval('svg', (svgs) => {
    return svgs.map(svg => {
      const parent = svg.closest('.bg-white, [class*="course"], [class*="card"]');
      const classes = svg.getAttribute('class') || '';
      const parentClasses = parent ? parent.getAttribute('class') || '' : '';
      return { classes, parentClasses, html: svg.outerHTML.substring(0, 200) };
    }).filter(s => s.html.includes('trophy') || s.html.includes('award') || s.html.includes('star') || s.classes.includes('text-yellow'));
  });

  console.log('=== AP Award Icon Check ===');
  if (apAwardIcons.length === 0) {
    console.log('✓ No AP award icons found in course cards');
  } else {
    console.log('Found potential AP award icons:');
    apAwardIcons.forEach((icon, i) => console.log(`  ${i+1}. ${icon.html}`));
  }

  // Check AP Test Scores section
  console.log('\n=== AP Test Scores Section Check ===');
  const apSection = await page.$('text=AP Test Scores');
  if (apSection) {
    // Get the section container
    const sectionContainer = await apSection.evaluateHandle(el => {
      let parent = el.parentElement;
      while (parent && !parent.className.includes('bg-')) {
        parent = parent.parentElement;
      }
      return parent;
    });

    // Get padding info
    const sectionStyles = await page.evaluate(el => {
      if (!el) return null;
      const styles = window.getComputedStyle(el);
      return {
        paddingLeft: styles.paddingLeft,
        paddingRight: styles.paddingRight,
        marginLeft: styles.marginLeft
      };
    }, sectionContainer);

    console.log('AP Test Scores section styles:', sectionStyles);

    // Compare with other sidebar sections
    const allSections = await page.$$eval('[class*="bg-white"], [class*="bg-gray"]', els => {
      return els.slice(0, 5).map(el => {
        const styles = window.getComputedStyle(el);
        const text = el.textContent?.substring(0, 30) || '';
        return {
          text,
          paddingLeft: styles.paddingLeft,
          paddingRight: styles.paddingRight
        };
      });
    });

    console.log('\nFirst few sections for comparison:');
    allSections.forEach(s => console.log(`  "${s.text}..." - pl: ${s.paddingLeft}, pr: ${s.paddingRight}`));
  } else {
    console.log('AP Test Scores section not found');
  }

  // Screenshot the sidebar specifically
  const sidebar = await page.$('[class*="sidebar"], [class*="w-80"], [class*="w-96"]');
  if (sidebar) {
    await sidebar.screenshot({ path: '/tmp/westview_sidebar.png' });
    console.log('\nSidebar screenshot saved to /tmp/westview_sidebar.png');
  }

  await browser.close();
  console.log('\nFull page screenshot saved to /tmp/westview_full.png');
})();
