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
    // Target: 4 courses per semester for grades 9-11, 3 for grade 12
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

      // Check if this course passes business rules
      if (!businessRules.canAddCourse(course)) continue;

      suggestions.push({
        courseId: course.id,
        year,
        quarter: targetQuarter,
        reason: this.generateReason(course, unmetRequirements),
        courseName: course.full_name,
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
}
