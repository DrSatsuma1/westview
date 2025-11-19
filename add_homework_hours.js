// Script to add homework_hours_per_week to courses_complete.json
const fs = require('fs');

// Homework time data from survey (636 responses)
const HOMEWORK_HOURS = {
  // History/Social Science
  'WORLD HISTORY': 2,
  'AP EUROPEAN HISTORY': 5,
  'AP EURO': 5,
  'U.S. HISTORY': 3,
  'AP UNITED STATES HISTORY': 5,
  'AP US HISTORY': 5,
  'CIVICS': 2,
  'ECONOMICS': 2,
  'AP AMERICAN GOVERNMENT & POLITICS': 3,
  'AP AMER. GOV\'T': 3,
  'AP HUMAN GEOGRAPHY': 4.3,

  // English
  'ENGLISH 1-2': 3.5,
  'H. ENGLISH 1-2': 3,
  'HONORS ENGLISH 1-2': 3,
  'ENGLISH 3-4': 2,
  'H. HUMANITIES': 4.75,
  'HONORS HUMANITIES': 4.75,
  'AMERICAN LITERATURE': 1.5,
  'AM LIT': 1.5,
  'H. AMERICAN LITERATURE': 3.25,
  'H. AM LIT': 3.25,
  'HONORS AMERICAN LITERATURE': 3.25,
  'AP ENGLISH LITERATURE': 3.3,
  'AP ENGLISH LIT': 3.3,
  'APEL': 3,
  'EXPOSITORY READING': 2.2,
  'EXPOS': 2.2,
  'WORLD LITERATURE': 2.8,
  'WORLD LIT': 2.8,
  'ART HISTORY': 3,

  // Math
  'INTEGRATED MATHEMATICS I': 2.5,
  'INTEGRATED I': 2.5,
  'INTEGRATED MATHEMATICS II': 3,
  'INTEGRATED II': 3,
  'INTEGRATED MATHEMATICS III': 4.25,
  'INTEGRATED III': 4.25,
  'ALGEBRA/FINANCIAL APPLICATIONS': 3,
  'AFA': 3,
  'AP CALCULUS AB': 5,
  'AP CALC AB': 5,
  'AP CALCULUS BC': 3.5,
  'AP CALC BC': 3.5,
  'AP STATISTICS': 3.5,
  'AP STATS': 3.5,

  // Science
  'BIOLOGY': 2.5,
  'AP BIOLOGY': 4.6,
  'AP BIO': 4.6,
  'HUMAN BIOLOGY': 3.5,
  'HUMAN BIO': 3.5,
  'BIOMEDICAL TECHNOLOGY': 0, // No data, use default
  'ZOOLOGY': 2,
  'MARINE SCIENCE': 2,
  'CHEMISTRY': 3,
  'AP CHEMISTRY': 3.5,
  'PHYSICS': 3.5,
  'AP PHYSICS C': 4,
  'AP ENVIRONMENTAL SCIENCE': 5.3,
  'AP ENVIRONMENTAL': 5.3,

  // Foreign Language
  'SPANISH 1-2': 1.5,
  'SPANISH 3-4': 1.5,
  'SPANISH 5-6': 1.75,
  'SPANISH 7-8': 2.25,
  'AP SPANISH LANGUAGE': 2,
  'AP SPANISH 9-10': 2,
  'AP SPANISH LITERATURE': 2.5,
  'FRENCH 1-2': 2,
  'FRENCH 3-4': 5,
  'FRENCH 5-6': 2.5,
  'AP FRENCH LANGUAGE': 3,
  'AP FRENCH': 3,
  'FILIPINO 1-2': 3,
  'FILIPINO 7-8': 1.5,

  // Fine Arts
  'ADVANCED DANCE': 4.2,
  'ADV. DANCE': 4.2,
  'CHOIR': 1.1,
  'CERAMICS': 1.2,
  'BAND': 4.6, // Competitive
  'BAND COMPETITIVE': 4.6,
  'BAND NON-COMPETITIVE': 1.7,
  'DESIGN MIXED MEDIA': 1,
  'DESIGN MXD MED': 1,
  'DIGITAL MEDIA PRODUCTION': 1.3,
  'DIGITAL MED PROD': 1.3,
  'DRAMA': 1,
  'DRAMA & TECHNICAL PRODUCTION': 1,
  'DRAWING & PAINTING': 1.6,
  'GRAPHIC DESIGN': 1.3,
  'ORCHESTRA': 2.9,
  'DIGITAL PHOTOGRAPHY': 3.5,
  'PHOTOGRAPHY': 3.5,
  'AP ART HISTORY': 3.5,
  'AP STUDIO ART': 3.8,

  // CTE/Electives
  'BUSINESS': 2,
  'BUSINESS CLASSES': 2,
  'BROADCAST': 1,
  'BROADCAST 1-4': 1,
  'FILM STUDIES': 1,
  'PRINCIPLES OF ENGINEERING': 1,
  'PRINC. OF ENG.': 1,
  'PSYCHOLOGY 1-2': 1,
  'SOCIOLOGY': 1,
  'LAW': 1,
  'SOCIOLOGY/LAW': 1,
  'SPORTS MEDICINE': 1.3,
  'JOURNALISM': 4.5,
  'JOURNALISM (NEXUS)': 4.5,
  'YEARBOOK': 3,
  'AP COMPUTER SCIENCE PRINCIPLES': 1.1,
  'AP COMP SCI PRIN 1-2': 1.1,
  'AP COMPUTER SCIENCE': 2,
  'AP COMP SCI/DATA': 2,
  'AP COMPUTER SCIENCE A': 1.4,
  'AP COMP SCI/INTRO': 1.4,
  'AP PSYCHOLOGY': 4.2
};

