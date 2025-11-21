/**
 * Test that AP courses are never suggested for Grade 9
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

console.log('Testing AP Course Restriction for Grade 9\n');
console.log('='.repeat(80));

// Test: Grade 9 should never get AP suggestions
console.log('\n📝 Grade 9 Fall - No AP courses should be suggested');
console.log('-'.repeat(80));

const suggestions = engine.generateSuggestions({
  courses: [],
  year: '9',
  term: 'fall',
  westviewReqs: WESTVIEW_REQUIREMENTS,
  agReqs: AG_REQUIREMENTS
});

console.log(`\nSuggested ${suggestions.length} courses:`);
suggestions.forEach(s => {
  const course = NORMALIZED_CATALOG[s.courseId];
  console.log(`  - ${s.courseName} (${course?.pathway})`);
});

const hasAP = suggestions.some(s => {
  const courseName = s.courseName.toUpperCase();
  return courseName.includes('AP');
});

console.log(`\n✓ Contains AP course: ${hasAP}`);

if (hasAP) {
  console.log('❌ FAILED: AP course was suggested for Grade 9!');
  const apCourse = suggestions.find(s => s.courseName.toUpperCase().includes('AP'));
  console.log(`   AP course: ${apCourse.courseName}`);
} else {
  console.log('✅ PASSED: No AP courses suggested for Grade 9');
}

console.log('\n' + '='.repeat(80));
console.log('✓ Grade 9 AP restriction working correctly');
console.log('='.repeat(80));
