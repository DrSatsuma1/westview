/**
 * SuggestionEngine.js
 *
 * Main orchestrator for course suggestions.
 * Replaces the 667-line generateCourseSuggestions() function with
 * a clean, modular, requirement-driven architecture.
 *
 * Usage:
 *   const engine = new SuggestionEngine(normalizedCatalog, deprecatedCourses);
 *   const suggestions = engine.generateSuggestions({
 *     courses,
 *     year: '10',
 *     term: 'fall',
 *     westviewReqs,
 *     agReqs
 *   });
 */

import { RequirementCalculator } from './RequirementCalculator.js';
import { CandidateRanker } from './CandidateRanker.js';
import { BusinessRules } from './BusinessRules.js';

export class SuggestionEngine {
  constructor(normalizedCatalog, deprecatedCourses) {
    this.catalog = normalizedCatalog;
    this.deprecated = deprecatedCourses;
  }

  /**
   * Generate course suggestions for a specific year and term
   * @param {Object} params
   * @param {Array} params.courses - All scheduled courses
   * @param {string} params.year - '9', '10', '11', or '12'
   * @param {string} params.term - 'fall' or 'spring'
   * @param {Object} params.westviewReqs - Westview graduation requirements
   * @param {Object} params.agReqs - UC/CSU A-G requirements
   * @param {Function} params.checkEligibility - Function to check course prerequisites
   * @param {number} params.targetCount - Optional: override default target
   * @returns {Array} - Suggested courses with metadata
   */
  generateSuggestions({
    courses,
    year,
    term,
    westviewReqs,
    agReqs,
    checkEligibility = null,
    targetCount = null
  }) {
    const yearInt = parseInt(year);
    // Target suggestions: 4 per semester (Years 1-3), 3 per semester (Year 4)
    // Hard minimum: 3 per semester (Years 1-3), 2 per semester (Year 4)
    const defaultTarget = yearInt <= 11 ? 4 : 3;
    const target = targetCount ?? defaultTarget;

    // Step 1: Compute unmet requirements
    const reqCalc = new RequirementCalculator(
      courses,
      this.catalog,
      westviewReqs,
      agReqs
    );

    const unmetRequirements = {
      ...reqCalc.getUnmetWestview(year),
      agGaps: reqCalc.getUnmetAG()
    };

    // Step 2: Build candidate pool (all eligible courses)
    const candidates = this.buildCandidatePool(year, courses);

    // Step 3: Rank candidates by priority
    const ranker = new CandidateRanker(unmetRequirements, year, term);
    const scored = candidates
      .map(course => ({
        course,
        score: ranker.scoreCourse(course)
      }))
      .sort((a, b) => b.score - a.score);

    // Step 4: Apply business rules and select top N
    const suggestions = [];
    const businessRules = new BusinessRules(
      courses,
      suggestions,
      this.catalog,
      term,
      year
    );

    const termQuarters = term === 'fall' ? ['Q1', 'Q2'] : ['Q3', 'Q4'];
    const targetQuarter = termQuarters[0]; // Q1 for fall, Q3 for spring

    for (const { course, score } of scored) {
      if (suggestions.length >= target) break;

      // Check prerequisites (if checker provided)
      if (checkEligibility) {
        const eligibility = checkEligibility(course.id, year);
        // Skip if course has blocking prerequisite issues
        if (eligibility.blocking) continue;
      }

      // Check for chronological prerequisite violations
      // (e.g., Math II in Fall when Math I is in Spring)
      if (this.hasPrerequisiteInLaterQuarter(course, courses, year, targetQuarter)) {
        continue; // Skip this course - prerequisite is not completed yet
      }

      // Check if this course passes business rules
      if (!businessRules.canAddCourse(course)) continue;

      suggestions.push({
        courseId: course.id,
        year,
        quarter: targetQuarter,
        reason: this.generateReason(course, unmetRequirements),
        courseName: course.full_name,
        courseNumber: course.course_id, // Full course ID/number
        pathway: course.pathway, // Course category
        score // Keep for debugging/testing
      });
    }

    return suggestions;
  }

