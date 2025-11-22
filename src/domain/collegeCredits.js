/**
 * College Credits Calculator from Test Scores
 *
 * Calculates CSU and UC credits from AP, IB, CLEP, and A-Level exams.
 */

/**
 * Calculate college credits from test scores
 *
 * @param {Array} testScores - Array of { type, subject, score }
 * @returns {Object} - { csu: number, uc: number, details: Array }
 */
export function calculateCollegeCredits(testScores) {
  if (testScores.length === 0) return { csu: 0, uc: 0, details: [] };

  let csuTotal = 0;
  let ucTotal = 0;
  const details = [];

  testScores.forEach(test => {
    let csuCredits = 0;
    let ucCredits = 0;
    const subject = test.subject.toUpperCase();
    const score = parseInt(test.score);

    if (test.type === 'AP' && score >= 3) {
      // CSU AP Credits (all are semester units)
      if (subject.includes('CALCULUS BC')) {
        csuCredits = 6;
        ucCredits = 5.3;
      } else if (subject.includes('CALCULUS AB') || subject.includes('CALCULUS')) {
        csuCredits = 3;
        ucCredits = 2.6;
      } else if (subject.includes('BIOLOGY') || subject.includes('CHEMISTRY')) {
        csuCredits = 6;
        ucCredits = 5.3;
      } else if (subject.includes('PHYSICS')) {
        csuCredits = 4;
        ucCredits = 5.3;
      } else if (subject.includes('ENGLISH') || subject.includes('LITERATURE')) {
        csuCredits = 6;
        ucCredits = 5.3;
      } else if (subject.includes('HISTORY') || subject.includes('GOVERNMENT')) {
        csuCredits = subject.includes('US HISTORY') || subject.includes('WORLD') || subject.includes('EUROPEAN') ? 6 : 3;
        ucCredits = subject.includes('US HISTORY') || subject.includes('WORLD') || subject.includes('EUROPEAN') ? 5.3 : 2.6;
      } else if (subject.includes('LANGUAGE') || subject.includes('SPANISH') || subject.includes('FRENCH') || subject.includes('CHINESE') || subject.includes('GERMAN') || subject.includes('JAPANESE') || subject.includes('LATIN')) {
        csuCredits = 6;
        ucCredits = 5.3;
      } else if (subject.includes('PSYCHOLOGY') || subject.includes('ECONOMICS') || subject.includes('STATISTICS') || subject.includes('HUMAN GEOGRAPHY')) {
        csuCredits = 3;
        ucCredits = 2.6;
      } else if (subject.includes('COMPUTER SCIENCE')) {
        csuCredits = score >= 3 ? 6 : 3;
        ucCredits = 5.3;
      } else if (subject.includes('ENVIRONMENTAL')) {
        csuCredits = 4;
        ucCredits = 2.6;
      } else if (subject.includes('ART')) {
        csuCredits = subject.includes('HISTORY') ? 6 : 3;
        ucCredits = subject.includes('HISTORY') ? 5.3 : 5.3;
      } else {
        csuCredits = 3; // Default
        ucCredits = 2.6;
      }
    } else if (test.type === 'IB' && score >= 4) {
      // IB HL exams (score 4+): 6 credits CSU, 8 quarter units UC (5.3 semester)
      if ((score >= 5 && (subject.includes('BIOLOGY') || subject.includes('CHEMISTRY') || subject.includes('PHYSICS') ||
           subject.includes('ECONOMICS') || subject.includes('GEOGRAPHY') || subject.includes('HISTORY') ||
           subject.includes('PSYCHOLOGY'))) ||
          (score >= 4 && (subject.includes('LANGUAGE') || subject.includes('LITERATURE') || subject.includes('MATHEMATICS') ||
           subject.includes('THEATRE')))) {
        csuCredits = 6;
        ucCredits = 5.3;
      }
    } else if (test.type === 'CLEP' && score >= 50) {
      // CLEP: mostly 3 credits CSU
      if (subject.includes('CALCULUS') || subject.includes('CHEMISTRY') || subject.includes('BIOLOGY') ||
          subject.includes('COLLEGE ALGEBRA') || subject.includes('PRE-CALCULUS')) {
        csuCredits = 3;
      } else if (subject.includes('HISTORY') || subject.includes('GOVERNMENT') || subject.includes('ECONOMICS') ||
                 subject.includes('PSYCHOLOGY') || subject.includes('SOCIOLOGY')) {
        csuCredits = 3;
      } else if (subject.includes('HUMANITIES') || subject.includes('LITERATURE')) {
        csuCredits = 3;
      } else if (subject.includes('SPANISH') || subject.includes('FRENCH') || subject.includes('GERMAN')) {
        if (score >= 63) {
          csuCredits = 9; // Level II
        } else if (score >= 50) {
          csuCredits = 6; // Level I
        }
      }
      // UC doesn't typically grant credit for CLEP
    } else if (test.type === 'A-Level' && ['A', 'B', 'C'].includes(test.score)) {
      // A-Level: UC grants up to 12 quarter (8 semester) units
      ucCredits = 5.3;
      // CSU doesn't have standardized A-Level credit
    }

    if (csuCredits > 0 || ucCredits > 0) {
      csuTotal += csuCredits;
      ucTotal += ucCredits;
      details.push({
        exam: `${test.type} ${test.subject}`,
        score: test.score,
        csu: csuCredits,
        uc: ucCredits
      });
    }
  });

  return {
    csu: Math.round(csuTotal * 10) / 10,
    uc: Math.round(ucTotal * 10) / 10,
    details
  };
}
