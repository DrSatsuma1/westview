/**
 * Baseline test fixtures for architecture refactor
 * These capture current behavior BEFORE extraction
 */

// Sample course schedules to test with
export const FIXTURE_EMPTY = {
  name: 'empty_schedule',
  courses: []
};

export const FIXTURE_FRESHMAN_BASIC = {
  name: 'freshman_basic',
  courses: [
    // English 1-2 (yearlong) - 4 quarters
    { id: 1, courseId: 'HIGH_SCHOOL_0003', year: 9, quarter: 'Q1' },
    { id: 2, courseId: 'HIGH_SCHOOL_0003', year: 9, quarter: 'Q2' },
    { id: 3, courseId: 'HIGH_SCHOOL_0003', year: 9, quarter: 'Q3' },
    { id: 4, courseId: 'HIGH_SCHOOL_0003', year: 9, quarter: 'Q4' },
    // Biology (yearlong)
    { id: 9, courseId: 'BIOLOGY_OF_0012', year: 9, quarter: 'Q1' },
    { id: 10, courseId: 'BIOLOGY_OF_0012', year: 9, quarter: 'Q2' },
    { id: 11, courseId: 'BIOLOGY_OF_0012', year: 9, quarter: 'Q3' },
    { id: 12, courseId: 'BIOLOGY_OF_0012', year: 9, quarter: 'Q4' },
    // ENS 1-2 (PE - yearlong)
    { id: 13, courseId: 'ENS_12_0014', year: 9, quarter: 'Q1' },
    { id: 14, courseId: 'ENS_12_0014', year: 9, quarter: 'Q2' },
    { id: 15, courseId: 'ENS_12_0014', year: 9, quarter: 'Q3' },
    { id: 16, courseId: 'ENS_12_0014', year: 9, quarter: 'Q4' },
  ]
};

export const FIXTURE_NAVAL_SCIENCE = {
  name: 'naval_science_dual_credit',
  courses: [
    // Naval Science 1 (should count toward PE + Electives)
    { id: 1, courseId: 'NAVAL_SCIENCE_0016', year: 9, quarter: 'Q1' },
    { id: 2, courseId: 'NAVAL_SCIENCE_0016', year: 9, quarter: 'Q2' },
    { id: 3, courseId: 'NAVAL_SCIENCE_0016', year: 9, quarter: 'Q3' },
    { id: 4, courseId: 'NAVAL_SCIENCE_0016', year: 9, quarter: 'Q4' },
  ]
};

export const FIXTURE_ENS = {
  name: 'ens_dual_credit',
  courses: [
    // ENS 1-2 (should count 5 to Health, 5 to PE)
    { id: 1, courseId: 'ENS_12_0014', year: 9, quarter: 'Q1' },
    { id: 2, courseId: 'ENS_12_0014', year: 9, quarter: 'Q2' },
    { id: 3, courseId: 'ENS_12_0014', year: 9, quarter: 'Q3' },
    { id: 4, courseId: 'ENS_12_0014', year: 9, quarter: 'Q4' },
  ]
};

// Expected outputs - to be filled in by running current implementation
export const EXPECTED_OUTPUTS = {
  empty_schedule: {
    westviewProgress: null,  // Will capture
    agProgress: null,
    totalCredits: 0
  },
  freshman_basic: {
    westviewProgress: null,
    agProgress: null,
    totalCredits: null  // Should be 40 (4 yearlong courses * 10 credits)
  },
  naval_science_dual_credit: {
    westviewProgress: null,  // PE: 10, Electives: 10
    agProgress: null,
    totalCredits: null
  },
  ens_dual_credit: {
    westviewProgress: null,  // Health: 5, PE: 5
    agProgress: null,
    totalCredits: null
  }
};

export const ALL_FIXTURES = [
  FIXTURE_EMPTY,
  FIXTURE_FRESHMAN_BASIC,
  FIXTURE_NAVAL_SCIENCE,
  FIXTURE_ENS
];
