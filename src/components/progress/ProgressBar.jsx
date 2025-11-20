/**
 * ProgressBar Component
 *
 * Purpose: Displays progress toward a requirement with visual indicators including
 * progress percentage, earned/needed counts, status icon, and colored progress bar.
 * Used for both Westview graduation requirements and UC/CSU A-G requirements.
 *
 * Used by: App.jsx (Westview Requirements sidebar, UC/CSU Requirements sidebar)
 *
 * Props:
 *   - label (string): Display name of the requirement (e.g., "English", "Math")
 *   - earned (number): Current progress value (credits or years earned)
 *   - needed (number): Target requirement value (credits or years needed)
 *   - unit (string, optional): Unit label for the values (e.g., "years"). Defaults to no unit.
 *   - showPlural (boolean, optional): If true, pluralizes unit when needed > 1. Defaults to false.
 *
 * Visual States:
 *   - Complete (earned >= needed): Green bar and checkmark icon
 *   - In Progress (0 < earned < needed): Orange bar and alert icon
 *   - Not Started (earned === 0): Gray bar and empty circle icon
 *
 * Features:
 *   - Responsive progress bar that fills based on earned/needed percentage
 *   - Status icons that change based on progress state
 *   - Smooth transitions when progress updates
 *   - Caps visual progress at 100% even if earned > needed
 */

import React from 'react';
import { CheckCircle2, AlertCircle, Circle } from 'lucide-react';

export function ProgressBar({
  label,
  earned,
  needed,
  unit = '',
  showPlural = false
}) {
  // Calculate progress percentage (capped at 100% for visual display)
  const percentage = Math.min((earned / needed) * 100, 100);

  // Determine progress state for styling
  const isComplete = earned >= needed;
  const isInProgress = earned > 0 && !isComplete;
  const isNotStarted = earned === 0;

  // Format unit text with optional pluralization
  const unitText = unit ? (showPlural && needed !== 1 ? `${unit}s` : unit) : '';

  return (
    <div>
      {/* Label, count, and status icon row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>

        <div className="flex items-center gap-2">
          {/* Earned/Needed count */}
          <span className="text-sm font-bold text-gray-900">
            {earned}/{needed}{unitText && ` ${unitText}`}
          </span>

          {/* Status icon */}
          {isComplete ? (
            <CheckCircle2 className="text-green-600" size={18} />
          ) : isInProgress ? (
            <AlertCircle className="text-orange-500" size={18} />
          ) : (
            <Circle className="text-gray-300" size={18} />
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            isComplete ? 'bg-green-500' : isInProgress ? 'bg-orange-500' : 'bg-gray-300'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
