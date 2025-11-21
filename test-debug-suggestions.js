/**
 * Debug script to understand why suggestions are empty
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

console.log('Debug: Checking suggestion generation\n');
console.log('='.repeat(80));

const courses = [];

console.log('\n1. Check normalized catalog size:');
console.log(`   Total courses in catalog: ${Object.keys(NORMALIZED_CATALOG).length}`);

console.log('\n2. Check candidate pool for Grade 9:');
const candidates = engine.buildCandidatePool('9', courses);
console.log(`   Candidates found: ${candidates.length}`);

if (candidates.length > 0) {
  console.log('\n   Sample candidates (first 10):');
  candidates.slice(0, 10).forEach(c => {
    console.log(`   - ${c.full_name} (${c.pathway}) - Grades: ${c.grades_allowed?.join(',')}`);
  });
}

console.log('\n3. Check English courses in catalog:');
const englishCourses = Object.entries(NORMALIZED_CATALOG)
  .filter(([id, c]) => c.pathway === 'English' && c.grades_allowed?.includes(9))
  .map(([id, c]) => ({ id, name: c.full_name, pathway: c.pathway }));

console.log(`   English courses for Grade 9: ${englishCourses.length}`);
englishCourses.slice(0, 5).forEach(c => {
  console.log(`   - ${c.name}`);
});

console.log('\n4. Check Math courses in catalog:');
const mathCourses = Object.entries(NORMALIZED_CATALOG)
  .filter(([id, c]) => c.pathway === 'Math' && c.grades_allowed?.includes(9))
  .map(([id, c]) => ({ id, name: c.full_name, pathway: c.pathway }));

console.log(`   Math courses for Grade 9: ${mathCourses.length}`);
mathCourses.slice(0, 5).forEach(c => {
  console.log(`   - ${c.name}`);
});

console.log('\n5. Check PE courses in catalog:');
const peCourses = Object.entries(NORMALIZED_CATALOG)
  .filter(([id, c]) => c.pathway === 'Physical Education' && c.grades_allowed?.includes(9))
  .map(([id, c]) => ({ id, name: c.full_name, pathway: c.pathway }));

console.log(`   PE courses for Grade 9: ${peCourses.length}`);
peCourses.forEach(c => {
  console.log(`   - ${c.name}`);
});

console.log('\n6. Actually generate suggestions:');
const suggestions = engine.generateSuggestions({
  courses: [],
  year: '9',
  term: 'fall',
  westviewReqs: WESTVIEW_REQUIREMENTS,
  agReqs: AG_REQUIREMENTS
});

console.log(`   Suggestions generated: ${suggestions.length}`);
suggestions.forEach(s => {
  const course = NORMALIZED_CATALOG[s.courseId];
  console.log(`   - ${s.courseName} (${course?.pathway}) - Score: ${s.score}`);
});

console.log('\n' + '='.repeat(80));
