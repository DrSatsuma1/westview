const catalog = require('./src/data/courses_complete.json');

const mathCourses = catalog.courses.filter(c => c.pathway === 'Math');
console.log('Math courses by grade:');
const mathByGrade = {};
mathCourses.forEach(c => {
  c.grades_allowed.forEach(g => {
    if (!mathByGrade[g]) mathByGrade[g] = [];
    mathByGrade[g].push(c.full_name);
  });
});
Object.keys(mathByGrade).sort().forEach(grade => {
  console.log(`Grade ${grade}: ${mathByGrade[grade].length} courses`);
  mathByGrade[grade].slice(0, 3).forEach(name => console.log(`  - ${name}`));
});

const scienceCourses = catalog.courses.filter(c => 
  c.pathway === 'Science - Biological' || c.pathway === 'Science - Physical'
);
console.log('\nScience courses by grade:');
const scienceByGrade = {};
scienceCourses.forEach(c => {
  c.grades_allowed.forEach(g => {
    if (!scienceByGrade[g]) scienceByGrade[g] = [];
    scienceByGrade[g].push(c.full_name);
  });
});
Object.keys(scienceByGrade).sort().forEach(grade => {
  console.log(`Grade ${grade}: ${scienceByGrade[grade].length} courses`);
  scienceByGrade[grade].slice(0, 3).forEach(name => console.log(`  - ${name}`));
});
