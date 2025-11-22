/**
 * Capture baseline outputs from current App.jsx logic
 * Run this BEFORE extracting to domain files
 */

const fs = require('fs');
const path = require('path');

// Load catalog
const catalogData = require('../../src/data/courses_complete.json');

// Build COURSE_CATALOG object (same as App.jsx)
const COURSE_CATALOG = {};
catalogData.courses.forEach(course => {
  COURSE_CATALOG[course.course_id] = course;
});

// Requirements (copied from App.jsx lines 35-55)
const WESTVIEW_REQUIREMENTS = {
  'English': { needed: 40, pathways: ['English'] },
  'Math': { needed: 30, pathways: ['Math'] },
  'Biological Science': { needed: 10, pathways: ['Science - Biological'] },
  'Physical Science': { needed: 10, pathways: ['Science - Physical'] },
  'History/Social Science': { needed: 30, pathways: ['History/Social Science'] },
  'Fine Arts/Foreign Language/CTE': { needed: 10, pathways: ['Fine Arts', 'Foreign Language', 'CTE'] },
  'Health Science': { needed: 5, pathways: ['Physical Education'], specialCourses: ['ENS 1-2'] },
  'Physical Education': { needed: 20, pathways: ['Physical Education'] },
  'Electives': { needed: 85, pathways: ['Electives', 'Clubs/Athletics'] }
};

