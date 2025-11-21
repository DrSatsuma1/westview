/**
 * Test: History Suggestion Count and Target Verification
 *
 * Problem: Not enough history being suggested to meet UC requirements
 * Problem: Not suggesting enough courses total for some semesters
 *
 * UC Requirement: 2 years of History (Category A) by end of Year 3
 * Target: 4 courses per semester (Years 1-3)
 */

import { SuggestionEngine } from './src/utils/SuggestionEngine.js';
import { normalizePathway } from './src/utils/CatalogNormalizer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load course catalog
const catalogPath = path.join(__dirname, 'src/data/courses_complete.json');
const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const COURSE_CATALOG = catalogData.courses.reduce((acc, course) => {
  acc[course.course_id] = course;
  return acc;
}, {});

// Normalize catalog
const NORMALIZED_CATALOG = Object.fromEntries(
  Object.entries(COURSE_CATALOG).map(([id, course]) => [
    id,
    {
      ...course,
      pathway: normalizePathway(course.pathway, course.full_name, course.uc_csu_category)
    }
  ])
);

const DEPRECATED_COURSES = [];

const WESTVIEW_REQUIREMENTS = {
  'English': { subject: 'English', pathways: ['English'], creditsNeeded: 40, creditType: 'standard' },
  'Math': { subject: 'Math', pathways: ['Math'], creditsNeeded: 30, creditType: 'standard' },
  'History/Social Science': { subject: 'History/Social Science', pathways: ['History/Social Science'], creditsNeeded: 30, creditType: 'standard' },
  'Science': { subject: 'Science', pathways: ['Science - Biological', 'Science - Physical'], creditsNeeded: 20, creditType: 'standard' },
  'Physical Education': { subject: 'Physical Education', pathways: ['Physical Education'], creditsNeeded: 20, creditType: 'standard' },
  'Fine Arts': { subject: 'Fine Arts', pathways: ['Fine Arts'], creditsNeeded: 10, creditType: 'standard' },
  'Foreign Language': { subject: 'Foreign Language', pathways: ['Foreign Language'], creditsNeeded: 0, creditType: 'optional' },
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

const engine = new SuggestionEngine(NORMALIZED_CATALOG, DEPRECATED_COURSES);

console.log('=== Test: History Suggestions and Course Counts ===\n');

// Test Year 1 Fall
console.log('Year 1 Fall - Empty Schedule:');
const year1Fall = engine.generateSuggestions({
  courses: [],
  year: '9',
  term: 'fall',
  westviewReqs: WESTVIEW_REQUIREMENTS,
  agReqs: AG_REQUIREMENTS
});

console.log(`  Total suggested: ${year1Fall.length} (target: 4)`);
console.log('  Suggestions:');
year1Fall.forEach(s => {
  const course = NORMALIZED_CATALOG[s.courseId];
  console.log(`    - ${s.courseName} [${course.pathway}] [UC: ${course.uc_csu_category || 'none'}] (score: ${s.score})`);
});

const historyInFall = year1Fall.filter(s => NORMALIZED_CATALOG[s.courseId].pathway === 'History/Social Science');
console.log(`  \n  History courses: ${historyInFall.length}`);

// Test Year 1 Spring
console.log('\nYear 1 Spring - Empty Schedule:');
const year1Spring = engine.generateSuggestions({
  courses: [],
  year: '9',
  term: 'spring',
  westviewReqs: WESTVIEW_REQUIREMENTS,
  agReqs: AG_REQUIREMENTS
});

console.log(`  Total suggested: ${year1Spring.length} (target: 4)`);
console.log('  Suggestions:');
year1Spring.forEach(s => {
  const course = NORMALIZED_CATALOG[s.courseId];
  console.log(`    - ${s.courseName} [${course.pathway}] [UC: ${course.uc_csu_category || 'none'}] (score: ${s.score})`);
});

const historyInSpring = year1Spring.filter(s => NORMALIZED_CATALOG[s.courseId].pathway === 'History/Social Science');
console.log(`  \n  History courses: ${historyInSpring.length}`);

// Check UC A-G Category A progress
const totalHistory = historyInFall.length + historyInSpring.length;
console.log(`\n=== UC A-G Category A (History) Analysis ===`);
console.log(`Total History courses suggested for Year 1: ${totalHistory}`);
console.log(`UC Requirement: 2 courses by end of Year 3`);
console.log(totalHistory >= 1 ? '✓ On track' : '❌ Not enough History suggested');

// Check if target count is being met
console.log(`\n=== Target Count Analysis ===`);
console.log(`Year 1 Fall: ${year1Fall.length}/4 ${year1Fall.length === 4 ? '✓' : '❌ SHORT'}`);
console.log(`Year 1 Spring: ${year1Spring.length}/4 ${year1Spring.length === 4 ? '✓' : '❌ SHORT'}`);
