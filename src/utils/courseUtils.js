/**
 * Utility functions for working with the course schema
 */

import courseCatalogData from '../data/courses.json';

/**
 * Load the course catalog from JSON data
 */
export function loadCourseCatalog() {
  return courseCatalogData;
}

/**
 * Create a lookup map for fast course access by course_id
 */
export function createCourseLookup(courses) {
  return courses.reduce((lookup, course) => {
    lookup[course.course_id] = course;
    return lookup;
  }, {});
}

/**
 * Get all courses for a specific pathway
 */
export function getCoursesByPathway(courses, pathway) {
  return courses.filter(course => course.pathway === pathway);
}

/**
 * Get all courses available for a specific grade level
 */
export function getCoursesByGrade(courses, grade) {
  return courses.filter(course => course.grades_allowed.includes(grade));
}

/**
 * Get all prerequisite courses (both required and recommended) for a course
 */
export function getPrerequisites(course) {
  return [...course.prerequisites_required, ...course.prerequisites_recommended];
}

/**
 * Check if a course has any prerequisites
 */
export function hasPrerequisites(course) {
  return course.prerequisites_required.length > 0 || course.prerequisites_recommended.length > 0;
}

/**
 * Check if a course is year-long
 */
export function isYearLong(course) {
  return course.term_length === 'yearlong';
}

/**
 * Check if a course is AP or Honors
 */
export function isAPorHonors(course) {
  return course.is_ap_or_honors_pair;
}

/**
 * Check if a course fulfills graduation requirements
 */
export function isGraduationRequirement(course) {
  return course.is_graduation_requirement;
}

/**
 * Get all courses in a sequence (following linked_courses)
 */
export function getCourseSequence(course, courseLookup) {
  const sequence = [course];
  let current = course;

  // Follow the chain forward
  while (current.linked_courses.length > 0) {
    const nextId = current.linked_courses[0];
    const next = courseLookup[nextId];
    if (next && !sequence.includes(next)) {
      sequence.push(next);
      current = next;
    } else {
      break;
    }
  }

  return sequence;
}

/**
 * Convert new Course schema to legacy format for backward compatibility
 */
export function toLegacyFormat(course) {
  return {
    name: course.full_name,
    credits: course.credits,
    ag: course.uc_csu_category,
    category: course.pathway,
    ap: course.is_ap_or_honors_pair,
    yearLong: course.term_length === 'yearlong',
  };
}

/**
 * Convert legacy format to new Course schema (partial conversion)
 */
export function fromLegacyFormat(courseId, legacy, pathway) {
  return {
    course_id: courseId,
    full_name: legacy.name,
    course_numbers: [],
    grades_allowed: [9, 10, 11, 12],
    credits: legacy.credits,
    credit_type: 'standard',
    uc_csu_category: legacy.ag,
    pathway: pathway || legacy.category,
    term_length: legacy.yearLong ? 'yearlong' : 'semester',
    offered_terms: ['fall', 'spring'],
    prerequisites_required: [],
    prerequisites_recommended: [],
    is_replacement_course: false,
    replacement_equivalents: [],
    is_ap_or_honors_pair: legacy.ap || false,
    pair_course_id: null,
    fall_to_spring_dependency: false,
    linked_courses: [],
    category_priority: 1,
    is_graduation_requirement: false,
    semester_restrictions: null,
    alternate_ids: [],
    notes: '',
  };
}

/**
 * Get all pathways in the catalog
 */
export function getUniquePathways(courses) {
  const pathways = new Set(courses.map(course => course.pathway));
  return Array.from(pathways).sort();
}

/**
 * Get all UC/CSU categories represented in the catalog
 */
export function getUCCSUCategories(courses) {
  const categories = new Set(courses.map(course => course.uc_csu_category));
  return Array.from(categories).filter(cat => cat !== null).sort();
}

/**
 * Filter courses by term availability
 */
export function getCoursesForTerm(courses, term) {
  return courses.filter(course =>
    course.offered_terms.includes(term) &&
    (course.semester_restrictions === null ||
     course.semester_restrictions === `${term} only`)
  );
}

/**
 * Check if prerequisites are met based on completed courses
 */
export function arePrerequisitesMet(course, completedCourseIds) {
  return course.prerequisites_required.every(prereqId =>
    completedCourseIds.includes(prereqId)
  );
}

/**
 * Get courses that a student is eligible for based on grade and completed courses
 */
export function getEligibleCourses(courses, grade, completedCourseIds) {
  return courses.filter(course =>
    course.grades_allowed.includes(grade) &&
    arePrerequisitesMet(course, completedCourseIds)
  );
}

/**
 * Validate course data against schema requirements
 */
export function validateCourse(course) {
  const errors = [];

  if (!course.course_id) errors.push('Missing course_id');
  if (!course.full_name) errors.push('Missing full_name');
  if (!course.pathway) errors.push('Missing pathway');
  if (course.credits === undefined) errors.push('Missing credits');
  if (!course.term_length) errors.push('Missing term_length');
  if (!course.grades_allowed || course.grades_allowed.length === 0) {
    errors.push('Missing or empty grades_allowed');
  }

  return errors;
}

/**
 * Search courses by name or course number
 */
export function searchCourses(courses, query) {
  const lowerQuery = query.toLowerCase();
  return courses.filter(course =>
    course.full_name.toLowerCase().includes(lowerQuery) ||
    course.course_id.toLowerCase().includes(lowerQuery) ||
    course.course_numbers.some(num => num.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Create a mapping from old course IDs to new course IDs
 * This helps with migration from the legacy format
 */
export function createLegacyMapping() {
  return {
    'MATH-I': 'MATH_IMATH_I',
    'MATH-II': 'MATH_IMATH_II',
    'MATH-III': 'MATH_IMATH_III',
    'AP-CALC-AB': 'MATH_AP_CALC_AB',
    'AP-CALC-BC': 'MATH_AP_CALC_BC',
    'AP-STATS': 'MATH_AP_STATISTICS',
    'SPANISH-1': 'WL_SPA_1-2',
    'SPANISH-2': 'WL_SPA_3-4',
    'SPANISH-3': 'WL_SPA_5-6',
    'SPANISH-4': 'WL_SPA_7-8',
    'AP-SPANISH': 'AP_SPANISH',
    'BIOLOGY': 'SCI_BIO_1-2',
    'AP-BIO': 'SCI_AP_BIOLOGY',
    'CHEMISTRY': 'SCI_CHEM_1-2',
    'AP-CHEM': 'SCI_AP_CHEMISTRY',
    'WORLD-HIST': 'HIST_WORLD_1-2',
    'AP-WORLD': 'HIST_AP_WORLD',
    'ENGLISH-1': 'ENG_1-2',
    'ENGLISH-2': 'ENG_3-4',
  };
}
