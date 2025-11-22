/**
 * CTE (Career Technical Education) Pathway Progress Calculator
 *
 * Tracks completion of CTE pathways for transcript notation and diploma seal.
 */

/**
 * Calculate CTE Pathway completion progress
 *
 * Completion Requirements:
 * - (Concentrator + Capstone) OR (2 Capstones)
 *
 * @param {Array} courses - Array of scheduled course objects
 * @param {Object} courseCatalog - Course catalog lookup object
 * @param {Object} ctePathwayMode - { enabled: boolean, pathway: string }
 * @param {Object} ctePathways - CTE_PATHWAYS configuration object
 * @returns {Object} - CTE pathway progress
 */
export function calculateCTEPathwayProgress(courses, courseCatalog, ctePathwayMode, ctePathways) {
  const emptyResult = {
    completed: [],
    missing: [],
    totalRequired: 0,
    totalCompleted: 0,
    hasConcentrator: false,
    capstoneCount: 0,
    isPathwayCompleter: false,
    completionStatus: ''
  };

  if (!ctePathwayMode.enabled || !ctePathwayMode.pathway) {
    return emptyResult;
  }

  const pathway = ctePathways[ctePathwayMode.pathway];
  if (!pathway) {
    return emptyResult;
  }

  const completed = [];
  const missing = [];
  let hasConcentrator = false;
  let capstoneCount = 0;

  pathway.courses.forEach(requiredCourse => {
    const hasCourse = courses.some(c => {
      const info = courseCatalog[c.courseId];
      if (!info) return false;
      const courseName = info.full_name.toUpperCase();
      return courseName.includes(requiredCourse.name);
    });

    if (hasCourse) {
      completed.push(requiredCourse);

      // Track level completion
      if (requiredCourse.level.includes('Concentrator')) {
        hasConcentrator = true;
      }
      if (requiredCourse.level.includes('Capstone')) {
        capstoneCount++;
      }
    } else {
      missing.push(requiredCourse);
    }
  });

  // Determine pathway completion status
  // Complete if: (has Concentrator AND has Capstone) OR (has 2+ Capstones)
  const isPathwayCompleter = (hasConcentrator && capstoneCount >= 1) || (capstoneCount >= 2);

  let completionStatus = '';
  if (isPathwayCompleter) {
    completionStatus = 'Pathway Completer! Certificate, transcript notation, and diploma seal earned.';
  } else if (hasConcentrator && capstoneCount === 0) {
    completionStatus = 'Need 1 Capstone course to complete pathway';
  } else if (capstoneCount === 1 && !hasConcentrator) {
    completionStatus = 'Need 1 more Capstone OR 1 Concentrator to complete pathway';
  } else if (hasConcentrator || capstoneCount > 0) {
    completionStatus = `Progress: ${hasConcentrator ? 'Concentrator ✓' : ''} ${capstoneCount > 0 ? `${capstoneCount} Capstone${capstoneCount > 1 ? 's' : ''} ✓` : ''}`;
  } else {
    completionStatus = 'Need Concentrator + Capstone OR 2 Capstones';
  }

  return {
    completed,
    missing,
    totalRequired: pathway.courses.length,
    totalCompleted: completed.length,
    pathwayName: pathway.name,
    hasConcentrator,
    capstoneCount,
    isPathwayCompleter,
    completionStatus
  };
}
