/**
 * Golden Master Test for Course Progress Calculations
 *
 * Run with: node tests/golden-master.mjs
 *
 * This test ensures refactoring doesn't change calculation results.
 * Before refactoring: Run this to capture expected outputs.
 * After refactoring: Run again to verify outputs match.
 */

import { createRequire } from 'module';
import { calculateWestviewProgress } from '../src/domain/progress/westview.js';
import { calculateAGProgress } from '../src/domain/progress/ag.js';
import { calculateUCGPA } from '../src/domain/gpa.js';
import { calculateTotalCreditsWithCap, calculateEarlyGradEligibility } from '../src/domain/graduation.js';

const require = createRequire(import.meta.url);
const courseCatalogData = require('../src/data/courses_complete.json');

// Build catalog lookup
const COURSE_CATALOG = courseCatalogData.courses.reduce((acc, course) => {
  acc[course.course_id] = course;
  return acc;
}, {});

// Sample schedule using REAL course IDs from courses_complete.json
const sampleCourses = [
  // Grade 9 - typical schedule (yearlong courses = all 4 quarters)
  // English 1-2
  { courseId: 'HIGH_SCHOOL_0003', year: '9', quarter: 'Q1' },
  { courseId: 'HIGH_SCHOOL_0003', year: '9', quarter: 'Q2' },
  { courseId: 'HIGH_SCHOOL_0003', year: '9', quarter: 'Q3' },
  { courseId: 'HIGH_SCHOOL_0003', year: '9', quarter: 'Q4' },
  // Integrated Math Ia-Ib
  { courseId: 'INTEGRATED_MATHEMATICS_0010', year: '9', quarter: 'Q1' },
  { courseId: 'INTEGRATED_MATHEMATICS_0010', year: '9', quarter: 'Q2' },
  { courseId: 'INTEGRATED_MATHEMATICS_0010', year: '9', quarter: 'Q3' },
  { courseId: 'INTEGRATED_MATHEMATICS_0010', year: '9', quarter: 'Q4' },
  // Biology of the Living Earth 1-2
  { courseId: 'BIOLOGY_OF_0012', year: '9', quarter: 'Q1' },
  { courseId: 'BIOLOGY_OF_0012', year: '9', quarter: 'Q2' },
  { courseId: 'BIOLOGY_OF_0012', year: '9', quarter: 'Q3' },
  { courseId: 'BIOLOGY_OF_0012', year: '9', quarter: 'Q4' },
  // World History 1-2
  { courseId: 'WORLD_HISTORY_0013', year: '9', quarter: 'Q1' },
  { courseId: 'WORLD_HISTORY_0013', year: '9', quarter: 'Q2' },
  { courseId: 'WORLD_HISTORY_0013', year: '9', quarter: 'Q3' },
  { courseId: 'WORLD_HISTORY_0013', year: '9', quarter: 'Q4' },
  // Spanish 1-2 (using Chinese as example - same structure)
  { courseId: 'CHINESE_12_0004', year: '9', quarter: 'Q1' },
  { courseId: 'CHINESE_12_0004', year: '9', quarter: 'Q2' },
  { courseId: 'CHINESE_12_0004', year: '9', quarter: 'Q3' },
  { courseId: 'CHINESE_12_0004', year: '9', quarter: 'Q4' },
  // PE - ENS 1-2
  { courseId: 'ENS_12_0014', year: '9', quarter: 'Q1' },
  { courseId: 'ENS_12_0014', year: '9', quarter: 'Q2' },
  { courseId: 'ENS_12_0014', year: '9', quarter: 'Q3' },
  { courseId: 'ENS_12_0014', year: '9', quarter: 'Q4' },
  // Grade 10 - with grades for GPA testing
  // English 3-4 (HIGH_SCHOOL)
  { courseId: 'HIGH_SCHOOL', year: '10', quarter: 'Q1', grade: 'A' },
  { courseId: 'HIGH_SCHOOL', year: '10', quarter: 'Q2', grade: 'A' },
  { courseId: 'HIGH_SCHOOL', year: '10', quarter: 'Q3', grade: 'A' },
  { courseId: 'HIGH_SCHOOL', year: '10', quarter: 'Q4', grade: 'A' },
  // Integrated Math II (using INTEGRATED_MATHEMATICS_0001 - Math II)
  { courseId: 'INTEGRATED_MATHEMATICS_0001', year: '10', quarter: 'Q1', grade: 'B' },
  { courseId: 'INTEGRATED_MATHEMATICS_0001', year: '10', quarter: 'Q2', grade: 'B' },
  { courseId: 'INTEGRATED_MATHEMATICS_0001', year: '10', quarter: 'Q3', grade: 'B' },
  { courseId: 'INTEGRATED_MATHEMATICS_0001', year: '10', quarter: 'Q4', grade: 'B' },
];

