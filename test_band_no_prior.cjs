// Test BAND rule when there's NO BAND in prior years
const { BusinessRules } = require('./src/utils/BusinessRules.js');
const data = require('./src/data/courses_complete.json');

// Build catalog
const catalog = {};
data.courses.forEach(c => {
  catalog[c.course_id] = c;
});

// Find BAND course
const bandCourse = data.courses.find(c => c.full_name.toUpperCase().includes('BAND'));
console.log('BAND course found:', bandCourse?.full_name);

// Scenario 1: No BAND in prior years, trying to suggest in Grade 11
console.log('\n=== Scenario 1: No BAND in prior years ===');
const coursesWithoutBand = [
  { courseId: 'HIGH_SCHOOL_0003', year: '9', quarter: 'Q1' }, // English
  { courseId: 'DRAMA_12_0003', year: '9', quarter: 'Q1' },    // Drama (Fine Arts, not BAND)
  { courseId: 'HIGH_SCHOOL', year: '10', quarter: 'Q1' },     // English
  { courseId: 'ORCHESTRA_0003', year: '10', quarter: 'Q1' },  // Orchestra (Fine Arts, not BAND)
];

const rules1 = new BusinessRules(coursesWithoutBand, [], catalog, 'fall', '11', null);
const canAddBandGrade11 = rules1.checkBandContinuation(bandCourse);
console.log('Can add BAND in Grade 11 (no prior BAND):', canAddBandGrade11);
console.log('Expected: false (blocked)');

// Scenario 2: BAND in Grade 10, trying to suggest in Grade 11
console.log('\n=== Scenario 2: BAND in Grade 10 ===');
const coursesWithBand = [
  { courseId: 'HIGH_SCHOOL_0003', year: '9', quarter: 'Q1' }, // English
  { courseId: 'DRAMA_12_0003', year: '9', quarter: 'Q1' },    // Drama
  { courseId: 'HIGH_SCHOOL', year: '10', quarter: 'Q1' },     // English
  { courseId: 'BAND_WITH_0911', year: '10', quarter: 'Q1' },  // BAND
];

const rules2 = new BusinessRules(coursesWithBand, [], catalog, 'fall', '11', null);
const canAddBandGrade11WithPrior = rules2.checkBandContinuation(bandCourse);
console.log('Can add BAND in Grade 11 (has prior BAND):', canAddBandGrade11WithPrior);
console.log('Expected: true (allowed)');

// Scenario 3: BAND in Grade 9/10, check Grade 12
console.log('\n=== Scenario 3: Grade 12 with prior BAND ===');
const rules3 = new BusinessRules(coursesWithBand, [], catalog, 'fall', '12', null);
const canAddBandGrade12WithPrior = rules3.checkBandContinuation(bandCourse);
console.log('Can add BAND in Grade 12 (has prior BAND):', canAddBandGrade12WithPrior);
console.log('Expected: true (allowed)');

// Scenario 4: No prior BAND, check Grade 12
console.log('\n=== Scenario 4: Grade 12 without prior BAND ===');
const rules4 = new BusinessRules(coursesWithoutBand, [], catalog, 'fall', '12', null);
const canAddBandGrade12NoPrior = rules4.checkBandContinuation(bandCourse);
console.log('Can add BAND in Grade 12 (no prior BAND):', canAddBandGrade12NoPrior);
console.log('Expected: false (blocked)');
