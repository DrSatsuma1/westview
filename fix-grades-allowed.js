const fs = require('fs');
const catalog = require('./src/data/courses_complete.json');

let updatedCount = 0;

// Fix Math and Science courses to include grades 10 and 11
catalog.courses.forEach(course => {
  const isMath = course.pathway === 'Math';
  const isScience = course.pathway === 'Science - Biological' || course.pathway === 'Science - Physical';
  
  if ((isMath || isScience) && course.grades_allowed.length === 2) {
    if (course.grades_allowed.includes(9) && course.grades_allowed.includes(12)) {
      // This course is missing grades 10 and 11
      course.grades_allowed = [9, 10, 11, 12];
      updatedCount++;
      console.log('Updated: ' + course.full_name);
    }
  }
});

// Write back to file
fs.writeFileSync(
  './src/data/courses_complete.json',
  JSON.stringify(catalog, null, 2)
);

console.log('\nTotal courses updated: ' + updatedCount);
