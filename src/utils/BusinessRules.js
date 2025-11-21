/**
 * BusinessRules.js
 *
 * Validation checks applied AFTER scoring/ranking.
 * Ensures suggestions comply with business constraints:
 * - No two Fine Arts in same term
 * - Foreign Language continuity (stick to one language)
 * - Yearlong courses only in Fall
 * - No duplicates
 */

export class BusinessRules {
  constructor(courses, suggestions, catalog, term, year, preferredLanguage = null) {
    this.courses = courses;
    this.suggestions = suggestions;
    this.catalog = catalog;
    this.term = term;
    this.year = year;
    this.preferredLanguage = preferredLanguage;
    this.termQuarters = term === 'fall' ? ['Q1', 'Q2'] : ['Q3', 'Q4'];
  }

  /**
   * Check if a course can be added to suggestions
   * @param {Object} course - Course to validate
   * @returns {boolean} - true if allowed, false if blocked by business rule
   */
  canAddCourse(course) {
    return (
      this.checkAPGrade9Restriction(course) &&
      this.checkOffRollYearRestriction(course) &&
      this.checkPETotalLimit(course) &&
      this.checkFineArtsLimit(course) &&
      this.checkPELimit(course) &&
      this.checkEnglishLimit(course) &&
      this.checkMathLimit(course) &&
      this.checkScienceLimit(course) &&
      this.checkHistoryLimit(course) &&
      this.checkIntegratedMathLimit(course) &&
      this.checkPreferredLanguage(course) &&
      this.checkForeignLanguageConsistency(course) &&
      this.checkYearlongTermPlacement(course) &&
      this.checkDuplicates(course) &&
      this.checkSameSemesterLanguageLimit(course) &&
      this.checkCalcBCReviewRequiresConcurrent(course)
    );
  }

  /**
   * RULE: Calculus BC Review can only be suggested if AP Calc BC is also in this term
   * BC Review is a 5th class that requires concurrent enrollment in AP Calc BC
   * @param {Object} course
   * @returns {boolean}
   */
  checkCalcBCReviewRequiresConcurrent(course) {
    // Only apply to BC Review course
    if (!course.full_name.toUpperCase().includes('CALCULUS BC REVIEW')) return true;

    // BC Review is Fall only
    if (this.term !== 'fall') return false;

    // Check if AP Calculus BC is already in this term's courses OR in suggestions
    const hasAPCalcBCInCourses = this.courses.some(c => {
      const info = this.catalog[c.courseId];
      if (!info) return false;
      const inThisTerm = c.year === this.year && this.termQuarters.includes(c.quarter);
      return inThisTerm && info.full_name.toUpperCase().includes('AP CALCULUS BC');
    });

    const hasAPCalcBCInSuggestions = this.suggestions.some(s => {
      const info = this.catalog[s.courseId];
      if (!info) return false;
      return info.full_name.toUpperCase().includes('AP CALCULUS BC');
    });

    return hasAPCalcBCInCourses || hasAPCalcBCInSuggestions;
  }

  /**
   * RULE: If user has set a preferred language, only suggest that language
   * @param {Object} course
   * @returns {boolean}
   */
  checkPreferredLanguage(course) {
    // Only apply to Foreign Language courses
    if (course.pathway !== 'Foreign Language') return true;

    // If no preference set, allow all languages
    if (!this.preferredLanguage) return true;

    // Check if course name contains the preferred language
    const courseNameUpper = course.full_name.toUpperCase();
    const preferredUpper = this.preferredLanguage.toUpperCase();

    return courseNameUpper.includes(preferredUpper);
  }

  /**
   * RULE: Never suggest AP courses in Grade 9
   * @param {Object} course
   * @returns {boolean}
   */
  checkAPGrade9Restriction(course) {
    const yearInt = parseInt(this.year);
    if (yearInt !== 9) return true; // Only restrict for Grade 9

    const courseNameUpper = course.full_name.toUpperCase();
    return !courseNameUpper.includes('AP');
  }

  /**
   * RULE: Never suggest Off-Roll courses in Grades 9-11
   * Off-Roll courses are only appropriate for Grade 12
   * @param {Object} course
   * @returns {boolean}
   */
  checkOffRollYearRestriction(course) {
    if (course.pathway !== 'Off-Roll') return true;

    const yearInt = parseInt(this.year);
    // Only allow Off-Roll suggestions in Grade 12
    return yearInt === 12;
  }

