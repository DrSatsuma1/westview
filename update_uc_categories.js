/**
 * Updates course data with correct UC A-G categories based on official UC course list
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the current course data
const coursesPath = path.join(__dirname, 'src', 'data', 'courses_complete.json');
const coursesData = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));

/**
 * UC A-G Category Mapping based on official UC course list PDF
 *
 * A - History/Social Science
 * B - English
 * C - Mathematics
 * D - Laboratory Science
 * E - Language Other Than English
 * F - Visual & Performing Arts
 * G - College-Preparatory Elective
 */

const UC_CATEGORY_MAPPING = {
  // A - History/Social Science
  'AP GOVERNMENT AND POLITICS UNITED STATES': 'A',
  'AP UNITED STATES GOVERNMENT & POLITICS 1-2': 'A',
  'AP HUMAN GEOGRAPHY': 'A',
  'AP UNITED STATES HISTORY 1-2': 'A',
  'AP WORLD HISTORY 1-2': 'A',
  'CIVICS': 'A',
  'U.S. HISTORY 1-2': 'A',
  'WORLD GEOGRAPHY AND CULTURES': 'A',
  'WORLD HISTORY 1-2': 'A',
  'HONORS WORLD HISTORY 1-2': 'A',

  // B - English
  'ACADEMIC LITERACY 3-4': 'B',
  'ADVANCED COMPOSITION 1-2': 'B',
  'AMERICAN LITERATURE (1)-(2) (H)': 'B',
  'AMERICAN LITERATURE 1-2': 'B',
  'HONORS AMERICAN LITERATURE 1-2': 'B',
  'AP ENGLISH LANGUAGE AND COMPOSITION': 'B',
  'AP ENGLISH LANGUAGE 1-2': 'B',
  'AP ENGLISH LITERATURE AND COMPOSITION': 'B',
  'AP ENGLISH LITERATURE 1-2': 'B',
  'BRITISH LITERATURE 1-2': 'B',
  'ENGLISH LANGUAGE LEARNER 3-4': 'B',
  'ETHNIC LITERATURE': 'B',
  'EXPOSITORY READING AND WRITING 1-2': 'B',
  'HIGH SCHOOL ENGLISH 1-2': 'B',
  'HONORS HIGH SCHOOL ENGLISH 1-2': 'B',
  'HIGH SCHOOL ENGLISH 3-4': 'B',
  'HUMANITIES 1-2 (H)': 'B',
  'HONORS HUMANITIES 1-2': 'B',
  'WORLD LITERATURE 1-2': 'B',

  // C - Mathematics
  'AP CALCULUS AB': 'C',
  'AP CALCULUS BC': 'C',
  'AP COMPUTER SCIENCE A': 'C',
  'AP PRECALCULUS': 'C',
  'AP STATISTICS': 'C',
  'COLLEGE ALGEBRA': 'C',
  'INTEGRATED MATHEMATICS IA-IB': 'C',
  'INTEGRATED MATHEMATICS IIA-IIB': 'C',
  'INTEGRATED MATHEMATICS IIIA-IIIB': 'C',
  'INTRODUCTION TO DATA SCIENCE 1-2': 'C',
  'MOBILE APP DEVELOPMENT 1-2': 'C',
  'PRE-CALCULUS': 'C',
  'HONORS PRE-CALCULUS 1-2': 'C',
  'STATISTICS': 'C',
  'TRIGONOMETRY': 'C',

  // D - Laboratory Science
  'AP BIOLOGY': 'D',
  'AP CHEMISTRY': 'D',
  'AP COMPUTER SCIENCE PRINCIPLES': 'D',
  'AP ENVIRONMENTAL SCIENCE': 'D',
  'AP PHYSICS 1': 'D',
  'AP PHYSICS C: ELECTRICITY AND MAGNETISM': 'D',
  'AP PHYSICS C: MECHANICS': 'D',
  'AP PHYSICS C: ELECTRICITY & MAGNETISM 1-2': 'D',
  'HONORS BIOLOGY 1-2': 'D',
  'BIOLOGY OF THE LIVING EARTH 1-2': 'D',
  'HONORS CHEMISTRY 1-2': 'D',
  'CHEMISTRY IN THE EARTH SYSTEM 1-2': 'D',
  'GEOSCIENCE': 'D',
  'HONORS PLTW MEDICAL INTERVENTIONS': 'D',
  'HONORS PLTW PRINCIPLES OF ENGINEERING': 'D',
  'MARINE SCIENCE 1-2': 'D',
  'PHYSICS OF THE UNIVERSE': 'D',
  'PLTW CIVIL ENGINEERING AND ARCHITECTURE': 'D',
  'PLTW COMPUTER INTEGRATED MANUFACTURING': 'D',
  'PLTW DIGITAL ELECTRONICS': 'D',
  'PLTW HUMAN BODY SYSTEMS': 'D',
  'PLTW INTRODUCTION TO ENGINEERING DESIGN': 'D',
  'PLTW PRINCIPLES OF BIOMEDICAL SCIENCE': 'D',
  'ZOOLOGY 1-2': 'D',

  // E - Language Other Than English
  'AP CHINESE LANGUAGE AND CULTURE': 'E',
  'AP CHINESE LANGUAGE 1-2': 'E',
  'AP FRENCH LANGUAGE AND CULTURE': 'E',
  'AP FRENCH LANGUAGE 7-8': 'E',
  'AP SPANISH LANGUAGE AND CULTURE': 'E',
  'AP SPANISH LANGUAGE 1-2': 'E',
  'CHINESE 1-2': 'E',
  'CHINESE 3-4': 'E',
  'CHINESE 5-6': 'E',
  'CHINESE 7-8': 'E',
  'FILIPINO 1-2': 'E',
  'FILIPINO 3-4': 'E',
  'FILIPINO 5-6': 'E',
  'FILIPINO 7/8 HONORS': 'E',
  'FILIPINO 7-8': 'E',
  'FRENCH 1-2': 'E',
  'FRENCH 3-4': 'E',
  'FRENCH 5-6': 'E',
  'FRENCH 7-8(H)': 'E',
  'HONORS FRENCH 7-8': 'E',
  'SPANISH 1-2': 'E',
  'SPANISH 3-4': 'E',
  'SPANISH 5-6': 'E',
  'SPANISH 7-8': 'E',
  'HONORS SPANISH 7-8': 'E',
  'SPANISH 9-10': 'E',

  // F - Visual & Performing Arts
  '3D COMPUTER ANIMATION 1-2': 'F',
  'ADVANCED DANCE 1-2': 'F',
  'AP 2D ART AND DESIGN': 'F',
  'AP 3D ART AND DESIGN': 'F',
  'AP ART HISTORY': 'F',
  'AP DRAWING': 'F',
  'AP MUSIC THEORY': 'F',
  'BROADCAST JOURNALISM 3-4': 'F',
  'CERAMICS 1-2': 'F',
  'CERAMICS 3-4': 'F',
  'CONCERT BAND 1-2': 'F',
  'CONCERT CHOIR 1-2': 'F',
  'DANCE PROP': 'F',
  'DESIGN AND MIXED MEDIA 1-2': 'F',
  'DESIGN AND MIXED MEDIA 3-4': 'F',
  'DIGITAL MEDIA PRODUCTION (ADVANCED)': 'F',
  'DIGITAL MEDIA PRODUCTION 1-2': 'F',
  'DIGITAL MEDIA PRODUCTION 3-4': 'F',
  'DIGITAL PHOTOGRAPHY 1-2': 'F',
  'DIGITAL PHOTOGRAPHY 3-4': 'F',
  'DIGITAL PHOTOGRAPHY 5-6': 'F',
  'DRAMA 1-2': 'F',
  'DRAMA 3-4': 'F',
  'DRAMA 5-6': 'F',
  'DRAWING AND PAINTING 1-2': 'F',
  'DRAWING & PAINTING 1-2': 'F',
  'DRAWING AND PAINTING 3-4': 'F',
  'DRAWING & PAINTING 3-4': 'F',
  'GRAPHIC DESIGN 1-2': 'F',
  'GRAPHIC DESIGN 3-4': 'F',
  'GRAPHIC DESIGN 5-6': 'F',
  'ORCHESTRA/STRING ENSEMBLE 1-2': 'F',
  'PHOTOGRAPHY 1-2': 'F',
  'PHOTOGRAPHY 3-4': 'F',
  'STUDIO ART': 'F',
  'TECHNICAL PRODUCTION FOR THEATER 1-': 'F',
  'TECHNICAL PRODUCTION FOR THEATER 3-': 'F',
  'THEATRE ARTS STUDY & PERFORMANCE 7-8': 'F',
  'THEATRE STUDY AND PERFORMANCE 7-8': 'F',
  'THEATER ARTS STUDY': 'F',
  'WEB DESIGN 1-2': 'F',
  'WIND ENSEMBLE 1-2': 'F',
  'BAND WITH COMPETITIVE MARCHING 001175 - 001176 &': 'F',
  'BAND WITH NON-COMPETITIVE MARCHING 001175 - 001176 &': 'F',
  'ORCHESTRA 1-2': 'F',
  'DIGITAL MEDIA PRODUCTION ADVANCED': 'F',

  // G - College-Preparatory Elective
  'AP PSYCHOLOGY': 'G',
  'AVID 10': 'G',
  'AVID 11': 'G',
  'AVID 12': 'G',
  'AVID 9': 'G',
  'BROADCAST JOURNALISM 1-2': 'G',
  'BROADCAST JOURNALISM ADVANCED 1-2': 'G',
  'BUSINESS PRINCIPLES AND STRATEGIES 1-2': 'G',
  'BUSINESS PRINCIPLES': 'G',
  'CHILD DEVELOPMENT & PSYCHOLOGY 1-2': 'G',
  'COMPUTER SCIENCE & SOFTWARE ENGINEERING 1-2': 'G',
  'DATA STRUCTURES 1-2': 'G',
  'ECONOMICS': 'G',
  'ECONOMICS OF BUSINESS OWNERSHIP 1-2': 'G',
  'ETHNIC STUDIES': 'G',
  'FILM STUDIES 1-2': 'G',
  'FIRE SCIENCE 1,2,3': 'G',
  'FIRST RESPONDER': 'G',
  'INTERMEDIATE DANCE': 'G',
  'INTERNSHIP/WORK EXPERIENCE': 'G',
  'INTERNSHIP': 'G',
  'INTRODUCTION TO FINANCE': 'G',
  'INTRO TO FINANCE': 'G',
  'JOURNALISM 1-2': 'G',
  'JROTC NAVAL SCIENCE 1': 'G',
  'JROTC NAVAL SCIENCE 2': 'G',
  'JROTC NAVAL SCIENCE 3': 'G',
  'JROTC NAVAL SCIENCE 4': 'G',
  'LAW IN ACTION': 'G',
  'MARKETING ECONOMICS 1-2': 'G',
  'MARKETING ECONOMICS': 'G',
  'PLANNING AND LEADERSHIP/ASB 1-2': 'G',
  'ASB - PLANNING & LEADERSHIP 1-2': 'G',
  'PSYCHOLOGY 1-2': 'G',
  'SOCIOLOGY': 'G',
  'WRITING SEMINAR 1-2': 'G',
  'YEARBOOK 1-2': 'G',
  'YOU AND THE LAW': 'G',
  'JROTC NAVAL SCIENCE 1': 'G',
  'JROTC NAVAL SCIENCE 2': 'G',
  'JROTC NAVAL SCIENCE 3': 'G',
  'JROTC NAVAL SCIENCE 4': 'G',
  'ROTC - NAVAL SCIENCE 1A, B, C, D': 'G',
  'ROTC - NAVAL SCIENCE 2A, B, C, D': 'G',
  'ROTC - NAVAL SCIENCE 3A, B, C, D': 'G',
  'ROTC - NAVAL SCIENCE 4A, B, C, D': 'G'
};

