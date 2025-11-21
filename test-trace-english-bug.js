/**
 * Trace why English limit is not working
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load catalog
const catalogPath = path.join(__dirname, 'src/data/courses_complete.json');
const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const COURSE_CATALOG = catalogData.courses.reduce((acc, course) => {
  acc[course.course_id] = course;
  return acc;
}, {});

import { getNormalizedCatalog } from './src/utils/CatalogNormalizer.js';
import { BusinessRules } from './src/utils/BusinessRules.js';

const NORMALIZED_CATALOG = getNormalizedCatalog(COURSE_CATALOG);

console.log('Tracing English Limit Bug\n');
console.log('='.repeat(80));

// Simulate the scenario: English 1-2 already in Fall (Q1)
const existingCourses = [
  { id: 1, courseId: 'ENG_ENG_1-2', year: '9', quarter: 'Q1' }
];

const suggestions = []; // Empty suggestions initially
const year = '9';
const term = 'spring'; // Generating suggestions for Spring

console.log('\n1. Existing courses:');
existingCourses.forEach(c => {
  console.log(`   - ${c.courseId}, year: ${c.year}, quarter: ${c.quarter}`);
});

console.log(`\n2. Generating suggestions for: Year ${year}, Term ${term}`);

const rules = new BusinessRules(existingCourses, suggestions, NORMALIZED_CATALOG, term, year);

// Find English 1-2 course
const englishCourse = Object.entries(NORMALIZED_CATALOG)
  .find(([id, c]) => c.full_name === 'ENGLISH 1-2');

if (!englishCourse) {
  console.log('ERROR: Could not find ENGLISH 1-2 in catalog');
  process.exit(1);
}

const [englishId, englishInfo] = englishCourse;

console.log(`\n3. Testing if we can add English 1-2 to suggestions:`);
console.log(`   Course ID: ${englishId}`);
console.log(`   Pathway: ${englishInfo.pathway}`);

// Manually check the English limit logic
console.log(`\n4. Checking English limit logic:`);
console.log(`   rules.year = ${rules.year}`);
console.log(`   rules.courses = ${JSON.stringify(rules.courses)}`);

const yearCourses = rules.courses.filter(c => c.year === rules.year);
console.log(`\n   Year courses filtered: ${yearCourses.length} courses`);
yearCourses.forEach(c => {
  console.log(`     - ${c.courseId}, year: ${c.year}, quarter: ${c.quarter}`);
});

const hasEnglishInYear = yearCourses.some(c => {
  const info = NORMALIZED_CATALOG[c.courseId];
  console.log(`     Checking ${c.courseId}: pathway = ${info?.pathway}`);
  return info && info.pathway === 'English';
});

console.log(`\n   Has English in year: ${hasEnglishInYear}`);

const canAdd = rules.checkEnglishLimit(englishInfo);
console.log(`\n5. Result: canAddCourse = ${canAdd}`);
console.log(`   Expected: false (should NOT allow English since it's already in the year)`);

if (canAdd) {
  console.log('\n❌ BUG CONFIRMED: English limit is not blocking duplicate English');
} else {
  console.log('\n✅ English limit is working correctly');
}

console.log('\n' + '='.repeat(80));
