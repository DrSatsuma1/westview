/**
 * Test: 3-Year History Progression
 *
 * Verify that by end of Year 3, student has 2 History courses (= 2 UC years)
 * UC Requirement: 2 years of History/Social Science
 * Westview: 1 semester = 1 UC year
 */

import { SuggestionEngine } from './src/utils/SuggestionEngine.js';
import { normalizePathway } from './src/utils/CatalogNormalizer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

console.log('=== 3-Year History Progression Test ===\n');

let allCourses = [];
let historyCount = 0;

// Year 1 Fall
console.log('Year 1 Fall:');
const y1f = engine.generateSuggestions({
  courses: allCourses,
  year: '9',
  term: 'fall',
  westviewReqs: WESTVIEW_REQUIREMENTS,
  agReqs: AG_REQUIREMENTS
});
y1f.forEach(s => {
  allCourses.push({ courseId: s.courseId, year: '9', quarter: 'Q1' });
  const c = NORMALIZED_CATALOG[s.courseId];
  console.log(`  + ${s.courseName} [${c.pathway}]`);
  if (c.pathway === 'History/Social Science') historyCount++;
});

// Year 1 Spring
console.log('\nYear 1 Spring:');
const y1s = engine.generateSuggestions({
  courses: allCourses,
  year: '9',
  term: 'spring',
  westviewReqs: WESTVIEW_REQUIREMENTS,
  agReqs: AG_REQUIREMENTS
});
y1s.forEach(s => {
  allCourses.push({ courseId: s.courseId, year: '9', quarter: 'Q3' });
  const c = NORMALIZED_CATALOG[s.courseId];
  console.log(`  + ${s.courseName} [${c.pathway}]`);
  if (c.pathway === 'History/Social Science') historyCount++;
});

console.log(`\nYear 1 total History: ${historyCount}`);

// Year 2 Fall
console.log('\nYear 2 Fall:');
const y2f = engine.generateSuggestions({
  courses: allCourses,
  year: '10',
  term: 'fall',
  westviewReqs: WESTVIEW_REQUIREMENTS,
  agReqs: AG_REQUIREMENTS
});
y2f.forEach(s => {
  allCourses.push({ courseId: s.courseId, year: '10', quarter: 'Q1' });
  const c = NORMALIZED_CATALOG[s.courseId];
  console.log(`  + ${s.courseName} [${c.pathway}]`);
  if (c.pathway === 'History/Social Science') historyCount++;
});

// Year 2 Spring
console.log('\nYear 2 Spring:');
const y2s = engine.generateSuggestions({
  courses: allCourses,
  year: '10',
  term: 'spring',
  westviewReqs: WESTVIEW_REQUIREMENTS,
  agReqs: AG_REQUIREMENTS
});
y2s.forEach(s => {
  allCourses.push({ courseId: s.courseId, year: '10', quarter: 'Q3' });
  const c = NORMALIZED_CATALOG[s.courseId];
  console.log(`  + ${s.courseName} [${c.pathway}]`);
  if (c.pathway === 'History/Social Science') historyCount++;
});

console.log(`\nYear 2 total History: ${historyCount}`);

// Year 3 Fall
console.log('\nYear 3 Fall:');
const y3f = engine.generateSuggestions({
  courses: allCourses,
  year: '11',
  term: 'fall',
  westviewReqs: WESTVIEW_REQUIREMENTS,
  agReqs: AG_REQUIREMENTS
});
y3f.forEach(s => {
  allCourses.push({ courseId: s.courseId, year: '11', quarter: 'Q1' });
  const c = NORMALIZED_CATALOG[s.courseId];
  console.log(`  + ${s.courseName} [${c.pathway}]`);
  if (c.pathway === 'History/Social Science') historyCount++;
});

// Year 3 Spring
console.log('\nYear 3 Spring:');
const y3s = engine.generateSuggestions({
  courses: allCourses,
  year: '11',
  term: 'spring',
  westviewReqs: WESTVIEW_REQUIREMENTS,
  agReqs: AG_REQUIREMENTS
});
y3s.forEach(s => {
  allCourses.push({ courseId: s.courseId, year: '11', quarter: 'Q3' });
  const c = NORMALIZED_CATALOG[s.courseId];
  console.log(`  + ${s.courseName} [${c.pathway}]`);
  if (c.pathway === 'History/Social Science') historyCount++;
});

console.log(`\n=== FINAL RESULT ===`);
console.log(`Total History courses by end of Year 3: ${historyCount}`);
console.log(`UC Requirement: 2 courses`);
console.log(historyCount >= 2 ? '✓ MEETS UC requirement' : '❌ DOES NOT meet UC requirement');
