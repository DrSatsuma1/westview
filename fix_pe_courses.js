/**
 * Fix PE course credit values
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const coursesPath = path.join(__dirname, 'src', 'data', 'courses_complete.json');
const coursesData = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));

let updatedCount = 0;
const updates = [];

coursesData.courses = coursesData.courses.map(course => {
  const name = course.full_name.toUpperCase();

  // COURT SPORTS 1-2 should be 10 credits (one semester = quarters 1-2)
  if (name.includes('COURT SPORTS 1-2')) {
    if (course.credits !== 10) {
      updates.push({
        name: course.full_name,
        field: 'credits',
        from: course.credits,
        to: 10
      });
      course.credits = 10;
      updatedCount++;
    }
  }

  // RACQUET SPORTS 1-2 should be 10 credits (one semester = quarters 1-2)
  if (name.includes('RACQUET SPORTS 1-2')) {
    if (course.credits !== 10) {
      updates.push({
        name: course.full_name,
        field: 'credits',
        from: course.credits,
        to: 10
      });
      course.credits = 10;
      updatedCount++;
    }
  }

  // TEAM ATHLETICS/WEIGHTS should be 10 credits
  if (name.includes('TEAM ATHLETICS/WEIGHTS')) {
    if (course.credits !== 10) {
      updates.push({
        name: course.full_name,
        field: 'credits',
        from: course.credits,
        to: 10
      });
      course.credits = 10;
      updatedCount++;
    }
  }

  // AEROBICS/WEIGHTS should be 5 credits per semester
  if (name.includes('AEROBICS/WEIGHTS')) {
    // If it's yearlong with 10 credits, it should be semester with 5 credits
    if (course.term_length === 'yearlong' && course.credits === 10) {
      updates.push({
        name: course.full_name,
        field: 'term_length and credits',
        from: `yearlong, 10 credits`,
        to: `semester, 5 credits`
      });
      course.term_length = 'semester';
      course.credits = 5;
      updatedCount++;
    }
  }

  return course;
});

// Write updated data back
fs.writeFileSync(coursesPath, JSON.stringify(coursesData, null, 2));

console.log(`\n✓ Updated ${updatedCount} PE courses\n`);

if (updates.length > 0) {
  console.log('Updated courses:');
  updates.forEach(u => {
    console.log(`  ${u.name}`);
    console.log(`    ${u.field}: ${u.from} → ${u.to}`);
  });
} else {
  console.log('No courses needed updating.');
}

console.log('\n✓ Course data updated successfully!');
