import React from 'react';
import { CheckCircle2, AlertCircle, Circle } from 'lucide-react';

export function AGRequirements({ requirements, progress }) {
  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">UC/CSU Eligibility</h3>
      <p className="text-sm text-gray-600 mb-4">A-G Requirements</p>
      <div className="space-y-4">
        {Object.entries(requirements).map(([cat, req]) => {
          const prog = progress[cat];
          const pct = Math.min((prog.earned / prog.needed) * 100, 100);
          return (
            <div key={cat}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{req.short}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">
                    {prog.earned}/{prog.needed} {prog.needed === 1 ? 'year' : 'years'}
                  </span>
                  {prog.met ? (
                    <CheckCircle2 className="text-green-600" size={18} />
                  ) : prog.earned > 0 ? (
                    <AlertCircle className="text-amber-500" size={18} />
                  ) : (
                    <Circle className="text-gray-300" size={18} />
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    prog.met ? 'bg-green-500' : prog.earned > 0 ? 'bg-amber-500' : 'bg-gray-300'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {prog.met && !prog.meetsRecommended && prog.recommended > prog.needed && (
                <div className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  <span>Recommended: {prog.recommended} years for competitive admissions</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-600 text-center mt-4 pt-4 border-t border-gray-200">
        Grade of C or better required
      </p>
    </div>
  );
}
