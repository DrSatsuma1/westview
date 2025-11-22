/**
 * Verify extracted westview.js matches baseline outputs
 */

const fs = require('fs');
const path = require('path');

// Load baseline
const baseline = require('./baseline-snapshot.json');

// Load catalog
const catalogData = require('../../src/data/courses_complete.json');
const COURSE_CATALOG = {};
catalogData.courses.forEach(course => {
  COURSE_CATALOG[course.course_id] = course;
});

// Import extracted module (use dynamic import for ESM)
async function runVerification() {
  const { calculateWestviewProgress } = await import('../../src/domain/progress/westview.js');

  // Test fixtures (same as capture)
  const FIXTURES = {
    empty_schedule: { courses: [] },
    freshman_basic: {
      courses: [
        { id: 1, courseId: 'HIGH_SCHOOL_0003', year: 9, quarter: 'Q1' },
        { id: 2, courseId: 'HIGH_SCHOOL_0003', year: 9, quarter: 'Q2' },
        { id: 3, courseId: 'HIGH_SCHOOL_0003', year: 9, quarter: 'Q3' },
        { id: 4, courseId: 'HIGH_SCHOOL_0003', year: 9, quarter: 'Q4' },
        { id: 9, courseId: 'BIOLOGY_OF_0012', year: 9, quarter: 'Q1' },
        { id: 10, courseId: 'BIOLOGY_OF_0012', year: 9, quarter: 'Q2' },
        { id: 11, courseId: 'BIOLOGY_OF_0012', year: 9, quarter: 'Q3' },
        { id: 12, courseId: 'BIOLOGY_OF_0012', year: 9, quarter: 'Q4' },
        { id: 13, courseId: 'ENS_12_0014', year: 9, quarter: 'Q1' },
        { id: 14, courseId: 'ENS_12_0014', year: 9, quarter: 'Q2' },
        { id: 15, courseId: 'ENS_12_0014', year: 9, quarter: 'Q3' },
        { id: 16, courseId: 'ENS_12_0014', year: 9, quarter: 'Q4' },
      ]
    },
    naval_science: {
      courses: [
        { id: 1, courseId: 'NAVAL_SCIENCE_0016', year: 9, quarter: 'Q1' },
        { id: 2, courseId: 'NAVAL_SCIENCE_0016', year: 9, quarter: 'Q2' },
        { id: 3, courseId: 'NAVAL_SCIENCE_0016', year: 9, quarter: 'Q3' },
        { id: 4, courseId: 'NAVAL_SCIENCE_0016', year: 9, quarter: 'Q4' },
      ]
    },
    ens_only: {
      courses: [
        { id: 1, courseId: 'ENS_12_0014', year: 9, quarter: 'Q1' },
        { id: 2, courseId: 'ENS_12_0014', year: 9, quarter: 'Q2' },
        { id: 3, courseId: 'ENS_12_0014', year: 9, quarter: 'Q3' },
        { id: 4, courseId: 'ENS_12_0014', year: 9, quarter: 'Q4' },
      ]
    }
  };

  console.log('=== PARITY VERIFICATION ===\n');

  let allPassed = true;

  for (const [name, fixture] of Object.entries(FIXTURES)) {
    console.log(`Testing: ${name}`);

    const newProgress = calculateWestviewProgress(fixture.courses, COURSE_CATALOG);
    const baselineProgress = baseline[name].westviewProgress;

    // Compare each category
    for (const [cat, expected] of Object.entries(baselineProgress)) {
      const actual = newProgress[cat];

      if (actual.earned !== expected.earned) {
        console.log(`  FAIL: ${cat} - earned ${actual.earned}, expected ${expected.earned}`);
        allPassed = false;
      } else if (actual.met !== expected.met) {
        console.log(`  FAIL: ${cat} - met ${actual.met}, expected ${expected.met}`);
        allPassed = false;
      }
    }

    // Check for categories in new but not baseline
    for (const cat of Object.keys(newProgress)) {
      if (!baselineProgress[cat] && newProgress[cat].earned > 0) {
        console.log(`  WARN: ${cat} has ${newProgress[cat].earned} credits in new but missing from baseline`);
      }
    }

    console.log('  PASS');
    console.log('');
  }

  if (allPassed) {
    console.log('=== ALL TESTS PASSED ===');
    console.log('Extracted westview.js matches baseline behavior.');
  } else {
    console.log('=== SOME TESTS FAILED ===');
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
