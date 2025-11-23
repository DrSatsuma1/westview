import React from 'react';
import { AlertCircle } from 'lucide-react';

export function ValidationWarnings({ scheduleErrors, englishWarnings, peWarnings, prereqWarnings }) {
  const hasWarnings = scheduleErrors.length > 0 || englishWarnings.length > 0 ||
                      peWarnings.length > 0 || prereqWarnings.length > 0;

  if (!hasWarnings) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {/* Schedule Validation Errors */}
      {scheduleErrors.length > 0 && (
        <div className="bg-red-50 border border-red-400 rounded-lg px-3 py-2 flex items-center gap-2 min-w-fit max-w-[48%]">
          <AlertCircle className="text-red-600 flex-shrink-0" size={16} />
          <div className="text-sm text-red-800">
            <span className="font-semibold">Schedule Issues:</span>{' '}
            {scheduleErrors.map((err, idx) => (
              <span key={idx}>
                {idx > 0 && ', '}Grade {err.year}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* English Warning */}
      {englishWarnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-400 rounded-lg px-3 py-2 flex items-center gap-2 min-w-fit max-w-[48%]">
          <AlertCircle className="text-yellow-600 flex-shrink-0" size={16} />
          <div className="text-sm text-yellow-800">
            <span className="font-semibold">Missing English:</span>{' '}
            Grade{englishWarnings.length > 1 ? 's' : ''} {englishWarnings.join(', ')}
          </div>
        </div>
      )}

      {/* PE Warning */}
      {peWarnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-400 rounded-lg px-3 py-2 flex items-center gap-2 min-w-fit max-w-[48%]">
          <AlertCircle className="text-yellow-600 flex-shrink-0" size={16} />
          <div className="text-sm text-yellow-800">
            <span className="font-semibold">Missing PE:</span>{' '}
            Grade{peWarnings.length > 1 ? 's' : ''} {peWarnings.join(', ')}
          </div>
        </div>
      )}

      {/* Prerequisite Warnings */}
      {prereqWarnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-400 rounded-lg px-3 py-2 flex items-center gap-2 min-w-fit max-w-[48%]">
          <AlertCircle className="text-amber-600 flex-shrink-0" size={16} />
          <div className="text-sm text-amber-800">
            <span className="font-semibold">Prerequisites:</span>{' '}
            {prereqWarnings.map((w, idx) => (
              <span key={idx}>
                {idx > 0 && ' • '}{w.message}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
