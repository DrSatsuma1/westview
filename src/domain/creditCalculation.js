/**
 * Credit calculation domain logic
 * Single source of truth for credit calculations across the app
 */

/**
 * Get credits for a course in a single semester context.
 * Yearlong courses are divided by 2 (half per semester).
 * Semester and quarter courses return full credits.
 *
 * @param {Object} courseInfo - Course info from catalog
 * @returns {number} Credits for one semester
 */
export function getSemesterCredits(courseInfo) {
  if (!courseInfo) return 0;
  if (courseInfo.term_length === 'yearlong') {
    return courseInfo.credits / 2;
  }
  return courseInfo.credits;
}

/**
 * Calculate total credits for a semester.
 *
 * @param {string[]} uniqueCourseIds - Deduplicated course IDs in the semester
 * @param {Object} courseCatalog - Course catalog lookup object
 * @returns {number} Total semester credits
 */
export function calculateSemesterTotal(uniqueCourseIds, courseCatalog) {
  return uniqueCourseIds.reduce((sum, courseId) => {
    const info = courseCatalog[courseId];
    return sum + getSemesterCredits(info);
  }, 0);
}

/**
 * Calculate total credits for a full year (both semesters).
 * Year-long courses: full credits
 * Semester courses appearing in both terms: full credits each
 *
 * @param {string[]} uniqueCourseIds - Deduplicated course IDs for the year
 * @param {Object} courseCatalog - Course catalog lookup object
 * @returns {number} Total year credits
 */
export function calculateYearTotal(uniqueCourseIds, courseCatalog) {
  return uniqueCourseIds.reduce((sum, courseId) => {
    const info = courseCatalog[courseId];
    // For year total, we want full credits regardless of term_length
    return sum + (info ? info.credits : 0);
  }, 0);
}
