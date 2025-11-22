/**
 * SemesterControls Component
 *
 * Auto-fill and Lock buttons for a semester.
 */
import React from 'react';

/**
 * Light bulb icon for auto-fill button
 */
const LightBulbIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

/**
 * Locked padlock icon
 */
const LockedIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

/**
 * Unlocked padlock icon
 */
const UnlockedIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
  </svg>
);

export function SemesterControls({
  year,
  term,
  isLocked,
  onAutoFill,
  onToggleLock
}) {
  const termLabel = term === 'fall' ? 'Fall' : 'Spring';

  return (
    <div className="flex gap-2">
      <button
        onClick={() => onAutoFill(year, term)}
        disabled={isLocked}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
          isLocked
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-[#2B6CB0] text-white hover:bg-[#1E4E8C]'
        }`}
      >
        <LightBulbIcon />
        Auto-fill {termLabel}
      </button>
      <button
        onClick={() => onToggleLock(year, term)}
        className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
          isLocked
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        }`}
        title={isLocked ? `Unlock ${termLabel}` : `Lock ${termLabel}`}
      >
        {isLocked ? <LockedIcon /> : <UnlockedIcon />}
      </button>
    </div>
  );
}
