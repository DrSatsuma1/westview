/**
 * Fix specific courses that should be yearlong based on user feedback
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

// List of course patterns that should be yearlong
const yearlongPatterns = [
  // Chinese 3-4 is yearlong
  { pattern: /^CHINESE 3-4/i, shouldBeYearlong: true },
  // All L/English classes are yearlong
  { pattern: /^L\/ENGLISH/i, shouldBeYearlong: true },
  // Journalism 2 (School Newspaper) is yearlong
  { pattern: /^JOURNALISM 2 \(School Newspaper\)/i, shouldBeYearlong: true },
  // Yearbook is yearlong
  { pattern: /^YEARBOOK$/i, shouldBeYearlong: true },
  // L/Biology 1-2 is yearlong
  { pattern: /^L\/BIOLOGY 1-2/i, shouldBeYearlong: true },
  // Band with Competitive Marching is yearlong
  { pattern: /^BAND WITH COMPETITIVE MARCHING/i, shouldBeYearlong: true },
  // Honors Principles of Engineering is 1 semester (NOT yearlong)
  { pattern: /HONORS.*PRINCIPLES OF ENGINEERING/i, shouldBeYearlong: false },
];

coursesData.courses = coursesData.courses.map(course => {
  const name = course.full_name.toUpperCase();

  // Check if this course matches any pattern
  for (const { pattern, shouldBeYearlong } of yearlongPatterns) {
    if (pattern.test(name)) {
      const targetTermLength = shouldBeYearlong ? 'yearlong' : 'semester';
      const targetCredits = shouldBeYearlong ? 10 : 5;

      if (course.term_length !== targetTermLength) {
        updates.push({
          name: course.full_name,
          from: course.term_length,
          to: targetTermLength,
          creditsFrom: course.credits,
          creditsTo: targetCredits
        });

        course.term_length = targetTermLength;
        course.credits = targetCredits;
        updatedCount++;
      }

      break; // Stop after first match
    }
  }

  return course;
});

// Write updated data back
fs.writeFileSync(coursesPath, JSON.stringify(coursesData, null, 2));

console.log(`\n✓ Updated ${updatedCount} courses to yearlong\n`);

if (updates.length > 0) {
  console.log('Updated courses:');
  updates.forEach(u => {
    console.log(`  ${u.name}`);
    console.log(`    ${u.from} (${u.creditsFrom} cr) → ${u.to} (${u.creditsTo} cr)`);
  });
} else {
  console.log('No courses needed updating.');
}

console.log('\n✓ Course data updated successfully!');