  /**
   * RULE: Maximum 3 PE courses total across all 4 years
   * @param {Object} course
   * @returns {boolean}
   */
  checkPETotalLimit(course) {
    if (course.pathway !== 'Physical Education') return true;

    // Count PE courses already in schedule
    const peCourses = this.courses.filter(c => {
      const info = this.catalog[c.courseId];
      return info && info.pathway === 'Physical Education';
    });

    // Count PE courses already in suggestions
    const peInSuggestions = this.suggestions.filter(s => {
      const info = this.catalog[s.courseId];
      return info && info.pathway === 'Physical Education';
    });

    const totalPE = peCourses.length + peInSuggestions.length;

    // Maximum 3 PE courses total
    return totalPE < 3;
  }

  /**
   * RULE: Never suggest two Fine Arts in the same term
   * @param {Object} course
   * @returns {boolean}
   */
  checkFineArtsLimit(course) {
    if (course.pathway !== 'Fine Arts') return true;

    // Check existing courses in this term
    const termCourses = this.courses.filter(c =>
      c.year === this.year && this.termQuarters.includes(c.quarter)
    );

    const hasFineArtsInTerm = termCourses.some(c =>
      this.catalog[c.courseId]?.pathway === 'Fine Arts'
    );

    // Check already suggested courses for this term
    const hasFineArtsInSuggestions = this.suggestions.some(s =>
      this.catalog[s.courseId]?.pathway === 'Fine Arts'
    );

    return !hasFineArtsInTerm && !hasFineArtsInSuggestions;
  }

  /**
   * RULE: Never suggest two PE/ENS courses in the same term
   * @param {Object} course
   * @returns {boolean}
   */
  checkPELimit(course) {
    if (course.pathway !== 'Physical Education') return true;

    // Check existing courses in this term
    const termCourses = this.courses.filter(c =>
      c.year === this.year && this.termQuarters.includes(c.quarter)
    );

    const hasPEInTerm = termCourses.some(c =>
      this.catalog[c.courseId]?.pathway === 'Physical Education'
    );

    // Check already suggested courses for this term
    const hasPEInSuggestions = this.suggestions.some(s =>
      this.catalog[s.courseId]?.pathway === 'Physical Education'
    );

    return !hasPEInTerm && !hasPEInSuggestions;
  }

  /**
   * RULE: Only one English course per YEAR (students take one English per year)
   * @param {Object} course
   * @returns {boolean}
   */
  checkEnglishLimit(course) {
    if (course.pathway !== 'English') return true;

    // Check entire year - English is required once per year, not per semester
    const yearCourses = this.courses.filter(c => c.year === this.year);

    const hasEnglishInYear = yearCourses.some(c =>
      this.catalog[c.courseId]?.pathway === 'English'
    );

    // Check all suggestions for this year
    const hasEnglishInYearSuggestions = this.suggestions.some(s =>
      s.year === this.year && this.catalog[s.courseId]?.pathway === 'English'
    );

    return !hasEnglishInYear && !hasEnglishInYearSuggestions;
  }

  /**
   * RULE: Only one Math course per semester (can take Math 1-2 Fall, Math 3-4 Spring)
   * @param {Object} course
   * @returns {boolean}
   */
  checkMathLimit(course) {
    if (course.pathway !== 'Math') return true;

    // Check current semester only - students can take different math courses in Fall and Spring
    const termCourses = this.courses.filter(c =>
      c.year === this.year && this.termQuarters.includes(c.quarter)
    );

    const hasMathInTerm = termCourses.some(c =>
      this.catalog[c.courseId]?.pathway === 'Math'
    );

    const hasMathInSuggestions = this.suggestions.some(s =>
      this.catalog[s.courseId]?.pathway === 'Math'
    );

    return !hasMathInTerm && !hasMathInSuggestions;
  }

  /**
   * RULE: Only one Science course per semester
   * @param {Object} course
   * @returns {boolean}
   */
  checkScienceLimit(course) {
    const isScience = course.pathway?.includes('Science');
    if (!isScience) return true;

    const termCourses = this.courses.filter(c =>
      c.year === this.year && this.termQuarters.includes(c.quarter)
    );

    const hasScienceInTerm = termCourses.some(c => {
      const info = this.catalog[c.courseId];
      return info && info.pathway?.includes('Science');
    });

    const hasScienceInSuggestions = this.suggestions.some(s => {
      const info = this.catalog[s.courseId];
      return info && info.pathway?.includes('Science');
    });

    return !hasScienceInTerm && !hasScienceInSuggestions;
  }

  /**
   * RULE: Only one History course per semester
   * @param {Object} course
   * @returns {boolean}
   */
  checkHistoryLimit(course) {
    if (course.pathway !== 'History/Social Science') return true;

    const termCourses = this.courses.filter(c =>
      c.year === this.year && this.termQuarters.includes(c.quarter)
    );

    const hasHistoryInTerm = termCourses.some(c =>
      this.catalog[c.courseId]?.pathway === 'History/Social Science'
    );

    const hasHistoryInSuggestions = this.suggestions.some(s =>
      this.catalog[s.courseId]?.pathway === 'History/Social Science'
    );

    return !hasHistoryInTerm && !hasHistoryInSuggestions;
  }

