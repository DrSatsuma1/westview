const fs = require('fs');

// Load courses
const data = JSON.parse(fs.readFileSync('./src/data/courses_complete.json'));

// Math prerequisite mappings
// Format: course_id -> { required: [...], recommended: [...] }
const mathPrereqs = {
  // Core sequence - each requires the previous
  'INTEGRATED_MATHEMATICS_0010': {
    required: [],
    recommended: []
  }, // Math I - entry level

  'INTEGRATED_MATHEMATICS': {
    required: [],
    recommended: ['INTEGRATED_MATHEMATICS_0010']
  }, // Math II - recommends Math I

  'INTEGRATED_MATHEMATICS_0001': {
    required: [],
    recommended: ['INTEGRATED_MATHEMATICS']
  }, // Math III - recommends Math II

  'AP_PRECALCULUS_0010': {
    required: [],
    recommended: ['INTEGRATED_MATHEMATICS_0001']
  }, // AP Pre-Calc - recommends Math III

  'AP_CALCULUS_0010': {
    required: [],
    recommended: ['AP_PRECALCULUS_0010']
  }, // AP Calc AB - recommends Pre-Calc

  'AP_CALCULUS': {
    required: [],
    recommended: ['AP_CALCULUS_0010']
  }, // AP Calc BC - recommends AP Calc AB

  // Statistics track
  'COLLEGE_ALGEBRA_0010': {
    required: [],
    recommended: ['INTEGRATED_MATHEMATICS_0001']
  }, // College Algebra - recommends Math III

  'STATISTICS_0010': {
    required: [],
    recommended: ['INTEGRATED_MATHEMATICS_0001']
  }, // Statistics - recommends Math III

  'AP_STATISTICS_0010': {
    required: [],
    recommended: ['INTEGRATED_MATHEMATICS_0001']
  }, // AP Stats - recommends Math III

  // Other math courses
  'ADVANCED_FUNCTIONS_0010': {
    required: [],
    recommended: ['INTEGRATED_MATHEMATICS_0001']
  }, // Advanced Functions - recommends Math III

  'INTRODUCTION_TO_0010': {
    required: [],
    recommended: ['INTEGRATED_MATHEMATICS']
  }, // Intro to Data Science - recommends Math II

  'AP_COMPUTER_0010': {
    required: [],
    recommended: ['INTEGRATED_MATHEMATICS']
  }, // AP CS A - recommends Math II

  'INTRODUCTION_TO_0002': {
    required: [],
    recommended: ['INTEGRATED_MATHEMATICS_0010']
  }, // Intro to Finance - recommends Math I

  // Support & Special Ed - no prereqs
  'ACADEMIC_SUCCESS_0380': { required: [], recommended: [] },
  'LBASIC_MATH_0020': { required: [], recommended: [] },
  'LINTEGRATED_MATHEMATICS_0020': { required: [], recommended: [] },
  'SPECIAL_ED': { required: [], recommended: [] },
  'LMATH_ACCELERATION_0010': { required: [], recommended: [] },
};

// Update courses
let updated = 0;
data.courses = data.courses.map(course => {
  if (mathPrereqs[course.course_id]) {
    const prereqs = mathPrereqs[course.course_id];
    course.prerequisites_required_ids = prereqs.required;
    course.prerequisites_recommended_ids = prereqs.recommended;
    updated++;
    console.log(`Updated: ${course.full_name}`);
  }
  return course;
});

console.log(`\nTotal updated: ${updated} courses`);

// Save
fs.writeFileSync('./src/data/courses_complete.json', JSON.stringify(data, null, 2));
console.log('Saved to courses_complete.json');