  /**
   * Build pool of all courses eligible for this year
   * (Does NOT apply scoring or business rules - just basic eligibility)
   * @param {string} year
   * @param {Array} courses
   * @returns {Array}
   */
  buildCandidatePool(year, courses) {
    const yearInt = parseInt(year);

    // Exclude courses already scheduled in ANY year (not just current year)
    const allScheduledCourseIds = new Set(courses.map(c => c.courseId));

    return Object.entries(this.catalog)
      .filter(([id, course]) => {
        // Basic eligibility only - no pathway/AP/yearlong filtering here
        if (this.deprecated.includes(id)) return false;
        if (allScheduledCourseIds.has(id)) return false; // Already taken in any year
        if (!course.grades_allowed?.includes(yearInt)) return false;

        // Never suggest Special Ed courses
        if (course.full_name.toUpperCase().includes('SPECIAL ED')) return false;

        // Never suggest ROBOTICS (complex scheduling constraints)
        if (course.full_name.toUpperCase() === 'ROBOTICS') return false;

        // Never suggest ROTC (user preference)
        if (course.full_name.toUpperCase().includes('ROTC')) return false;

        // Never suggest Newcomer Class (not appropriate for most students)
        if (course.full_name.toUpperCase().includes('NEWCOMER')) return false;

        return true;
      })
      .map(([id, course]) => ({ id, ...course }));
  }

  /**
   * Generate human-readable reason for suggestion
   * @param {Object} course
   * @param {Object} unmet - Unmet requirements
   * @returns {string}
   */
  generateReason(course, unmet) {
    // Required courses (highest priority)
    if (unmet.needsEnglish && course.pathway === 'English') {
      return 'Required: English course for graduation';
    }
    if (unmet.needsMath && course.pathway === 'Math') {
      return 'Required: Math course for graduation';
    }
    if (unmet.needsHistory && course.pathway === 'History/Social Science') {
      return 'Required: History/Social Science for UC/CSU A-G';
    }
    if (unmet.needsScience && course.pathway.includes('Science')) {
      return 'Required: Science course for graduation';
    }
    if (unmet.needsPE && course.pathway === 'Physical Education') {
      return 'Required: PE for Westview graduation';
    }

    // UC/CSU A-G gaps
    if (unmet.agGaps.includes(course.uc_csu_category)) {
      const categoryNames = {
        'A': 'History/Social Science',
        'B': 'English',
        'C': 'Math',
        'D': 'Science',
        'E': 'Foreign Language',
        'F': 'Visual/Performing Arts',
        'G': 'Elective'
      };
      const categoryName = categoryNames[course.uc_csu_category] || course.uc_csu_category;
      return `Recommended: Fills UC/CSU A-G ${categoryName} requirement`;
    }

    // Electives
    if (course.pathway === 'Foreign Language') {
      return 'Recommended: Foreign Language for UC/CSU eligibility';
    }
    if (course.pathway === 'Fine Arts') {
      return 'Recommended: Visual/Performing Arts for UC/CSU eligibility';
    }
    if (course.pathway === 'CTE') {
      return 'Recommended: CTE pathway course';
    }

    return 'Elective: Helps reach target course count';
  }

  /**
   * Generate suggestions for all years (used by "Auto-fill All" button)
   * @param {Object} params - Same as generateSuggestions, but without 'year'
   * @param {Array} params.years - Array of years to generate for (e.g., ['9', '10', '11', '12'])
   * @returns {Array} - All suggestions across all years
   */
  generateAllYears({
    courses,
    years,
    term,
    westviewReqs,
    agReqs
  }) {
    const allSuggestions = [];

    for (const year of years) {
      const yearSuggestions = this.generateSuggestions({
        courses,
        year,
        term,
        westviewReqs,
        agReqs
      });
      allSuggestions.push(...yearSuggestions);
    }

    return allSuggestions;
  }

