/**
 * Course Addition Logic
 *
 * Handles the creation of course entries for scheduling, including:
 * - Yearlong courses (spans all 4 quarters)
 * - Semester courses (spans 2 quarters)
 * - Quarter courses (single quarter)
 * - Linked course rules (auto-add companion courses)
 *
 * Key fix: Linked semester courses are placed in the OPPOSITE semester
 * from the main course, not the same semester.
 */

import { LINKED_COURSE_RULES } from '../config';

/**
 * Creates course entry objects for a single course based on its term type.
 *
 * @param {Object} params
 * @param {string} params.courseId - The course ID to add
 * @param {number} params.baseId - Starting ID for entries
 * @param {number} params.year - Grade year (9, 10, 11, 12)
 * @param {string} params.targetQuarter - Target quarter (Q1, Q2, Q3, Q4)
 * @param {Function} params.getTermRequirements - Function to get term requirements
 * @returns {{ entries: Array, termType: string }}
 */
export function createCourseEntries({
  courseId,
  baseId,
  year,
  targetQuarter,
  getTermRequirements
}) {
  const termReqs = getTermRequirements(courseId);
  const entries = [];

  if (termReqs.type === 'yearlong') {
    // Yearlong: all 4 quarters
    entries.push({ courseId, id: baseId, year, quarter: 'Q1' });
    entries.push({ courseId, id: baseId + 1, year, quarter: 'Q2' });
    entries.push({ courseId, id: baseId + 2, year, quarter: 'Q3' });
    entries.push({ courseId, id: baseId + 3, year, quarter: 'Q4' });
  } else if (termReqs.type === 'semester') {
    // Semester: 2 quarters based on target
    const isFall = targetQuarter === 'Q1' || targetQuarter === 'Q2';
    const [firstQ, secondQ] = isFall ? ['Q1', 'Q2'] : ['Q3', 'Q4'];
    entries.push({ courseId, id: baseId, year, quarter: firstQ });
    entries.push({ courseId, id: baseId + 1, year, quarter: secondQ });
  } else {
    // Quarter: single quarter
    entries.push({ courseId, id: baseId, year, quarter: targetQuarter });
  }

  return { entries, termType: termReqs.type };
}

/**
 * Calculates the opposite semester quarter for linked course placement.
 *
 * @param {string} quarter - Original quarter (Q1, Q2, Q3, Q4)
 * @returns {string} - Starting quarter of opposite semester
 */
export function getOppositeSemesterQuarter(quarter) {
  const isFall = quarter === 'Q1' || quarter === 'Q2';
  return isFall ? 'Q3' : 'Q1';
}

/**
 * Calculates semester credits for a given year and semester.
 *
 * @param {Array} courses - Array of course entries
 * @param {number} year - Grade year
 * @param {string} semester - 'fall' or 'spring'
 * @param {Object} courseCatalog - Course catalog with credits info
 * @returns {number} - Total credits in that semester
 */
function calculateSemesterCredits(courses, year, semester, courseCatalog) {
  const semesterQuarters = semester === 'fall' ? ['Q1', 'Q2'] : ['Q3', 'Q4'];
  const semesterCourses = courses.filter(c =>
    c.year === year && semesterQuarters.includes(c.quarter)
  );
  // Get unique course IDs (yearlong courses appear in multiple quarters)
  const uniqueCourseIds = [...new Set(semesterCourses.map(c => c.courseId))];
  return uniqueCourseIds.reduce((sum, id) => {
    const info = courseCatalog[id];
    return sum + (info?.credits || 0);
  }, 0);
}

/**
 * Calculates all course entries to add, including main course and linked courses.
 *
 * @param {Object} params
 * @param {string} params.courseId - The main course ID being added
 * @param {number} params.year - Grade year (9, 10, 11, 12)
 * @param {string} params.quarter - Target quarter for main course
 * @param {Array} params.currentCourses - Existing courses in schedule
 * @param {Function} params.getTermRequirements - Function to get term requirements
 * @param {Object} params.courseCatalog - Course catalog for credit lookup (optional)
 * @param {number} params.maxCredits - Maximum credits per semester (optional, default 45)
 * @returns {{ courses: Array, warning: string|null }} - Courses to add and any warning
 */
export function calculateCourseAdditions({
  courseId,
  year,
  quarter,
  currentCourses,
  getTermRequirements,
  courseCatalog = null,
  maxCredits = 45
}) {
  const newCourses = [];
  let nextId = Date.now();
  let warning = null;

  // 1. Add the main course
  const mainResult = createCourseEntries({
    courseId,
    baseId: nextId,
    year,
    targetQuarter: quarter,
    getTermRequirements
  });
  newCourses.push(...mainResult.entries);
  nextId += 4; // Reserve IDs for potential yearlong course

  // 2. Process linked course rules
  const existingCourseIds = currentCourses
    .filter(c => c.year === year)
    .map(c => c.courseId);

  // Track added courses to prevent duplicates in chain reactions
  const addedCourseIds = new Set([courseId]);

  LINKED_COURSE_RULES.forEach(rule => {
    let linkedCourseId = null;

    // Determine if a rule is triggered
    if (rule.type === 'bidirectional') {
      const [courseA, courseB] = rule.courses;
      if (courseId === courseA && !existingCourseIds.includes(courseB) && !addedCourseIds.has(courseB)) {
        linkedCourseId = courseB;
      } else if (courseId === courseB && !existingCourseIds.includes(courseA) && !addedCourseIds.has(courseA)) {
        linkedCourseId = courseA;
      }
    } else if (rule.type === 'one_way') {
      if (courseId === rule.trigger && !existingCourseIds.includes(rule.adds) && !addedCourseIds.has(rule.adds)) {
        linkedCourseId = rule.adds;
      }
    } else if (rule.type === 'sequential') {
      if (courseId === rule.first && !existingCourseIds.includes(rule.second) && !addedCourseIds.has(rule.second)) {
        linkedCourseId = rule.second;
      }
    }

    if (linkedCourseId) {
      // Determine the quarter for the linked course
      const linkedTermReqs = getTermRequirements(linkedCourseId);
      let linkedQuarter = quarter;

      // KEY FIX: If both main and linked are semester courses,
      // place linked course in the OPPOSITE semester
      if (mainResult.termType === 'semester' && linkedTermReqs.type === 'semester') {
        linkedQuarter = getOppositeSemesterQuarter(quarter);
      }

      // Check if adding linked course would exceed semester credits
      if (courseCatalog && linkedTermReqs.type === 'semester') {
        const linkedSemester = (linkedQuarter === 'Q1' || linkedQuarter === 'Q2') ? 'fall' : 'spring';
        const existingCredits = calculateSemesterCredits(currentCourses, year, linkedSemester, courseCatalog);
        const linkedCourseCredits = courseCatalog[linkedCourseId]?.credits || 0;

        if (existingCredits + linkedCourseCredits > maxCredits) {
          const linkedCourseName = courseCatalog[linkedCourseId]?.full_name || linkedCourseId;
          const semesterName = linkedSemester.charAt(0).toUpperCase() + linkedSemester.slice(1);
          warning = `Adding ${linkedCourseName} to ${semesterName} will exceed ${maxCredits} credits. Consider removing a course.`;
        }
      }

      const linkedResult = createCourseEntries({
        courseId: linkedCourseId,
        baseId: nextId,
        year,
        targetQuarter: linkedQuarter,
        getTermRequirements
      });
      newCourses.push(...linkedResult.entries);
      nextId += 4;

      // Track to prevent duplicates
      addedCourseIds.add(linkedCourseId);
    }
  });

  return { courses: newCourses, warning };
}
