/**
 * CatalogNormalizer.js
 *
 * Fixes pathway inconsistencies in the course catalog BEFORE suggestion logic runs.
 * Runs ONCE at startup to create a normalized catalog.
 *
 * Problems this fixes:
 * - History courses stored as "History/Social Science", "History / Social Science", "Social Science"
 * - CTE courses marked as "Science - Biological"
 * - Arts courses marked as "Electives"
 */

/**
 * Normalize a single pathway string to canonical form
 * @param {string} pathway - Original pathway from catalog
 * @param {string} courseName - Course full_name (used for CTE detection)
 * @param {string} ucCsuCategory - UC/CSU A-G category (used for Arts detection)
 * @returns {string} Normalized pathway
 */
export function normalizePathway(pathway, courseName, ucCsuCategory) {
  if (!pathway) return '';

  const pathwayLower = pathway.toLowerCase().trim();
  const nameUpper = (courseName || '').toUpperCase();

  // Fix History variations
  if (pathwayLower.includes('history') || pathwayLower.includes('social')) {
    return 'History/Social Science';
  }

  // Fix Arts courses marked as "Electives" - use UC/CSU category F
  if (ucCsuCategory === 'F') {
    return 'Fine Arts';
  }

  // Fix CTE courses incorrectly marked as Science
  // Common CTE keywords: Biotech, Engineering, Medical, PLTW, Robotics
  const cteKeywords = ['BIOTECH', 'ENGINEERING', 'MEDICAL', 'PLTW', 'ROBOTICS', 'HEALTH SCIENCE'];
  if (cteKeywords.some(keyword => nameUpper.includes(keyword))) {
    return 'CTE';
  }

  // Fix Science variations - normalize to canonical form
  if (pathwayLower.includes('science')) {
    if (pathwayLower.includes('biological') || pathwayLower.includes('biology')) {
      return 'Science - Biological';
    }
    if (pathwayLower.includes('physical') || pathwayLower.includes('physics') || pathwayLower.includes('chemistry')) {
      return 'Science - Physical';
    }
    // Generic "Science" becomes Physical by default
    return 'Science - Physical';
  }

  // Normalize spacing in pathways
  return pathway.trim().replace(/\s+/g, ' ');
}

/**
 * Create a normalized version of the entire course catalog
 * @param {Object} rawCatalog - Original COURSE_CATALOG from courses_complete.json
 * @returns {Object} Normalized catalog with fixed pathways
 */
export function getNormalizedCatalog(rawCatalog) {
  const normalized = {};

  for (const [id, course] of Object.entries(rawCatalog)) {
    normalized[id] = {
      ...course,
      pathway: normalizePathway(
        course.pathway,
        course.full_name,
        course.uc_csu_category
      ),
      originalPathway: course.pathway // Keep original for debugging
    };
  }

  return normalized;
}

/**
 * Check if two pathways are equivalent after normalization
 * @param {string} pathway1
 * @param {string} pathway2
 * @returns {boolean}
 */
export function pathwaysMatch(pathway1, pathway2) {
  const normalize = (p) => (p || '').toLowerCase().trim().replace(/\s+/g, ' ');
  return normalize(pathway1) === normalize(pathway2);
}
