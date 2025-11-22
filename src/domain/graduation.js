/**
 * Graduation Eligibility Calculations
 *
 * Handles total credits, early graduation eligibility, and graduation readiness.
 */

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
 * Calculate total credits toward graduation with 80 credit/year cap
 * Maximum 80 credits count per year, regardless of how many courses are taken
 *
 * @param {Array} courses - Array of scheduled course objects
 * @param {Object} courseCatalog - Course catalog lookup object
 * @returns {number} - Total credits (capped at 80 per year)
 */
export function calculateTotalCreditsWithCap(courses, courseCatalog) {
  const uniqueCourses = deduplicateCourses(courses);

  // Calculate credits per year, capped at 80 each
  const yearsCredits = {};
  ['9', '10', '11', '12'].forEach(year => {
    const yearCourses = uniqueCourses.filter(c => c.year === year);
    const rawCredits = yearCourses.reduce((sum, c) => {
      const info = courseCatalog[c.courseId];
      return sum + (info ? info.credits : 0);
    }, 0);
    yearsCredits[year] = Math.min(rawCredits, 80); // Cap at 80 per year
  });

  return Object.values(yearsCredits).reduce((sum, credits) => sum + credits, 0);
}

/**
 * Calculate early graduation eligibility
 *
 * Requirements:
 * - 3-Year Graduation: 170+ credits through grade 11, senior English, and Civics/Econ
 * - 3.5-Year Graduation: 170+ credits through grade 11
 *
 * @param {Array} courses - Array of scheduled course objects
 * @param {Object} courseCatalog - Course catalog lookup object
 * @returns {Object} - Early graduation eligibility status
 */
export function calculateEarlyGradEligibility(courses, courseCatalog) {
  const uniqueCourses = deduplicateCourses(courses);

  const grade11Courses = uniqueCourses.filter(c => c.year === '11');

  const creditsThrough11 = uniqueCourses
    .filter(c => ['9', '10', '11'].includes(c.year))
    .reduce((sum, c) => {
      const info = courseCatalog[c.courseId];
      return sum + (info ? info.credits : 0);
    }, 0);

  const hasSeniorEnglish = grade11Courses.some(c => {
    const info = courseCatalog[c.courseId];
    if (!info || info.pathway !== 'English') return false;
    const name = info.full_name.toUpperCase();
    return name.includes('AMERICAN LIT') || name.includes('ETHNIC LIT') ||
           name.includes('EXPOSITORY') || name.includes('WORLD LIT') ||
           name.includes('AP ENGLISH');
  });

  const hasCivicsEcon = grade11Courses.some(c => {
    const info = courseCatalog[c.courseId];
    if (!info) return false;
    const name = info.full_name.toUpperCase();
    return name.includes('CIVICS') && name.includes('ECONOMICS');
  });

  return {
    eligible3Year: creditsThrough11 >= 170 && hasSeniorEnglish && hasCivicsEcon,
    eligible3_5Year: creditsThrough11 >= 170,
    creditsThrough11,
    hasSeniorEnglish,
    hasCivicsEcon
  };
}

/**
 * Check if student is ready for Westview graduation
 * Requires 230+ total credits and all category requirements met
 *
 * @param {number} totalCredits - Total credits earned
 * @param {Object} westviewProgress - Progress object from calculateWestviewProgress
 * @returns {boolean}
 */
export function isWestviewGraduationReady(totalCredits, westviewProgress) {
  return totalCredits >= 230 && Object.values(westviewProgress).every(p => p.met);
}