// Normalize course name for matching
function normalizeName(name) {
  return name
    .toUpperCase()
    .replace(/\s+1-2$/, '')
    .replace(/\s+3-4$/, '')
    .replace(/\s+5-6$/, '')
    .replace(/\s+7-8$/, '')
    .replace(/\s+9-10$/, '')
    .replace(/\s+&\s+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Find homework hours for a course
function findHomeworkHours(courseName) {
  const normalized = normalizeName(courseName);

  // Direct match
  for (const [key, hours] of Object.entries(HOMEWORK_HOURS)) {
    if (normalizeName(key) === normalized) {
      return hours;
    }
  }

  // Partial match - check if key is contained in course name
  for (const [key, hours] of Object.entries(HOMEWORK_HOURS)) {
    const normalizedKey = normalizeName(key);
    if (normalized.includes(normalizedKey) || normalizedKey.includes(normalized)) {
      return hours;
    }
  }

  // Check with level suffix
  const withSuffix = courseName.toUpperCase();
  for (const [key, hours] of Object.entries(HOMEWORK_HOURS)) {
    if (key.toUpperCase() === withSuffix) {
      return hours;
    }
  }

  return null; // No data available
}

// Load courses_complete.json
const coursesPath = './src/data/courses_complete.json';
const data = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));

let matchedCount = 0;
let unmatchedCourses = [];

// Add homework_hours_per_week to each course
data.courses.forEach(course => {
  const hours = findHomeworkHours(course.full_name);

  if (hours !== null) {
    course.homework_hours_per_week = hours;
    matchedCount++;
  } else {
    course.homework_hours_per_week = null; // Explicitly null when no data
    unmatchedCourses.push(course.full_name);
  }
});

// Save updated file
fs.writeFileSync(coursesPath, JSON.stringify(data, null, 2));

console.log(`✅ Added homework hours to ${matchedCount} out of ${data.courses.length} courses`);
console.log(`\n📊 Unmatched courses (${unmatchedCourses.length}):`);
unmatchedCourses.slice(0, 20).forEach(name => console.log(`  - ${name}`));
if (unmatchedCourses.length > 20) {
  console.log(`  ... and ${unmatchedCourses.length - 20} more`);
}
