/**
 * Test: Verify Target Suggestion Counts
 *
 * Target: 4 courses per semester (Years 1-3), 3 per semester (Year 4)
 * Minimum: 3 courses per semester (Years 1-3), 2 per semester (Year 4)
 *
 * Problem: Not suggesting enough courses total for some semesters
 */

import { SuggestionEngine } from './src/utils/SuggestionEngine.js';
import { normalizePathway } from './src/utils/CatalogNormalizer.js';
import fs from 'fs';

const catalogData = JSON.parse(fs.readFileSync('./src/data/courses_complete.json', 'utf8'));
const COURSE_CATALOG = catalogData.courses.reduce((acc, course) => {
  acc[course.course_id] = course;
  return acc;
}, {});

const NORMALIZED_CATALOG = Object.fromEntries(
  Object.entries(COURSE_CATALOG).map(([id, course]) => [
    id,
    {
      ...course,
      pathway: normalizePathway(course.pathway, course.full_name, course.uc_csu_category)
    }
  ])
);

const engine = new SuggestionEngine(NORMALIZED_CATALOG, []);

const WESTVIEW_REQUIREMENTS = {
  'English': { subject: 'English', pathways: ['English'], creditsNeeded: 40 },
  'Math': { subject: 'Math', pathways: ['Math'], creditsNeeded: 30 },
  'History/Social Science': { subject: 'History/Social Science', pathways: ['History/Social Science'], creditsNeeded: 30 },
  'Science': { subject: 'Science', pathways: ['Science - Biological', 'Science - Physical'], creditsNeeded: 20 },
  'Physical Education': { subject: 'Physical Education', pathways: ['Physical Education'], creditsNeeded: 20 },
};

const AG_REQUIREMENTS = {
  'A': { category: 'A', short: 'History', needed: 2 },
  'B': { category: 'B', short: 'English', needed: 4 },
  'C': { category: 'C', short: 'Math', needed: 3 },
  'D': { category: 'D', short: 'Science', needed: 2 },
  'E': { category: 'E', short: 'Lang.', needed: 2 },
  'F': { category: 'F', short: 'Arts', needed: 1 },
  'G': { category: 'G', short: 'Elective', needed: 1 },
};

console.log('=== Suggestion Count Verification ===\n');
console.log('Target: 4 per semester (Years 1-3), 3 per semester (Year 4)');
console.log('Minimum: 3 per semester (Years 1-3), 2 per semester (Year 4)\n');

let allCourses = [];
const results = [];

for (const year of ['9', '10', '11', '12']) {
  for (const term of ['fall', 'spring']) {
    const suggestions = engine.generateSuggestions({
      courses: allCourses,
      year,
      term,
      westviewReqs: WESTVIEW_REQUIREMENTS,
      agReqs: AG_REQUIREMENTS
    });

    const yearInt = parseInt(year);
    const target = yearInt <= 11 ? 4 : 3;
    const minimum = yearInt <= 11 ? 3 : 2;

    const status = suggestions.length >= target ? '✓ MEETS TARGET' :
                   suggestions.length >= minimum ? '⚠ MEETS MINIMUM' :
                   '❌ BELOW MINIMUM';

    console.log(`Year ${year} ${term}: ${suggestions.length}/${target} ${status}`);

    results.push({
      year,
      term,
      count: suggestions.length,
      target,
      minimum,
      meetsTarget: suggestions.length >= target
    });

    // Add suggestions to schedule
    suggestions.forEach(s => {
      const quarter = term === 'fall' ? 'Q1' : 'Q3';
      allCourses.push({ courseId: s.courseId, year, quarter });
    });
  }
}

console.log('\n=== Summary ===');
const totalTests = results.length;
const meetsTarget = results.filter(r => r.meetsTarget).length;
const meetsMinimum = results.filter(r => r.count >= r.minimum).length;

console.log(`Tests meeting target: ${meetsTarget}/${totalTests}`);
console.log(`Tests meeting minimum: ${meetsMinimum}/${totalTests}`);

if (meetsTarget < totalTests) {
  console.log('\n❌ Not all semesters meet target count');
  console.log('Semesters below target:');
  results.filter(r => !r.meetsTarget).forEach(r => {
    console.log(`  - Year ${r.year} ${r.term}: ${r.count}/${r.target} (short by ${r.target - r.count})`);
  });
} else {
  console.log('\n✓ All semesters meet target count!');
}
