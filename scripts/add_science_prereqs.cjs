const fs = require('fs');

// Load courses
const data = JSON.parse(fs.readFileSync('./src/data/courses_complete.json'));

// Science prerequisite mappings
// Format: course_id -> { required: [...], recommended: [...] }
const sciencePrereqs = {
  // ====== BIOLOGY ======
  'BIOLOGY_OF_0012': {
    required: [],
    recommended: []
  }, // Biology of Living Earth - entry level

  'HON_BIOLOGY_0012': {
    required: [],
    recommended: []
  }, // Honors Biology - entry level (can take instead of regular)

  'AP_BIOLOGY_0012': {
    required: [],
    recommended: ['HON_BIOLOGY_0012']
  }, // AP Biology 3-4 - recommends Honors Bio

  'MARINE_SCIENCE_0012': {
    required: [],
    recommended: ['BIOLOGY_OF_0012']
  }, // Marine Science - recommends Biology

  'ZOOLOGY_12_0012': {
    required: [],
    recommended: ['BIOLOGY_OF_0012']
  }, // Zoology - recommends Biology

  // ====== CHEMISTRY ======
  'CHEMISTRY_IN_0012': {
    required: [],
    recommended: ['BIOLOGY_OF_0012']
  }, // Chemistry - recommends Biology (typical sequence)

  'HON_CHEMISTRY_0012': {
    required: [],
    recommended: ['BIOLOGY_OF_0012']
  }, // Honors Chemistry - recommends Biology

  'AP_CHEMISTRY_0012': {
    required: [],
    recommended: ['HON_CHEMISTRY_0012']
  }, // AP Chemistry 3-4 - recommends Honors Chem

  // ====== PHYSICS ======
  'PHYSICS_OF_0012': {
    required: [],
    recommended: ['INTEGRATED_MATHEMATICS', 'CHEMISTRY_IN_0012']
  }, // Physics - recommends Math II + Chemistry

  'AP_PHYSICS_0012': {
    required: [],
    recommended: ['INTEGRATED_MATHEMATICS_0001']
  }, // AP Physics 1 - recommends Math III

  'AP_PHYSICS_0001': {
    required: [],
    recommended: ['AP_PHYSICS_0012', 'AP_CALCULUS_0010']
  }, // AP Physics C: Mechanics - recommends AP Physics 1 + Calc AB

  'AP_PHYSICS': {
    required: [],
    recommended: ['AP_PHYSICS_0001']
  }, // AP Physics C: E&M - recommends AP Physics C: Mechanics

  // ====== ENVIRONMENTAL/OTHER ======
  'AP_ENVIRONMENTAL_0012': {
    required: [],
    recommended: ['BIOLOGY_OF_0012']
  }, // AP Environmental Science - recommends Biology

  // ====== SPECIAL ED - no prereqs ======
  'LBIOLOGY_12_0020': { required: [], recommended: [] },
  'LMARINE_SCIENCE_0020': { required: [], recommended: [] },
};

// Update courses
let updated = 0;
data.courses = data.courses.map(course => {
  if (sciencePrereqs[course.course_id]) {
    const prereqs = sciencePrereqs[course.course_id];
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
