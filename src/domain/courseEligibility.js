/**
 * Course Eligibility Checking
 *
 * Validates prerequisites and linked course requirements.
 */

/**
 * Linked course requirements configuration
 * These are BLOCKING requirements - course cannot be added without partner
 */
const LINKED_REQUIREMENTS = {
  // AVID courses require English/History
  '001595-001596': { requires: '000301-000302', name: 'English 1-2' },
  '001597-001598': { requires: '000310-000311', name: 'English 3-4' },
  '001599-001600': { requires: '001376-001377', name: 'US History 1-2' },

  // AP CS A group - must have at least one partner
  '001056-001057': {
    requiresOneOf: ['000971-000972', '001072-001073', '000150'],
    names: ['Computer Science & Software Engineering 1-2', 'Data Structures 1-2', 'Studio Art 1-2: Graphic Design']
  },
  '000971-000972': { requires: '001056-001057', name: 'AP Computer Science A 1-2' },
  '001072-001073': { requires: '001056-001057', name: 'AP Computer Science A 1-2' },
  '000150': { requires: '001056-001057', name: 'AP Computer Science A 1-2' },

  // Bidirectional required pairs
  '000496-000497': { requires: '000484-000485', name: 'AP Spanish Language 1-2' },
  '000484-000485': { requires: '000496-000497', name: 'Honors Spanish 7-8' },
  '001085-001086': { requires: '001060-001061', name: 'AP Calculus AB 1-2' },
  '001060-001061': { requires: '001085-001086', name: 'AP Pre-Calculus 1-2' },
  '000384-000385': { requires: '000370-000371', name: 'AP English Literature 1-2' },
  '000370-000371': { requires: '000384-000385', name: 'British Literature 1-2' },
  '000382-000383': { requires: '001382-001383', name: 'AP United States History 1-2' },
  '001382-001383': { requires: '000382-000383', name: 'Honors American Literature 1-2' },
  '001262-001263': { requires: '001264-001265', name: 'AP Physics C: Electricity & Magnetism 1-2' },
  '001264-001265': { requires: '001262-001263', name: 'AP Physics C: Mechanics 1-2' },
  '001228-001229': { requires: '001232-001233', name: 'AP Biology 3-4' },
  '001232-001233': { requires: '001228-001229', name: 'Honors Biology 1-2' },
  '001238-001239': { requires: '001242-001243', name: 'AP Chemistry 3-4' },
  '001242-001243': { requires: '001238-001239', name: 'Honors Chemistry 1-2' },
  '001305-001306': { requires: '001307-001308', name: 'AP World History 1-2' },
  '001307-001308': { requires: '001305-001306', name: 'Honors World History 1-2' },
  '001054': { requires: '001064-001065', name: 'AP Statistics 1-2' },
  '001039': { requires: '001064-001065', name: 'AP Statistics 1-2' },
  '001064-001065': {
    requiresOneOf: ['001054', '001039'],
    names: ['College Algebra 1', 'Statistics']
  },
  '000150': { requires: '000159-000160', name: 'AP Studio Art 3D: Ceramics' },
  '000159-000160': { requires: '000150', name: 'Studio Art 1-2: Ceramics' },
  '000150': { requires: '000151-000152', name: 'AP Studio Art: Drawing & Painting' },
  '000151-000152': { requires: '000150', name: 'Studio Art 1-2: Drawing & Painting' },
  '000150': { requires: '000157-000158', name: 'AP Studio Art 2D: Photography' },
  '000157-000158': { requires: '000150', name: 'Studio Art 1-2: Digital Photography' },
  '001199-001193': { requires: '001193-001194', name: 'Dance Prop (Tall Flags)' },
  '001193-001194': { requires: '001199-001193', name: 'Marching PE Flags/Tall Flags' },
};

/**
 * Course hierarchies where higher courses satisfy lower prereqs
 */
const COURSE_HIERARCHIES = [
  // Math
  ['001012-001013', '001016-001017', '001018-001019',
   '001085-001086', '001060-001061', '001062-001063'],
  // Physics
  ['001248-001249', '001216-001217', '001262-001263', '001264-001265'],
  // Chemistry
  ['001246-001247', '001238-001239', '001242-001243'],
  // Biology
  ['001236-001237', '001228-001229', '001232-001233'],
  // English
  ['000301-000302', '000310-000311'],
];

/**
 * Equivalent courses (either satisfies the prereq)
 */
const EQUIVALENT_COURSES = {
  '000301-000302': ['000303-000304'],
  '000310-000311': ['000313-000314'],
  '000387-000388': ['000382-000383'],
  '001236-001237': ['001228-001229'],
};

/**
 * Foreign language level prerequisites
 */
const FL_PREVIOUS_LEVELS = {
  '3-4': ['1-2'],
  '5-6': ['1-2', '3-4'],
  '7-8': ['1-2', '3-4', '5-6'],
  '9-10': ['1-2', '3-4', '5-6', '7-8']
};

/**
 * Detect language from course name
 */
function detectLanguage(courseName) {
  const name = courseName.toUpperCase();
  if (name.includes('SPANISH')) return 'SPANISH';
  if (name.includes('CHINESE')) return 'CHINESE';
  if (name.includes('FRENCH')) return 'FRENCH';
  if (name.includes('FILIPINO')) return 'FILIPINO';
  if (name.includes('GERMAN')) return 'GERMAN';
  if (name.includes('JAPANESE')) return 'JAPANESE';
  if (name.includes('LATIN')) return 'LATIN';
  return null;
}

/**
 * Detect foreign language level from course name
 */
