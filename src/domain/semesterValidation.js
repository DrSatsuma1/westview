/**
 * Semester Completion Validation
 *
 * Validates that a semester meets all requirements for completion.
 */

/**
 * Helper to get courses for a specific quarter
 */
function getQuarterCourses(courses, year, quarter) {
  return courses.filter(c => c.year === year && c.quarter === quarter);
}

/**
 * Validate semester completion requirements
 *
 * @param {string} year - Grade year ('9', '10', '11', '12')
 * @param {string} quarter - Quarter ('Q1', 'Q2', 'Q3', 'Q4')
 * @param {Array} courses - All scheduled courses
 * @param {Function} getCourseInfo - Function to get course info from catalog
 * @returns {Object} - { valid: boolean, issues: [], warnings: [], info: [] }
 */
export function validateSemesterCompletion(year, quarter, courses, getCourseInfo) {
  const quarterCourses = getQuarterCourses(courses, year, quarter);
  const issues = [];
  const warnings = [];
  const info = [];

  // Check if quarter has any courses
  if (quarterCourses.length === 0) {
    issues.push('No courses scheduled for this semester');
    return { valid: false, issues, warnings, info };
  }

  // Check minimum course count for the term (both quarters combined)
  const termQuarters = (quarter === 'Q1' || quarter === 'Q2') ? ['Q1', 'Q2'] : ['Q3', 'Q4'];
  const termCourses = courses.filter(c =>
    c.year === year && termQuarters.includes(c.quarter)
  );

  // Minimum 3 courses per term for grades 9-11, minimum 2 for grade 12
  const yearInt = parseInt(year);
  const minCourses = yearInt === 12 ? 2 : 3;

  if (termCourses.length < minCourses) {
    issues.push(`Minimum ${minCourses} courses required per semester (currently ${termCourses.length} in this term)`);
    return { valid: false, issues, warnings, info };
  }

  // Check for English (required all 4 years)
  const hasEnglish = quarterCourses.some(c => {
    const courseInfo = getCourseInfo(c.courseId);
    return courseInfo?.pathway === 'English';
  });

  if (!hasEnglish) {
    const allQuarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const otherQuarters = allQuarters.filter(q => q !== quarter);
    const hasEnglishElsewhere = otherQuarters.some(q => {
      const otherCourses = getQuarterCourses(courses, year, q);
      return otherCourses.some(c => {
        const courseInfo = getCourseInfo(c.courseId);
        return courseInfo?.pathway === 'English';
      });
    });

    if (!hasEnglishElsewhere) {
      issues.push('Missing English course - required all 4 years');
    }
  }

  // Check for PE (required grades 9-10)
  if (yearInt === 9 || yearInt === 10) {
    const hasPE = quarterCourses.some(c => {
      const courseInfo = getCourseInfo(c.courseId);
      return courseInfo?.pathway === 'Physical Education';
    });

    if (!hasPE) {
      const allQuarters = ['Q1', 'Q2', 'Q3', 'Q4'];
      const otherQuarters = allQuarters.filter(q => q !== quarter);
      const hasPEElsewhere = otherQuarters.some(q => {
        const otherCourses = getQuarterCourses(courses, year, q);
        return otherCourses.some(c => {
          const courseInfo = getCourseInfo(c.courseId);
          return courseInfo?.pathway === 'Physical Education';
        });
      });

      if (!hasPEElsewhere) {
        issues.push(`PE required for Grade ${year}`);
      }
    }
  }

  // Check for Integrated Math I requirement at graduation
  if (yearInt === 12 && quarter === 'Q4') {
    const allCourses = courses.filter(c => parseInt(c.year) <= 12);
    const hasMathI = allCourses.some(c => {
      const courseInfo = getCourseInfo(c.courseId);
      return courseInfo && /INTEGRATED MATHEMATICS I[^I]/i.test(courseInfo.full_name);
    });
    const hasHigherMath = allCourses.some(c => {
      const courseInfo = getCourseInfo(c.courseId);
      return courseInfo && /INTEGRATED MATHEMATICS (II|III)/i.test(courseInfo.full_name);
    });

    if (!hasMathI && !hasHigherMath) {
      warnings.push('Integrated Math I (or higher) is required for graduation');
    }
  }

  // Check for yearlong courses in both quarters
  quarterCourses.forEach(course => {
    const courseInfo = getCourseInfo(course.courseId);
    if (courseInfo?.term_length === 'yearlong') {
      let oppositeQuarter;
      if (quarter === 'Q1') oppositeQuarter = 'Q2';
      else if (quarter === 'Q2') oppositeQuarter = 'Q1';
      else if (quarter === 'Q3') oppositeQuarter = 'Q4';
      else oppositeQuarter = 'Q3';

      const oppositeCourses = getQuarterCourses(courses, year, oppositeQuarter);
      const hasOpposite = oppositeCourses.some(c => c.courseId === course.courseId);

      if (!hasOpposite) {
        const termName = (quarter === 'Q1' || quarter === 'Q2') ? 'Fall' : 'Spring';
        issues.push(`Year-long course "${courseInfo.full_name}" must be in both quarters of ${termName} term`);
      }
    }

    // Check for special PE courses requiring counselor consultation
    if (courseInfo?.full_name && (
      courseInfo.full_name.toUpperCase().includes('UNIFIED PE') ||
      courseInfo.full_name.toUpperCase().includes('O.C.I.S./P.E.')
    )) {
      warnings.push(`⚠️ ${courseInfo.full_name} credit allocation varies - consult your counselor`);
    }
  });

  // Check semester capacity
  if (quarterCourses.length > 8) {
    issues.push(`Overloaded schedule (${quarterCourses.length} courses). Maximum is 8 courses per quarter.`);
  } else if (quarterCourses.length >= 5) {
    warnings.push(`Above standard load (${quarterCourses.length} courses). Standard is 3 courses per quarter.`);
  }

  // Check UC A-G progress for juniors and seniors
  if (yearInt >= 11) {
    const yearsToCheck = yearInt === 11 ? ['9', '10', '11'] : ['9', '10', '11', '12'];
    const quarterOrder = ['Q1', 'Q2', 'Q3', 'Q4'];
    const currentQuarterIndex = quarterOrder.indexOf(quarter);

    const uniqueAGCourses = new Set();
    yearsToCheck.forEach(checkYear => {
      quarterOrder.forEach((checkQuarter, qIndex) => {
        if (parseInt(checkYear) < yearInt ||
            (parseInt(checkYear) === yearInt && qIndex <= currentQuarterIndex)) {
          const qCourses = getQuarterCourses(courses, checkYear, checkQuarter);
          qCourses.forEach(c => {
            const courseInfo = getCourseInfo(c.courseId);
            if (courseInfo?.uc_csu_category) {
              uniqueAGCourses.add(c.courseId);
            }
          });
        }
      });
    });

    const uniqueCount = uniqueAGCourses.size;

    // UC requirement: 11 A-G courses by end of junior year
    if (yearInt === 11 && quarter === 'Q4') {
      if (uniqueCount < 11) {
        issues.push(`UC requirement: Need 11 A-G courses by end of junior year. Currently have ${uniqueCount}.`);
      } else {
        info.push(`✓ UC requirement met: ${uniqueCount} A-G courses by end of junior year`);
      }
    }

    // Total requirement: 15 A-G courses by graduation
    if (yearInt === 12 && quarter === 'Q4') {
      if (uniqueCount < 15) {
        issues.push(`UC requirement: Need 15 A-G courses total for graduation. Currently have ${uniqueCount}.`);
      } else {
        info.push(`✓ UC requirement met: ${uniqueCount} A-G courses completed`);
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
    info
  };
}
