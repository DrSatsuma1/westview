const fs = require('fs');

// Load courses
const data = JSON.parse(fs.readFileSync('./src/data/courses_complete.json'));

// Foreign Language prerequisite mappings
// Each level requires the previous level in the same language
const flPrereqs = {
  // SPANISH
  'SPANISH_12_0004': { required: [], recommended: [] }, // 1-2 entry level
  'SPANISH_34_0004': { required: [], recommended: ['SPANISH_12_0004'] }, // 3-4 requires 1-2
  'SPANISH_56_0004': { required: [], recommended: ['SPANISH_34_0004'] }, // 5-6 requires 3-4
  'SPANISH_78_0004': { required: [], recommended: ['SPANISH_56_0004'] }, // 7-8 requires 5-6
  'SPANISH_910_0004': { required: [], recommended: ['SPANISH_78_0004'] }, // 9-10 requires 7-8
  'HON_SPANISH_0004': { required: [], recommended: ['SPANISH_56_0004'] }, // Honors 7-8 requires 5-6
  'AP_SPANISH_0004': { required: [], recommended: ['HON_SPANISH_0004'] }, // AP requires Honors 7-8

  // CHINESE
  'CHINESE_12_0004': { required: [], recommended: [] }, // 1-2 entry level
  'CHINESE_34_0004': { required: [], recommended: ['CHINESE_12_0004'] }, // 3-4 requires 1-2
  'CHINESE_56_0004': { required: [], recommended: ['CHINESE_34_0004'] }, // 5-6 requires 3-4
  'CHINESE_78_0004': { required: [], recommended: ['CHINESE_56_0004'] }, // 7-8 requires 5-6
  'AP_CHINESE_0004': { required: [], recommended: ['CHINESE_78_0004'] }, // AP requires 7-8

  // FRENCH
  'FRENCH_12_0004': { required: [], recommended: [] }, // 1-2 entry level
  'FRENCH_34_0004': { required: [], recommended: ['FRENCH_12_0004'] }, // 3-4 requires 1-2
  'FRENCH_56_0004': { required: [], recommended: ['FRENCH_34_0004'] }, // 5-6 requires 3-4
  'HON_FRENCH_0004': { required: [], recommended: ['FRENCH_56_0004'] }, // Honors 7-8 requires 5-6
  'AP_FRENCH_0004': { required: [], recommended: ['HON_FRENCH_0004'] }, // AP requires Honors 7-8

  // FILIPINO
  'FILIPINO_12_0004': { required: [], recommended: [] }, // 1-2 entry level
  'FILIPINO_34_0004': { required: [], recommended: ['FILIPINO_12_0004'] }, // 3-4 requires 1-2
  'FILIPINO_56_0004': { required: [], recommended: ['FILIPINO_34_0004'] }, // 5-6 requires 3-4
  'FILIPINO_78_0004': { required: [], recommended: ['FILIPINO_56_0004'] }, // 7-8 requires 5-6
  'HON_FILIPINO_0004': { required: [], recommended: ['FILIPINO_56_0004'] }, // Honors 7-8 requires 5-6
};

// Update courses
let updated = 0;
data.courses = data.courses.map(course => {
  if (flPrereqs[course.course_id]) {
    const prereqs = flPrereqs[course.course_id];
    course.prerequisites_required_ids = prereqs.required;
    course.prerequisites_recommended_ids = prereqs.recommended;
    updated++;
    console.log(`Updated: ${course.full_name}`);
    if (prereqs.recommended.length > 0) {
      const names = prereqs.recommended.map(id => {
        const c = data.courses.find(c => c.course_id === id);
        return c ? c.full_name : id;
      });
      console.log(`  Recommends: ${names.join(', ')}`);
    }
  }
  return course;
});

console.log(`\nTotal updated: ${updated} courses`);

// Save
fs.writeFileSync('./src/data/courses_complete.json', JSON.stringify(data, null, 2));
console.log('Saved to courses_complete.json');
