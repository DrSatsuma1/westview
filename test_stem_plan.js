/**
 * Test the STEM Focus plan against validation logic
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const coursesPath = path.join(__dirname, 'src', 'data', 'courses_complete.json');
const coursesData = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));

// STEM Plan from Westview PDF
const stemPlan = {
  '9': {
    'Fall': [
      'ENGLISH 1-2',
      'ENS 1-2',
      'INTEGRATED MATHEMATICS IA-IB',
      'AP COMPUTER SCIENCE PRINCIPLES'
    ],
    'Spring': [
      'CHEMISTRY IN THE EARTH SYSTEM 1-2',
      'ENS 3-4',
      'INTEGRATED MATHEMATICS IIA-IIB',
      'INTRODUCTION TO ENGINEERING DESIGN'
    ]
  },
  '10': {
    'Fall': [
      'HIGH SCHOOL ENGLISH 3-4',
      'WORLD HISTORY 1-2',
      'AP BIOLOGY',
      'SPANISH 1-2'
    ],
    'Spring': [
      'INTEGRATED MATHEMATICS IIIA-IIIB',
      'HONORS PLTW PRINCIPLES OF ENGINEERING',
      'AP BIOLOGY',
      'SPANISH 3-4'
    ]
  },
  '11': {
    'Fall': [
      'AMERICAN LITERATURE 1-2',
      'HONORS PRE-CALCULUS 1-2',
      'AP CHEMISTRY',
      'AP COMPUTER SCIENCE A'
    ],
    'Spring': [
      'AP UNITED STATES HISTORY 1-2',
      'HONORS PRE-CALCULUS 1-2',
      'AP CHEMISTRY',
      'AP COMPUTER SCIENCE A'
    ]
  },
  '12': {
    'Fall': [
      'EXPOSITORY READING AND WRITING 1-2',
      'PLTW DIGITAL ELECTRONICS',
      'AP PHYSICS 1',
      'STUDIO ART'
    ],
    'Spring': [
      'CIVICS',
      'AP CALCULUS BC',
      'AP PHYSICS 1',
      'PHYSICAL EDUCATION'
    ]
  }
};

console.log('\n=== TESTING STEM PLAN VALIDATION ===\n');

let totalIssues = 0;
let totalWarnings = 0;

Object.keys(stemPlan).forEach(year => {
  console.log(`\nGRADE ${year}:`);

  ['Fall', 'Spring'].forEach(semester => {
    console.log(`\n  ${semester} Semester:`);
    const coursesInSemester = stemPlan[year][semester];

    coursesInSemester.forEach(courseName => {
      const found = coursesData.courses.find(c =>
        c.full_name.toUpperCase().includes(courseName.toUpperCase()) ||
        courseName.toUpperCase().includes(c.full_name.toUpperCase())
      );

      if (found) {
        const issues = [];
        const warnings = [];

        // Check term_length
        if (found.term_length === 'yearlong') {
          warnings.push('⚠️  YEARLONG - must be in both Fall and Spring');
        }

        // Check grade level
        if (!found.grades_allowed.includes(parseInt(year))) {
          issues.push(`❌ NOT ALLOWED in grade ${year} (allowed: ${found.grades_allowed.join(', ')})`);
          totalIssues++;
        }

        console.log(`    ✓ ${found.full_name}`);
        console.log(`      - Term: ${found.term_length}, Credits: ${found.credits}`);
        console.log(`      - Grades allowed: ${found.grades_allowed.join(', ')}`);
        if (found.uc_csu_category) {
          console.log(`      - UC/CSU: ${found.uc_csu_category}`);
        }
        if (warnings.length > 0) {
          warnings.forEach(w => console.log(`      ${w}`));
          totalWarnings++;
        }
        if (issues.length > 0) {
          issues.forEach(i => console.log(`      ${i}`));
        }
      } else {
        console.log(`    ❌ NOT FOUND: ${courseName}`);
        totalIssues++;
      }
    });
  });
});

console.log('\n\n=== SUMMARY ===');
console.log(`Total Issues: ${totalIssues}`);
console.log(`Total Warnings: ${totalWarnings}`);

if (totalIssues === 0 && totalWarnings === 0) {
  console.log('✅ STEM plan is valid!');
} else if (totalIssues === 0) {
  console.log('⚠️  STEM plan has warnings but no blocking issues');
} else {
  console.log('❌ STEM plan has blocking issues that need to be resolved');
}
