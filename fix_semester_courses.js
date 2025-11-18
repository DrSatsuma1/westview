/**
 * Fix courses ending in "1-2" that are NOT AP or Honors to be semester courses
 * Any course with "1-2" that is not AP or Honors should be one semester, not yearlong
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the current course data
const coursesPath = path.join(__dirname, 'src', 'data', 'courses_complete.json');
const coursesData = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));

let updatedCount = 0;
const updatedCourses = [];

coursesData.courses = coursesData.courses.map(course => {
  const name = course.full_name.toUpperCase();

  // Check if course name ends with "1-2" (with optional spaces)
  const has12 = /\s*1\s*-\s*2\s*$/.test(name);

  if (has12) {
    // Check if it's AP or Honors
    const isAPOrHonors = name.includes('AP ') ||
                         name.includes('HONORS') ||
                         name.includes('(H)') ||
                         course.is_ap_or_honors_pair === true;

    // If it ends in 1-2 but is NOT AP or Honors, and is currently yearlong, change to semester
    if (!isAPOrHonors && course.term_length === 'yearlong') {
      updatedCourses.push({
        name: course.full_name,
        from: 'yearlong',
        to: 'semester'
      });

      course.term_length = 'semester';
      course.credits = 5; // Semester courses are 5 credits
      updatedCount++;
    }
  }

  return course;
});

// Write updated data back
fs.writeFileSync(coursesPath, JSON.stringify(coursesData, null, 2));

console.log(`✓ Updated ${updatedCount} courses from yearlong to semester\n`);

if (updatedCourses.length > 0) {
  console.log('Updated courses:');
  updatedCourses.forEach(c => {
    console.log(`  - ${c.name}`);
  });
} else {
  console.log('No courses needed updating.');
}

console.log('\n✓ Course data updated successfully!');
