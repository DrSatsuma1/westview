/**
 * UC GPA Calculator
 *
 * Single source of truth for UC GPA calculations.
 * Grades 10-11, A-G courses only, with honors weighting caps.
 */

/**
 * Convert letter grade to base points (no +/-)
 * @param {string} grade - Letter grade (A+, A, A-, B+, etc.)
 * @returns {number} - Base grade points (4, 3, 2, 1, 0)
 */
export function getBaseGradePoints(grade) {
  if (!grade) return 0;
  const letter = grade.replace('+', '').replace('-', '');
  const points = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'F': 0 };
  return points[letter] || 0;
}

/**
 * Filter courses for UC GPA calculation
 * Only grades 10-11, A-G courses with grades entered
 *
 * @param {Array} courses - All scheduled courses
 * @param {Object} courseCatalog - Course catalog lookup
 * @returns {Array} - Filtered courses eligible for UC GPA
 */
export function filterUCGPACourses(courses, courseCatalog) {
  return courses.filter(c => {
    const info = courseCatalog[c.courseId];
    return info &&
           info.uc_csu_category &&
           (c.year === '10' || c.year === '11' || c.year === 10 || c.year === 11) &&
           c.grade &&
           c.grade !== '';
  });
}

/**
 * Calculate UC GPA with various weighting options
 *
 * UC GPA rules:
 * - Only grades 10-11 count
 * - Only A-G courses count
 * - Honors points: +1 for AP/IB/Honors with C or better
 * - Capped: max 4 honors semesters from grade 10, max 4 from grade 11, total max 8
 *
 * @param {Array} courses - Array of scheduled course objects with grades
 * @param {Object} courseCatalog - Course catalog lookup object
 * @returns {Object|null} - GPA results or null if no eligible courses
 */
export function calculateUCGPA(courses, courseCatalog) {
  const agCourses = filterUCGPACourses(courses, courseCatalog);

  if (agCourses.length === 0) return null;

  // Calculate total grade points
  let totalGradePoints = 0;
  let totalGrades = 0;

  agCourses.forEach(c => {
    totalGradePoints += getBaseGradePoints(c.grade);
    totalGrades++;
  });

  const unweightedGPA = totalGrades > 0 ? totalGradePoints / totalGrades : 0;

  // Calculate honors points (AP/IB/Honors courses with grades C or better)
  let grade10HonorsCount = 0;
  let grade11HonorsCount = 0;

  agCourses.forEach(c => {
    const info = courseCatalog[c.courseId];
    const basePoints = getBaseGradePoints(c.grade);

    // Only give honors points for C or better grades
    if (basePoints >= 2 && info.is_ap_or_honors_pair) {
      const year = String(c.year);
      if (year === '10') grade10HonorsCount++;
      if (year === '11') grade11HonorsCount++;
    }
  });

  // Capped: max 4 semesters from grade 10, max 4 from grade 11, total max 8
  const cappedGrade10Honors = Math.min(grade10HonorsCount, 4);
  const cappedGrade11Honors = Math.min(grade11HonorsCount, 4);
  const totalCappedHonors = Math.min(cappedGrade10Honors + cappedGrade11Honors, 8);

  const weightedCappedGPA = totalGrades > 0
    ? (totalGradePoints + totalCappedHonors) / totalGrades
    : 0;

  // Fully weighted: all honors points (no cap)
  const totalFullyWeightedHonors = grade10HonorsCount + grade11HonorsCount;
  const fullyWeightedGPA = totalGrades > 0
    ? (totalGradePoints + totalFullyWeightedHonors) / totalGrades
    : 0;

  return {
    unweighted: Math.floor(unweightedGPA * 100) / 100,
    weightedCapped: Math.floor(weightedCappedGPA * 100) / 100,
    fullyWeighted: Math.floor(fullyWeightedGPA * 100) / 100,
    totalGrades,
    grade10Honors: grade10HonorsCount,
    grade11Honors: grade11HonorsCount,
    cappedHonorsUsed: totalCappedHonors
  };
}

/**
 * Calculate GPA for a specific pathway (e.g., English for Biliteracy Seal)
 *
 * @param {Array} courses - Courses in the pathway with grades
 * @returns {number|null} - GPA or null if no graded courses
 */
export function calculatePathwayGPA(courses) {
  const gradedCourses = courses.filter(c => c.grade && c.grade !== '');

  if (gradedCourses.length === 0) return null;

  const totalPoints = gradedCourses.reduce((sum, c) => sum + getBaseGradePoints(c.grade), 0);
  return totalPoints / gradedCourses.length;
}
