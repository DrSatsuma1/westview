const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:3001');
  await page.waitForTimeout(1000);

  // Click "Track AP Exams" button
  const trackAPButton = await page.$('button:has-text("Track AP Exams")');
  if (trackAPButton) {
    await trackAPButton.click();
    console.log('Clicked "Track AP Exams" button');
    await page.waitForTimeout(500);
  } else {
    console.log('Track AP Exams button not found');
  }

  // Take screenshot after clicking
  await page.screenshot({ path: '/tmp/westview_ap_section.png', fullPage: true });
  console.log('Screenshot saved to /tmp/westview_ap_section.png');

  // Check for AP Test Scores section now
  const apSection = await page.$('text=AP Test Scores');
  if (apSection) {
    console.log('\n=== AP Test Scores Section Found ===');

    // Find the container and compare padding with other sections
    const sectionInfo = await page.evaluate(() => {
      const apHeader = [...document.querySelectorAll('*')].find(el =>
        el.textContent?.includes('AP Test Scores') && el.tagName.match(/^(H[1-6]|DIV|SPAN|P)$/i)
      );

      if (!apHeader) return { found: false };

      // Find the parent container
      let container = apHeader;
      while (container && !container.classList.toString().includes('bg-')) {
        container = container.parentElement;
      }

      if (!container) return { found: true, containerFound: false };

      const styles = window.getComputedStyle(container);

      // Get all sidebar section containers for comparison
      const sidebar = document.querySelector('[class*="w-80"], [class*="w-96"], [class*="sidebar"]') ||
                      container.closest('[class*="flex-col"]');

      let siblingPaddings = [];
      if (sidebar) {
        const sections = sidebar.querySelectorAll('[class*="bg-white"], [class*="rounded"]');
        sections.forEach(sec => {
          const secStyles = window.getComputedStyle(sec);
          const text = sec.querySelector('h2, h3, [class*="font-semibold"]')?.textContent || 'Unknown';
          siblingPaddings.push({
            text: text.substring(0, 30),
            paddingLeft: secStyles.paddingLeft,
            paddingRight: secStyles.paddingRight,
            marginLeft: secStyles.marginLeft
          });
        });
      }

      return {
        found: true,
        containerFound: true,
        containerClass: container.className,
        paddingLeft: styles.paddingLeft,
        paddingRight: styles.paddingRight,
        marginLeft: styles.marginLeft,
        siblingPaddings
      };
    });

    console.log('AP Section Info:', JSON.stringify(sectionInfo, null, 2));
  } else {
    console.log('AP Test Scores section still not found after clicking');
  }

  await browser.close();
})();
