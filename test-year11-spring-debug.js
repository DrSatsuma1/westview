/**
 * Debug: Year 11 Spring suggesting only 2 courses
 *
 * Expected: 4 courses
 * Actual: 2 courses
 *
 * Need to understand why business rules are blocking so many courses
 */

import { SuggestionEngine } from './src/utils/SuggestionEngine.js';
import { normalizePathway } from './src/utils/CatalogNormalizer.js';
import { RequirementCalculator } from './src/utils/RequirementCalculator.js';
import { CandidateRanker } from './src/utils/CandidateRanker.js';
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

console.log('=== Year 11 Spring Debug ===\n');

// Build up schedule through Year 11 Fall
const allCourses = [];

// Year 9 Fall
const y9f = engine.generateSuggestions({
  courses: allCourses,
  year: '9',
  term: 'fall',
  westviewReqs: WESTVIEW_REQUIREMENTS,
  agReqs: AG_REQUIREMENTS
});
y9f.forEach(s => allCourses.push({ courseId: s.courseId, year: '9', quarter: 'Q1' }));

// Year 9 Spring
const y9s = engine.generateSuggestions({
  courses: allCourses,
  year: '9',
  term: 'spring',
  westviewReqs: WESTVIEW_REQUIREMENTS,
  agReqs: AG_REQUIREMENTS
});
y9s.forEach(s => allCourses.push({ courseId: s.courseId, year: '9', quarter: 'Q3' }));

// Year 10 Fall
const y10f = engine.generateSuggestions({
  courses: allCourses,
  year: '10',
  term: 'fall',
  westviewReqs: WESTVIEW_REQUIREMENTS,
  agReqs: AG_REQUIREMENTS
});
y10f.forEach(s => allCourses.push({ courseId: s.courseId, year: '10', quarter: 'Q1' }));

// Year 10 Spring
const y10s = engine.generateSuggestions({
  courses: allCourses,
  year: '10',
  term: 'spring',
  westviewReqs: WESTVIEW_REQUIREMENTS,
  agReqs: AG_REQUIREMENTS
});
y10s.forEach(s => allCourses.push({ courseId: s.courseId, year: '10', quarter: 'Q3' }));

// Year 11 Fall
const y11f = engine.generateSuggestions({
  courses: allCourses,
  year: '11',
  term: 'fall',
  westviewReqs: WESTVIEW_REQUIREMENTS,
  agReqs: AG_REQUIREMENTS
});
y11f.forEach(s => allCourses.push({ courseId: s.courseId, year: '11', quarter: 'Q1' }));

console.log('Schedule before Year 11 Spring:');
console.log(`Total courses: ${allCourses.length}`);
console.log('');

// Check unmet requirements for Year 11 Spring
const reqCalc = new RequirementCalculator(
  allCourses,
  NORMALIZED_CATALOG,
  WESTVIEW_REQUIREMENTS,
  AG_REQUIREMENTS
);

const unmetReqs = reqCalc.getUnmetWestview('11');
const agGaps = reqCalc.getUnmetAG();

console.log('Unmet requirements for Year 11:');
console.log(`  needsEnglish: ${unmetReqs.needsEnglish}`);
console.log(`  needsMath: ${unmetReqs.needsMath}`);
console.log(`  needsHistory: ${unmetReqs.needsHistory}`);
console.log(`  needsScience: ${unmetReqs.needsScience}`);
console.log(`  needsPE: ${unmetReqs.needsPE}`);
console.log(`  agGaps: ${agGaps.join(', ') || 'none'}`);
console.log('');

// Now test Year 11 Spring
const y11s = engine.generateSuggestions({
  courses: allCourses,
  year: '11',
  term: 'spring',
  westviewReqs: WESTVIEW_REQUIREMENTS,
  agReqs: AG_REQUIREMENTS
});

console.log(`Year 11 Spring suggestions: ${y11s.length}/4`);
y11s.forEach(s => {
  const c = NORMALIZED_CATALOG[s.courseId];
  console.log(`  - ${s.courseName} [${c.pathway}] (score: ${s.score})`);
});

// Analyze candidate pool
const candidates = engine.buildCandidatePool('11', allCourses);
console.log(`\nTotal candidates available: ${candidates.length}`);

// Score top 20 candidates
const ranker = new CandidateRanker({ ...unmetReqs, agGaps }, '11', 'spring');
const scored = candidates
  .map(course => ({
    course,
    score: ranker.scoreCourse(course)
  }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 20);

console.log('\nTop 20 candidates by score:');
scored.forEach((item, idx) => {
  console.log(`  ${idx + 1}. ${item.course.full_name} [${item.course.pathway}] (${item.score})`);
});

console.log('\n❌ Why only 2 suggestions?');
console.log('Possible reasons:');
console.log('  1. Most candidates blocked by business rules');
console.log('  2. Most candidates already scheduled');
console.log('  3. Prerequisites not met');
console.log('  4. Candidate pool too small');
