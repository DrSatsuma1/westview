import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto('http://localhost:3000');
await page.waitForSelector('text=Grade 9');

// Click on an empty slot in Year 3 (Grade 11) to add AP US History
const grade11Card = page.locator('.bg-white.rounded-xl.shadow-lg').filter({ hasText: 'Grade 11' });
await grade11Card.locator('button:has-text("Add")').first().click();

// Wait for add course form
await page.waitForSelector('text=Select a pathway');

// Select History/Social Science pathway
await page.click('button:has-text("History")');

// Wait for dropdown and select AP US History
await page.waitForSelector('select');
await page.selectOption('select', { label: 'AP UNITED STATES HISTORY 1-2' });

// Click Add button
await page.click('button.bg-green-500:has-text("Add")');

// Wait a moment for courses to be added
await page.waitForTimeout(1000);

// Check if both courses appear
const pageContent = await page.content();
const hasAPUSHistory = pageContent.includes('AP UNITED STATES HISTORY');
const hasHonAmLit = pageContent.includes('HONORS AMERICAN LITERATURE');

console.log('AP US History added:', hasAPUSHistory);
console.log('Honors American Literature auto-added:', hasHonAmLit);

if (hasAPUSHistory && hasHonAmLit) {
  console.log('✅ PASS: Linked courses work correctly!');
} else if (hasAPUSHistory && !hasHonAmLit) {
  console.log('❌ FAIL: AP US History added but Honors Am Lit was NOT auto-added');
} else {
  console.log('❌ FAIL: Course addition failed');
}

await browser.close();
