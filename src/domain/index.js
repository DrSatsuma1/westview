/**
 * Domain Logic Barrel Export
 *
 * Single import point for all domain logic.
 * Usage: import { calculateWestviewProgress, calculateAGProgress, calculateUCGPA } from './domain';
 */

// Credit calculations
export {
  getSemesterCredits,
  calculateSemesterTotal,
  calculateYearTotal
} from './creditCalculation.js';

// Westview graduation progress
export {
  WESTVIEW_REQUIREMENTS,
  calculateWestviewProgress,
  calculateTotalCredits,
  isGraduationReady
} from './progress/westview.js';

// UC/CSU A-G progress
export {
  AG_REQUIREMENTS,
  calculateAGProgress,
  isUCSUEligible,
  meetsAllRecommended
} from './progress/ag.js';

// GPA calculations
export {
  getBaseGradePoints,
  filterUCGPACourses,
  calculateUCGPA,
  calculatePathwayGPA
} from './gpa.js';

// Graduation eligibility
export {
  calculateTotalCreditsWithCap,
  calculateEarlyGradEligibility,
  isWestviewGraduationReady
} from './graduation.js';

// CTE Pathways
export { calculateCTEPathwayProgress } from './cte.js';

// Biliteracy Seal
export { calculateBiliteracyEligibility } from './biliteracy.js';
