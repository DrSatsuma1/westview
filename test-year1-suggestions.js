/**
 * Test Year 1 (Grade 9) suggestions for both Fall and Spring
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

console.log('Testing Year 1 (Grade 9) Suggestions\n');
console.log('='.repeat(80));

// Test 1: Grade 9 Fall - Empty Schedule
console.log('\n📝 Grade 9 FALL - Empty Schedule');
console.log('-'.repeat(80));

const fallSuggestions = engine.generateSuggestions({
  courses: [],
  year: '9',
  term: 'fall',
  westviewReqs: WESTVIEW_REQUIREMENTS,
  agReqs: AG_REQUIREMENTS
});

console.log(`\nSuggested ${fallSuggestions.length} courses:`);
fallSuggestions.forEach((s, i) => {
  const course = NORMALIZED_CATALOG[s.courseId];
  console.log(`  ${i+1}. ${s.courseName} (${course?.pathway})`);
});

// Test 2: Grade 9 Spring - With Fall courses already scheduled
console.log('\n\n📝 Grade 9 SPRING - With Fall courses in schedule');
console.log('-'.repeat(80));

// Build schedule from Fall suggestions
const fallCourses = fallSuggestions.map((s, i) => ({
  id: i + 1,
  courseId: s.courseId,
  year: '9',
  quarter: 'Q1'
}));

console.log('\nFall courses in schedule:');
fallCourses.forEach(c => {
  const info = NORMALIZED_CATALOG[c.courseId];
  console.log(`  - ${info?.full_name} (Q1)`);
});

const springSuggestions = engine.generateSuggestions({
  courses: fallCourses,
  year: '9',
  term: 'spring',
  westviewReqs: WESTVIEW_REQUIREMENTS,
  agReqs: AG_REQUIREMENTS
});

console.log(`\nSuggested ${springSuggestions.length} courses:`);
springSuggestions.forEach((s, i) => {
  const course = NORMALIZED_CATALOG[s.courseId];
  console.log(`  ${i+1}. ${s.courseName} (${course?.pathway})`);
});

// Check for Math II in both semesters
console.log('\n' + '='.repeat(80));
console.log('Analysis:');
console.log('-'.repeat(80));

const fallMath = fallSuggestions.find(s => NORMALIZED_CATALOG[s.courseId]?.pathway === 'Math');
const springMath = springSuggestions.find(s => NORMALIZED_CATALOG[s.courseId]?.pathway === 'Math');

if (fallMath) {
  console.log(`✓ Fall Math: ${fallMath.courseName}`);
}

if (springMath) {
  console.log(`✓ Spring Math: ${springMath.courseName}`);
}

if (fallMath && springMath && fallMath.courseId === springMath.courseId) {
  console.log('\n❌ BUG: Same Math course suggested in both Fall and Spring!');
  console.log(`   Course: ${fallMath.courseName}`);
} else if (fallMath && springMath) {
  console.log('\n✅ GOOD: Different Math courses suggested');
  console.log(`   Fall: ${fallMath.courseName}`);
  console.log(`   Spring: ${springMath.courseName}`);
} else {
  console.log('\n⚠️  Only one semester has Math suggestion');
}

console.log('\n' + '='.repeat(80));
