const catalog = require('./src/data/courses_complete.json');

const grade10Math = catalog.courses.filter(c => 
  c.pathway === 'Math' && 
  c.grades_allowed.includes(10) &&
  !c.full_name.toUpperCase().includes('AP') &&
  !c.full_name.toUpperCase().includes('HONORS')
);
console.log('Grade 10 Math (non-AP, non-Honors):');
grade10Math.forEach(c => console.log('- ' + c.full_name));
console.log('Total: ' + grade10Math.length);

const grade10Science = catalog.courses.filter(c => 
  (c.pathway === 'Science - Biological' || c.pathway === 'Science - Physical') &&
  c.grades_allowed.includes(10) &&
  !c.full_name.toUpperCase().includes('AP')
);
console.log('');
console.log('Grade 10 Science (non-AP):');
grade10Science.forEach(c => console.log('- ' + c.full_name + ' (pathway: ' + c.pathway + ')'));
console.log('Total: ' + grade10Science.length);
