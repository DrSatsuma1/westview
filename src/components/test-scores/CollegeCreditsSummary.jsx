/**
 * CollegeCreditsSummary Component
 *
 * Displays a summary table of college credits earned from test scores
 * with CSU and UC unit breakdowns.
 */
import React from 'react';

export function CollegeCreditsSummary({ collegeCredits }) {
  if (!collegeCredits || collegeCredits.details.length === 0) {
    return null;
  }

  return (
    <div className="max-w-[1800px] mx-auto px-12 pb-16 mt-12">
      <div className="lg:pr-[calc(25%+1.5rem)]">
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4">
            <h3 className="text-2xl font-bold">College Credits from Test Scores</h3>
          </div>

          <div className="p-6">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-4 font-bold text-[#1A202C]">Test</th>
                  <th className="text-center py-3 px-4 font-bold text-[#1A202C]">Score</th>
                  <th className="text-center py-3 px-4 font-bold text-[#1A202C]">CSU Units</th>
                  <th className="text-center py-3 px-4 font-bold text-[#1A202C]">UC Units</th>
                </tr>
              </thead>
              <tbody>
                {collegeCredits.details.map((detail, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4 text-[#1A202C]">{detail.exam}</td>
                    <td className="py-3 px-4 text-center text-[#718096]">{detail.score}</td>
                    <td className="py-3 px-4 text-center text-[#718096]">{detail.csu}</td>
                    <td className="py-3 px-4 text-center text-[#718096]">{detail.uc}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td colSpan="2" className="py-4 px-4 text-right font-bold text-[#1A202C]">Total CSU Credits:</td>
                  <td className="py-4 px-4 text-center font-bold text-[#2B6CB0] text-xl">{collegeCredits.csu}</td>
                  <td className="py-4 px-4"></td>
                </tr>
                <tr>
                  <td colSpan="2" className="py-4 px-4 text-right font-bold text-[#1A202C]">Total UC Credits:</td>
                  <td className="py-4 px-4"></td>
                  <td className="py-4 px-4 text-center font-bold text-[#2B6CB0] text-xl">{collegeCredits.uc}</td>
                </tr>
              </tfoot>
            </table>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-[#718096]">
                Note: Credit values are estimates based on typical CSU and UC policies. Actual credit awarded may vary by campus.
                UC credits shown are semester units for Berkeley/Merced (multiply by 1.5 for quarter units at other UCs).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