function detectLevel(courseName) {
  const levelPatterns = ['1-2', '3-4', '5-6', '7-8', '9-10'];
  for (const pattern of levelPatterns) {
    if (courseName.includes(pattern)) {
      return pattern;
    }
  }
  return null;
}

/**
 * Check for missing foreign language prerequisites
 *
 * @param {string} courseId - Course to check
 * @param {Array} courses - All scheduled courses
 * @param {Object} courseCatalog - Course catalog
 * @returns {Object|null} - Missing prereqs info or null
 */
export function checkForeignLanguagePrereqs(courseId, courses, courseCatalog) {
  const courseInfo = courseCatalog[courseId];
  if (!courseInfo || courseInfo.pathway !== 'Foreign Language') {
    return null;
  }

  const courseName = courseInfo.full_name.toUpperCase();
  const language = detectLanguage(courseName);
  if (!language) return null;

  const level = detectLevel(courseName);
  if (!level || level === '1-2') return null;

  const requiredLevels = FL_PREVIOUS_LEVELS[level] || [];
  const scheduledCourses = courses.map(c => courseCatalog[c.courseId]?.full_name?.toUpperCase() || '');

  const missingLevels = requiredLevels.filter(reqLevel => {
    const hasLevel = scheduledCourses.some(name =>
      name.includes(language) && name.includes(reqLevel)
    );
    return !hasLevel;
  });

  if (missingLevels.length > 0) {
    return {
      language: language.charAt(0) + language.slice(1).toLowerCase(),
      currentLevel: level,
      missingLevels: missingLevels
    };
  }

  return null;
}

/**
 * Check if a prerequisite is satisfied (including higher courses)
 */
function isPrereqSatisfied(prereqId, completedCourseIds) {
  if (completedCourseIds.has(prereqId)) return true;

  // Check equivalents first
  if (EQUIVALENT_COURSES[prereqId]) {
    for (const equivId of EQUIVALENT_COURSES[prereqId]) {
      if (completedCourseIds.has(equivId)) return true;
    }
  }

  // Check hierarchies
  for (const hierarchy of COURSE_HIERARCHIES) {
    const prereqIndex = hierarchy.indexOf(prereqId);
    if (prereqIndex === -1) continue;
    for (let i = prereqIndex + 1; i < hierarchy.length; i++) {
      if (completedCourseIds.has(hierarchy[i])) return true;
    }
  }
  return false;
}

/**
 * Check if student is eligible for a course
 *
 * @param {string} courseId - Course to check
 * @param {string} targetYear - Year course would be taken
 * @param {Array} courses - All scheduled courses
 * @param {Object} courseCatalog - Course catalog
 * @returns {Object} - { eligible: boolean, warning: string|null, blocking: boolean }
 */
export function checkCourseEligibility(courseId, targetYear, courses, courseCatalog) {
  const courseInfo = courseCatalog[courseId];
  if (!courseInfo) return { eligible: true, warning: null, blocking: false };

  const yearCourses = courses.filter(c => c.year === targetYear);

  // Check Foreign Language prerequisites (warning only, not blocking)
  if (courseInfo.pathway === 'Foreign Language') {
    const flPrereqCheck = checkForeignLanguagePrereqs(courseId, courses, courseCatalog);
    if (flPrereqCheck) {
      return {
        eligible: true,
        warning: `${flPrereqCheck.language} ${flPrereqCheck.currentLevel} typically requires: ${flPrereqCheck.missingLevels.join(', ')}`,
        blocking: false
      };
    }
  }

  // Check recommended prerequisites (warning only, not blocking)
  const recommendedPrereqs = courseInfo.prerequisites_recommended_ids || [];
  if (recommendedPrereqs.length > 0) {
    const completedCourseIds = new Set();
    const targetYearInt = parseInt(targetYear);

    for (const c of courses) {
      const cYearInt = parseInt(c.year);
      if (cYearInt < targetYearInt) {
        completedCourseIds.add(c.courseId);
      }
    }

    const missingPrereqs = recommendedPrereqs.filter(id => !isPrereqSatisfied(id, completedCourseIds));
    if (missingPrereqs.length > 0) {
      const missingNames = missingPrereqs
        .map(id => courseCatalog[id]?.full_name || id)
        .join(', ');
      return {
        eligible: true,
        warning: `${courseInfo.full_name} typically requires: ${missingNames}`,
        blocking: false
      };
    }
  }

  // Check linked course requirements (these ARE blocking)
  if (LINKED_REQUIREMENTS[courseId]) {
    const requirement = LINKED_REQUIREMENTS[courseId];

    // Handle "requires one of"
    if (requirement.requiresOneOf) {
      const hasAnyPartner = requirement.requiresOneOf.some(partnerId =>
        yearCourses.some(c => c.courseId === partnerId)
      );

      if (!hasAnyPartner) {
        const partnerNames = requirement.names.join(', or ');
        return {
          eligible: false,
          warning: `${courseInfo.full_name} must be taken with one of: ${partnerNames}`,
          blocking: true
        };
      }
    }
    // Handle standard single requirement
    else if (requirement.requires) {
      const hasRequiredCourse = yearCourses.some(c => c.courseId === requirement.requires);

      if (!hasRequiredCourse) {
        return {
          eligible: false,
          warning: `${courseInfo.full_name} must be taken with ${requirement.name}`,
          blocking: true
        };
      }
    }
  }

  // All checks passed
  return { eligible: true, warning: null, blocking: false };
}

// Export configurations for testing
export { LINKED_REQUIREMENTS, COURSE_HIERARCHIES, EQUIVALENT_COURSES };
