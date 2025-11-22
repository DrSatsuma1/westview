/**
 * UC/CSU A-G Requirements Progress Calculator
 *
 * Single source of truth for A-G category tracking.
 * Handles special level-based counting for Math (C) and Foreign Language (E).
 */

/**
 * UC/CSU A-G requirements configuration
 */
export const AG_REQUIREMENTS = {
  'A': { name: 'History/Social Science', needed: 2, short: 'History', recommended: 2 },
  'B': { name: 'English', needed: 4, short: 'English', recommended: 4 },
  'C': { name: 'Mathematics (including Geometry)', needed: 3, short: 'Math (including Geometry)', recommended: 4 },
  'D': { name: 'Laboratory Science', needed: 2, short: 'Science', recommended: 3 },
  'E': { name: 'Language Other Than English', needed: 2, short: 'Foreign Language', recommended: 3 },
  'F': { name: 'Visual & Performing Arts', needed: 1, short: 'Arts', recommended: 1 },
  'G': { name: 'College Prep Elective', needed: 1, short: 'College Prep Elective', recommended: 1 }
};

/**
 * Deduplicate courses by courseId + year
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
 * Calculate implied Math years by course level
 * Math I=1yr, Math II=2yr, Math III=3yr, Pre-Calc=4yr, AP Calc=5yr
 */
function getMathImpliedYears(courseInfo) {
  if (!courseInfo || courseInfo.pathway !== 'Math') return 0;

  const nameUpper = courseInfo.full_name.toUpperCase();

  // AP Calculus AB or BC = 5 years
  if (nameUpper.includes('AP') && nameUpper.includes('CALCULUS')) {
    return 5;
  }
  // Pre-Calculus = 4 years
  if (nameUpper.includes('PRECALCULUS') || nameUpper.includes('PRE-CALCULUS')) {
    return 4;
  }
  // Statistics = 4 years (typically taken after Math III)
  if (nameUpper.includes('STATISTICS')) {
    return 4;
  }
  // Integrated Math III = 3 years
  if (nameUpper.includes('MATHEMATICS III') || nameUpper.includes('MATH III')) {
    return 3;
  }
  // Integrated Math II = 2 years
  if (nameUpper.includes('MATHEMATICS II') || nameUpper.includes('MATH II')) {
    return 2;
  }
  // Integrated Math I = 1 year
  if (nameUpper.includes('MATHEMATICS I') || nameUpper.includes('MATH I')) {
    return 1;
  }

  return 1; // Default
}

/**
 * Calculate implied Foreign Language years by course level
 * 1-2=1yr, 3-4=2yr, 5-6=3yr, 7-8=4yr, Honors 7-8/9-10=5yr, AP=6yr
 */
function getForeignLanguageImpliedYears(courseInfo) {
  if (!courseInfo || courseInfo.pathway !== 'Foreign Language') return 0;

  const nameUpper = courseInfo.full_name.toUpperCase();

  // AP Language courses = 6 years (highest level)
  if (nameUpper.includes('AP ')) {
    return 6;
  }
  // Honors 7-8 or 9-10 = 5 years
  if (nameUpper.includes('HONORS') && (nameUpper.includes('7-8') || nameUpper.includes('9-10'))) {
    return 5;
  }
  // Regular numbered courses (1-2=1yr, 3-4=2yr, etc.)
  const levelMatch = nameUpper.match(/(\d+)-(\d+)/);
  if (levelMatch) {
    const levelNum = parseInt(levelMatch[1]);
    return Math.ceil(levelNum / 2);
  }

  return 0;
}

/**
 * Calculate Math (Category C) years
 * Uses highest level reached, not course count
 */
function calculateMathYears(uniqueCourses, courseCatalog) {
  let highestMathYear = 0;

  uniqueCourses.forEach(c => {
    const info = courseCatalog[c.courseId];
    const impliedYears = getMathImpliedYears(info);
    if (impliedYears > highestMathYear) {
      highestMathYear = impliedYears;
    }
  });

  return highestMathYear > 0 ? highestMathYear : uniqueCourses.length;
}

/**
 * Calculate Foreign Language (Category E) years
 * Uses highest level reached + 2 if met in grades 7/8
 */
function calculateForeignLanguageYears(uniqueCourses, courseCatalog, metIn78) {
  let highestLevelYears = 0;

  uniqueCourses.forEach(c => {
    const info = courseCatalog[c.courseId];
    const impliedYears = getForeignLanguageImpliedYears(info);
    if (impliedYears > highestLevelYears) {
      highestLevelYears = impliedYears;
    }
  });

  // Add 2 years if met in grades 7/8
  if (metIn78) {
    highestLevelYears += 2;
  }

  return highestLevelYears;
}

/**
 * Calculate UC/CSU A-G progress for all categories
 *
 * @param {Array} courses - Array of scheduled course objects
 * @param {Object} courseCatalog - Course catalog lookup object
 * @param {boolean} metForeignLanguageIn78 - Whether FL requirement was met in grades 7/8
 * @param {Object} [requirements=AG_REQUIREMENTS] - Requirements config
 * @returns {Object} - Progress by category { [cat]: { earned, needed, recommended, met, meetsRecommended } }
 */
export function calculateAGProgress(courses, courseCatalog, metForeignLanguageIn78 = false, requirements = AG_REQUIREMENTS) {
  const progress = {};

  // Calculate A-F categories
  ['A', 'B', 'C', 'D', 'E', 'F'].forEach(cat => {
    const relevantCourses = courses.filter(c => {
      const info = courseCatalog[c.courseId];
      return info && info.uc_csu_category === cat;
    });

    const uniqueCourses = deduplicateCourses(relevantCourses);

    let years;
    switch (cat) {
      case 'C':
        years = calculateMathYears(uniqueCourses, courseCatalog);
        break;
      case 'E':
        years = calculateForeignLanguageYears(uniqueCourses, courseCatalog, metForeignLanguageIn78);
        break;
      default:
        years = uniqueCourses.length;
    }

    progress[cat] = {
      earned: years,
      needed: requirements[cat].needed,
      recommended: requirements[cat].recommended,
      met: years >= requirements[cat].needed,
      meetsRecommended: years >= requirements[cat].recommended
    };
  });

  // Calculate G: courses marked as 'G' + extra courses from A-F beyond minimums
  const gCourses = courses.filter(c => {
    const info = courseCatalog[c.courseId];
    return info && info.uc_csu_category === 'G';
  });
  const uniqueGCourses = deduplicateCourses(gCourses);

  // Count extra courses from A-F that exceed requirements
  let extraAFCourses = 0;
  ['A', 'B', 'C', 'D', 'E', 'F'].forEach(cat => {
    const extra = progress[cat].earned - progress[cat].needed;
    if (extra > 0) {
      extraAFCourses += extra;
    }
  });

  const gYears = uniqueGCourses.length + extraAFCourses;
  progress['G'] = {
    earned: gYears,
    needed: requirements['G'].needed,
    recommended: requirements['G'].recommended,
    met: gYears >= requirements['G'].needed,
    meetsRecommended: gYears >= requirements['G'].recommended
  };

  return progress;
}

/**
 * Check if student is UC/CSU eligible (all A-G requirements met)
 * @param {Object} progress - Progress object from calculateAGProgress
 * @returns {boolean}
 */
export function isUCSUEligible(progress) {
  return Object.values(progress).every(p => p.met);
}

/**
 * Check if student meets all recommended levels
 * @param {Object} progress - Progress object from calculateAGProgress
 * @returns {boolean}
 */
export function meetsAllRecommended(progress) {
  return Object.values(progress).every(p => p.meetsRecommended);
}
