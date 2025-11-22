/**
 * RequirementsSidebar Component
 *
 * Purpose: Displays comprehensive graduation and college eligibility tracking
 * including Westview requirements (230 credits), UC/CSU A-G requirements,
 * UC GPA calculation, and State Seal of Biliteracy progress.
 *
 * Used by: App.jsx (right sidebar in main grid layout)
 *
 * Props:
 *   - westviewProgress (object): Progress toward each Westview requirement
 *       Format: { 'English': { earned, needed, met }, ... }
 *   - totalCredits (number): Total credits earned across all courses
 *   - westviewRequirements (object): Definition of Westview requirements
 *   - agProgress (object): Progress toward UC/CSU A-G requirements
 *       Format: { 'A': { earned, needed, met, recommended, meetsRecommended }, ... }
 *   - agRequirements (object): UC/CSU A-G requirement definitions
 *   - ucGPA (object|null): UC GPA calculation results (only if gpaMode is true)
 *   - biliteracySealEligibility (object): Biliteracy seal progress tracking
 *   - westviewGradOnly (boolean): If true, hide UC/CSU and Biliteracy sections
 *   - gpaMode (boolean): If true, show GPA-related details
 *
 * Sections:
 *   1. Westview Graduation Requirements - 230 credit requirement with breakdown
 *   2. UC/CSU A-G Requirements - 15 year A-G requirement with optional UC GPA
 *   3. State Seal of Biliteracy - 4 years English + 4 years language tracking
 *
 * Features:
 *   - Overall progress bar for 230 credit graduation requirement
 *   - Individual progress bars for each requirement category
 *   - UC GPA calculation (weighted & capped, unweighted, fully weighted)
 *   - Biliteracy seal eligibility tracker with GPA requirements
 *   - Conditional display based on westviewGradOnly mode
 *   - Recommended course year warnings for competitive UC/CSU admission
 */

import React from 'react';
import { CheckCircle2, AlertCircle, Circle } from 'lucide-react';
import { ProgressBar } from './ProgressBar.jsx';

