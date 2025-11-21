/**
 * Test: Math Sequencing Bug
 *
 * Reproduces issue where:
 * 1. User clicks Auto-Suggest for Spring → Gets Math I
 * 2. User clicks Auto-Suggest for Fall → Gets Math II
 *
 * This is backwards because Fall (Q1/Q2) comes BEFORE Spring (Q3/Q4)
 * Math II cannot be taken before completing Math I.
 */

const fs = require('fs');
const path = require('path');

// Load course catalog
const catalogPath = path.join(__dirname, 'src/data/courses_complete.json');
const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const COURSE_CATALOG = catalogData.courses.reduce((acc, course) => {
  acc[course.course_id] = course;
  return acc;
}, {});

// Import suggestion engine modules as ES6
import { SuggestionEngine } from './src/utils/SuggestionEngine.js';
import { normalizePathway } from './src/utils/CatalogNormalizer.js';

// Normalize catalog (same approach as App.jsx)
const NORMALIZED_CATALOG = Object.fromEntries(
  Object.entries(COURSE_CATALOG).map(([id, course]) => [
    id,
    {
      ...course,
      pathway: normalizePathway(course.pathway, course.full_name, course.uc_csu_category)
    }
  ])
);

// Deprecated courses (empty for this test)
const DEPRECATED_COURSES = [];

// Requirements
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

// Initialize engine
const engine = new SuggestionEngine(NORMALIZED_CATALOG, DEPRECATED_COURSES);

// TEST 1: Suggest for Spring first
console.log('=== TEST 1: Auto-Suggest for Year 1 Spring ===\n');

const springCourses = [];
const springSuggestions = engine.generateSuggestions({
  courses: springCourses,
  year: '9',
  term: 'spring',
  westviewReqs: WESTVIEW_REQUIREMENTS,
  agReqs: AG_REQUIREMENTS
});

console.log('Spring Suggestions:');
springSuggestions.forEach(s => {
  console.log(`  - ${s.courseName} (${s.courseId})`);
  console.log(`    Quarter: ${s.quarter}, Reason: ${s.reason}`);
});

// Find Math I in suggestions
const mathISuggestion = springSuggestions.find(s =>
  NORMALIZED_CATALOG[s.courseId]?.full_name.includes('INTEGRATED MATHEMATICS I')
);

console.log(`\n✓ Spring suggested Math I: ${mathISuggestion ? 'YES' : 'NO'}`);

// TEST 2: Now add Math I to Spring and suggest for Fall
console.log('\n=== TEST 2: Auto-Suggest for Year 1 Fall (with Math I already in Spring) ===\n');

const coursesWithMathIInSpring = [];

if (mathISuggestion) {
  coursesWithMathIInSpring.push({
    id: Date.now(),
    courseId: mathISuggestion.courseId,
    year: '9',
    quarter: 'Q3' // Spring
  });
}

const fallSuggestions = engine.generateSuggestions({
  courses: coursesWithMathIInSpring,
  year: '9',
  term: 'fall',
  westviewReqs: WESTVIEW_REQUIREMENTS,
  agReqs: AG_REQUIREMENTS
});

console.log('Fall Suggestions (with Math I in Spring):');
fallSuggestions.forEach(s => {
  console.log(`  - ${s.courseName} (${s.courseId})`);
  console.log(`    Quarter: ${s.quarter}, Reason: ${s.reason}`);
});

// Check if Math II was suggested
const mathIISuggestion = fallSuggestions.find(s =>
  NORMALIZED_CATALOG[s.courseId]?.full_name.includes('INTEGRATED MATHEMATICS II')
);

console.log(`\n❌ BUG: Fall suggested Math II: ${mathIISuggestion ? 'YES (WRONG!)' : 'NO (CORRECT)'}`);

if (mathIISuggestion) {
  console.log('\n🔥 PROBLEM DETECTED:');
  console.log('  Math II is suggested in Fall (Q1/Q2)');
  console.log('  But Math I is in Spring (Q3/Q4)');
  console.log('  Fall comes BEFORE Spring chronologically!');
  console.log('  This violates prerequisite order.');
}

// TEST 3: Verify the correct behavior
console.log('\n=== TEST 3: Expected Behavior ===');
console.log('When Math I is in Spring (Q3/Q4):');
console.log('  - Fall (Q1/Q2) should NOT suggest Math II');
console.log('  - Fall should suggest Math I OR other courses');
console.log('  - Math II should only be suggested if Math I is completed in an EARLIER quarter');
