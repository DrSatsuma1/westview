/**
 * Full parity verification for all extracted domain modules
 */

const fs = require('fs');
const path = require('path');

// Load course catalog
const catalogPath = path.join(__dirname, '../../src/data/courses_complete.json');
const COURSE_CATALOG = {};
const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
(catalogData.courses || catalogData).forEach(c => {
  COURSE_CATALOG[c.course_id] = c;
});

// Import extracted modules (using dynamic import for ESM)
async function runTests() {
  const westviewModule = await import('../../src/domain/progress/westview.js');
  const agModule = await import('../../src/domain/progress/ag.js');
  const gpaModule = await import('../../src/domain/gpa.js');

  const { calculateWestviewProgress, WESTVIEW_REQUIREMENTS } = westviewModule;
  const { calculateAGProgress, AG_REQUIREMENTS } = agModule;
  const { calculateUCGPA, getBaseGradePoints } = gpaModule;

  let allPassed = true;

  console.log('=== FULL PARITY VERIFICATION ===\n');

  // Test 1: Westview empty schedule
  console.log('Test 1: Westview empty schedule');
  const emptyProgress = calculateWestviewProgress([], COURSE_CATALOG);
  if (Object.keys(emptyProgress).length === 9) {
    console.log('  PASS: 9 categories returned');
  } else {
    console.log('  FAIL: Expected 9 categories, got', Object.keys(emptyProgress).length);
    allPassed = false;
  }

  // Test 2: A-G empty schedule
  console.log('\nTest 2: A-G empty schedule');
  const emptyAG = calculateAGProgress([], COURSE_CATALOG, false);
  if (Object.keys(emptyAG).length === 7) {
    console.log('  PASS: 7 categories (A-G) returned');
  } else {
    console.log('  FAIL: Expected 7 categories, got', Object.keys(emptyAG).length);
    allPassed = false;
  }

  // Test 3: GPA no courses
  console.log('\nTest 3: UC GPA no courses');
  const emptyGPA = calculateUCGPA([], COURSE_CATALOG);
  if (emptyGPA === null) {
    console.log('  PASS: Returns null for no courses');
  } else {
    console.log('  FAIL: Expected null, got', emptyGPA);
    allPassed = false;
  }

  // Test 4: Math level-based counting
  console.log('\nTest 4: A-G Math level-based counting');
  const mathCourses = [
    { courseId: 'AP_CALCULUS', year: '11', semester: 'Fall', id: 1 }  // AP CALCULUS BC 1-2
  ];
  const mathProgress = calculateAGProgress(mathCourses, COURSE_CATALOG, false);
  if (mathProgress.C && mathProgress.C.earned === 5) {
    console.log('  PASS: AP Calc BC counts as 5 years of math');
  } else {
    console.log('  FAIL: Expected 5 years, got', mathProgress.C?.earned);
    allPassed = false;
  }

  // Test 5: Foreign language with 7/8 credit
  console.log('\nTest 5: A-G Foreign Language with 7/8 credit');
  const flCourses = [
    { courseId: 'CHINESE_34_0004', year: '10', semester: 'Fall', id: 1 }  // CHINESE 3-4
  ];
  const flProgress = calculateAGProgress(flCourses, COURSE_CATALOG, true);
  if (flProgress.E && flProgress.E.earned === 4) { // 2 + 2 from 7/8
    console.log('  PASS: Chinese 3-4 + met in 7/8 = 4 years');
  } else {
    console.log('  FAIL: Expected 4 years, got', flProgress.E?.earned);
    allPassed = false;
  }

  // Test 6: GPA with grades
  console.log('\nTest 6: UC GPA calculation');
  const gradedCourses = [
    { courseId: 'AMERICAN_LITERATURE_0003', year: '10', semester: 'Fall', grade: 'A', id: 1 },
    { courseId: 'AMERICAN_LITERATURE_0003', year: '10', semester: 'Spring', grade: 'B', id: 2 }
  ];
  const gpaResult = calculateUCGPA(gradedCourses, COURSE_CATALOG);
  if (gpaResult && gpaResult.unweighted === 3.5) {
    console.log('  PASS: (4 + 3) / 2 = 3.5 unweighted');
  } else {
    console.log('  FAIL: Expected 3.5, got', gpaResult?.unweighted);
    allPassed = false;
  }

  // Test 7: Grade points helper
  console.log('\nTest 7: getBaseGradePoints helper');
  const tests = [
    ['A+', 4], ['A', 4], ['A-', 4],
    ['B+', 3], ['B', 3], ['B-', 3],
    ['C+', 2], ['C', 2], ['C-', 2],
    ['D', 1], ['F', 0]
  ];
  let gradeTestsPassed = true;
  tests.forEach(([grade, expected]) => {
    const result = getBaseGradePoints(grade);
    if (result !== expected) {
      console.log(`  FAIL: ${grade} expected ${expected}, got ${result}`);
      gradeTestsPassed = false;
    }
  });
  if (gradeTestsPassed) {
    console.log('  PASS: All grade conversions correct');
  } else {
    allPassed = false;
  }

  // Test 8: Excess credits to electives
  console.log('\nTest 8: Westview excess credits to Electives');
  const excessCourses = [
    // 5 English courses = 50 credits (need 40, excess 10)
    { courseId: 'HIGH_SCHOOL_0003', year: '9', semester: 'Fall', id: 1 },     // ENGLISH 1-2 (10cr)
    { courseId: 'HIGH_SCHOOL', year: '10', semester: 'Fall', id: 2 },          // ENGLISH 3-4 (10cr)
    { courseId: 'EXPOSITORY_READING_0003', year: '11', semester: 'Fall', id: 3 }, // EXPOSITORY READING (10cr)
    { courseId: 'AMERICAN_LITERATURE_0003', year: '12', semester: 'Fall', id: 4 }, // AMERICAN LIT (10cr)
    { courseId: 'BRITISH_LITERATURE_0003', year: '12', semester: 'Spring', id: 5 } // BRITISH LIT (10cr)
  ];
  const excessProgress = calculateWestviewProgress(excessCourses, COURSE_CATALOG);
  if (excessProgress['English'].earned === 50 && excessProgress['Electives'].earned >= 10) {
    console.log('  PASS: 50 English credits, excess flows to Electives');
  } else {
    console.log('  FAIL: English=', excessProgress['English'].earned, 'Electives=', excessProgress['Electives'].earned);
    allPassed = false;
  }

  console.log('\n=================================');
  if (allPassed) {
    console.log('ALL TESTS PASSED');
    process.exit(0);
  } else {
    console.log('SOME TESTS FAILED');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
