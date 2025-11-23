/**
 * Course Validation Domain Logic
 *
 * Validates course additions against business rules.
 * Returns validation results without side effects.
 */

import { LINKED_REQUIREMENTS } from './courseEligibility.js';
import { EXCLUSIVE_COURSE_PAIRS } from '../config/index.js';

/**
 * Validate adding a course to a schedule
 *
 * @param {Object} params - Validation parameters
 * @param {string} params.courseId - Course being added
 * @param {string} params.year - Grade year ('9', '10', '11', '12')
 * @param {string} params.quarter - Quarter ('Q1', 'Q2', 'Q3', 'Q4')
 * @param {Object} params.courseInfo - Course catalog info
 * @param {Array} params.allCourses - All scheduled courses
 * @param {Array} params.quarterCourses - Courses in the target quarter
 * @param {Array} params.yearCourses - Courses in the target year
 * @param {Object} params.courseCatalog - Full course catalog
 * @param {Object} params.earlyGradMode - Early graduation mode settings
 * @param {Object} params.earlyGradEligibility - Early grad eligibility status
 * @param {Object} params.ctePathwayMode - CTE pathway mode settings
 * @param {Object} params.ctePathwayProgress - CTE pathway progress
 * @param {Object} params.ctePathways - CTE pathway definitions
 * @param {number} params.currentSlot - Slot being added to
 * @param {boolean} params.allowRepeatCourses - Allow repeat courses setting
 * @param {Function} params.getTermRequirements - Function to get term requirements
 * @param {Function} params.canScheduleInSemester - Function to check semester scheduling
 * @param {Function} params.getCoursesForQuarter - Function to get courses for a quarter
 * @returns {Object} - { valid: boolean, error: string|null, warning: string|null }
 */
