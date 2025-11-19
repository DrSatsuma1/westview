const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./src/data/courses_complete.json', 'utf8'));

const coursesWithHomework = data.courses.filter(c => c.homework_hours_per_week !== null && c.homework_hours_per_week !== undefined);
const coursesWithoutHomework = data.courses.filter(c => c.homework_hours_per_week === null || c.homework_hours_per_week === undefined);

console.log('Courses with homework data:', coursesWithHomework.length);
console.log('Courses without homework data:', coursesWithoutHomework.length);
console.log('Total courses:', data.courses.length);
console.log('\nSample courses with homework hours:');
coursesWithHomework.slice(0, 15).forEach(c =>
  console.log(`  ${c.full_name.padEnd(50)} ${c.homework_hours_per_week} hrs/week`)
);

console.log('\nCourses with highest homework load:');
const sortedByHomework = [...coursesWithHomework].sort((a, b) => b.homework_hours_per_week - a.homework_hours_per_week);
sortedByHomework.slice(0, 10).forEach(c =>
  console.log(`  ${c.full_name.padEnd(50)} ${c.homework_hours_per_week} hrs/week`)
);