// Westview progress calculation (extracted from App.jsx lines 438-620)
function calculateWestviewProgress(courses) {
  const progress = {};

  Object.entries(WESTVIEW_REQUIREMENTS).forEach(([name, req]) => {
    const relevantCourses = courses.filter(c => {
      const info = COURSE_CATALOG[c.courseId];
      return info && req.pathways.includes(info.pathway);
    });

    // Deduplicate courses by courseId + year
    const uniqueCourses = [];
    const seen = new Set();
    relevantCourses.forEach(c => {
      const key = `${c.courseId}-${c.year}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueCourses.push(c);
      }
    });

    let credits = 0;

    if (name === 'Health Science') {
      credits = uniqueCourses.reduce((sum, c) => {
        const info = COURSE_CATALOG[c.courseId];
        if (req.specialCourses && req.specialCourses.includes(info.full_name)) {
          return sum + 5;
        }
        return sum;
      }, 0);
    } else if (name === 'Physical Education') {
      credits = uniqueCourses.reduce((sum, c) => {
        const info = COURSE_CATALOG[c.courseId];
        if (info.full_name === 'ENS 1-2') {
          return sum + 5;
        } else if (info.full_name === 'MARCHING PE FLAGS/TALL FLAGS (DANCE PROP)') {
          return sum + 5;
        }
        return sum + info.credits;
      }, 0);

      // Add Naval Science PE credits
      const navalScienceCourses = courses.filter(c => {
        const info = COURSE_CATALOG[c.courseId];
        return info && info.full_name && info.full_name.toUpperCase().includes('NAVAL SCIENCE');
      });

      const uniqueNaval = [];
      const seenNaval = new Set();
      navalScienceCourses.forEach(c => {
        const key = `${c.courseId}-${c.year}`;
        if (!seenNaval.has(key)) {
          seenNaval.add(key);
          uniqueNaval.push(c);
        }
      });

      uniqueNaval.forEach(c => {
        const info = COURSE_CATALOG[c.courseId];
        if (info.term_length === 'yearlong') {
          credits += 10;
        }
      });
    } else if (name === 'Fine Arts/Foreign Language/CTE') {
      credits = uniqueCourses.reduce((sum, c) => sum + COURSE_CATALOG[c.courseId].credits, 0);

      const peCourses = courses.filter(c => {
        const info = COURSE_CATALOG[c.courseId];
        return info && info.pathway === 'Physical Education';
      });

      const hasMarchingPE = peCourses.some(c => {
        const info = COURSE_CATALOG[c.courseId];
        return info && info.full_name === 'MARCHING PE FLAGS/TALL FLAGS (DANCE PROP)';
      });

      if (hasMarchingPE) {
        credits += 5;
      }
    } else if (name === 'Electives') {
      credits = uniqueCourses.reduce((sum, c) => sum + COURSE_CATALOG[c.courseId].credits, 0);

      // Naval Science elective credits
      const navalScienceCourses = courses.filter(c => {
        const info = COURSE_CATALOG[c.courseId];
        return info && info.full_name && info.full_name.toUpperCase().includes('NAVAL SCIENCE');
      });

      const uniqueNavalElec = [];
      const seenNavalElec = new Set();
      navalScienceCourses.forEach(c => {
        const key = `${c.courseId}-${c.year}`;
        if (!seenNavalElec.has(key)) {
          seenNavalElec.add(key);
          uniqueNavalElec.push(c);
        }
      });

      uniqueNavalElec.forEach(c => {
        const info = COURSE_CATALOG[c.courseId];
        if (info.term_length === 'yearlong') {
          credits += 10;
        }
      });
    } else {
      credits = uniqueCourses.reduce((sum, c) => sum + COURSE_CATALOG[c.courseId].credits, 0);
    }

    progress[name] = {
      earned: credits,
      needed: req.needed,
      met: credits >= req.needed
    };
  });

  return progress;
}

// Test fixtures
const FIXTURES = {
  empty_schedule: { courses: [] },
  freshman_basic: {
    courses: [
      { id: 1, courseId: 'HIGH_SCHOOL_0003', year: 9, quarter: 'Q1' },
      { id: 2, courseId: 'HIGH_SCHOOL_0003', year: 9, quarter: 'Q2' },
      { id: 3, courseId: 'HIGH_SCHOOL_0003', year: 9, quarter: 'Q3' },
      { id: 4, courseId: 'HIGH_SCHOOL_0003', year: 9, quarter: 'Q4' },
      { id: 9, courseId: 'BIOLOGY_OF_0012', year: 9, quarter: 'Q1' },
      { id: 10, courseId: 'BIOLOGY_OF_0012', year: 9, quarter: 'Q2' },
      { id: 11, courseId: 'BIOLOGY_OF_0012', year: 9, quarter: 'Q3' },
      { id: 12, courseId: 'BIOLOGY_OF_0012', year: 9, quarter: 'Q4' },
      { id: 13, courseId: 'ENS_12_0014', year: 9, quarter: 'Q1' },
      { id: 14, courseId: 'ENS_12_0014', year: 9, quarter: 'Q2' },
      { id: 15, courseId: 'ENS_12_0014', year: 9, quarter: 'Q3' },
      { id: 16, courseId: 'ENS_12_0014', year: 9, quarter: 'Q4' },
    ]
  },
  naval_science: {
    courses: [
      { id: 1, courseId: 'NAVAL_SCIENCE_0016', year: 9, quarter: 'Q1' },
      { id: 2, courseId: 'NAVAL_SCIENCE_0016', year: 9, quarter: 'Q2' },
      { id: 3, courseId: 'NAVAL_SCIENCE_0016', year: 9, quarter: 'Q3' },
      { id: 4, courseId: 'NAVAL_SCIENCE_0016', year: 9, quarter: 'Q4' },
    ]
  },
  ens_only: {
    courses: [
      { id: 1, courseId: 'ENS_12_0014', year: 9, quarter: 'Q1' },
      { id: 2, courseId: 'ENS_12_0014', year: 9, quarter: 'Q2' },
      { id: 3, courseId: 'ENS_12_0014', year: 9, quarter: 'Q3' },
      { id: 4, courseId: 'ENS_12_0014', year: 9, quarter: 'Q4' },
    ]
  }
};

// Run and capture baseline
console.log('=== BASELINE CAPTURE ===\n');

const results = {};

for (const [name, fixture] of Object.entries(FIXTURES)) {
  console.log(`Testing: ${name}`);
  const progress = calculateWestviewProgress(fixture.courses);
  results[name] = { westviewProgress: progress };

  console.log('  Westview Progress:');
  for (const [cat, data] of Object.entries(progress)) {
    if (data.earned > 0) {
      console.log(`    ${cat}: ${data.earned}/${data.needed} (${data.met ? 'MET' : 'NOT MET'})`);
    }
  }
  console.log('');
}

// Save baseline
const outputPath = path.join(__dirname, 'baseline-snapshot.json');
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
console.log(`\nBaseline saved to: ${outputPath}`);
