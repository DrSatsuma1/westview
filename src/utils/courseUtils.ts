/**
 * Utility functions for working with the course schema
 */

import type { Course, CourseCatalog, CourseLookup, LegacyCourse, UCCSUCategory } from '../types/course';
import courseCatalogData from '../data/courses.json';

/**
 * Load the course catalog from JSON data
 */
export function loadCourseCatalog(): CourseCatalog {
  return courseCatalogData as CourseCatalog;
}

/**
 * Create a lookup map for fast course access by course_id
 */
export function createCourseLookup(courses: Course[]): CourseLookup {
  return courses.reduce((lookup, course) => {
    lookup[course.course_id] = course;
    return lookup;
  }, {} as CourseLookup);
}

/**
 * Get all courses for a specific pathway
 */
export function getCoursesByPathway(courses: Course[], pathway: string): Course[] {
  return courses.filter(course => course.pathway === pathway);
}

/**
 * Get all courses available for a specific grade level
 */
export function getCoursesByGrade(courses: Course[], grade: number): Course[] {
  return courses.filter(course => course.grades_allowed.includes(grade as 9 | 10 | 11 | 12));
}

/**
 * Get all prerequisite courses (both required and recommended) for a course
 */
export function getPrerequisites(course: Course): string[] {
  return [...course.prerequisites_required, ...course.prerequisites_recommended];
}

/**
 * Check if a course has any prerequisites
 */
export function hasPrerequisites(course: Course): boolean {
  return course.prerequisites_required.length > 0 || course.prerequisites_recommended.length > 0;
}

/**
 * Check if a course is year-long
 */
export function isYearLong(course: Course): boolean {
  return course.term_length === 'yearlong';
}

/**
 * Check if a course is AP or Honors
 */
export function isAPorHonors(course: Course): boolean {
  return course.is_ap_or_honors_pair;
}

/**
 * Check if a course fulfills graduation requirements
 */
export function isGraduationRequirement(course: Course): boolean {
  return course.is_graduation_requirement;
}

/**
 * Get all courses in a sequence (following linked_courses)
 */
export function getCourseSequence(course: Course, courseLookup: CourseLookup): Course[] {
  const sequence: Course[] = [course];
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
export function toLegacyFormat(course: Course): LegacyCourse {
  return {
    name: course.full_name,
    credits: course.credits,
    ag: course.uc_csu_category,
    category: course.pathway,
    ap: course.is_ap_or_honors_pair,
    yearLong: course.term_length === 'yearlong',
    // Note: years, schoolService, workExperience would need to be added to new schema or derived
  };
}

/**
 * Convert legacy format to new Course schema (partial conversion)
 */
export function fromLegacyFormat(
  courseId: string,
  legacy: LegacyCourse,
  pathway?: string
): Partial<Course> {
  return {
    course_id: courseId,
    full_name: legacy.name,
    credits: legacy.credits,
    uc_csu_category: legacy.ag,
    pathway: pathway || legacy.category,
    term_length: legacy.yearLong ? 'yearlong' : 'semester',
    is_ap_or_honors_pair: legacy.ap || false,
    // Other fields would need defaults or additional data
  };
}

/**
 * Get all pathways in the catalog
 */
export function getUniquePathways(courses: Course[]): string[] {
  const pathways = new Set(courses.map(course => course.pathway));
  return Array.from(pathways).sort();
}

/**
 * Get all UC/CSU categories represented in the catalog
 */
export function getUCCSUCategories(courses: Course[]): UCCSUCategory[] {
  const categories = new Set(courses.map(course => course.uc_csu_category));
  return Array.from(categories).filter((cat): cat is UCCSUCategory => cat !== null).sort();
}

/**
 * Filter courses by term availability
 */
export function getCoursesForTerm(courses: Course[], term: 'fall' | 'spring'): Course[] {
  return courses.filter(course =>
    course.offered_terms.includes(term) &&
    (course.semester_restrictions === null ||
     course.semester_restrictions === `${term} only`)
  );
}

/**
 * Check if prerequisites are met based on completed courses
 */
export function arePrerequisitesMet(
  course: Course,
  completedCourseIds: string[]
): boolean {
  return course.prerequisites_required.every(prereqId =>
    completedCourseIds.includes(prereqId)
  );
}

/**
 * Get courses that a student is eligible for based on grade and completed courses
 */
export function getEligibleCourses(
  courses: Course[],
  grade: number,
  completedCourseIds: string[]
): Course[] {
  return courses.filter(course =>
    course.grades_allowed.includes(grade as 9 | 10 | 11 | 12) &&
    arePrerequisitesMet(course, completedCourseIds)
  );
}

/**
 * Validate course data against schema requirements
 */
export function validateCourse(course: Partial<Course>): string[] {
  const errors: string[] = [];

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
export function searchCourses(courses: Course[], query: string): Course[] {
  const lowerQuery = query.toLowerCase();
  return courses.filter(course =>
    course.full_name.toLowerCase().includes(lowerQuery) ||
    course.course_id.toLowerCase().includes(lowerQuery) ||
    course.course_numbers.some(num => num.toLowerCase().includes(lowerQuery))
  );
}