export function validateCourseAddition({
  courseId,
  year,
  quarter,
  courseInfo,
  allCourses,
  quarterCourses,
  yearCourses,
  courseCatalog,
  earlyGradMode,
  earlyGradEligibility,
  ctePathwayMode,
  ctePathwayProgress,
  ctePathways,
  currentSlot,
  allowRepeatCourses,
  getTermRequirements,
  canScheduleInSemester,
  getCoursesForQuarter,
  checkCourseEligibility
}) {
  const courseName = courseInfo.full_name.toUpperCase();
  let warning = null;

  // === LINKED COURSE VALIDATION ===
  // NOTE: Don't block here - LINKED_COURSE_RULES in addCourse() will auto-add the linked course
  // Just set a warning to inform user that linked course will be added
  if (LINKED_REQUIREMENTS[courseId]) {
    const requirement = LINKED_REQUIREMENTS[courseId];

    if (requirement.requiresOneOf) {
      const hasAnyPartner = requirement.requiresOneOf.some(partnerId =>
        yearCourses.some(c => c.courseId === partnerId)
      );
      if (!hasAnyPartner) {
        const partnerNames = requirement.names.join(' or ');
        warning = `${courseInfo.full_name} will be added with ${partnerNames}`;
      }
    } else if (requirement.requires) {
      const hasRequiredCourse = yearCourses.some(c => c.courseId === requirement.requires);
      if (!hasRequiredCourse) {
        warning = `${courseInfo.full_name} will be added with ${requirement.name}`;
      }
    }
  }

  // === EXCLUSIVE COURSE PAIR VALIDATION (Plain vs AVID-linked) ===
  // Cannot take both plain course and AVID-linked version (e.g., English 1-2 AND English 1-2 w/AVID)
  for (const pair of EXCLUSIVE_COURSE_PAIRS) {
    if (courseId === pair.courseA) {
      // Trying to add plain version - check if AVID-linked version exists
      const hasLinkedVersion = allCourses.some(c => c.courseId === pair.courseB);
      if (hasLinkedVersion) {
        const linkedInfo = courseCatalog[pair.courseB];
        const linkedName = linkedInfo ? linkedInfo.full_name : `${pair.description} (AVID-linked)`;
        return { valid: false, error: `Cannot take both versions of ${pair.description}. You already have ${linkedName}.`, warning: null };
      }
    } else if (courseId === pair.courseB) {
      // Trying to add AVID-linked version - check if plain version exists
      const hasPlainVersion = allCourses.some(c => c.courseId === pair.courseA);
      if (hasPlainVersion) {
        const plainInfo = courseCatalog[pair.courseA];
        const plainName = plainInfo ? plainInfo.full_name : pair.description;
        return { valid: false, error: `Cannot take both versions of ${pair.description}. You already have ${plainName}.`, warning: null };
      }
    }
  }

  // === EARLY GRADUATION MODE VALIDATIONS ===
  if (earlyGradMode?.enabled) {
    if (earlyGradMode.targetYear === '3year') {
      if (year === '12') {
        return { valid: false, error: 'Early Graduation (3 years): Cannot add courses to Grade 12', warning: null };
      }
      if (year === '11') {
        const isSeniorEnglish = courseInfo.pathway === 'English' && (
          courseName.includes('AMERICAN LIT') || courseName.includes('ETHNIC LIT') ||
          courseName.includes('EXPOSITORY') || courseName.includes('WORLD LIT') ||
          courseName.includes('AP ENGLISH')
        );
        const isCivicsEcon = courseName.includes('CIVICS') && courseName.includes('ECONOMICS');

        if (!earlyGradEligibility?.hasSeniorEnglish && !isSeniorEnglish && (quarter === 'Q1' || quarter === 'Q2')) {
          warning = 'Early Graduation: Remember to add a Senior English course in Grade 11';
        }
        if (!earlyGradEligibility?.hasCivicsEcon && !isCivicsEcon && (quarter === 'Q1' || quarter === 'Q2')) {
          warning = 'Early Graduation: Remember to add Civics/Economics in Grade 11';
        }
      }
    } else if (earlyGradMode.targetYear === '3.5year') {
      if (year === '12' && (quarter === 'Q3' || quarter === 'Q4')) {
        return { valid: false, error: 'Early Graduation (3.5 years): Cannot add courses to Grade 12 Spring (Q3/Q4)', warning: null };
      }
    }
  }

  // === CTE PATHWAY MODE VALIDATIONS ===
  if (ctePathwayMode?.enabled && ctePathwayMode.pathway && ctePathways) {
    const pathway = ctePathways[ctePathwayMode.pathway];
    if (pathway) {
      const isPathwayCourse = pathway.courses.some(pc => courseName.includes(pc.name));
      if (isPathwayCourse) {
        const pathwayCourse = pathway.courses.find(pc => courseName.includes(pc.name));
        const currentGrade = parseInt(year);
        if (pathwayCourse && !pathwayCourse.grades.includes(currentGrade)) {
          warning = `CTE Pathway: ${pathwayCourse.name} is recommended for grades ${pathwayCourse.grades.join(', ')}`;
        }
      }
    }
  }

  // === AP CALCULUS AB/BC CONFLICT ===
  if (courseName.includes('AP CALCULUS')) {
    if (courseName.includes('CALCULUS AB')) {
      const hasBC = allCourses.some(c => {
        const info = courseCatalog[c.courseId];
        return info && info.full_name.toUpperCase().includes('AP CALCULUS BC');
      });
      if (hasBC) {
        return { valid: false, error: 'Cannot take AP Calculus AB and BC - choose one', warning: null };
      }
    } else if (courseName.includes('CALCULUS BC')) {
      const hasAB = allCourses.some(c => {
        const info = courseCatalog[c.courseId];
        return info && info.full_name.toUpperCase().includes('AP CALCULUS AB');
      });
      if (hasAB) {
        return { valid: false, error: 'Cannot take AP Calculus AB and BC - choose one', warning: null };
      }
    }
  }

  // === MATH PREREQUISITE VALIDATION ===
  // Check if student has the required math prerequisites
  if (courseInfo.pathway === 'Math') {
    const mathPrereqWarning = checkMathPrerequisites(courseName, allCourses, courseCatalog, parseInt(year));
    if (mathPrereqWarning) {
      warning = mathPrereqWarning;
    }
  }

  // === ENGLISH SEQUENCE VALIDATION ===
  if (courseInfo.pathway === 'English') {
    const allCourseInfos = allCourses.map(c => courseCatalog[c.courseId]);

    const isRegularEnglish12 = (courseName === 'ENGLISH 1-2' || courseName === 'ENGLISH IA-IB' ||
      courseName.startsWith('H. ENGLISH 1-2') || courseName.startsWith('HONORS ENGLISH 1-2'));

    if (isRegularEnglish12) {
      const hasHigherEnglish = allCourseInfos.some(c =>
        c && c.pathway === 'English' &&
        (c.full_name.toUpperCase().includes('ENGLISH 3-4') ||
          c.full_name.toUpperCase().includes('ENGLISH IIA-IIB') ||
          c.full_name.toUpperCase().includes('ENGLISH 5-6') ||
          c.full_name.toUpperCase().includes('ENGLISH 7-8'))
      );
      if (hasHigherEnglish) {
        return { valid: false, error: 'Cannot add English 1-2 after completing higher-level English courses', warning: null };
      }

      const hasEnglish34SameYear = allCourses.some(c =>
        c.year === year && courseCatalog[c.courseId] &&
        ['ENGLISH 3-4', 'H. ENGLISH 3-4', 'HONORS ENGLISH 3-4'].includes(
          courseCatalog[c.courseId].full_name.toUpperCase()
        )
      );
      if (hasEnglish34SameYear) {
        return { valid: false, error: 'Cannot take ENGLISH 1-2 and ENGLISH 3-4 in the same year', warning: null };
      }
    }

    const isRegularEnglish34 = (courseName === 'ENGLISH 3-4' || courseName === 'ENGLISH IIA-IIB' ||
      courseName.startsWith('H. ENGLISH 3-4') || courseName.startsWith('HONORS ENGLISH 3-4'));

    if (isRegularEnglish34) {
      const hasHigherEnglish = allCourseInfos.some(c =>
        c && c.pathway === 'English' &&
        (c.full_name.toUpperCase().includes('ENGLISH 5-6') ||
          c.full_name.toUpperCase().includes('ENGLISH 7-8'))
      );
      if (hasHigherEnglish) {
        return { valid: false, error: 'Cannot add English 3-4 after completing higher-level English courses', warning: null };
      }

      const hasEnglish12SameYear = allCourses.some(c =>
        c.year === year && courseCatalog[c.courseId] &&
        ['ENGLISH 1-2', 'H. ENGLISH 1-2', 'HONORS ENGLISH 1-2'].includes(
          courseCatalog[c.courseId].full_name.toUpperCase()
        )
      );
      if (hasEnglish12SameYear) {
        return { valid: false, error: 'Cannot take ENGLISH 3-4 and ENGLISH 1-2 in the same year', warning: null };
      }
    }
  }

  // === COURSE ELIGIBILITY CHECK ===
  if (checkCourseEligibility) {
    const eligibility = checkCourseEligibility(courseId, year);
    if (eligibility.warning && !eligibility.blocking) {
      warning = `${eligibility.warning}. Have you met the prerequisites?`;
    }
  }

  // === OFF-ROLL RESTRICTIONS ===
  if (courseInfo.pathway === 'Off-Roll') {
    if (currentSlot !== undefined && currentSlot !== 0 && currentSlot !== 3) {
      return { valid: false, error: 'Off-Roll courses can only be selected as the 1st or 4th class of the day', warning: null };
    }
    if (year === '10') {
      return { valid: false, error: 'Off-Roll courses are not allowed in Grade 10', warning: null };
    }
    const semesterOffRollCount = quarterCourses.filter(c => {
      const info = courseCatalog[c.courseId];
      return info && info.pathway === 'Off-Roll';
    }).length;
    const maxPerSemester = year === '12' ? 2 : 1;
    if (semesterOffRollCount >= maxPerSemester) {
      const msg = year === '12'
        ? 'Maximum 2 Off-Roll courses allowed per semester in Grade 12'
        : `Maximum 1 Off-Roll course allowed per semester in Grade ${year}`;
      return { valid: false, error: msg, warning: null };
    }
  }

  // === DUPLICATE COURSE CHECK ===
  const alreadyHasCourse = quarterCourses.some(c => c.courseId === courseId);
  if (alreadyHasCourse) {
    return { valid: false, error: 'This course is already in this semester', warning: null };
  }

  if (!allowRepeatCourses) {
    const alreadyHasCourseInSchedule = allCourses.some(c => c.courseId === courseId);
    if (alreadyHasCourseInSchedule) {
      return { valid: false, error: 'This course is already in your 4-year schedule. Enable "Allow Repeat Courses" in settings to override.', warning: null };
    }
  }

  // === PE CREDIT CAP ===
  if (courseInfo.pathway === 'Physical Education') {
    const totalPECredits = allCourses
      .filter(c => courseCatalog[c.courseId]?.pathway === 'Physical Education')
      .reduce((sum, c) => sum + courseCatalog[c.courseId].credits, 0);
    if (totalPECredits + courseInfo.credits > 40) {
      return { valid: false, error: 'Maximum 40 credits of Physical Education may be applied toward graduation', warning: null };
    }
  }

  // === ACADEMIC TUTOR / LIBRARY TA CREDIT CAP ===
  const isAcademicTutorOrLibrary = courseName.includes('ACADEMIC TUTOR') ||
    (courseName.includes('LIBRARY') && courseName.includes('ASSISTANT'));
  if (isAcademicTutorOrLibrary) {
    const totalTutorCredits = allCourses
      .filter(c => {
        const info = courseCatalog[c.courseId];
        if (!info) return false;
        const name = info.full_name.toUpperCase();
        return name.includes('ACADEMIC TUTOR') || (name.includes('LIBRARY') && name.includes('ASSISTANT'));
      })
      .reduce((sum, c) => sum + courseCatalog[c.courseId].credits, 0);
    if (totalTutorCredits + courseInfo.credits > 10) {
      return { valid: false, error: 'Maximum 10 credits from Academic Tutor or Library & Information Science TA', warning: null };
    }
  }

  // === SCHOOL SERVICE COURSE LIMIT ===
  const isSchoolService = courseName.includes('ACADEMIC TUTOR') ||
    (courseName.includes('LIBRARY') && courseName.includes('ASSISTANT')) ||
    courseName.includes('WORK EXPERIENCE') ||
    (courseName.includes('TEACHER') && courseName.includes('ASSISTANT'));
  if (isSchoolService) {
    const hasSchoolService = quarterCourses.some(c => {
      const info = courseCatalog[c.courseId];
      if (!info) return false;
      const name = info.full_name.toUpperCase();
      return name.includes('ACADEMIC TUTOR') ||
        (name.includes('LIBRARY') && name.includes('ASSISTANT')) ||
        name.includes('WORK EXPERIENCE') ||
        (name.includes('TEACHER') && name.includes('ASSISTANT'));
    });
    if (hasSchoolService) {
      return { valid: false, error: 'No more than one school service course per semester', warning: null };
    }
  }

  // === WORK EXPERIENCE RESTRICTIONS ===
  if (courseName.includes('WORK EXPERIENCE')) {
    if (courseInfo.credits > 10) {
      return { valid: false, error: 'Maximum 10 credits in Work Experience may be earned in one term', warning: null };
    }
    const hasOtherSchoolService = quarterCourses.some(c => {
      const info = courseCatalog[c.courseId];
      if (!info) return false;
      const name = info.full_name.toUpperCase();
      return !name.includes('WORK EXPERIENCE') && (
        name.includes('ACADEMIC TUTOR') ||
        (name.includes('LIBRARY') && name.includes('ASSISTANT')) ||
        (name.includes('TEACHER') && name.includes('ASSISTANT'))
      );
    });
    if (hasOtherSchoolService) {
      return { valid: false, error: 'Other school service classes may not be taken by students enrolled in Work Experience', warning: null };
    }
  }

  // === FOREIGN LANGUAGE SAME-SEMESTER RESTRICTION ===
  if (courseInfo.pathway === 'Foreign Language') {
    const isLiteratureCourse = courseName.includes('LITERATURE') || courseName.includes('LIT');
    if (!isLiteratureCourse) {
      let language = null;
      if (courseName.includes('SPANISH')) language = 'Spanish';
      else if (courseName.includes('CHINESE')) language = 'Chinese';
      else if (courseName.includes('FRENCH')) language = 'French';
      else if (courseName.includes('FILIPINO')) language = 'Filipino';
      else if (courseName.includes('GERMAN')) language = 'German';
      else if (courseName.includes('JAPANESE')) language = 'Japanese';
      else if (courseName.includes('LATIN')) language = 'Latin';

      if (language) {
        const hasSameLanguage = quarterCourses.some(c => {
          const cInfo = courseCatalog[c.courseId];
          if (!cInfo || cInfo.pathway !== 'Foreign Language') return false;
          const cName = cInfo.full_name.toUpperCase();
          const isLit = cName.includes('LITERATURE') || cName.includes('LIT');
          return !isLit && cName.includes(language.toUpperCase());
        });
        if (hasSameLanguage) {
          return { valid: false, error: `Cannot take two ${language} courses in the same semester`, warning: null };
        }
      }
    }
  }

  // === ROBOTICS CONSECUTIVE QUARTER VALIDATION ===
  if (courseName === 'ROBOTICS') {
    const roboticsCourses = yearCourses.filter(c =>
      courseCatalog[c.courseId]?.full_name === 'ROBOTICS'
    );
    const roboticsQuarters = roboticsCourses.map(c => c.quarter).sort();

    if (quarter !== 'Q1' && !roboticsQuarters.includes('Q1')) {
      return { valid: false, error: 'ROBOTICS must start in Q1. You can take it for 1-4 consecutive quarters.', warning: null };
    }
    if (roboticsQuarters.length > 0) {
      const allQuarters = [...roboticsQuarters, quarter].sort();
      const expectedSequence = ['Q1', 'Q2', 'Q3', 'Q4'].slice(0, allQuarters.length);
      const isConsecutive = allQuarters.every((q, i) => q === expectedSequence[i]);
      if (!isConsecutive) {
        return { valid: false, error: 'ROBOTICS must be taken in consecutive quarters starting from Q1', warning: null };
      }
    }
  }

  // === SEMESTER CREDIT WARNING ===
  // Warn if semester will exceed 40 credits
  const isFall = quarter === 'Q1' || quarter === 'Q2';
  const semesterQuarters = isFall ? ['Q1', 'Q2'] : ['Q3', 'Q4'];
  const semesterCourses = allCourses.filter(c =>
    c.year === year && semesterQuarters.includes(c.quarter)
  );
  const uniqueSemesterCourseIds = [...new Set(semesterCourses.map(c => c.courseId))];
  const semesterCredits = uniqueSemesterCourseIds.reduce((sum, id) => {
    const info = courseCatalog[id];
    return sum + (info?.credits || 0);
  }, 0);
  const newCredits = courseInfo.credits || 0;
  if (semesterCredits + newCredits > 40) {
    const semesterName = isFall ? 'Fall' : 'Spring';
    warning = `Adding this course will put you at ${semesterCredits + newCredits} credits in ${semesterName}. Maximum recommended is 40.`;
  }

  // === TERM REQUIREMENTS VALIDATION ===
  if (getTermRequirements && canScheduleInSemester && getCoursesForQuarter) {
    const termReqs = getTermRequirements(courseId);

    if (termReqs.type === 'yearlong' && (quarter === 'Q3' || quarter === 'Q4')) {
      return { valid: false, error: 'Year-long courses must start in Fall term (Q1 or Q2)', warning: null };
    }

    if (termReqs.type === 'yearlong' && (quarter === 'Q1' || quarter === 'Q2')) {
      const springQ3Courses = getCoursesForQuarter(year, 'Q3');
      const springQ4Courses = getCoursesForQuarter(year, 'Q4');
      const alreadyInSpring = [...springQ3Courses, ...springQ4Courses].some(c => c.courseId === courseId);
      if (alreadyInSpring) {
        return { valid: false, error: 'This year-long course is already in Spring term', warning: null };
      }
    }

    if (termReqs.type === 'semester') {
      const currentTermQuarters = (quarter === 'Q1' || quarter === 'Q2') ? ['Q1', 'Q2'] : ['Q3', 'Q4'];
      const alreadyInTerm = currentTermQuarters.some(q => {
        const qCourses = getCoursesForQuarter(year, q);
        return qCourses.some(c => c.courseId === courseId);
      });
      if (alreadyInTerm) {
        const termName = (quarter === 'Q1' || quarter === 'Q2') ? 'Fall' : 'Spring';
        return { valid: false, error: `This course is already scheduled in ${termName} term`, warning: null };
      }
    }

    const semesterName = (quarter === 'Q1' || quarter === 'Q2') ? 'fall' : 'spring';
    if (!canScheduleInSemester(courseId, semesterName)) {
      const termName = (quarter === 'Q1' || quarter === 'Q2') ? 'Fall' : 'Spring';
      return { valid: false, error: `This course is not offered in ${termName} term (${quarter})`, warning: null };
    }
  }

  return { valid: true, error: null, warning };
}

