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
    targetCount = null,
    preferredLanguage = null
  }) {
    const yearInt = parseInt(year);
    // Credit targets per semester:
    // - Target: 40 credits (max earnable per semester)
    // - Min Years 1-3: 30 credits, Year 4: 20 credits
    const TARGET_CREDITS = 40;

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

    // DEBUG: Log PE status for Year 12
    if (parseInt(year) === 12) {
      const peCredits = reqCalc.calculateTotalPECredits();
      console.log(`[DEBUG] Year 12 - Total PE credits: ${peCredits}, needsPE: ${unmetRequirements.needsPE}`);
    }

    // Step 2: Build candidate pool (all eligible courses)
    const candidates = this.buildCandidatePool(year, courses);

    // Step 3: Rank candidates by priority
    const ranker = new CandidateRanker(unmetRequirements, year, term, courses, this.catalog);
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
      year,
      preferredLanguage
    );

    const termQuarters = term === 'fall' ? ['Q1', 'Q2'] : ['Q3', 'Q4'];
    const targetQuarter = termQuarters[0]; // Q1 for fall, Q3 for spring

    // Calculate existing credits in this term (including yearlong courses that flowed from Fall to Spring)
    const existingCoursesInTerm = courses.filter(c =>
      c.year === year && termQuarters.includes(c.quarter)
    );
    // Use unique course IDs to avoid double-counting yearlong (Q1+Q2 or Q3+Q4)
    const uniqueExistingCourseIds = [...new Set(existingCoursesInTerm.map(c => c.courseId))];

    // Calculate existing credits (credits field = per-semester credits for both yearlong and semester)
    let existingCredits = 0;
    for (const courseId of uniqueExistingCourseIds) {
      const courseInfo = this.catalog[courseId];
      if (courseInfo) {
        existingCredits += courseInfo.credits; // credits is per-semester value
      }
    }

    // Track credits as we add suggestions
    let suggestedCredits = 0;

    for (const { course, score } of scored) {
      // Stop if we've reached the credit target
      if (existingCredits + suggestedCredits >= TARGET_CREDITS) break;

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

      // Check recommended prerequisites
      // Don't suggest courses where recommended prereqs aren't completed
      if (this.hasMissingRecommendedPrereqs(course, courses, year, targetQuarter)) {
        continue; // Skip - user can still manually add with warning
      }

      // Check if this course passes business rules
      if (!businessRules.canAddCourse(course)) continue;

      // Calculate credits this course would add
      const courseCredits = course.credits;

      // Don't exceed credit target
      if (existingCredits + suggestedCredits + courseCredits > TARGET_CREDITS) continue;

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

      suggestedCredits += courseCredits;
    }

    // Special case: If AP Calculus BC was suggested in Fall, also suggest BC Review as 5th class
    if (term === 'fall') {
      const hasAPCalcBC = suggestions.some(s =>
        s.courseName.toUpperCase().includes('AP CALCULUS BC')
      );

      if (hasAPCalcBC) {
        // Find BC Review course in catalog
        const bcReview = Object.values(this.catalog).find(c =>
          c.full_name.toUpperCase().includes('CALCULUS BC REVIEW')
        );

        if (bcReview) {
          // Check it's not already in courses or suggestions
          const alreadyHasBCReview = courses.some(c =>
            this.catalog[c.courseId]?.full_name.toUpperCase().includes('CALCULUS BC REVIEW')
          ) || suggestions.some(s =>
            s.courseName.toUpperCase().includes('CALCULUS BC REVIEW')
          );

          if (!alreadyHasBCReview) {
            suggestions.push({
              courseId: bcReview.id,
              year,
              quarter: targetQuarter,
              reason: 'Concurrent with AP Calculus BC (5th class, 2.5 credits)',
              courseName: bcReview.full_name,
              courseNumber: bcReview.course_id,
              pathway: bcReview.pathway,
              score: 100, // Lower score, but still suggested
              isFifthClass: true // Mark as 5th class
            });
          }
        }
      }
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

        // Never suggest courses marked with never_suggest flag
        if (course.never_suggest) return false;

        // Never suggest Academic Success (remedial course)
        if (course.full_name.toUpperCase().includes('ACADEMIC SUCCESS')) return false;

        // Never suggest Yearbook (user preference)
        if (course.full_name.toUpperCase().includes('YEARBOOK')) return false;

        // Never suggest Band courses (user preference)
        if (course.full_name.toUpperCase().includes('BAND')) return false;

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
    if (course.pathway === 'Electives') {
      return 'Recommended: Elective course';
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
   * Check if a course has recommended prerequisites that haven't been completed
   * (either in prior years or in earlier quarters of the same year)
   *
   * @param {Object} course - Course to check
   * @param {Array} courses - All scheduled courses
   * @param {string} year - Year we're suggesting for
   * @param {string} targetQuarter - Quarter we're suggesting for (Q1, Q2, Q3, Q4)
   * @returns {boolean} - true if missing recommended prereqs, false otherwise
   */
  hasMissingRecommendedPrereqs(course, courses, year, targetQuarter) {
    // Get recommended prerequisites from course data
    const recommendedPrereqs = course.prerequisites_recommended_ids || [];

    // No recommended prereqs = no issue
    if (recommendedPrereqs.length === 0) return false;

    // Define quarter chronology for same-year checks
    const QUARTER_ORDER = ['Q1', 'Q2', 'Q3', 'Q4'];
    const targetQuarterIndex = QUARTER_ORDER.indexOf(targetQuarter);
    const yearInt = parseInt(year);

    // Get all courses scheduled BEFORE this slot
    // (previous years OR earlier quarters in the same year)
    const scheduledCourseIds = new Set();

    for (const c of courses) {
      const cYearInt = parseInt(c.year);

      // Courses from previous years count as completed
      if (cYearInt < yearInt) {
        scheduledCourseIds.add(c.courseId);
        continue;
      }

      // Courses from same year, earlier quarters count as completed
      if (cYearInt === yearInt) {
        const cQuarterIndex = QUARTER_ORDER.indexOf(c.quarter);
        if (cQuarterIndex < targetQuarterIndex) {
          scheduledCourseIds.add(c.courseId);
        }
      }
    }

    // Check if ALL recommended prereqs are satisfied
    // A higher-level course always satisfies a lower-level prereq
    for (const prereqId of recommendedPrereqs) {
      if (!this.isPrereqSatisfied(prereqId, scheduledCourseIds)) {
        return true; // Missing at least one recommended prereq
      }
    }

    return false; // All recommended prereqs are satisfied
  }

  /**
   * Check if a prerequisite is satisfied by scheduled courses
   * A higher-level course satisfies a lower-level prereq
   * @param {string} prereqId - The prerequisite course ID
   * @param {Set} scheduledCourseIds - Set of scheduled course IDs
   * @returns {boolean} - true if prereq is satisfied
   */
  isPrereqSatisfied(prereqId, scheduledCourseIds) {
    // Direct match
    if (scheduledCourseIds.has(prereqId)) return true;

    // Define course hierarchies where higher courses satisfy lower prereqs
    const mathHierarchy = [
      '001012-001013',  // Math I
      '001016-001017',       // Math II
      '001018-001019',  // Math III
      '001085-001086',          // Pre-Calc
      '001060-001061',             // Calc AB
      '001062-001063',                  // Calc BC
    ];

    const physicsHierarchy = [
      '001248-001249',              // Physics
      '001216-001217',              // AP Physics 1
      '001262-001263',              // AP Physics C: Mechanics
      '001264-001265',                   // AP Physics C: E&M
    ];

    const chemistryHierarchy = [
      '001246-001247',            // Chemistry
      '001238-001239',           // Honors Chemistry
      '001242-001243',            // AP Chemistry
    ];

    const biologyHierarchy = [
      '001236-001237',              // Biology
      '001228-001229',             // Honors Biology
      '001232-001233',              // AP Biology
    ];

    // English hierarchy (Honors is equivalent to regular at same level)
    const englishHierarchy = [
      '000301-000302',             // English 1-2
      '000310-000311',                  // English 3-4
    ];

    // Equivalent courses (either satisfies the prereq)
    const equivalentCourses = {
      '000301-000302': ['000303-000304'],  // English 1-2 ≈ Honors English 1-2
      '000310-000311': ['000313-000314'], // English 3-4 ≈ Honors Humanities
      '000387-000388': ['000382-000383'], // Am Lit ≈ Honors Am Lit
      '001236-001237': ['001228-001229'], // Biology ≈ Honors Biology
    };

    // Check if an equivalent course is scheduled
    if (equivalentCourses[prereqId]) {
      for (const equivId of equivalentCourses[prereqId]) {
        if (scheduledCourseIds.has(equivId)) return true;
      }
    }

    // Check each hierarchy
    for (const hierarchy of [mathHierarchy, physicsHierarchy, chemistryHierarchy, biologyHierarchy, englishHierarchy]) {
      const prereqIndex = hierarchy.indexOf(prereqId);
      if (prereqIndex === -1) continue; // prereq not in this hierarchy

      // Check if any higher-level course is scheduled
      for (let i = prereqIndex + 1; i < hierarchy.length; i++) {
        if (scheduledCourseIds.has(hierarchy[i])) {
          return true; // Higher course satisfies this prereq
        }
      }
    }

    return false; // Prereq not satisfied
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
