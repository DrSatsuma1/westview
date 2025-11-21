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
  constructor(courses, suggestions, catalog, term, year) {
    this.courses = courses;
    this.suggestions = suggestions;
    this.catalog = catalog;
    this.term = term;
    this.year = year;
    this.termQuarters = term === 'fall' ? ['Q1', 'Q2'] : ['Q3', 'Q4'];
  }

  /**
   * Check if a course can be added to suggestions
   * @param {Object} course - Course to validate
   * @returns {boolean} - true if allowed, false if blocked by business rule
   */
  canAddCourse(course) {
    return (
      this.checkFineArtsLimit(course) &&
      this.checkPELimit(course) &&
      this.checkForeignLanguageConsistency(course) &&
      this.checkYearlongTermPlacement(course) &&
      this.checkDuplicates(course) &&
      this.checkSameSemesterLanguageLimit(course)
    );
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
   * RULE: Stick to one foreign language across all years
   * (Students should not switch languages mid-sequence)
   * @param {Object} course
   * @returns {boolean}
   */
  checkForeignLanguageConsistency(course) {
    if (course.pathway !== 'Foreign Language') return true;

    // Find any existing language course
    const allLanguageCourses = this.courses.filter(c =>
      this.catalog[c.courseId]?.pathway === 'Foreign Language'
    );

    if (allLanguageCourses.length === 0) return true; // No constraint yet

    // Extract language from existing course
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
