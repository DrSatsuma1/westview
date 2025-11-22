/**
 * Header Component
 *
 * Main application header with title, language selector, action buttons, and settings.
 */
import React from 'react';
import { SettingsDropdown } from '../SettingsDropdown.jsx';
import { EarlyGradButton } from '../EarlyGradButton.jsx';

export function Header({
  // Language preference
  preferredLanguage,
  setPreferredLanguage,
  // Test scores
  setShowTestScores,
  // Early grad
  earlyGradMode,
  setEarlyGradMode,
  earlyGradEligibility,
  // Undo
  courseHistory,
  onUndo,
  // Clear
  onClearAll,
  // Settings
  gpaMode,
  setGpaMode,
  westviewGradOnly,
  setWestviewGradOnly,
  showTestScores,
  hideAPClasses,
  setHideAPClasses,
  hideSpecialEdClasses,
  setHideSpecialEdClasses,
  ctePathwayMode,
  setCtePathwayMode,
  testScoresRef,
  allowRepeatCourses,
  setAllowRepeatCourses,
  isCaliforniaResident,
  setIsCaliforniaResident,
  // CTE Progress
  ctePathwayProgress
}) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-[1800px] mx-auto px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Title */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-4">
              <div className="flex-grow">
                <h1 className="text-3xl font-bold text-[#1A202C]">Westview High School</h1>
                <h2 className="text-2xl font-bold text-[#2D3748]">Course Planner</h2>
                <p className="text-[#718096] mt-1">Plan your path through high school</p>
              </div>
              {/* Foreign Language Selector */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Language:</label>
                <select
                  value={preferredLanguage || ''}
                  onChange={(e) => setPreferredLanguage(e.target.value || null)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">Select...</option>
                  <option value="Spanish">Spanish</option>
                  <option value="Chinese">Chinese</option>
                  <option value="French">French</option>
                  <option value="Filipino">Filipino</option>
                </select>
              </div>
              <button
                onClick={() => {
                  setShowTestScores(true);
                  setTimeout(() => {
                    const element = document.getElementById('test-scores-section');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }}
                className="bg-[#2B6CB0] hover:bg-[#2C5282] text-white border-2 border-[#2B6CB0] rounded-lg px-4 py-3 transition-colors text-sm font-bold whitespace-nowrap min-w-[140px] text-center"
              >
                Track AP Exams
              </button>
              <EarlyGradButton
                earlyGradMode={earlyGradMode}
                setEarlyGradMode={setEarlyGradMode}
                earlyGradEligibility={earlyGradEligibility}
              />
              <button
                onClick={onUndo}
                disabled={courseHistory.length === 0}
                className={`rounded-lg px-4 py-3 transition-colors text-sm font-bold min-w-[140px] text-center ${
                  courseHistory.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-2 border-gray-300'
                    : 'bg-[#718096] hover:bg-[#4A5568] text-white border-2 border-[#718096]'
                }`}
              >
                Undo
              </button>
              <button
                onClick={onClearAll}
                className="bg-[#C53030] hover:bg-[#9B2C2C] text-white border-2 border-[#C53030] rounded-lg px-4 py-3 transition-colors text-sm font-bold min-w-[140px] text-center"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Right: Settings */}
          <div className="flex justify-end">
            <SettingsDropdown
              gpaMode={gpaMode}
              setGpaMode={setGpaMode}
              westviewGradOnly={westviewGradOnly}
              setWestviewGradOnly={setWestviewGradOnly}
              showTestScores={showTestScores}
              setShowTestScores={setShowTestScores}
              hideAPClasses={hideAPClasses}
              setHideAPClasses={setHideAPClasses}
              hideSpecialEdClasses={hideSpecialEdClasses}
              setHideSpecialEdClasses={setHideSpecialEdClasses}
              ctePathwayMode={ctePathwayMode}
              setCtePathwayMode={setCtePathwayMode}
              testScoresRef={testScoresRef}
              allowRepeatCourses={allowRepeatCourses}
              setAllowRepeatCourses={setAllowRepeatCourses}
              isCaliforniaResident={isCaliforniaResident}
              setIsCaliforniaResident={setIsCaliforniaResident}
            />
          </div>
        </div>

        {/* CTE Pathway Button */}
        {ctePathwayMode.enabled && ctePathwayProgress.totalRequired > 0 && (
          <div className="mt-2">
            <button
              className="px-3 py-1.5 rounded-md bg-purple-100 border border-purple-300 hover:bg-purple-200 transition-colors text-xs font-medium text-purple-900"
              title={`${ctePathwayProgress.pathwayName}\nCourses: ${ctePathwayProgress.totalCompleted}/${ctePathwayProgress.totalRequired}\n${ctePathwayProgress.hasConcentrator ? 'Concentrator ✓\n' : ''}${ctePathwayProgress.capstoneCount > 0 ? `${ctePathwayProgress.capstoneCount} Capstone${ctePathwayProgress.capstoneCount > 1 ? 's' : ''} ✓\n` : ''}${ctePathwayProgress.completionStatus}`}
            >
              {ctePathwayProgress.pathwayName.split(' ')[0]} {ctePathwayProgress.totalCompleted}/{ctePathwayProgress.totalRequired}
              {ctePathwayProgress.isPathwayCompleter && ' ✓'}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
