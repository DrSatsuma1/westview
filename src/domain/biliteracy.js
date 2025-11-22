/**
 * State Seal of Biliteracy Eligibility Calculator
 *
 * Requirements:
 * - 4 years of English with 3.0+ GPA (if in GPA mode)
 * - 4 years of world language with 3.0+ GPA (if in GPA mode)
 */

import { getBaseGradePoints } from './gpa.js';

/**
 * Detect language from course name
 * @param {string} courseName - Course full name
 * @returns {string} - Language name
 */
function detectLanguage(courseName) {
  const name = courseName.toUpperCase();
  if (name.includes('SPANISH')) return 'Spanish';
  if (name.includes('CHINESE')) return 'Chinese';
  if (name.includes('FRENCH')) return 'French';
  if (name.includes('JAPANESE')) return 'Japanese';
  if (name.includes('GERMAN')) return 'German';
  if (name.includes('ASL') || name.includes('SIGN LANGUAGE')) return 'ASL';
  return 'Other';
}

/**
 * Calculate State Seal of Biliteracy eligibility
 *
 * @param {Array} courses - Array of scheduled course objects
 * @param {Object} courseCatalog - Course catalog lookup object
 * @param {boolean} gpaMode - Whether GPA mode is enabled
 * @returns {Object} - Biliteracy eligibility status
 */
export function calculateBiliteracyEligibility(courses, courseCatalog, gpaMode) {
  // Check English requirement: 4 years of English with 3.0 GPA (if in GPA mode)
  const englishCourses = courses.filter(c => {
    const info = courseCatalog[c.courseId];
    return info && info.pathway === 'English';
  });

  // Group by year to check 4-year requirement
  const englishYears = new Set(englishCourses.map(c => c.year));
  const has4YearsEnglish = englishYears.size >= 4;

  let englishGPAMet = true; // Assume met if not in GPA mode
  if (gpaMode) {
    const englishWithGrades = englishCourses.filter(c => c.grade && c.grade !== '');
    if (englishWithGrades.length > 0) {
      const totalPoints = englishWithGrades.reduce((sum, c) => sum + getBaseGradePoints(c.grade), 0);
      const englishGPA = totalPoints / englishWithGrades.length;
      englishGPAMet = englishGPA >= 3.0;
    } else {
      englishGPAMet = false; // No grades entered yet
    }
  }

  // Check world language requirement: 4 years with 3.0 GPA (if in GPA mode)
  const worldLangCourses = courses.filter(c => {
    const info = courseCatalog[c.courseId];
    return info && info.pathway === 'Foreign Language';
  });

  // Find the language with the most years
  const languageYears = {};
  worldLangCourses.forEach(c => {
    const info = courseCatalog[c.courseId];
    const lang = detectLanguage(info.full_name);

    if (!languageYears[lang]) {
      languageYears[lang] = new Set();
    }
    languageYears[lang].add(c.year);
  });

  let primaryLanguage = null;
  let maxYears = 0;
  Object.entries(languageYears).forEach(([lang, years]) => {
    if (years.size > maxYears) {
      maxYears = years.size;
      primaryLanguage = lang;
    }
  });

  const has4YearsLanguage = maxYears >= 4;

  let languageGPAMet = true; // Assume met if not in GPA mode
  if (gpaMode && primaryLanguage) {
    const langCoursesWithGrades = worldLangCourses.filter(c => {
      const info = courseCatalog[c.courseId];
      const lang = detectLanguage(info.full_name);
      return lang === primaryLanguage && c.grade && c.grade !== '';
    });

    if (langCoursesWithGrades.length > 0) {
      const totalPoints = langCoursesWithGrades.reduce((sum, c) => sum + getBaseGradePoints(c.grade), 0);
      const langGPA = totalPoints / langCoursesWithGrades.length;
      languageGPAMet = langGPA >= 3.0;
    } else {
      languageGPAMet = false; // No grades entered yet
    }
  }

  const isEligible = has4YearsEnglish && englishGPAMet && has4YearsLanguage && languageGPAMet;

  return {
    eligible: isEligible,
    has4YearsEnglish,
    englishGPAMet,
    has4YearsLanguage,
    languageGPAMet,
    primaryLanguage,
    languageYears: maxYears,
    englishYears: englishYears.size
  };
}