  /**
   * Check if a course has a prerequisite in a LATER quarter of the same year
   * This prevents suggesting advanced courses before their prerequisites are completed
   *
   * Example: Math II in Fall (Q1) when Math I is in Spring (Q3) - WRONG!
   * Fall comes before Spring chronologically.
   *
   * @param {Object} course - Course to check
   * @param {Array} courses - All scheduled courses
   * @param {string} year - Year we're suggesting for
   * @param {string} targetQuarter - Quarter we're suggesting for (Q1, Q2, Q3, Q4)
   * @returns {boolean} - true if prerequisite is in later quarter, false otherwise
   */
  hasPrerequisiteInLaterQuarter(course, courses, year, targetQuarter) {
    // Define quarter chronology
    const QUARTER_ORDER = ['Q1', 'Q2', 'Q3', 'Q4'];
    const targetQuarterIndex = QUARTER_ORDER.indexOf(targetQuarter);

    // Get courses in the same year
    const yearCourses = courses.filter(c => c.year === year);

    // Math sequence detection (Integrated Math I → II → III)
    const courseName = course.full_name.toUpperCase();

    if (courseName.includes('INTEGRATED MATHEMATICS II')) {
      // Check if Math I is in a later quarter
      const mathIInYear = yearCourses.find(c => {
        const cInfo = this.catalog[c.courseId];
        return cInfo && cInfo.full_name.toUpperCase().includes('INTEGRATED MATHEMATICS I') &&
               !cInfo.full_name.toUpperCase().includes('III'); // Exclude Math III
      });

      if (mathIInYear) {
        const mathIQuarterIndex = QUARTER_ORDER.indexOf(mathIInYear.quarter);
        // If Math I is in a later quarter, block Math II suggestion
        if (mathIQuarterIndex > targetQuarterIndex) {
          return true; // BLOCK - prerequisite not completed yet
        }
      }
    }

    if (courseName.includes('INTEGRATED MATHEMATICS III')) {
      // Check if Math II is in a later quarter
      const mathIIInYear = yearCourses.find(c => {
        const cInfo = this.catalog[c.courseId];
        return cInfo && cInfo.full_name.toUpperCase().includes('INTEGRATED MATHEMATICS II') &&
               !cInfo.full_name.toUpperCase().includes('III');
      });

      if (mathIIInYear) {
        const mathIIQuarterIndex = QUARTER_ORDER.indexOf(mathIIInYear.quarter);
        if (mathIIQuarterIndex > targetQuarterIndex) {
          return true; // BLOCK
        }
      }
    }

    // Foreign Language sequence detection (1-2 → 3-4 → 5-6 → 7-8 → 9-10)
    if (course.pathway === 'Foreign Language') {
      const levelMatch = courseName.match(/(\d+)-(\d+)/);
      if (levelMatch) {
        const courseLevel = parseInt(levelMatch[1]);

        // Find if lower level of same language is in later quarter
        const language = this.extractLanguage(course.full_name);
        const lowerLevelInYear = yearCourses.find(c => {
          const cInfo = this.catalog[c.courseId];
          if (!cInfo || cInfo.pathway !== 'Foreign Language') return false;

          const cLanguage = this.extractLanguage(cInfo.full_name);
          const cLevelMatch = cInfo.full_name.toUpperCase().match(/(\d+)-(\d+)/);
          if (!cLevelMatch) return false;

          const cLevel = parseInt(cLevelMatch[1]);
          return cLanguage === language && cLevel < courseLevel;
        });

        if (lowerLevelInYear) {
          const lowerQuarterIndex = QUARTER_ORDER.indexOf(lowerLevelInYear.quarter);
          if (lowerQuarterIndex > targetQuarterIndex) {
            return true; // BLOCK - lower level not completed yet
          }
        }
      }
    }

    return false; // No blocking prerequisite found
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
