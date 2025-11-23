/**
 * Migration script: Replace made-up course_id with real course_numbers
 *
 * Before: course_id: "AP_ENGLISH", course_numbers: ["000370", "000371"]
 * After:  course_id: "000370-000371"
 *
 * Also updates:
 * - linked_courses to use new format
 * - pair_course_id to use new format
 * - prerequisites_recommended_ids to use new format
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const catalogPath = join(__dirname, '../src/data/courses_complete.json');

// Load catalog
const data = JSON.parse(readFileSync(catalogPath, 'utf-8'));
const courses = data.courses;

// Build mapping: old_id -> new_id
const idMapping = {};
courses.forEach(course => {
  const oldId = course.course_id;
  const numbers = course.course_numbers;
  if (numbers && numbers.length > 0) {
    const newId = numbers.join('-');
    idMapping[oldId] = newId;
  }
});

console.log('=== ID Mapping (sample) ===');
Object.entries(idMapping).slice(0, 10).forEach(([old, newId]) => {
  console.log(`  ${old} -> ${newId}`);
});
console.log(`  ... (${Object.keys(idMapping).length} total mappings)`);

// Transform courses
const transformedCourses = courses.map(course => {
  const newCourse = { ...course };

  // Update course_id
  if (course.course_numbers && course.course_numbers.length > 0) {
    newCourse.course_id = course.course_numbers.join('-');
  }

  // Remove course_numbers (now redundant)
  delete newCourse.course_numbers;

  // Update linked_courses - these are already in number format but might be single values
  // Need to map them to the new hyphenated format
  if (newCourse.linked_courses && newCourse.linked_courses.length > 0) {
    // linked_courses contains individual semester numbers, need to find matching course
    newCourse.linked_courses = newCourse.linked_courses.map(linkedNum => {
      // Find course that has this number in its course_numbers
      const linkedCourse = courses.find(c =>
        c.course_numbers && c.course_numbers.includes(linkedNum)
      );
      if (linkedCourse) {
        return linkedCourse.course_numbers.join('-');
      }
      return linkedNum; // Keep as-is if not found
    });
    // Dedupe (since both semester numbers map to same course)
    newCourse.linked_courses = [...new Set(newCourse.linked_courses)];
  }

  // Update pair_course_id
  if (newCourse.pair_course_id && idMapping[newCourse.pair_course_id]) {
    newCourse.pair_course_id = idMapping[newCourse.pair_course_id];
  }

  // Update prerequisites_recommended_ids
  if (newCourse.prerequisites_recommended_ids && newCourse.prerequisites_recommended_ids.length > 0) {
    newCourse.prerequisites_recommended_ids = newCourse.prerequisites_recommended_ids.map(id =>
      idMapping[id] || id
    );
  }

  return newCourse;
});

// Create new data structure
const newData = {
  ...data,
  courses: transformedCourses
};

// Write output
const outputPath = join(__dirname, '../src/data/courses_complete_migrated.json');
writeFileSync(outputPath, JSON.stringify(newData, null, 2));

console.log('\n=== Migration Complete ===');
console.log(`Output: ${outputPath}`);
console.log(`Courses migrated: ${transformedCourses.length}`);

// Show sample transformed course
console.log('\n=== Sample Transformed Course ===');
const sample = transformedCourses.find(c => c.full_name.includes('AP ENGLISH LITERATURE'));
if (sample) {
  console.log(JSON.stringify(sample, null, 2));
}
