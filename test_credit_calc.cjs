// Test credit calculation issue
const data = require('./src/data/courses_complete.json');

// Build catalog
const COURSE_CATALOG = {};
data.courses.forEach(c => {
  COURSE_CATALOG[c.course_id] = c;
});

// Simulate courses after Fall auto-fill for Grade 11
// Yearlong courses are in all 4 quarters
const courses = [
  // American Literature (semester) - Q1, Q2 only
  { courseId: 'AMERICAN_LITERATURE_0003', year: '11', quarter: 'Q1' },
  { courseId: 'AMERICAN_LITERATURE_0003', year: '11', quarter: 'Q2' },
  // Int Math II (semester) - Q1, Q2 only
  { courseId: 'INTEGRATED_MATHEMATICS', year: '11', quarter: 'Q1' },
  { courseId: 'INTEGRATED_MATHEMATICS', year: '11', quarter: 'Q2' },
  // World History (semester) - Q1, Q2 only
  { courseId: 'WORLD_HISTORY_0013', year: '11', quarter: 'Q1' },
  { courseId: 'WORLD_HISTORY_0013', year: '11', quarter: 'Q2' },
  // Chinese 3-4 (yearlong) - all 4 quarters
  { courseId: 'CHINESE_34_0004', year: '11', quarter: 'Q1' },
  { courseId: 'CHINESE_34_0004', year: '11', quarter: 'Q2' },
  { courseId: 'CHINESE_34_0004', year: '11', quarter: 'Q3' },
  { courseId: 'CHINESE_34_0004', year: '11', quarter: 'Q4' },
];

const year = '11';
const termQuarters = ['Q3', 'Q4']; // Spring term

// Current buggy calculation (from App.jsx)
const existingTermCredits = courses
  .filter(c => c.year === year && termQuarters.includes(c.quarter))
  .reduce((sum, c) => {
    const info = COURSE_CATALOG[c.courseId];
    return sum + (info ? info.credits : 0);
  }, 0);

console.log('=== Credit Calculation Bug Analysis ===\n');

console.log('Courses in Spring term (Q3/Q4):');
courses.filter(c => c.year === year && termQuarters.includes(c.quarter)).forEach(c => {
  const info = COURSE_CATALOG[c.courseId];
  console.log('  ' + c.courseId + ' (' + c.quarter + '): ' + info?.credits + ' credits');
});

console.log('\nBuggy existingTermCredits (counts per entry):', existingTermCredits);
console.log('Expected (per unique course): 10 credits (Chinese 3-4 only)');

// Correct calculation - count unique courses
const uniqueSpringCourseIds = [...new Set(
  courses
    .filter(c => c.year === year && termQuarters.includes(c.quarter))
    .map(c => c.courseId)
)];

const correctCredits = uniqueSpringCourseIds.reduce((sum, courseId) => {
  const info = COURSE_CATALOG[courseId];
  return sum + (info ? info.credits : 0);
}, 0);

console.log('\nCorrect existingTermCredits (unique courses):', correctCredits);

console.log('\n=== Impact on Spring auto-fill ===');
console.log('MAX_SEMESTER_CREDITS: 45');
console.log('Available with buggy calc: ' + (45 - existingTermCredits) + ' credits');
console.log('Available with correct calc: ' + (45 - correctCredits) + ' credits');
console.log('\nCourses that can be added (10 credits each):');
console.log('  Buggy: ' + Math.floor((45 - existingTermCredits) / 10) + ' courses');
console.log('  Correct: ' + Math.floor((45 - correctCredits) / 10) + ' courses');
