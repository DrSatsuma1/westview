/**
 * Schedule Validation Logic
 *
 * Validates course schedules for missing requirements and prerequisite gaps.
 */

/**
 * Detect language from course name
 */
function detectLanguage(courseName) {
  if (courseName.includes('SPANISH')) return 'Spanish';
  if (courseName.includes('CHINESE')) return 'Chinese';
  if (courseName.includes('FRENCH')) return 'French';
  if (courseName.includes('FILIPINO')) return 'Filipino';
  if (courseName.includes('GERMAN')) return 'German';
  if (courseName.includes('JAPANESE')) return 'Japanese';
  if (courseName.includes('LATIN')) return 'Latin';
  return null;
}

/**
 * Detect foreign language level from course name
 */
function detectLanguageLevel(courseName) {
  const levelPatterns = ['1-2', '3-4', '5-6', '7-8', '9-10'];
  for (const pattern of levelPatterns) {
    if (courseName.includes(pattern)) {
      return pattern;
    }
  }
  return null;
}

/**
 * Required previous levels for each language level
 */
const PREVIOUS_LEVELS = {
  '3-4': ['1-2'],
  '5-6': ['1-2', '3-4'],
  '7-8': ['1-2', '3-4', '5-6'],
  '9-10': ['1-2', '3-4', '5-6', '7-8']
};

/**
 * Validate schedule for missing courses and prerequisite gaps
 *
 * @param {Array} courses - All scheduled courses
 * @param {Object} courseCatalog - Course catalog lookup
 * @param {Function} getCoursesForQuarter - Function to get courses for a specific quarter
 * @param {Object} schedulingEngine - Scheduling engine instance
 * @returns {Object} - { errors: Array, warnings: Array }
 */
export function validateSchedule(courses, courseCatalog, getCoursesForQuarter, schedulingEngine) {
  const validation = { errors: [], warnings: [] };

  ['9', '10', '11', '12'].forEach(year => {
    const q1Courses = getCoursesForQuarter(year, 'Q1');
    const q2Courses = getCoursesForQuarter(year, 'Q2');
    const q3Courses = getCoursesForQuarter(year, 'Q3');
    const q4Courses = getCoursesForQuarter(year, 'Q4');

    // For scheduling engine compatibility, combine Q1+Q2 as "fall" and Q3+Q4 as "spring"
    const fallCourses = [...q1Courses, ...q2Courses];
    const springCourses = [...q3Courses, ...q4Courses];

    const schedule = {
      fall: fallCourses.map(c => c.courseId),
      spring: springCourses.map(c => c.courseId)
    };

    // Use scheduling engine to validate
    const result = schedulingEngine.validateSchedule(schedule);
    if (!result.valid) {
      result.errors.forEach(err => {
        validation.errors.push({ ...err, year });
      });
    }

    // Check for missing mandatory courses in years with courses
    const hasCoursesInAnyQuarter = q1Courses.length > 0 || q2Courses.length > 0 || q3Courses.length > 0 || q4Courses.length > 0;
    if (hasCoursesInAnyQuarter) {
      const allYearCourses = [...q1Courses, ...q2Courses, ...q3Courses, ...q4Courses];

      // Check for English (required all 4 years)
      const hasEnglish = allYearCourses.some(c => {
        const info = courseCatalog[c.courseId];
        return info && info.pathway === 'English';
      });

      if (!hasEnglish) {
        validation.warnings.push({
          type: 'missing_english',
          year,
          message: `Missing English in Grade ${year}`
        });
      }

      // Check for PE (required at least 2 years, typically 9 and 10)
      const hasPE = allYearCourses.some(c => {
        const info = courseCatalog[c.courseId];
        return info && info.pathway === 'Physical Education';
      });

      if (!hasPE && (year === '9' || year === '10')) {
        validation.warnings.push({
          type: 'missing_pe',
          year,
          message: `Missing PE in Grade ${year}`
        });
      }
    }
  });

  // Check for foreign language prerequisite gaps across all courses
  courses.forEach(course => {
    const courseInfo = courseCatalog[course.courseId];
    if (!courseInfo || courseInfo.pathway !== 'Foreign Language') return;

    const courseName = courseInfo.full_name.toUpperCase();
    const language = detectLanguage(courseName);
    if (!language) return;

    const level = detectLanguageLevel(courseName);
    if (!level || level === '1-2') return;

    // Check for previous levels
    const requiredLevels = PREVIOUS_LEVELS[level] || [];
    const allCourseNames = courses.map(c => courseCatalog[c.courseId]?.full_name?.toUpperCase() || '');

    const missingLevels = requiredLevels.filter(reqLevel => {
      const hasLevel = allCourseNames.some(name =>
        name.includes(language.toUpperCase()) && name.includes(reqLevel)
      );
      return !hasLevel;
    });

    if (missingLevels.length > 0) {
      const missingWithLanguage = missingLevels.map(lvl => `${language} ${lvl}`);
      validation.warnings.push({
        type: 'missing_prerequisites',
        year: course.year,
        message: `${language} ${level} missing prerequisites: ${missingWithLanguage.join(', ')}`
      });
    }
  });

  return validation;
}

/**
 * Extract specific warning types from validation result
 */
export function extractWarningsByType(validation, type) {
  return validation.warnings
    .filter(w => w.type === type)
    .map(w => w.year);
}
