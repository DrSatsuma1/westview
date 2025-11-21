/**
 * CandidateRanker.js
 *
 * Priority-based scoring for course suggestions.
 * Replaces brittle pathway filters with a scoring system that ranks
 * courses by how well they satisfy unmet requirements.
 *
 * Higher score = higher priority for suggestion.
 */

export class CandidateRanker {
  constructor(unmetRequirements, year, term) {
    this.unmet = unmetRequirements;
    this.year = parseInt(year);
    this.term = term;
  }

  /**
   * Score a course from 0-1000 based on priority
   * @param {Object} course - Normalized course object
   * @returns {number} - Score (higher = better candidate)
   */
  scoreCourse(course) {
    let score = 0;

    // Tier 1: Required core courses (700-950 points)
    // These MUST be taken for graduation
    // English: Check both pathway AND UC/CSU Category B (some English courses are categorized as History/Social Science)
    if (this.unmet.needsEnglish && (course.pathway === 'English' || course.uc_csu_category === 'B')) {
      score = 900;
      score += this.gradeAppropriatenessBonus(course);
      return score;
    }

    if (this.unmet.needsMath && course.pathway === 'Math') {
      score = 850;
      score += this.gradeAppropriatenessBonus(course);
      return score;
    }

    if (this.unmet.needsPE && course.pathway === 'Physical Education') {
      // Grade 9 PE is REQUIRED - highest priority
      // ENS 3-4 in Fall, ENS 1-2 in Spring
      const nameUpper = course.full_name.toUpperCase();

      if (this.year === 9) {
        // ENS 3-4 for Fall (Q1/Q2)
        if (this.term === 'fall' && nameUpper.includes('ENS 3-4')) {
          return 950; // Highest priority for Grade 9 Fall
        }
        // ENS 1-2 for Spring (Q3/Q4)
        if (this.term === 'spring' && nameUpper.includes('ENS 1-2')) {
          return 950; // Highest priority for Grade 9 Spring
        }
        // Other PE courses for Grade 9 get lower priority
        score = 800;
      } else if (this.year === 12) {
        // Grade 12 needs one PE class for the year
        score = 800;
      } else {
        // Grades 10-11 don't need PE, so very low priority
        score = 100;
      }

      return score;
    }

    if (this.unmet.needsHistory && course.pathway === 'History/Social Science') {
      score = 750;
      score += this.gradeAppropriatenessBonus(course);
      return score;
    }

    if (this.unmet.needsScience && course.pathway.includes('Science')) {
      score = 700;

      // Grade 9: Biology is preferred, but Chemistry is also acceptable
      if (this.year === 9) {
        const nameUpper = course.full_name.toUpperCase();
        if (nameUpper.includes('BIOLOGY') && !nameUpper.includes('AP')) {
          score += 50; // Prefer Biology for Grade 9
        } else if (nameUpper.includes('CHEMISTRY') && !nameUpper.includes('AP')) {
          score += 30; // Chemistry is also acceptable
        }
      }

      score += this.gradeAppropriatenessBonus(course);
      return score;
    }

    // Tier 2: UC/CSU A-G gaps (300-700 points)
    // CRITICAL: A-G must be completed by END OF YEAR 3 (Grade 11)
    // Prioritize heavily in Years 9-11, de-prioritize in Year 12 (too late for A-G)
    if (this.unmet.agGaps && this.unmet.agGaps.includes(course.uc_csu_category)) {
      const agPriority = {
        'A': 5, // History
        'B': 6, // English (shouldn't happen, but just in case)
        'C': 5, // Math
        'D': 4, // Science
        'E': 3, // Foreign Language
        'F': 2, // Arts
        'G': 1  // Elective
      };
      const priority = agPriority[course.uc_csu_category] || 1;
      score = 300 + (priority * 50);

      // Year 12: URGENT - A-G deadline passed, heavily de-prioritize
      // (Students should have completed A-G by end of Year 11)
      if (this.year === 12) {
        score -= 200; // Drop priority significantly (Year 12 courses don't count)
      }
      // Years 9-11: BOOST priority - need to complete A-G by end of Year 11
      else if (this.year === 11) {
        score += 100; // Year 11 is last chance for A-G
      } else if (this.year === 10) {
        score += 50; // Year 10 important for A-G progress
      }
    }

    // Tier 3: Electives (100-350 points)
    // Fill to target course count
    if (score === 0) {
      if (course.pathway === 'Foreign Language') {
        // Grade 9: Foreign Language is HIGH priority (recommend both semesters)
        if (this.year === 9) {
          score = 350; // Elevated priority for Grade 9 to ensure suggestion
        } else {
          score = 250; // High priority elective (needed for UC/CSU)
        }
      } else if (course.pathway === 'Fine Arts') {
        score = 200; // Medium priority (UC/CSU requirement)
      } else if (course.pathway === 'CTE') {
        score = 150; // Career pathway
      } else {
        score = 100; // Generic elective
      }
    }

    // Apply adjustments
    score += this.gradeAppropriatenessBonus(course);
    score -= this.penalizeAP(course);
    score -= this.penalizeYearlong(course);
    score -= this.penalizeHonors(course);

    return Math.max(0, score); // Never go negative
  }

