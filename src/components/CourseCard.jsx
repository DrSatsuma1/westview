import React from 'react';
import { Award } from 'lucide-react';

export function CourseCard({
  course,
  courseInfo,
  year,
  quarter,
  slotIndex,
  isOptionalSlot,
  isDragging,
  isDropTarget,
  pathwayColor,
  ctePathway,
  ctePathwayIcons,
  gpaMode,
  gradeOptions,
  agRequirements,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onGradeChange,
  onRemove
}) {
  const isYearLong = courseInfo.term_length === 'yearlong';
  const courseNumber = courseInfo.course_numbers && courseInfo.course_numbers.length > 0
    ? courseInfo.course_numbers.join(' - ')
    : '';

  return (
    <div
      draggable={true}
      onDragStart={(e) => onDragStart(e, course, year, quarter)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, year, quarter, slotIndex)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, year, quarter, slotIndex)}
      className={`rounded-lg p-3 transition-all border-l-4 border-r border-t border-b bg-white shadow-sm cursor-move ${pathwayColor} ${
        isOptionalSlot ? 'border-gray-300' : 'border-gray-200'
      } ${
        isDragging ? 'opacity-50 border-blue-400' : 'hover:shadow-md'
      } ${
        isDropTarget ? 'ring-2 ring-blue-400 bg-blue-50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {courseInfo.is_ap_or_honors_pair && <Award className="text-purple-600 flex-shrink-0" size={16} />}
            <div className="font-bold text-sm text-gray-900 truncate">{courseInfo.full_name}</div>
          </div>
          <div className="text-xs text-gray-500">
            {courseNumber && <span>{courseNumber} | </span>}
            <span>{courseInfo.pathway}</span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {isYearLong && 'Year-long'}
            {isYearLong && courseInfo.uc_csu_category && ' • '}
            {courseInfo.uc_csu_category && (
              <span>
                {agRequirements[courseInfo.uc_csu_category]?.short || courseInfo.uc_csu_category}
              </span>
            )}
          </div>
          {gpaMode && courseInfo.uc_csu_category && (
            <div className="mt-2">
              <select
                value={course.grade || ''}
                onChange={(e) => onGradeChange(course.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
              >
                <option value="">Select Grade</option>
                {gradeOptions.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="text-xs text-gray-400">
            {courseInfo.credits} cr.
          </div>
          <div className="flex items-center gap-2">
            {ctePathway && ctePathwayIcons[ctePathway] && (
              <div className="flex items-center">
                {React.createElement(ctePathwayIcons[ctePathway].icon, {
                  className: `${ctePathwayIcons[ctePathway].color} flex-shrink-0`,
                  size: 20
                })}
              </div>
            )}
            <button
              onClick={() => onRemove(course.id)}
              className="text-red-600 hover:text-red-700 text-xl font-bold flex-shrink-0"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
