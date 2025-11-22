/**
 * useSuggestionEngine Hook
 *
 * Encapsulates the auto-fill suggestion logic for course scheduling.
 */
import { getSemesterCredits, calculateSemesterTotal } from '../domain/creditCalculation.js';
import { LINKED_COURSE_RULES, AVID_COURSES } from '../config';

/**
 * Create course entries based on term type (yearlong, semester, quarter)
 */
export function createCourseEntries(courseId, year, quarter, termType, baseId) {
  const entries = [];

  if (termType === 'yearlong') {
    entries.push({ courseId, id: baseId, year, quarter: 'Q1' });
    entries.push({ courseId, id: baseId + 1, year, quarter: 'Q2' });
    entries.push({ courseId, id: baseId + 2, year, quarter: 'Q3' });
    entries.push({ courseId, id: baseId + 3, year, quarter: 'Q4' });
  } else if (termType === 'semester') {
    const [firstQ, secondQ] = (quarter === 'Q1' || quarter === 'Q2')
      ? ['Q1', 'Q2'] : ['Q3', 'Q4'];
    entries.push({ courseId, id: baseId, year, quarter: firstQ });
    entries.push({ courseId, id: baseId + 1, year, quarter: secondQ });
  } else {
    entries.push({ courseId, id: baseId, year, quarter });
  }

  return entries;
}

/**
 * Filter suggestions for a specific term
 */
export function filterSuggestionsForTerm(allSuggestions, year, term, courses, courseCatalog) {
  const termQuarters = term === 'fall' ? ['Q1', 'Q2'] : ['Q3', 'Q4'];
  const targetQuarter = term === 'fall' ? 'Q1' : 'Q3';

  return allSuggestions
    .filter(s => s.year === year)
    .filter(s => s.quarter === null || termQuarters.includes(s.quarter))
    .map(s => {
      const yearCourses = courses.filter(c => c.year === year);
      const suggestedCourseInfo = courseCatalog[s.courseId];
      const isSemesterCourse = suggestedCourseInfo?.term_length === 'semester';
      const coursesToCheck = yearCourses.filter(c => termQuarters.includes(c.quarter));

      const hasInTerm = coursesToCheck.some(c => {
        if (isSemesterCourse) {
          return c.courseId === s.courseId;
        } else {
          const info = courseCatalog[c.courseId];
          return info && (c.courseId === s.courseId || info.pathway === suggestedCourseInfo?.pathway);
        }
      });

      const isPECourse = suggestedCourseInfo?.pathway === 'Physical Education';
      const hasInYear = isPECourse && yearCourses.some(c => c.courseId === s.courseId);

      if (!hasInTerm && !hasInYear) {
        return { ...s, quarter: targetQuarter };
      }
      return null;
    })
    .filter(s => s !== null);
}

/**
 * Build new courses array from suggestions with credit limit checking
 */
export function buildCoursesFromSuggestions({
  termSuggestions,
  year,
  term,
  courses,
  courseCatalog,
  schedulingEngine,
  maxCredits = 45
}) {
  const termQuarters = term === 'fall' ? ['Q1', 'Q2'] : ['Q3', 'Q4'];
  const newCourses = [];

  // Calculate existing credits
  const uniqueTermCourseIds = [...new Set(
    courses
      .filter(c => c.year === year && termQuarters.includes(c.quarter))
      .map(c => c.courseId)
  )];
  const existingTermCredits = calculateSemesterTotal(uniqueTermCourseIds, courseCatalog);
  let addedCredits = 0;

  termSuggestions.forEach(suggestion => {
    const courseInfo = courseCatalog[suggestion.courseId];
    if (!courseInfo) return;

    const courseCreditsPerSemester = getSemesterCredits(courseInfo);
    const totalAfterAdd = existingTermCredits + addedCredits + courseCreditsPerSemester;
    if (totalAfterAdd > maxCredits) return;

    const termReqs = schedulingEngine.getTermRequirements(suggestion.courseId);
    const baseId = Date.now() + newCourses.length * 4;

    const entries = createCourseEntries(
      suggestion.courseId,
      suggestion.year,
      suggestion.quarter,
      termReqs.type,
      baseId
    );
    newCourses.push(...entries);
    addedCredits += courseCreditsPerSemester;
  });

  return newCourses;
}

/**
 * Process linked course rules and add companion courses
 */
export function processLinkedCourseRules({
  termSuggestions,
  year,
  term,
  courses,
  newCourses
}) {
  LINKED_COURSE_RULES.forEach(rule => {
    const yearCourses = courses.filter(c => c.year === year);

    if (rule.type === 'bidirectional') {
      const [courseA, courseB] = rule.courses;
      const hasA = termSuggestions.some(s => s.courseId === courseA);
      const hasB = termSuggestions.some(s => s.courseId === courseB);
      const yearHasA = yearCourses.some(c => c.courseId === courseA);
      const yearHasB = yearCourses.some(c => c.courseId === courseB);

      if (hasA && !yearHasB) {
        addLinkedCourse(courseB, year, term, newCourses);
      } else if (hasB && !yearHasA) {
        addLinkedCourse(courseA, year, term, newCourses);
      }
    } else if (rule.type === 'sequential') {
      const hasFirst = termSuggestions.some(s => s.courseId === rule.first);
      const hasSecond = yearCourses.some(c => c.courseId === rule.second);
      if (hasFirst && !hasSecond) {
        addLinkedCourse(rule.second, year, term, newCourses);
      }
    } else if (rule.type === 'one_way') {
      const hasTrigger = termSuggestions.some(s => s.courseId === rule.trigger);
      const hasLinked = yearCourses.some(c => c.courseId === rule.adds);
      if (hasTrigger && !hasLinked) {
        addLinkedCourse(rule.adds, year, term, newCourses);
      }
    }
  });
}

function addLinkedCourse(courseId, year, term, newCourses) {
  if (AVID_COURSES.includes(courseId)) return;

  // Linked courses go in opposite semester
  const firstQuarter = term === 'fall' ? 'Q3' : 'Q1';
  const secondQuarter = term === 'fall' ? 'Q4' : 'Q2';

  newCourses.push({
    courseId,
    id: Date.now() + newCourses.length * 2,
    year,
    quarter: firstQuarter
  });
  newCourses.push({
    courseId,
    id: Date.now() + newCourses.length * 2 + 1,
    year,
    quarter: secondQuarter
  });
}
