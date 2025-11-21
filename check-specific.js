const catalog = require('./src/data/courses_complete.json');

// Find Integrated Math II
const intMath2 = catalog.courses.filter(c => 
  c.full_name.toUpperCase().includes('INTEGRATED MATHEMATICS II')
);
console.log('INTEGRATED MATHEMATICS II courses:');
intMath2.forEach(c => {
  console.log('- ' + c.full_name);
  console.log('  Grades allowed: ' + c.grades_allowed.join(', '));
});

// Find Geometry
const geometry = catalog.courses.filter(c => 
  c.full_name.toUpperCase().includes('GEOMETRY') &&
  !c.full_name.toUpperCase().includes('ANALYTIC')
);
console.log('\nGEOMETRY courses:');
geometry.forEach(c => {
  console.log('- ' + c.full_name);
  console.log('  Grades allowed: ' + c.grades_allowed.join(', '));
});

// Find Chemistry
const chemistry = catalog.courses.filter(c => 
  c.full_name.toUpperCase().includes('CHEMISTRY')
);
console.log('\nCHEMISTRY courses:');
chemistry.forEach(c => {
  console.log('- ' + c.full_name);
  console.log('  Grades allowed: ' + c.grades_allowed.join(', '));
});
