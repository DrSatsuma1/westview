/**
 * Test script to verify Math and English limits
 * - English: 1 per YEAR (not both Fall and Spring)
 * - Math: 1 per SEMESTER (can take 2 different courses per year)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load modules
const catalogPath = path.join(__dirname, 'src/data/courses_complete.json');
const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// Convert array to object indexed by course_id (same as App.jsx)
const COURSE_CATALOG = catalogData.courses.reduce((acc, course) => {
  acc[course.course_id] = course;
  return acc;
}, {});

// Import normalizer
import { getNormalizedCatalog } from './src/utils/CatalogNormalizer.js';
import { SuggestionEngine } from './src/utils/SuggestionEngine.js';

const NORMALIZED_CATALOG = getNormalizedCatalog(COURSE_CATALOG);
const DEPRECATED_COURSES = [];

const WESTVIEW_REQUIREMENTS = {
  'English': { credits: 40, pathways: ['English'] },
  'Math': { credits: 30, pathways: ['Math'] },
  'Science': { credits: 30, pathways: ['Science - Biological', 'Science - Physical'] },
  'History/Social Science': { credits: 30, pathways: ['History/Social Science'] },
  'Physical Education': { credits: 20, pathways: ['Physical Education'] },
  'Foreign Language': { credits: 20, pathways: ['Foreign Language'] },
  'Fine Arts': { credits: 10, pathways: ['Fine Arts'] },
  'Electives': { credits: 50, pathways: ['CTE', 'Electives'] }
};

const AG_REQUIREMENTS = {
  'A': { name: 'History/Social Science', needed: 2 },
  'B': { name: 'English', needed: 4 },
  'C': { name: 'Math', needed: 3 },
  'D': { name: 'Science', needed: 2 },
  'E': { name: 'Foreign Language', needed: 2 },
  'F': { name: 'Visual/Performing Arts', needed: 1 },
  'G': { name: 'Elective', needed: 1 }
};

const engine = new SuggestionEngine(NORMALIZED_CATALOG, DEPRECATED_COURSES);

console.log('Testing Math and English Limits\n');
console.log('='.repeat(80));

// Test 1: Grade 9 Fall - should suggest English
console.log('\n📝 Test 1: Grade 9 Fall - Empty Schedule');
console.log('-'.repeat(80));
const courses1 = [];
const suggestions1 = engine.generateSuggestions({
  courses: courses1,
  year: '9',
  term: 'fall',
  westviewReqs: WESTVIEW_REQUIREMENTS,
  agReqs: AG_REQUIREMENTS
});

console.log(`Suggested ${suggestions1.length} courses:`);
suggestions1.forEach(s => {
  console.log(`  - ${s.courseName} (${s.reason})`);
});

const hasEnglishFall = suggestions1.some(s => NORMALIZED_CATALOG[s.courseId]?.pathway === 'English');
const hasMathFall = suggestions1.some(s => NORMALIZED_CATALOG[s.courseId]?.pathway === 'Math');
console.log(`\n✓ Contains English: ${hasEnglishFall}`);
console.log(`✓ Contains Math: ${hasMathFall}`);

// Test 2: Grade 9 Spring - should NOT suggest English again (already in Fall)
console.log('\n📝 Test 2: Grade 9 Spring - With English 1-2 already in Fall');
console.log('-'.repeat(80));

// Find actual English 1-2 course ID
const englishCourseEntry = Object.entries(NORMALIZED_CATALOG)
  .find(([id, c]) => c.full_name === 'ENGLISH 1-2');
const englishCourseId = englishCourseEntry ? englishCourseEntry[0] : null;

if (!englishCourseId) {
  console.log('ERROR: Could not find ENGLISH 1-2 in catalog');
  process.exit(1);
}

const courses2 = [
  { id: 1, courseId: englishCourseId, year: '9', quarter: 'Q1' }
];
const suggestions2 = engine.generateSuggestions({
  courses: courses2,
  year: '9',
  term: 'spring',
  westviewReqs: WESTVIEW_REQUIREMENTS,
  agReqs: AG_REQUIREMENTS
});

console.log(`Suggested ${suggestions2.length} courses:`);
suggestions2.forEach(s => {
  console.log(`  - ${s.courseName} (${s.reason})`);
});

const hasEnglishSpring = suggestions2.some(s => NORMALIZED_CATALOG[s.courseId]?.pathway === 'English');
console.log(`\n✓ Contains English: ${hasEnglishSpring} (should be FALSE)`);

if (hasEnglishSpring) {
  console.log('❌ FAILED: English suggested in Spring when already in Fall!');
} else {
  console.log('✅ PASSED: English correctly NOT suggested in Spring');
}

// Test 3: Grade 9 Spring - should suggest Math (different from Fall)
console.log('\n📝 Test 3: Grade 9 Spring - With Int Math Ia-Ib in Fall');
console.log('-'.repeat(80));

// Find actual Integrated Math Ia-Ib course ID
const intMathCourseEntry = Object.entries(NORMALIZED_CATALOG)
  .find(([id, c]) => c.full_name === 'INTEGRATED MATHEMATICS Ia-Ib');
const intMathCourseId = intMathCourseEntry ? intMathCourseEntry[0] : null;

if (!intMathCourseId) {
  console.log('ERROR: Could not find INTEGRATED MATHEMATICS Ia-Ib in catalog');
  process.exit(1);
}

const courses3 = [
  { id: 1, courseId: intMathCourseId, year: '9', quarter: 'Q1' },
  { id: 2, courseId: englishCourseId, year: '9', quarter: 'Q1' }
];
const suggestions3 = engine.generateSuggestions({
  courses: courses3,
  year: '9',
  term: 'spring',
  westviewReqs: WESTVIEW_REQUIREMENTS,
  agReqs: AG_REQUIREMENTS
});

console.log(`Suggested ${suggestions3.length} courses:`);
suggestions3.forEach(s => {
  console.log(`  - ${s.courseName} (${s.reason})`);
});

const hasMathSpring = suggestions3.some(s => NORMALIZED_CATALOG[s.courseId]?.pathway === 'Math');
const mathCourse = suggestions3.find(s => NORMALIZED_CATALOG[s.courseId]?.pathway === 'Math');
console.log(`\n✓ Contains Math: ${hasMathSpring} (should be TRUE)`);
if (mathCourse) {
  console.log(`✓ Math course: ${mathCourse.courseName}`);
}

if (hasMathSpring && mathCourse && mathCourse.courseId !== intMathCourseId) {
  console.log('✅ PASSED: Different Math course suggested in Spring');
} else if (!hasMathSpring) {
  console.log('❌ FAILED: No Math suggested in Spring (should suggest different Math)');
} else {
  console.log('❌ FAILED: Same Math course suggested again');
}

// Test 4: Grade 9 Fall - with English already in schedule, should NOT suggest English again
console.log('\n📝 Test 4: Grade 9 Fall - With English 1-2 already in Year');
console.log('-'.repeat(80));
const courses4 = [
  { id: 1, courseId: englishCourseId, year: '9', quarter: 'Q3' } // Spring
];
const suggestions4 = engine.generateSuggestions({
  courses: courses4,
  year: '9',
  term: 'fall',
  westviewReqs: WESTVIEW_REQUIREMENTS,
  agReqs: AG_REQUIREMENTS
});

console.log(`Suggested ${suggestions4.length} courses:`);
suggestions4.forEach(s => {
  console.log(`  - ${s.courseName} (${s.reason})`);
});

const hasEnglishFall2 = suggestions4.some(s => NORMALIZED_CATALOG[s.courseId]?.pathway === 'English');
console.log(`\n✓ Contains English: ${hasEnglishFall2} (should be FALSE)`);

if (hasEnglishFall2) {
  console.log('❌ FAILED: English suggested in Fall when already in Spring!');
} else {
  console.log('✅ PASSED: English correctly NOT suggested in Fall');
}

console.log('\n' + '='.repeat(80));
console.log('Test Summary:');
console.log('✓ English limit: 1 per YEAR (not per semester)');
console.log('✓ Math limit: 1 per SEMESTER (can take 2 different per year)');
console.log('='.repeat(80));
