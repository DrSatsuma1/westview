/**
 * Script to update old course IDs to new format in JS files
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load old catalog to build mapping
const oldData = JSON.parse(readFileSync(join(__dirname, '../src/data/courses_complete.old.json'), 'utf-8'));
const courses = oldData.courses;

// Build mapping: old_id -> new_id
const idMapping = {};
courses.forEach(course => {
  const oldId = course.course_id;
  const numbers = course.course_numbers;
  if (numbers && numbers.length > 0) {
    idMapping[oldId] = numbers.join('-');
  }
});

// Files to update
const filesToUpdate = [
  '../src/domain/courseEligibility.js',
  '../src/utils/SuggestionEngine.js',
];

filesToUpdate.forEach(relPath => {
  const filePath = join(__dirname, relPath);
  let content = readFileSync(filePath, 'utf-8');
  let changeCount = 0;

  // Replace each old ID with new ID
  // Sort by length descending to avoid partial matches
  const sortedOldIds = Object.keys(idMapping).sort((a, b) => b.length - a.length);

  sortedOldIds.forEach(oldId => {
    const newId = idMapping[oldId];
    // Match the ID in quotes (both single and double)
    const patterns = [
      new RegExp(`'${oldId}'`, 'g'),
      new RegExp(`"${oldId}"`, 'g'),
    ];

    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        changeCount += matches.length;
        content = content.replace(pattern, `'${newId}'`);
      }
    });
  });

  if (changeCount > 0) {
    writeFileSync(filePath, content);
    console.log(`Updated ${relPath}: ${changeCount} ID replacements`);
  } else {
    console.log(`No changes needed in ${relPath}`);
  }
});

console.log('\nDone!');
