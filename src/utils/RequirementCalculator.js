/**
 * RequirementCalculator.js
 *
 * Computes unmet graduation requirements (Westview + UC/CSU A-G).
 * Integrates with existing requirement tracking logic from App.jsx.
 *
 * This REPLACES the scattered requirement checks in generateCourseSuggestions()
 * with a unified calculator that matches the sidebar progress display.
 */

export class RequirementCalculator {
  constructor(courses, courseCatalog, westviewReqs, agReqs) {
    this.courses = courses;
    this.catalog = courseCatalog;
    this.westviewReqs = westviewReqs;
    this.agReqs = agReqs;
  }

  /**
   * Compute unmet Westview requirements for a specific year
   * @param {string} year - '9', '10', '11', or '12'
   * @returns {Object} - { needsEnglish, needsMath, needsHistory, needsScience, needsPE }
   */
  getUnmetWestview(year) {
    const yearCourses = this.courses.filter(c => c.year === year);

    return {
      needsEnglish: !this.hasPathway(yearCourses, 'English'),
      needsMath: !this.hasPathway(yearCourses, 'Math'),
      needsHistory: !this.hasPathway(yearCourses, 'History/Social Science'),
      needsScience: !this.hasPathway(yearCourses, ['Science - Biological', 'Science - Physical']),
      needsPE: this.checkPERequirement(year, yearCourses)
    };
  }

  /**
   * Compute unmet UC/CSU A-G requirements across all years
   * @returns {Array<string>} - Array of A-G category letters that need more courses (e.g., ['A', 'E'])
   */
  getUnmetAG() {
    const gaps = [];

    for (const [category, requirement] of Object.entries(this.agReqs)) {
      const relevantCourses = this.courses.filter(c => {
        const info = this.catalog[c.courseId];
        return info && info.uc_csu_category === category;
      });

      // Count years fulfilled (each yearlong course = 1 year)
      const yearsFulfilled = relevantCourses.length;
      const yearsRequired = requirement.needed || requirement.years || 0;

      if (yearsFulfilled < yearsRequired) {
        gaps.push(category);
      }
    }

    return gaps;
  }

  /**
   * Check if year has any course in given pathway(s)
   * @param {Array} courses - Year's courses
   * @param {string|Array<string>} pathways - Pathway(s) to check
   * @returns {boolean}
   */
  hasPathway(courses, pathways) {
    const pathwayArray = Array.isArray(pathways) ? pathways : [pathways];

    return courses.some(c => {
      const info = this.catalog[c.courseId];
      return info && pathwayArray.includes(info.pathway);
    });
  }

  /**
   * Check PE requirement for specific year
   * @param {string} year - '9', '10', '11', or '12'
   * @param {Array} yearCourses - Courses in this year
   * @returns {boolean} - true if PE is needed, false if already fulfilled
   */
  checkPERequirement(year, yearCourses) {
    const yearInt = parseInt(year);

    // Grade 9: Need PE in BOTH Fall and Spring
    if (yearInt === 9) {
      const fallCourses = yearCourses.filter(c => c.quarter === 'Q1' || c.quarter === 'Q2');
      const springCourses = yearCourses.filter(c => c.quarter === 'Q3' || c.quarter === 'Q4');

      const hasPEInFall = this.hasPathway(fallCourses, 'Physical Education');
      const hasPEInSpring = this.hasPathway(springCourses, 'Physical Education');

      // Return true if EITHER term is missing PE
      return !hasPEInFall || !hasPEInSpring;
    }

    // Grade 10-11: No PE required
    if (yearInt === 10 || yearInt === 11) {
      return false;
    }

    // Grade 12: Need one PE class for the year
    if (yearInt === 12) {
      return !this.hasPathway(yearCourses, 'Physical Education');
    }

    return false;
  }

  /**
   * Get specific PE requirement details for Grade 9
   * @param {Array} yearCourses - Grade 9 courses
   * @returns {Object} - { needsFallPE, needsSpringPE }
   */
  getGrade9PEDetails(yearCourses) {
    const fallCourses = yearCourses.filter(c => c.quarter === 'Q1' || c.quarter === 'Q2');
    const springCourses = yearCourses.filter(c => c.quarter === 'Q3' || c.quarter === 'Q4');

    return {
      needsFallPE: !this.hasPathway(fallCourses, 'Physical Education'),
      needsSpringPE: !this.hasPathway(springCourses, 'Physical Education')
    };
  }

  /**
   * Check if Foreign Language requirement is met for UC/CSU A-G
   * (Needed for Foreign Language continuity logic)
   * @returns {Object} - { hasAnyLanguage, language, highestLevel }
   */
  getForeignLanguageStatus() {
    const languageCourses = this.courses.filter(c => {
      const info = this.catalog[c.courseId];
      return info && info.pathway === 'Foreign Language';
    });

    if (languageCourses.length === 0) {
      return { hasAnyLanguage: false, language: null, highestLevel: 0 };
    }

    // Extract language from first course
    const firstCourse = this.catalog[languageCourses[0].courseId];
    const language = this.extractLanguage(firstCourse.full_name);

    // Find highest level taken
    let highestLevel = 0;
    for (const c of languageCourses) {
      const info = this.catalog[c.courseId];
      if (this.extractLanguage(info.full_name) === language) {
        const level = this.getLevelNumber(info.full_name);
        if (level > highestLevel) highestLevel = level;
      }
    }

    return { hasAnyLanguage: true, language, highestLevel };
  }

  /**
   * Extract language name from course title
   * @param {string} courseName - e.g., "SPANISH 3-4" or "CHINESE MANDARIN 1-2"
   * @returns {string} - e.g., "SPANISH" or "CHINESE MANDARIN"
   */
  extractLanguage(courseName) {
    const words = courseName.toUpperCase().split(' ');

    // Multi-word languages (e.g., "CHINESE MANDARIN")
    if (words.length > 1 && words[1].match(/^[A-Z]+$/)) {
      return `${words[0]} ${words[1]}`;
    }

    // Single-word languages (e.g., "SPANISH")
    return words[0];
  }

  /**
   * Extract level number from course name
   * @param {string} name - e.g., "SPANISH 3-4"
   * @returns {number} - e.g., 3
   */
  getLevelNumber(name) {
    const match = name.match(/(\d+)-(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }
}
