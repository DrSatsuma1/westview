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

  // PRIORITY 1: Use UC/CSU category as source of truth
  // This fixes courses with wrong pathway in catalog
  if (ucCsuCategory === 'A') {
    // Category A = History/Social Science
    return 'History/Social Science';
  }
  if (ucCsuCategory === 'B') {
    // Category B = English
    // Fixes: American Literature, Humanities (marked as History but are English)
    return 'English';
  }
  if (ucCsuCategory === 'C') {
    // Category C = Math
    return 'Math';
  }
  if (ucCsuCategory === 'D') {
    // Category D = Science
    // Determine if Biological or Physical
    if (nameUpper.includes('BIOLOGY') || nameUpper.includes('LIVING')) {
      return 'Science - Biological';
    }
    if (nameUpper.includes('CHEMISTRY') || nameUpper.includes('PHYSICS') || nameUpper.includes('PHYSICAL')) {
      return 'Science - Physical';
    }
    // Default to Physical if unclear
    return 'Science - Physical';
  }
  if (ucCsuCategory === 'E') {
    // Category E = Foreign Language
    return 'Foreign Language';
  }
  if (ucCsuCategory === 'F') {
    // Category F = Fine Arts
    // Fixes: Web Design (marked as History but is Arts)
    return 'Fine Arts';
  }
  if (ucCsuCategory === 'G') {
    // Category G = Elective
    return 'Electives';
  }

  // PRIORITY 2: Fix vocational/technical courses (no UC category but should be Electives)
  const vocationalKeywords = ['BIOTECH', 'ENGINEERING', 'MEDICAL', 'PLTW', 'ROBOTICS', 'HEALTH SCIENCE', 'BUSINESS', 'MARKETING'];
  if (vocationalKeywords.some(keyword => nameUpper.includes(keyword))) {
    return 'Electives';
  }

  // PRIORITY 3: Fix PE courses (no UC category)
  if (pathwayLower.includes('physical education') || nameUpper.includes('ENS ') || nameUpper.includes('PE ')) {
    return 'Physical Education';
  }

  // PRIORITY 4: Fix Off-Roll courses
  if (pathwayLower.includes('off-roll') || pathwayLower.includes('off roll')) {
    return 'Off-Roll';
  }

  // PRIORITY 5: Fallback - normalize spacing
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
