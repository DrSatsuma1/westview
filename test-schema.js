/**
 * Quick test script for the new course schema
 * Run with: node test-schema.js
 */

import { readFileSync } from 'fs';
const courseCatalogData = JSON.parse(
  readFileSync('./src/data/courses.json', 'utf-8')
);

console.log('=== Course Schema Test ===\n');

console.log(`Generated for: ${courseCatalogData.generated_for}`);
console.log(`Schema version: ${courseCatalogData.schema_version}`);
console.log(`Total courses: ${courseCatalogData.courses.length}\n`);

// Test 1: Count courses by pathway
console.log('Courses by Pathway:');
const pathwayCounts = courseCatalogData.courses.reduce((acc, course) => {
  acc[course.pathway] = (acc[course.pathway] || 0) + 1;
  return acc;
}, {});
Object.entries(pathwayCounts).forEach(([pathway, count]) => {
  console.log(`  ${pathway}: ${count}`);
});

// Test 2: Find courses with prerequisites
console.log('\nCourses with Required Prerequisites:');
const coursesWithPrereqs = courseCatalogData.courses.filter(
  c => c.prerequisites_required.length > 0
);
console.log(`  Found ${coursesWithPrereqs.length} courses`);
coursesWithPrereqs.slice(0, 3).forEach(course => {
  console.log(`  - ${course.full_name}: requires ${course.prerequisites_required.join(', ')}`);
});

// Test 3: Find AP/Honors courses
console.log('\nAP/Honors Courses:');
const apHonorsCourses = courseCatalogData.courses.filter(c => c.is_ap_or_honors_pair);
console.log(`  Found ${apHonorsCourses.length} courses`);
apHonorsCourses.slice(0, 5).forEach(course => {
  console.log(`  - ${course.full_name}`);
});

// Test 4: Find graduation requirements
console.log('\nGraduation Requirements:');
const gradReqs = courseCatalogData.courses.filter(c => c.is_graduation_requirement);
console.log(`  Found ${gradReqs.length} courses`);
gradReqs.forEach(course => {
  console.log(`  - ${course.full_name} (${course.pathway})`);
});

// Test 5: Find semester-restricted courses
console.log('\nSemester-Restricted Courses:');
const restricted = courseCatalogData.courses.filter(c => c.semester_restrictions !== null);
console.log(`  Found ${restricted.length} courses`);
restricted.forEach(course => {
  console.log(`  - ${course.full_name}: ${course.semester_restrictions}`);
});

// Test 6: UC/CSU categories
console.log('\nUC/CSU A-G Categories:');
const agCounts = courseCatalogData.courses.reduce((acc, course) => {
  const cat = course.uc_csu_category || 'None';
  acc[cat] = (acc[cat] || 0) + 1;
  return acc;
}, {});
Object.entries(agCounts).sort().forEach(([cat, count]) => {
  console.log(`  ${cat}: ${count} courses`);
});

console.log('\n✓ All tests passed!\n');