// Expected outputs (captured 2024-11-21 BEFORE refactoring)
// These are the golden master values - any change after refactoring = regression
const EXPECTED = {
  westviewProgress: {
    'English': { earned: 20, needed: 40, met: false },
    'Math': { earned: 20, needed: 30, met: false },
    'Biological Science': { earned: 10, needed: 10, met: true },
    'Physical Science': { earned: 0, needed: 10, met: false },
    'History/Social Science': { earned: 10, needed: 30, met: false },
    'Fine Arts/Foreign Language/CTE': { earned: 10, needed: 10, met: true },
    'Health Science': { earned: 5, needed: 5, met: true },
    'Physical Education': { earned: 5, needed: 20, met: false },
    'Electives': { earned: 0, needed: 85, met: false }
  },
  totalCredits: 80,
  agProgress: {
    'A': { earned: 1, needed: 2, recommended: 2, met: false, meetsRecommended: false },
    'B': { earned: 2, needed: 4, recommended: 4, met: false, meetsRecommended: false },
    'C': { earned: 3, needed: 3, recommended: 4, met: true, meetsRecommended: false },
    'D': { earned: 1, needed: 2, recommended: 3, met: false, meetsRecommended: false },
    'E': { earned: 1, needed: 2, recommended: 3, met: false, meetsRecommended: false },
    'F': { earned: 0, needed: 1, recommended: 1, met: false, meetsRecommended: false },
    'G': { earned: 0, needed: 1, recommended: 1, met: false, meetsRecommended: false }
  },
  ucGPA: {
    unweighted: 3.5,
    weightedCapped: 3.5,
    fullyWeighted: 3.5,
    totalGrades: 8,
    grade10Honors: 0,
    grade11Honors: 0,
    cappedHonorsUsed: 0
  },
  earlyGrad: {
    eligible3Year: false,
    eligible3_5Year: false,
    creditsThrough11: 80,
    hasSeniorEnglish: false,
    hasCivicsEcon: false
  }
};

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null || b === null) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false;
  }

  return true;
}

function runTests() {
  console.log('Running Golden Master Tests...\n');
  let passed = 0;
  let failed = 0;

  // Test 1: Westview Progress
  console.log('1. Testing calculateWestviewProgress...');
  const westviewProgress = calculateWestviewProgress(sampleCourses, COURSE_CATALOG);
  if (deepEqual(westviewProgress, EXPECTED.westviewProgress)) {
    passed++;
    console.log('   [PASS]\n');
  } else {
    failed++;
    console.log('   [FAIL]');
    console.log('   Expected:', JSON.stringify(EXPECTED.westviewProgress, null, 2));
    console.log('   Got:', JSON.stringify(westviewProgress, null, 2));
    console.log();
  }

  // Test 2: Total Credits
  console.log('2. Testing calculateTotalCreditsWithCap...');
  const totalCredits = calculateTotalCreditsWithCap(sampleCourses, COURSE_CATALOG);
  if (totalCredits === EXPECTED.totalCredits) {
    passed++;
    console.log('   [PASS]\n');
  } else {
    failed++;
    console.log('   [FAIL] Expected:', EXPECTED.totalCredits, 'Got:', totalCredits, '\n');
  }

  // Test 3: A-G Progress
  console.log('3. Testing calculateAGProgress...');
  const agProgress = calculateAGProgress(sampleCourses, COURSE_CATALOG, false);
  if (deepEqual(agProgress, EXPECTED.agProgress)) {
    passed++;
    console.log('   [PASS]\n');
  } else {
    failed++;
    console.log('   [FAIL]');
    console.log('   Expected:', JSON.stringify(EXPECTED.agProgress, null, 2));
    console.log('   Got:', JSON.stringify(agProgress, null, 2));
    console.log();
  }

  // Test 4: UC GPA (with graded courses)
  console.log('4. Testing calculateUCGPA...');
  const ucGPA = calculateUCGPA(sampleCourses, COURSE_CATALOG);
  if (deepEqual(ucGPA, EXPECTED.ucGPA)) {
    passed++;
    console.log('   [PASS]\n');
  } else {
    failed++;
    console.log('   [FAIL]');
    console.log('   Expected:', JSON.stringify(EXPECTED.ucGPA, null, 2));
    console.log('   Got:', JSON.stringify(ucGPA, null, 2));
    console.log();
  }

  // Test 5: Early Grad Eligibility
  console.log('5. Testing calculateEarlyGradEligibility...');
  const earlyGrad = calculateEarlyGradEligibility(sampleCourses, COURSE_CATALOG);
  if (deepEqual(earlyGrad, EXPECTED.earlyGrad)) {
    passed++;
    console.log('   [PASS]\n');
  } else {
    failed++;
    console.log('   [FAIL]');
    console.log('   Expected:', JSON.stringify(EXPECTED.earlyGrad, null, 2));
    console.log('   Got:', JSON.stringify(earlyGrad, null, 2));
    console.log();
  }

  console.log('='.repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));

  if (failed > 0) {
    console.log('\n[REGRESSION DETECTED] Refactoring changed calculation results!');
    process.exit(1);
  } else {
    console.log('\n[SUCCESS] All calculations match golden master.');
  }
}

runTests();
