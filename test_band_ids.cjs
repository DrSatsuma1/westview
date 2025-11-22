// Find BAND course IDs
const data = require('./src/data/courses_complete.json');

console.log('BAND courses in catalog:');
data.courses.filter(c => c.full_name.toUpperCase().includes('BAND')).forEach(c => {
  console.log('  ID:', c.course_id, '| Name:', c.full_name);
});
