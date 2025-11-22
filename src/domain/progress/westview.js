/**
 * Westview Graduation Requirements Progress Calculator
 *
 * Single source of truth for Westview 230-credit requirement tracking.
 * Handles special dual-credit cases: ENS, Naval Science, Marching PE Flags.
 */

/**
 * Westview graduation requirements configuration
 */
export const WESTVIEW_REQUIREMENTS = {
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

/**
 * Deduplicate courses by courseId + year
 * @param {Array} courses - Array of course objects
 * @returns {Array} - Deduplicated courses
 */
function deduplicateCourses(courses) {
  const uniqueCourses = [];
  const seen = new Set();
  courses.forEach(c => {
    const key = `${c.courseId}-${c.year}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueCourses.push(c);
    }
  });
  return uniqueCourses;
}

/**
 * Check if a course is Naval Science
 * @param {Object} courseInfo - Course info from catalog
 * @returns {boolean}
 */
function isNavalScience(courseInfo) {
  return courseInfo && courseInfo.full_name &&
         courseInfo.full_name.toUpperCase().includes('NAVAL SCIENCE');
}

/**
 * Check if a course is Marching PE Flags
 * @param {Object} courseInfo - Course info from catalog
 * @returns {boolean}
 */
function isMarchingPEFlags(courseInfo) {
  return courseInfo && courseInfo.full_name === 'MARCHING PE FLAGS/TALL FLAGS (DANCE PROP)';
}

/**
 * Calculate Health Science credits
 * Only ENS 1-2 counts (5 credits)
 */
function calculateHealthScienceCredits(uniqueCourses, courseCatalog, req) {
  return uniqueCourses.reduce((sum, c) => {
    const info = courseCatalog[c.courseId];
    if (req.specialCourses && req.specialCourses.includes(info.full_name)) {
      return sum + 5; // ENS 1-2 contributes 5 credits to Health Science
    }
    return sum;
  }, 0);
}

/**
 * Calculate Physical Education credits
 * Handles: ENS (5 credits), Marching PE Flags (5 credits), Naval Science (10 credits)
 */
function calculatePECredits(uniqueCourses, allCourses, courseCatalog) {
  let credits = uniqueCourses.reduce((sum, c) => {
    const info = courseCatalog[c.courseId];
    if (info.full_name === 'ENS 1-2') {
      return sum + 5; // ENS 1-2 contributes only 5 credits to PE (other 5 go to Health)
    } else if (isMarchingPEFlags(info)) {
      return sum + 5; // Marching PE Flags contributes only 5 credits to PE (other 5 go to Fine Arts)
    }
    return sum + info.credits;
  }, 0);

  // Add 10 PE credits from Naval Science courses
  const navalScienceCourses = allCourses.filter(c => isNavalScience(courseCatalog[c.courseId]));
  const uniqueNaval = deduplicateCourses(navalScienceCourses);

  uniqueNaval.forEach(c => {
    const info = courseCatalog[c.courseId];
    if (info.term_length === 'yearlong') {
      credits += 10;
    }
  });

  return credits;
}

/**
 * Calculate Fine Arts/Foreign Language/CTE credits
 * Also includes 5 credits from Marching PE Flags if present
 */
function calculateFineArtsCredits(uniqueCourses, allCourses, courseCatalog) {
  let credits = uniqueCourses.reduce((sum, c) => sum + courseCatalog[c.courseId].credits, 0);

  // Check for Marching PE Flags in PE pathway courses
  const peCourses = allCourses.filter(c => {
    const info = courseCatalog[c.courseId];
    return info && info.pathway === 'Physical Education';
  });

  const hasMarchingPE = peCourses.some(c => isMarchingPEFlags(courseCatalog[c.courseId]));
  if (hasMarchingPE) {
    credits += 5; // Add the Fine Arts portion of Marching PE Flags
  }

  return credits;
}

/**
 * Calculate Electives credits
 * Includes 10 credits per Naval Science yearlong course
 */
function calculateElectivesCredits(uniqueCourses, allCourses, courseCatalog) {
  let credits = uniqueCourses.reduce((sum, c) => sum + courseCatalog[c.courseId].credits, 0);

  // Add Naval Science elective credits
  const navalScienceCourses = allCourses.filter(c => isNavalScience(courseCatalog[c.courseId]));
  const uniqueNaval = deduplicateCourses(navalScienceCourses);

  uniqueNaval.forEach(c => {
    const info = courseCatalog[c.courseId];
    if (info.term_length === 'yearlong') {
      credits += 10;
    }
  });

  return credits;
}

/**
 * Calculate Westview graduation progress for all categories
 *
 * @param {Array} courses - Array of scheduled course objects
 * @param {Object} courseCatalog - Course catalog lookup object
 * @param {Object} [requirements=WESTVIEW_REQUIREMENTS] - Requirements config
 * @returns {Object} - Progress by category { [category]: { earned, needed, met } }
 */
export function calculateWestviewProgress(courses, courseCatalog, requirements = WESTVIEW_REQUIREMENTS) {
  const progress = {};

  Object.entries(requirements).forEach(([name, req]) => {
    // Filter courses by pathway
    const relevantCourses = courses.filter(c => {
      const info = courseCatalog[c.courseId];
      return info && req.pathways.includes(info.pathway);
    });

    // Deduplicate by courseId + year
    const uniqueCourses = deduplicateCourses(relevantCourses);

    let credits = 0;

    // Calculate credits based on category
    switch (name) {
      case 'Health Science':
        credits = calculateHealthScienceCredits(uniqueCourses, courseCatalog, req);
        break;
      case 'Physical Education':
        credits = calculatePECredits(uniqueCourses, courses, courseCatalog);
        break;
      case 'Fine Arts/Foreign Language/CTE':
        credits = calculateFineArtsCredits(uniqueCourses, courses, courseCatalog);
        break;
      case 'Electives':
        credits = calculateElectivesCredits(uniqueCourses, courses, courseCatalog);
        break;
      default:
        credits = uniqueCourses.reduce((sum, c) => sum + courseCatalog[c.courseId].credits, 0);
    }

    progress[name] = {
      earned: credits,
      needed: req.needed,
      met: credits >= req.needed
    };
  });

  return progress;
}

/**
 * Calculate total credits earned
 * @param {Object} progress - Progress object from calculateWestviewProgress
 * @returns {number} - Total credits
 */
export function calculateTotalCredits(progress) {
  return Object.values(progress).reduce((sum, p) => sum + p.earned, 0);
}

/**
 * Check if student meets graduation requirements (230 credits + all categories met)
 * @param {Object} progress - Progress object from calculateWestviewProgress
 * @returns {boolean}
 */
export function isGraduationReady(progress) {
  const totalCredits = calculateTotalCredits(progress);
  const allCategoriesMet = Object.values(progress).every(p => p.met);
  return totalCredits >= 230 && allCategoriesMet;
}
