import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export function UCGPADetails({ ucGPA }) {
  if (!ucGPA) return null;

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <h4 className="text-md font-bold text-gray-900 mb-3">UC GPA Calculation</h4>
      <div className="space-y-3">
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

        <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
          <div>Grade 10: {ucGPA.grade10Honors} honors courses</div>
          <div>Grade 11: {ucGPA.grade11Honors} honors courses</div>
        </div>
      </div>

      {ucGPA.weightedCapped >= 3.4 ? (
        <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-2 flex items-center gap-2">
          <CheckCircle2 className="text-green-600" size={16} />
          <span className="text-xs font-medium text-green-800">Meets 3.4 minimum GPA</span>
        </div>
      ) : ucGPA.totalGrades > 0 ? (
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center gap-2">
          <AlertCircle className="text-amber-600" size={16} />
          <span className="text-xs font-medium text-amber-800">Below 3.4 minimum GPA</span>
        </div>
      ) : null}
    </div>
  );
}
