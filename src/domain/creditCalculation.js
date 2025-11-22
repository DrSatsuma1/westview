/**
 * Credit calculation domain logic
 * Single source of truth for credit calculations across the app
 */

/**
 * Get credits for a course in a single semester context.
 * The credits field already represents per-semester credits for all course types:
 * - Yearlong: credits = per-semester (e.g., 10 = 10 Fall + 10 Spring = 20 total/year)
 * - Semester: credits = for that semester
 *
 * @param {Object} courseInfo - Course info from catalog
 * @returns {number} Credits for one semester
 */
export function getSemesterCredits(courseInfo) {
  if (!courseInfo) return 0;
  return courseInfo.credits; // credits is already per-semester for all course types
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