export function RequirementsSidebar({
  westviewProgress,
  totalCredits,
  westviewRequirements,
  agProgress,
  agRequirements,
  ucGPA,
  biliteracySealEligibility,
  westviewGradOnly,
  gpaMode,
  isCaliforniaResident = true,
  metForeignLanguageIn78,
  setMetForeignLanguageIn78
}) {
  // GPA threshold: 3.0 for CA residents, 3.4 for non-residents
  const minGPA = isCaliforniaResident ? 3.0 : 3.4;
  return (
    <div className="space-y-6">
      {/* Westview Graduation Requirements */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Westview</h3>

        {/* Overall progress to 230 credits */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress to Graduation</span>
            <span className="text-sm font-bold text-gray-900">{totalCredits}/230</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                totalCredits >= 230 ? 'bg-green-500' : totalCredits > 0 ? 'bg-blue-500' : 'bg-gray-300'
              }`}
              style={{ width: `${Math.min((totalCredits / 230) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Individual requirement progress bars */}
        <div className="space-y-4">
          {Object.entries(westviewRequirements).map(([name, req]) => {
            const prog = westviewProgress[name];
            if (!prog) return null;
            return (
              <ProgressBar
                key={name}
                label={name}
                earned={prog.earned}
                needed={prog.needed}
              />
            );
          })}
        </div>
      </div>

      {/* UC/CSU Requirements - Only show if not in Westview Graduation Only mode */}
      {!westviewGradOnly && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">UC/CSU Eligibility</h3>
          <p className="text-sm text-gray-600 mb-4">A-G Requirements</p>

          {/* A-G requirement progress bars */}
          <div className="space-y-4">
            {Object.entries(agRequirements).map(([cat, req]) => {
              const prog = agProgress[cat];
              return (
                <div key={cat}>
                  <ProgressBar
                    label={req.short}
                    earned={prog.earned}
                    needed={prog.needed}
                    recommended={prog.recommended}
                    unit="year"
                    showPlural={true}
                  />
                  {/* Recommended year warning for competitive admission - show when met minimum but not recommended */}
                  {prog.met && !prog.meetsRecommended && prog.recommended > prog.needed && (
                    <div className="mt-1 text-xs text-orange-600 flex items-center gap-1">
                      <AlertCircle size={12} />
                      <span>Recommended: {prog.recommended} years for competitive admissions</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Foreign Language met in grades 7/8 button */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded cursor-pointer border border-gray-200">
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">Met Foreign Language in grades 7/8</span>
                <p className="text-xs text-gray-600 mt-1">
                  Check if your high school accepts your 7th/8th grade language courses as equivalent (adds 2 years)
                </p>
              </div>
              <input
                type="checkbox"
                checked={metForeignLanguageIn78}
                onChange={(e) => setMetForeignLanguageIn78(e.target.checked)}
                className="w-5 h-5 ml-3 flex-shrink-0"
              />
            </label>
          </div>

          <p className="text-xs text-gray-600 text-center mt-4 pt-4 border-t border-gray-200">
            Grade of C or better required
          </p>

          {/* UC GPA Details - Only shown when GPA mode is enabled */}
          {gpaMode && ucGPA && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-md font-bold text-gray-900 mb-3">UC GPA Calculation</h4>
              <div className="space-y-3">
                {/* Primary GPA: Weighted & Capped */}
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Weighted & Capped</span>
                    <span className="text-lg font-bold text-blue-700">{ucGPA.weightedCapped}</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {ucGPA.totalGrades} A-G courses (grades 10-11)
                  </div>
                  <div className="text-xs text-gray-600">
                    {ucGPA.cappedHonorsUsed} honors points used (max 8)
                  </div>
                </div>

                {/* Secondary GPAs: Unweighted and Fully Weighted */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-xs text-gray-600">Unweighted</div>
                    <div className="text-md font-bold text-gray-900">{ucGPA.unweighted}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-xs text-gray-600">Fully Weighted</div>
                    <div className="text-md font-bold text-gray-900">{ucGPA.fullyWeighted}</div>
                  </div>
                </div>

                {/* Honors course breakdown by grade */}
                <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
                  <div>Grade 10: {ucGPA.grade10Honors} honors courses</div>
                  <div>Grade 11: {ucGPA.grade11Honors} honors courses</div>
                </div>
              </div>

              {/* GPA requirement status */}
              {ucGPA.weightedCapped >= minGPA ? (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-2 flex items-center gap-2">
                  <CheckCircle2 className="text-green-600" size={16} />
                  <span className="text-xs font-medium text-green-800">Meets {minGPA} minimum GPA {!isCaliforniaResident && '(non-CA)'}</span>
                </div>
              ) : ucGPA.totalGrades > 0 ? (
                <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-2 flex items-center gap-2">
                  <AlertCircle className="text-orange-600" size={16} />
                  <span className="text-xs font-medium text-orange-800">Below {minGPA} minimum GPA {!isCaliforniaResident && '(non-CA)'}</span>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* State Seal of Biliteracy */}
      {!westviewGradOnly && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">State Seal of Biliteracy</h3>
          <p className="text-sm text-gray-600 mb-4">California Recognition</p>

          {biliteracySealEligibility.eligible ? (
            /* Eligible - Show congratulations banner */
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-4xl">🏅</div>
                <div>
                  <div className="font-bold text-amber-900">On Track to Earn!</div>
                  <div className="text-xs text-amber-700">{biliteracySealEligibility.primaryLanguage || 'World Language'}</div>
                </div>
              </div>
            </div>
          ) : (
            /* Not yet eligible - Show progress toward requirements */
            <div className="space-y-3">
              {/* English requirement progress */}
              <div className={`flex items-center justify-between p-3 rounded-lg ${
                biliteracySealEligibility.has4YearsEnglish && biliteracySealEligibility.englishGPAMet
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <div>
                  <div className="text-sm font-medium text-gray-700">English Requirement</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {biliteracySealEligibility.englishYears}/4 years
                    {gpaMode && biliteracySealEligibility.has4YearsEnglish && (
                      <span> • {biliteracySealEligibility.englishGPAMet ? '≥3.0 GPA ✓' : '<3.0 GPA'}</span>
                    )}
                  </div>
                </div>
                {biliteracySealEligibility.has4YearsEnglish && biliteracySealEligibility.englishGPAMet ? (
                  <CheckCircle2 className="text-green-600" size={20} />
                ) : (
                  <Circle className="text-gray-400" size={20} />
                )}
              </div>

              {/* World Language requirement progress */}
              <div className={`flex items-center justify-between p-3 rounded-lg ${
                biliteracySealEligibility.has4YearsLanguage && biliteracySealEligibility.languageGPAMet
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <div>
                  <div className="text-sm font-medium text-gray-700">World Language</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {biliteracySealEligibility.languageYears}/4 years
                    {biliteracySealEligibility.primaryLanguage && (
                      <span> • {biliteracySealEligibility.primaryLanguage}</span>
                    )}
                    {gpaMode && biliteracySealEligibility.has4YearsLanguage && (
                      <span> • {biliteracySealEligibility.languageGPAMet ? '≥3.0 GPA ✓' : '<3.0 GPA'}</span>
                    )}
                  </div>
                </div>
                {biliteracySealEligibility.has4YearsLanguage && biliteracySealEligibility.languageGPAMet ? (
                  <CheckCircle2 className="text-green-600" size={20} />
                ) : (
                  <Circle className="text-gray-400" size={20} />
                )}
              </div>
            </div>
          )}

          {/* Requirement explanation */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              {gpaMode
                ? 'Requirements: 4 years English (≥3.0 GPA) + 4 years same world language (≥3.0 GPA)'
                : 'Requirements: 4 years English + 4 years same world language. Enable GPA Mode to track GPA requirements.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
