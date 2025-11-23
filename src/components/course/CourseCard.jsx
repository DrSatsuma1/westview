/**
 * CourseCard Component
 *
 * Purpose: Displays a single course in the 4-year planning grid with all relevant
 * information including course name, pathway, credits, UC/CSU category, and optional
 * grade selection. Supports drag-and-drop reordering between semesters.
 *
 * Used by: App.jsx (main course grid rendering)
 *
 * Props:
 *   - course (object): The course instance with { id, courseId, grade }
 *   - year (number): Grade level (9, 10, 11, 12)
 *   - quarter (string): Semester identifier ('Q1', 'Q2', 'Q3', 'Q4')
 *   - slotIndex (number): Position within the quarter's slot array
 *   - isOptionalSlot (boolean): Whether this is slot 5 or 6 (optional slots)
 *   - gpaMode (boolean): Whether to show grade selection dropdown
 *   - draggedCourse (object|null): Currently dragged course { course, year, quarter }
 *   - dragOverSlot (object|null): Current drop target { year, quarter, slot }
 *   - courseCatalog (object): Full course catalog keyed by course_id
 *   - pathwayColors (object): Mapping of pathway names to Tailwind border colors
 *   - agRequirements (object): UC/CSU A-G requirements with short names
 *   - gradeOptions (array): Available grade options ['A+', 'A', ...]
 *   - ctePathways (object): CTE pathway definitions with course lists
 *   - ctePathwayIcons (object): CTE pathway icon components and colors
 *   - onDragStart (function): Handler for drag start - (event, course, year, quarter) => void
 *   - onDragEnd (function): Handler for drag end - (event) => void
 *   - onDragOver (function): Handler for drag over - (event, year, quarter, slotIndex) => void
 *   - onDragLeave (function): Handler for drag leave - () => void
 *   - onDrop (function): Handler for drop - (event, year, quarter, slotIndex) => void
 *   - onRemove (function): Handler for course removal - (courseId) => void
 *   - onGradeChange (function): Handler for grade selection - (courseId, grade) => void
 *
 * Features:
 *   - Visual pathway indicator (colored left border)
 *   - AP/Honors badge display
 *   - Year-long course indicator
 *   - UC/CSU A-G category display
 *   - Optional grade selection (GPA mode)
 *   - CTE pathway icon display
 *   - Drag-and-drop support with visual feedback
 *   - Remove button with hover effect
 */

import React from 'react';

export function CourseCard({
  course,
  year,
  quarter,
  slotIndex,
  isOptionalSlot,
  gpaMode,
  draggedCourse,
  dragOverSlot,
  courseCatalog,
  pathwayColors,
  agRequirements,
  gradeOptions,
  ctePathways,
  ctePathwayIcons,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemove,
  onGradeChange
}) {
  // Get full course information from catalog
  const info = courseCatalog[course.courseId];

  // Calculate display properties
  const isDragging = draggedCourse?.course?.id === course.id;
  const isDropTarget = dragOverSlot?.year === year &&
                       dragOverSlot?.quarter === quarter &&
                       dragOverSlot?.slot === slotIndex;
  const pathwayColor = pathwayColors[info.pathway] || 'bg-gray-400';

  // Format course number as "xxxxxx-xxxxxx" (join semester 1 and 2 numbers)
  const courseNumber = info.course_numbers && info.course_numbers.length >= 2
    ? `${info.course_numbers[0]}-${info.course_numbers[1]}`
    : info.course_numbers && info.course_numbers.length === 1
    ? info.course_numbers[0]
    : '';

  // Format display name: abbreviate for space, remove unnecessary text
  const displayName = info.full_name
    .replace(/ AND /g, ' & ')
    .replace(/ \(PLTW\)/g, '')
    .replace(/INTEGRATED MATHEMATICS/g, 'Integrated Math')
    .replace(/INTRODUCTION/gi, 'Intro');


  return (
    <div
      key={course.id}
      draggable={true}
      onDragStart={(e) => onDragStart(e, course, year, quarter)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, year, quarter, slotIndex)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, year, quarter, slotIndex)}
      className={`rounded-lg p-3 min-h-[160px] transition-all border-l-4 border-r border-t border-b bg-gray-100 shadow-md cursor-move ${pathwayColor} ${
        isOptionalSlot ? 'border-gray-300' : 'border-gray-200'
      } ${
        isDragging ? 'opacity-50 border-blue-400' : 'hover:shadow-md'
      } ${
        isDropTarget ? 'ring-2 ring-blue-400 bg-blue-50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Left side: Course information */}
        <div className="flex-1 min-w-0">
          {/* Course name - reserve 3 lines (min-height) for alignment */}
          <div className="font-bold text-base text-gray-900 break-words mb-1 min-h-[4rem] line-clamp-3 uppercase">
            {displayName}
          </div>

          {/* Course number */}
          {courseNumber && (
            <div className="text-sm text-gray-600 font-mono">
              {courseNumber}
            </div>
          )}

          {/* Course category (pathway) */}
          <div className="text-sm text-gray-700 font-medium">
            {info.pathway}
          </div>

          {/* Grade selection dropdown (only shown in GPA mode for A-G courses) */}
          {gpaMode && info.uc_csu_category && (
            <div className="mt-2">
              <select
                value={course.grade || ''}
                onChange={(e) => onGradeChange(course.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
              >
                <option value="">Select Grade</option>
                {gradeOptions.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right side: Credits and remove button */}
        <div className="flex flex-col items-end justify-between flex-shrink-0">
          {/* Credit value */}
          <div className="text-sm text-gray-700 font-semibold">
            {info.credits} credits
          </div>

          {/* Remove button */}
          <button
            onClick={() => onRemove(course.id)}
            className="text-red-500 hover:text-red-600 text-2xl font-bold flex-shrink-0"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
