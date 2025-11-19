/**
 * Extract and populate pair_course_id for linked AP/Honors courses
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const coursesPath = path.join(__dirname, 'src', 'data', 'courses_complete.json');
const coursesData = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));

// Function to extract linked course name from notes/prerequisites
function extractLinkedCourseName(text) {
  if (!text) return null;

  const match = text.match(/linked w\/([^\.]+?)(?:\s+(?:Alternate|For|This|The|Advanced|U\.S\.|Honors)|\s*\d|$)/i);
  if (match) {
    let linkedName = match[1].trim();
    // Clean up common suffixes
    linkedName = linkedName.replace(/\s+1-2$/, '');
    linkedName = linkedName.replace(/\s+\d-\d$/, '');
    return linkedName;
  }
  return null;
}

// Function to find course ID by name
function findCourseByName(name) {
  if (!name) return null;

  const upperName = name.toUpperCase();

  // Try exact match first
  let found = coursesData.courses.find(c =>
    c.full_name.toUpperCase() === upperName ||
    c.full_name.toUpperCase().includes(upperName)
  );

  if (found) return found.course_id;

  // Try partial match
  found = coursesData.courses.find(c =>
    upperName.includes(c.full_name.toUpperCase())
  );

  return found ? found.course_id : null;
}

let updatedCount = 0;
const linkages = [];

coursesData.courses = coursesData.courses.map(course => {
  // Check notes field for "linked w/"
  if (course.notes && course.notes.includes('linked w/')) {
    const linkedName = extractLinkedCourseName(course.notes);

    if (linkedName) {
      const linkedCourseId = findCourseByName(linkedName);

      if (linkedCourseId) {
        course.pair_course_id = linkedCourseId;
        course.is_ap_or_honors_pair = true;

        linkages.push({
          course: course.full_name,
          linkedTo: linkedName,
          linkedId: linkedCourseId
        });

        updatedCount++;
      } else {
        console.log(`⚠️  Could not find course ID for: "${linkedName}" (from ${course.full_name})`);
      }
    }
  }

  return course;
});

// Write updated data
fs.writeFileSync(coursesPath, JSON.stringify(coursesData, null, 2));

console.log(`\n✓ Updated ${updatedCount} courses with linked course IDs\n`);

if (linkages.length > 0) {
  console.log('Linkages created:');
  linkages.forEach(link => {
    console.log(`  ${link.course}`);
    console.log(`    → linked to: ${link.linkedTo} (${link.linkedId})`);
  });
}

console.log('\n✓ Course data updated successfully!');
