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
  'AVID_12_0015': { requires: 'HIGH_SCHOOL_0003', name: 'English 1-2' },
  'AVID_34_0015': { requires: 'HIGH_SCHOOL', name: 'English 3-4' },
  'AVID_56_0015': { requires: 'UNITED_STATES_0013', name: 'US History 1-2' },

  // AP CS A group - must have at least one partner
  'AP_COMPUTER_0010': {
    requiresOneOf: ['COMPUTER_SCIENCE_0009', 'DATA_STRUCTURES_0010', 'STUDIO_ART_0003'],
    names: ['Computer Science & Software Engineering 1-2', 'Data Structures 1-2', 'Studio Art 1-2: Graphic Design']
  },
  'COMPUTER_SCIENCE_0009': { requires: 'AP_COMPUTER_0010', name: 'AP Computer Science A 1-2' },
  'DATA_STRUCTURES_0010': { requires: 'AP_COMPUTER_0010', name: 'AP Computer Science A 1-2' },
  'STUDIO_ART_0003': { requires: 'AP_COMPUTER_0010', name: 'AP Computer Science A 1-2' },

  // Bidirectional required pairs
  'HON_SPANISH_0004': { requires: 'AP_SPANISH_0004', name: 'AP Spanish Language 1-2' },
  'AP_SPANISH_0004': { requires: 'HON_SPANISH_0004', name: 'Honors Spanish 7-8' },
  'AP_PRECALCULUS_0010': { requires: 'AP_CALCULUS_0010', name: 'AP Calculus AB 1-2' },
  'AP_CALCULUS_0010': { requires: 'AP_PRECALCULUS_0010', name: 'AP Pre-Calculus 1-2' },
  'BRITISH_LITERATURE_0003': { requires: 'AP_ENGLISH', name: 'AP English Literature 1-2' },
  'AP_ENGLISH': { requires: 'BRITISH_LITERATURE_0003', name: 'British Literature 1-2' },
  'HON_AMERICAN_0003': { requires: 'AP_UNITED', name: 'AP United States History 1-2' },
  'AP_UNITED': { requires: 'HON_AMERICAN_0003', name: 'Honors American Literature 1-2' },
  'AP_PHYSICS_0001': { requires: 'AP_PHYSICS', name: 'AP Physics C: Electricity & Magnetism 1-2' },
  'AP_PHYSICS': { requires: 'AP_PHYSICS_0001', name: 'AP Physics C: Mechanics 1-2' },
  'HON_BIOLOGY_0012': { requires: 'AP_BIOLOGY_0012', name: 'AP Biology 3-4' },
  'AP_BIOLOGY_0012': { requires: 'HON_BIOLOGY_0012', name: 'Honors Biology 1-2' },
  'HON_CHEMISTRY_0012': { requires: 'AP_CHEMISTRY_0012', name: 'AP Chemistry 3-4' },
  'AP_CHEMISTRY_0012': { requires: 'HON_CHEMISTRY_0012', name: 'Honors Chemistry 1-2' },
  'HON_WORLD_0013': { requires: 'AP_WORLD_0013', name: 'AP World History 1-2' },
  'AP_WORLD_0013': { requires: 'HON_WORLD_0013', name: 'Honors World History 1-2' },
  'COLLEGE_ALGEBRA_0010': { requires: 'AP_STATISTICS_0010', name: 'AP Statistics 1-2' },
  'STATISTICS_0010': { requires: 'AP_STATISTICS_0010', name: 'AP Statistics 1-2' },
  'AP_STATISTICS_0010': {
    requiresOneOf: ['COLLEGE_ALGEBRA_0010', 'STATISTICS_0010'],
    names: ['College Algebra 1', 'Statistics']
  },
  'STUDIO_ART_0001': { requires: 'AP_STUDIO', name: 'AP Studio Art 3D: Ceramics' },
  'AP_STUDIO': { requires: 'STUDIO_ART_0001', name: 'Studio Art 1-2: Ceramics' },
  'STUDIO_ART_0002': { requires: 'AP_STUDIO_0002', name: 'AP Studio Art: Drawing & Painting' },
  'AP_STUDIO_0002': { requires: 'STUDIO_ART_0002', name: 'Studio Art 1-2: Drawing & Painting' },
  'STUDIO_ART': { requires: 'AP_STUDIO_0001', name: 'AP Studio Art 2D: Photography' },
  'AP_STUDIO_0001': { requires: 'STUDIO_ART', name: 'Studio Art 1-2: Digital Photography' },
  'MARCHING_PE_0011': { requires: 'DANCE_PROP_0011', name: 'Dance Prop (Tall Flags)' },
  'DANCE_PROP_0011': { requires: 'MARCHING_PE_0011', name: 'Marching PE Flags/Tall Flags' },
};

/**
 * Course hierarchies where higher courses satisfy lower prereqs
 */
const COURSE_HIERARCHIES = [
  // Math
  ['INTEGRATED_MATHEMATICS_0010', 'INTEGRATED_MATHEMATICS', 'INTEGRATED_MATHEMATICS_0001',
   'AP_PRECALCULUS_0010', 'AP_CALCULUS_0010', 'AP_CALCULUS'],
  // Physics
  ['PHYSICS_OF_0012', 'AP_PHYSICS_0012', 'AP_PHYSICS_0001', 'AP_PHYSICS'],
  // Chemistry
  ['CHEMISTRY_IN_0012', 'HON_CHEMISTRY_0012', 'AP_CHEMISTRY_0012'],
  // Biology
  ['BIOLOGY_OF_0012', 'HON_BIOLOGY_0012', 'AP_BIOLOGY_0012'],
  // English
  ['HIGH_SCHOOL_0003', 'HIGH_SCHOOL'],
];

/**
 * Equivalent courses (either satisfies the prereq)
 */
const EQUIVALENT_COURSES = {
  'HIGH_SCHOOL_0003': ['HON_HIGH_0003'],
  'HIGH_SCHOOL': ['HON_HUMANITIES_0003'],
  'AMERICAN_LITERATURE_0003': ['HON_AMERICAN_0003'],
  'BIOLOGY_OF_0012': ['HON_BIOLOGY_0012'],
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
