import React from 'react';
import { CheckCircle2, AlertCircle, Circle } from 'lucide-react';

export function WestviewRequirements({ requirements, progress }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Westview Graduation</h3>
      <p className="text-sm text-gray-600 mb-4">230 credits required</p>
      <div className="space-y-4">
        {Object.entries(requirements).map(([name, req]) => {
          const prog = progress[name];
          if (!prog) return null;
          const pct = Math.min((prog.earned / prog.needed) * 100, 100);
          return (
            <div key={name}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">
                    {prog.earned}/{prog.needed}
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
