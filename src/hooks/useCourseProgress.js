/**
 * useCourseProgress Hook
 *
 * Centralized hook for all progress, GPA, and validation calculations.
 * Implements "Option C": Single facade export with internal granular memoization.
 *
 * This extraction removes ~60 lines from App.jsx while preserving memoization boundaries.
 */
import { useMemo } from 'react';
import { calculateWestviewProgress, WESTVIEW_REQUIREMENTS } from '../domain/progress/westview.js';
import { calculateAGProgress, AG_REQUIREMENTS } from '../domain/progress/ag.js';
import { calculateUCGPA } from '../domain/gpa.js';
import {
  calculateTotalCreditsWithCap,
  calculateEarlyGradEligibility
} from '../domain/graduation.js';
import { calculateCTEPathwayProgress } from '../domain/cte.js';
import { calculateBiliteracyEligibility } from '../domain/biliteracy.js';
import { calculateCollegeCredits } from '../domain/collegeCredits.js';
import { validateSchedule as validateScheduleLogic } from '../domain/scheduleValidation.js';
import { CTE_PATHWAYS } from '../config';

/**
 * Centralized progress calculations hook
 *
 * @param {Object} params
 * @param {Array} params.courses - Array of scheduled course objects
 * @param {Object} params.courseCatalog - Course catalog lookup object
 * @param {Object} params.schedulingEngine - SchedulingEngine instance
 * @param {Object} params.settings - User settings object
 * @param {Object} params.settings.ctePathwayMode - CTE pathway mode settings
 * @param {boolean} params.settings.gpaMode - Whether GPA mode is enabled
 * @param {boolean} params.settings.metForeignLanguageIn78 - FL requirement met in grades 7/8
 * @param {Array} params.settings.testScores - Test scores for college credits
 * @returns {Object} - All progress, eligibility, and validation data
 */
export function useCourseProgress({
  courses,
  courseCatalog,
  schedulingEngine,
  settings
}) {
  const {
    ctePathwayMode,
    gpaMode,
    metForeignLanguageIn78,
    testScores
  } = settings;

  // Helper: Get courses for a specific quarter
  // Defined locally to avoid circular dependency on App.jsx
  const getCoursesForQuarter = (year, quarter) => {
    return courses.filter(c => c.year === year && c.quarter === quarter);
  };

  // 1. Westview Graduation Progress
  const westviewProgress = useMemo(() => {
    return calculateWestviewProgress(courses, courseCatalog);
  }, [courses, courseCatalog]);

  // 2. Total Credits (with 80/year cap)
  const totalCredits = useMemo(() => {
    return calculateTotalCreditsWithCap(courses, courseCatalog);
  }, [courses, courseCatalog]);

  // Derived: Graduation ready check
  const westviewGraduationReady = totalCredits >= 230 && Object.values(westviewProgress).every(p => p.met);

  // 3. Early Grad Eligibility
  const earlyGradEligibility = useMemo(() => {
    return calculateEarlyGradEligibility(courses, courseCatalog);
  }, [courses, courseCatalog]);

  // 4. CTE Pathway Progress
  const ctePathwayProgress = useMemo(() => {
    return calculateCTEPathwayProgress(courses, courseCatalog, ctePathwayMode, CTE_PATHWAYS);
  }, [courses, courseCatalog, ctePathwayMode]);

  // 5. UC/CSU A-G Progress
  const agProgress = useMemo(() => {
    return calculateAGProgress(courses, courseCatalog, metForeignLanguageIn78);
  }, [courses, courseCatalog, metForeignLanguageIn78]);

  // Derived: UC/CSU eligibility check
  const ucsuEligible = Object.values(agProgress).every(p => p.met);

  // 6. UC GPA Calculation (only when gpaMode enabled)
  const ucGPA = useMemo(() => {
    if (!gpaMode) return null;
    return calculateUCGPA(courses, courseCatalog);
  }, [courses, courseCatalog, gpaMode]);

  // 7. State Seal of Biliteracy Eligibility
  const biliteracySealEligibility = useMemo(() => {
    return calculateBiliteracyEligibility(courses, courseCatalog, gpaMode);
  }, [courses, courseCatalog, gpaMode]);

  // 8. College Credits from Test Scores
  const collegeCredits = useMemo(() => {
    return calculateCollegeCredits(testScores);
  }, [testScores]);

  // 9. Schedule Validation (errors & warnings)
  const scheduleValidation = useMemo(() => {
    return validateScheduleLogic(courses, courseCatalog, getCoursesForQuarter, schedulingEngine);
  }, [courses, courseCatalog, schedulingEngine]);

  // Derived: Categorized warnings for UI consumption
  const englishWarnings = useMemo(() =>
    scheduleValidation.warnings.filter(w => w.type === 'missing_english').map(w => w.year),
    [scheduleValidation]
  );

  const peWarnings = useMemo(() =>
    scheduleValidation.warnings.filter(w => w.type === 'missing_pe').map(w => w.year),
    [scheduleValidation]
  );

  const prereqWarnings = useMemo(() =>
    scheduleValidation.warnings.filter(w => w.type === 'missing_prerequisites'),
    [scheduleValidation]
  );

  return {
    // Progress data
    westviewProgress,
    totalCredits,
    westviewGraduationReady,
    earlyGradEligibility,
    ctePathwayProgress,
    agProgress,
    ucsuEligible,
    ucGPA,
    biliteracySealEligibility,
    collegeCredits,

    // Validation
    scheduleValidation,

    // Categorized warnings (convenience for UI)
    warnings: {
      english: englishWarnings,
      pe: peWarnings,
      prereq: prereqWarnings
    },

    // Re-export requirements for consumers that need them
    requirements: {
      westview: WESTVIEW_REQUIREMENTS,
      ag: AG_REQUIREMENTS
    }
  };
}