// Function to normalize course names for matching
function normalizeName(name) {
  return name.toUpperCase().trim()
    .replace(/\s+/g, ' ')
    .replace(/[()]/g, '')
    .replace(/\s*-\s*/g, '-');
}

// Update courses with UC categories
let updatedCount = 0;
let notFoundCourses = [];

coursesData.courses = coursesData.courses.map(course => {
  const normalized = normalizeName(course.full_name);

  // Try exact match first
  let category = UC_CATEGORY_MAPPING[course.full_name.toUpperCase()];

  // Try normalized match
  if (!category) {
    category = UC_CATEGORY_MAPPING[normalized];
  }

  // Try partial match for variations
  if (!category) {
    for (const [key, value] of Object.entries(UC_CATEGORY_MAPPING)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        category = value;
        break;
      }
    }
  }

  if (category) {
    course.uc_csu_category = category;
    updatedCount++;
  } else {
    // Check if it's a course that should have a category based on pathway
    if (course.pathway && !course.pathway.includes('Physical Education') &&
        !course.pathway.includes('Off-Roll') && course.pathway !== 'Electives') {
      notFoundCourses.push({
        name: course.full_name,
        pathway: course.pathway
      });
    }
  }

  return course;
});

// Write updated data back
fs.writeFileSync(coursesPath, JSON.stringify(coursesData, null, 2));

console.log(`✓ Updated ${updatedCount} courses with UC A-G categories`);
console.log(`✓ Total courses: ${coursesData.courses.length}`);

if (notFoundCourses.length > 0) {
  console.log(`\n⚠ ${notFoundCourses.length} courses without UC category mapping:`);
  notFoundCourses.forEach(c => {
    console.log(`  - ${c.name} (${c.pathway})`);
  });
}

console.log('\n✓ Course data updated successfully!');
