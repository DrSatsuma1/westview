const catalog = require('./src/data/courses_complete.json');

const grade11Math = catalog.courses.filter(c => 
  c.pathway === 'Math' && 
  c.grades_allowed.includes(11) &&
  !c.full_name.toUpperCase().includes('AP') &&
  !c.full_name.toUpperCase().includes('HONORS')
);
console.log('Grade 11 Math (non-AP, non-Honors):');
grade11Math.slice(0, 5).forEach(c => console.log('- ' + c.full_name));
console.log('Total: ' + grade11Math.length);

const grade11Science = catalog.courses.filter(c => 
  (c.pathway === 'Science - Biological' || c.pathway === 'Science - Physical') &&
  c.grades_allowed.includes(11)
);
console.log('');
console.log('Grade 11 Science:');
grade11Science.slice(0, 5).forEach(c => console.log('- ' + c.full_name + ' (pathway: ' + c.pathway + ')'));
console.log('Total: ' + grade11Science.length);
