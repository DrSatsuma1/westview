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

    // Tier 1: Required core courses (700-900 points)
    // These MUST be taken for graduation
    if (this.unmet.needsEnglish && course.pathway === 'English') {
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
      score = 800;
      return score;
    }

    if (this.unmet.needsHistory && course.pathway === 'History/Social Science') {
      score = 750;
      score += this.gradeAppropriatenessBonus(course);
      return score;
    }

    if (this.unmet.needsScience && course.pathway.includes('Science')) {
      score = 700;
      score += this.gradeAppropriatenessBonus(course);
      return score;
    }

    // Tier 2: UC/CSU A-G gaps (300-600 points)
    // Important for college admission
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
    }

    // Tier 3: Electives (100-250 points)
    // Fill to target course count
    if (score === 0) {
      if (course.pathway === 'Foreign Language') {
        score = 250; // High priority elective (needed for UC/CSU)
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

    // Grade 9: prefer foundational courses
    if (this.year === 9) {
      if (nameUpper.includes('ENGLISH 1-2')) return 50;
      if (nameUpper.includes('INTEGRATED MATHEMATICS I')) return 50;
      if (nameUpper.includes('BIOLOGY') && !nameUpper.includes('AP')) return 40;
      if (nameUpper.includes('SPANISH 1-2') || nameUpper.includes('CHINESE 1-2')) return 30;
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