/**
 * Check math prerequisites and return warning if missing
 * Math sequence: Math I → Math II → Math III → Pre-Calc/Advanced Functions → Calculus
 *
 * @param {string} courseName - Uppercase course name
 * @param {Array} allCourses - All scheduled courses
 * @param {Object} courseCatalog - Course catalog
 * @param {number} targetYear - Year being added to
 * @returns {string|null} - Warning message or null
 */
function checkMathPrerequisites(courseName, allCourses, courseCatalog, targetYear) {
  // Helper to check if student has a math course in schedule (in prior years)
  const hasMathCourse = (pattern) => {
    return allCourses.some(c => {
      if (parseInt(c.year) >= targetYear) return false; // Must be from prior year
      const info = courseCatalog[c.courseId];
      if (!info || info.pathway !== 'Math') return false;
      return info.full_name.toUpperCase().includes(pattern);
    });
  };

  // Also check same year but earlier semester (Fall before Spring)
  const hasMathCourseThisYear = (pattern) => {
    return allCourses.some(c => {
      if (parseInt(c.year) !== targetYear) return false;
      const info = courseCatalog[c.courseId];
      if (!info || info.pathway !== 'Math') return false;
      return info.full_name.toUpperCase().includes(pattern);
    });
  };

  // Math II requires Math I
  if (courseName.includes('MATHEMATICS II') || courseName.includes('MATH II')) {
    if (!hasMathCourse('MATHEMATICS I') && !hasMathCourse('MATH I')) {
      return 'Math II typically requires Math I. Have you completed Math I?';
    }
  }

  // Math III requires Math II
  if (courseName.includes('MATHEMATICS III') || courseName.includes('MATH III')) {
    const hasMathII = hasMathCourse('MATHEMATICS II') || hasMathCourse('MATH II');
    if (!hasMathII) {
      return 'Math III typically requires Math II. Have you completed Math II?';
    }
  }

  // Pre-Calculus / Advanced Functions requires Math III
  if (courseName.includes('PRE-CALC') || courseName.includes('PRECALC') ||
      courseName.includes('ADVANCED FUNCTIONS')) {
    const hasMathIII = hasMathCourse('MATHEMATICS III') || hasMathCourse('MATH III');
    if (!hasMathIII) {
      return 'Pre-Calculus requires Math III. Have you completed Math III?';
    }
  }

  // AP Calculus AB requires Pre-Calc or Advanced Functions
  if (courseName.includes('AP CALCULUS AB')) {
    const hasPreCalc = hasMathCourse('PRE-CALC') || hasMathCourse('PRECALC') ||
                       hasMathCourse('ADVANCED FUNCTIONS') ||
                       hasMathCourseThisYear('PRE-CALC') || hasMathCourseThisYear('PRECALC');
    if (!hasPreCalc) {
      return 'AP Calculus AB requires Pre-Calculus. Have you completed Pre-Calculus?';
    }
  }

  // AP Calculus BC requires Pre-Calc (or Calc AB for some students)
  if (courseName.includes('AP CALCULUS BC')) {
    const hasPreCalc = hasMathCourse('PRE-CALC') || hasMathCourse('PRECALC') ||
                       hasMathCourse('ADVANCED FUNCTIONS') ||
                       hasMathCourse('CALCULUS AB') ||
                       hasMathCourseThisYear('PRE-CALC') || hasMathCourseThisYear('PRECALC');
    if (!hasPreCalc) {
      return 'AP Calculus BC requires Pre-Calculus or Calculus AB. Have you completed Pre-Calculus?';
    }
  }

  // AP Statistics requires Math II (minimum)
  if (courseName.includes('AP STATISTICS')) {
    const hasMathII = hasMathCourse('MATHEMATICS II') || hasMathCourse('MATH II') ||
                      hasMathCourse('MATHEMATICS III') || hasMathCourse('MATH III');
    if (!hasMathII) {
      return 'AP Statistics requires at least Math II. Have you completed Math II?';
    }
  }

  return null;
}
