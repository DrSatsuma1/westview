/**
 * WarningBanner Component
 *
 * Purpose: Displays contextual alert messages with color-coded severity levels.
 * Used throughout the app for validation errors, warnings, and informational messages.
 *
 * Used by: App.jsx (validation warnings, course addition errors/warnings, etc.)
 *
 * Props:
 *   - type (string): Severity level - 'error', 'warning', 'info', or 'orange' (displays as amber)
 *   - message (string|ReactNode): Message content to display
 *   - icon (boolean, optional): Whether to show an alert icon. Defaults to true.
 *   - className (string, optional): Additional CSS classes to append
 *   - compact (boolean, optional): If true, uses compact styling for grid warnings. Defaults to false.
 *
 * Visual Types:
 *   - error: Red background (bg-red-50/100) with red border and text
 *   - warning: Yellow background (bg-yellow-50/100) with yellow border and text
 *   - info: Blue background (bg-blue-50/100) with blue border and text
 *   - orange: Amber background (bg-amber-50) with amber border and text
 *
 * Usage Examples:
 *   // Error message
 *   <WarningBanner type="error" message="Cannot add course: prerequisite missing" />
 *
 *   // Warning with custom content
 *   <WarningBanner type="warning" message={<span>Missing English: Grade 11</span>} />
 *
 *   // Compact style for grid warnings
 *   <WarningBanner type="warning" message="Missing PE: Grades 9, 10" compact={true} />
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';

export function WarningBanner({
  type = 'info',
  message,
  icon = true,
  className = '',
  compact = false
}) {
  // Determine color scheme based on type
  const styles = {
    error: {
      bg: compact ? 'bg-red-50' : 'bg-red-100',
      border: 'border-red-400',
      text: 'text-red-800',
      icon: 'text-red-600',
      borderWidth: compact ? 'border' : 'border'
    },
    warning: {
      bg: compact ? 'bg-yellow-50' : 'bg-yellow-100',
      border: 'border-yellow-400',
      text: 'text-yellow-800',
      icon: 'text-yellow-600',
      borderWidth: compact ? 'border' : 'border'
    },
    info: {
      bg: compact ? 'bg-blue-50' : 'bg-blue-100',
      border: 'border-blue-400',
      text: 'text-blue-800',
      icon: 'text-blue-600',
      borderWidth: compact ? 'border' : 'border'
    },
    orange: {
      bg: 'bg-amber-50',
      border: 'border-amber-400',
      text: 'text-amber-800',
      icon: 'text-amber-600',
      borderWidth: 'border'
    }
  };

  const style = styles[type] || styles.info;

  // Compact layout (for grid warnings)
  if (compact) {
    return (
      <div
        className={`${style.bg} ${style.borderWidth} ${style.border} rounded-lg px-3 py-2 flex items-center gap-2 min-w-fit max-w-[48%] ${className}`}
      >
        {icon && <AlertCircle className={`${style.icon} flex-shrink-0`} size={16} />}
        <div className={`text-sm ${style.text}`}>{message}</div>
      </div>
    );
  }

  // Full-width layout (for inline errors/warnings)
  return (
    <div
      className={`${style.bg} ${style.borderWidth} ${style.border} ${style.text} px-3 py-2 rounded text-sm ${className}`}
    >
      {icon ? (
        <div className="flex items-center gap-2">
          <AlertCircle className={`${style.icon} flex-shrink-0`} size={16} />
          <div>{message}</div>
        </div>
      ) : (
        message
      )}
    </div>
  );
}
