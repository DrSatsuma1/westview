const catalog = require('./src/data/courses_complete.json');

const grade10Math = catalog.courses.filter(c => 
  c.pathway === 'Math' && 
  c.grades_allowed.includes(10)
);
console.log('Grade 10 Math (ALL):');
grade10Math.forEach(c => console.log('- ' + c.full_name));
console.log('Total: ' + grade10Math.length);

const grade10Science = catalog.courses.filter(c => 
  (c.pathway === 'Science - Biological' || c.pathway === 'Science - Physical') &&
  c.grades_allowed.includes(10)
);
console.log('');
console.log('Grade 10 Science (ALL):');
grade10Science.slice(0, 10).forEach(c => console.log('- ' + c.full_name));
console.log('Total: ' + grade10Science.length);