  /**
   * RULE: Only one Integrated Math course per semester
   * (Int Math I, II, III should not be in same semester)
   * @param {Object} course
   * @returns {boolean}
   */
  checkIntegratedMathLimit(course) {
    const courseNameUpper = course.full_name.toUpperCase();
    const isIntegratedMath = courseNameUpper.includes('INTEGRATED MATHEMATICS');

    if (!isIntegratedMath) return true;

    // Check existing courses in this term
    const termCourses = this.courses.filter(c =>
      c.year === this.year && this.termQuarters.includes(c.quarter)
    );

    const hasIntMathInTerm = termCourses.some(c => {
      const info = this.catalog[c.courseId];
      return info && info.full_name.toUpperCase().includes('INTEGRATED MATHEMATICS');
    });

    // Check already suggested courses for this term
    const hasIntMathInSuggestions = this.suggestions.some(s => {
      const info = this.catalog[s.courseId];
      return info && info.full_name.toUpperCase().includes('INTEGRATED MATHEMATICS');
    });

    return !hasIntMathInTerm && !hasIntMathInSuggestions;
  }

  /**
   * RULE: Stick to one foreign language across all years
   * (Students should not switch languages mid-sequence)
   * @param {Object} course
   * @returns {boolean}
   */
  checkForeignLanguageConsistency(course) {
    if (course.pathway !== 'Foreign Language') return true;

    // Find any existing language course in user's schedule
    const existingLanguageCourses = this.courses.filter(c =>
      this.catalog[c.courseId]?.pathway === 'Foreign Language'
    );

    // Also check already-suggested language courses
    const suggestedLanguageCourses = this.suggestions.filter(s =>
      this.catalog[s.courseId]?.pathway === 'Foreign Language'
    );

    const allLanguageCourses = [...existingLanguageCourses, ...suggestedLanguageCourses];

    if (allLanguageCourses.length === 0) return true; // No constraint yet

    // Extract language from first existing/suggested course
    const existingLanguage = this.extractLanguage(
      this.catalog[allLanguageCourses[0].courseId].full_name
    );

    // Extract language from proposed course
    const proposedLanguage = this.extractLanguage(course.full_name);

    return existingLanguage === proposedLanguage;
  }

  /**
   * RULE: Cannot take two courses of the same language in the same semester
   * (Exception: literature courses)
   * @param {Object} course
   * @returns {boolean}
   */
  checkSameSemesterLanguageLimit(course) {
    if (course.pathway !== 'Foreign Language') return true;

    // Literature courses are exempt
    if (course.full_name.toUpperCase().includes('LITERATURE')) return true;

    // Check existing courses in this term
    const termCourses = this.courses.filter(c =>
      c.year === this.year && this.termQuarters.includes(c.quarter)
    );

    const proposedLanguage = this.extractLanguage(course.full_name);

    const hasLanguageInTerm = termCourses.some(c => {
      const info = this.catalog[c.courseId];
      if (!info || info.pathway !== 'Foreign Language') return false;
      if (info.full_name.toUpperCase().includes('LITERATURE')) return false; // Exclude literature
      return this.extractLanguage(info.full_name) === proposedLanguage;
    });

    // Check already suggested courses for this term
    const hasLanguageInSuggestions = this.suggestions.some(s => {
      const info = this.catalog[s.courseId];
      if (!info || info.pathway !== 'Foreign Language') return false;
      if (info.full_name.toUpperCase().includes('LITERATURE')) return false;
      return this.extractLanguage(info.full_name) === proposedLanguage;
    });

    return !hasLanguageInTerm && !hasLanguageInSuggestions;
  }

  /**
   * RULE: Yearlong courses can only be suggested for Fall term
   * (Cannot suggest yearlong course in Spring - it must start in Fall)
   * @param {Object} course
   * @returns {boolean}
   */
  checkYearlongTermPlacement(course) {
    if (course.term_length !== 'yearlong') return true;

    // Yearlong courses must start in Fall
    return this.term === 'fall';
  }

  /**
   * RULE: Don't suggest a course already in the year
   * @param {Object} course
   * @returns {boolean}
   */
  checkDuplicates(course) {
    const yearCourses = this.courses.filter(c => c.year === this.year);
    return !yearCourses.some(c => c.courseId === course.id);
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
      // Check if second word is also language (not level like "1-2")
      if (!words[1].match(/\d/)) {
        return `${words[0]} ${words[1]}`;
      }
    }

    // Single-word languages (e.g., "SPANISH")
    return words[0];
  }
}