  /**
   * Bonus for grade-appropriate courses
   * @param {Object} course
   * @returns {number} - Bonus points (0-50)
   */
  gradeAppropriatenessBonus(course) {
    const nameUpper = course.full_name.toUpperCase();

    // Grade 9: prefer foundational courses and recommended electives
    if (this.year === 9) {
      // Core required courses
      if (nameUpper.includes('ENGLISH 1-2')) return 50;
      if (nameUpper.includes('INTEGRATED MATHEMATICS I')) return 50;
      if (nameUpper.includes('BIOLOGY') && !nameUpper.includes('AP')) return 40;

      // Recommended Year 1 Foreign Language (level 1-2)
      if (course.pathway === 'Foreign Language') {
        if (nameUpper.includes('1-2')) return 40; // Spanish 1-2, Chinese 1-2, Filipino 1-2, French 1-2
        if (nameUpper.includes('3-4') || nameUpper.includes('5-6')) return 10; // Higher levels get low bonus
      }

      // Recommended Year 1 CTE courses
      if (nameUpper.includes('BUSINESS PRINCIPLES')) return 30;
      if (nameUpper.includes('COMPUTER INFO') || nameUpper.includes('WEB DESIGN')) return 30;
      if (nameUpper.includes('INTRO TO ENGINEERING') || nameUpper.includes('PRINCIPLES OF ENGINEERING')) return 30;

      // Recommended Year 1 Fine Arts (entry-level courses)
      if (course.pathway === 'Fine Arts') {
        const isEntryLevel = nameUpper.includes('1-2') ||
                            nameUpper.includes('BAND') ||
                            nameUpper.includes('ORCHESTRA') ||
                            nameUpper.includes('DRAMA 1-2') ||
                            nameUpper.includes('CERAMICS 1-2');
        if (isEntryLevel) return 30;
      }
    }

    // Grade 10: prefer standard progression
    if (this.year === 10) {
      if (nameUpper.includes('ENGLISH 3-4')) return 40;
      if (nameUpper.includes('WORLD HISTORY')) return 40;
      if (nameUpper.includes('CHEMISTRY') && !nameUpper.includes('AP')) return 30;
      if (nameUpper.includes('SPANISH 3-4') || nameUpper.includes('CHINESE 3-4')) return 25;
    }

    // Grade 11: prefer college-prep courses
    if (this.year === 11) {
      if (nameUpper.includes('UNITED STATES HISTORY')) return 40;
      if (nameUpper.includes('ENGLISH 5-6')) return 40;
    }

    // Grade 12: prefer semester courses (easier to complete)
    if (this.year === 12) {
      if (course.term_length === 'semester') return 30;
      if (nameUpper.includes('CIVICS')) return 40;
    }

    return 0;
  }

  /**
   * Penalty for AP courses (avoid suggesting unless student is ready)
   * @param {Object} course
   * @returns {number} - Penalty points (0-300)
   */
  penalizeAP(course) {
    const isAP = course.full_name.toUpperCase().includes('AP');
    if (!isAP) return 0;

    // Grade 9: heavily discourage AP (too early)
    if (this.year === 9) return 300;

    // Grade 12: discourage AP (risky for graduation)
    if (this.year === 12) return 250;

    // Grade 10-11: slight penalty (allow but don't prioritize)
    // Students can opt for AP manually if desired
    return 75;
  }

  /**
   * Penalty for yearlong courses
   * @param {Object} course
   * @returns {number} - Penalty points (0-200)
   */
  penalizeYearlong(course) {
    const isYearlong = course.term_length === 'yearlong';
    if (!isYearlong) return 0;

    // Grade 12: heavily avoid yearlong (can't finish if graduating early)
    if (this.year === 12) return 200;

    // Spring term: cannot suggest yearlong courses (must start in Fall)
    if (this.term === 'spring') return 500; // Effectively blocks it

    // Fall term, grades 9-11: slight penalty (prefer flexibility)
    return 25;
  }

  /**
   * Penalty for Honors courses
   * @param {Object} course
   * @returns {number} - Penalty points (0-100)
   */
  penalizeHonors(course) {
    const isHonors = course.full_name.toUpperCase().includes('HONORS');
    if (!isHonors) return 0;

    // Grade 9: discourage Honors (let students acclimate)
    if (this.year === 9) return 100;

    // Other grades: slight penalty (students can opt in manually)
    return 50;
  }

  /**
   * Check if course is foundational (entry-level)
   * @param {Object} course
   * @returns {boolean}
   */
  isFoundational(course) {
    const nameUpper = course.full_name.toUpperCase();
    return (
      nameUpper.includes('1-2') ||
      nameUpper.includes('INTEGRATED MATHEMATICS I') ||
      nameUpper.includes('BIOLOGY') ||
      nameUpper.includes('ENGLISH 1')
    );
  }
}
