/**
 * Test: Quarter Chronology Check
 *
 * Problem: SuggestionEngine doesn't check if courses exist in LATER quarters
 * when suggesting for EARLIER quarters.
 *
 * Fall = Q1/Q2 (comes FIRST)
 * Spring = Q3/Q4 (comes AFTER Fall)
 *
 * If Math I is in Spring (Q3), suggesting Math II for Fall (Q1) is WRONG.
 */

console.log('=== Quarter Chronology Analysis ===\n');

// Quarters in chronological order
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

// Term-to-quarter mapping (from SuggestionEngine.js line 91-92)
const termToQuarters = {
  'fall': ['Q1', 'Q2'],
  'spring': ['Q3', 'Q4']
};

console.log('Chronological order:');
console.log('  Fall: Q1, Q2 (comes first)');
console.log('  Spring: Q3, Q4 (comes after Fall)\n');

// Scenario: Math I is in Spring
const existingCourses = [
  { courseId: 'MATH_I', year: '9', quarter: 'Q3' } // Spring
];

// User clicks Auto-Suggest for Fall
const suggestingFor = 'fall';
const targetQuarters = termToQuarters[suggestingFor]; // ['Q1', 'Q2']

console.log('Scenario:');
console.log('  - Math I already in: Q3 (Spring)');
console.log('  - User clicks Auto-Suggest for: Fall (Q1/Q2)');
console.log('');

// Check if Math I exists in a LATER quarter
const mathIQuarter = existingCourses.find(c => c.courseId === 'MATH_I')?.quarter;
const mathIQuarterIndex = QUARTERS.indexOf(mathIQuarter);

console.log(`Math I is in: ${mathIQuarter} (index ${mathIQuarterIndex})`);
console.log(`Suggesting for quarters: ${targetQuarters.join(', ')}`);

// Check if any target quarter comes BEFORE Math I quarter
const suggestingBeforeMathI = targetQuarters.some(q => {
  const qIndex = QUARTERS.indexOf(q);
  return qIndex < mathIQuarterIndex;
});

console.log(`\nSuggesting for a quarter BEFORE Math I completes: ${suggestingBeforeMathI ? 'YES' : 'NO'}`);

if (suggestingBeforeMathI) {
  console.log('\n🔥 PROBLEM:');
  console.log('  Cannot suggest Math II for Fall because Math I is not completed until Spring!');
  console.log('  Math II requires Math I as prerequisite.');
  console.log('  Fall (Q1/Q2) comes BEFORE Spring (Q3/Q4).');
  console.log('');
  console.log('✅ SOLUTION:');
  console.log('  Before suggesting a course, check if its prerequisite exists in a LATER quarter.');
  console.log('  If yes, do NOT suggest the advanced course.');
}

// The fix needed in SuggestionEngine
console.log('\n=== Required Fix in SuggestionEngine ===');
console.log('');
console.log('When checking prerequisites (line 98-102):');
console.log('');
console.log('  if (checkEligibility) {');
console.log('    const eligibility = checkEligibility(course.id, year);');
console.log('    if (eligibility.blocking) continue;');
console.log('  }');
console.log('');
console.log('This needs to ALSO check:');
console.log('  - Does this course have a prerequisite?');
console.log('  - Is that prerequisite in a LATER quarter of the SAME YEAR?');
console.log('  - If yes, BLOCK the suggestion');
