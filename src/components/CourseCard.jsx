import React from 'react';
import { Award, Link2 } from 'lucide-react';
import { LINKED_COURSE_RULES } from '../config';

// Function to abbreviate course names for display
function abbreviateCourseName(fullName) {
  // Remove common words and numbers to shorten the name
  const abbreviated = fullName
    .replace(/HONORS?/gi, 'Hon.')
    .replace(/ADVANCED PLACEMENT/gi, 'AP')
    .replace(/INTEGRATED/gi, 'Int.')
    .replace(/MATHEMATICS/gi, 'Math')
    .replace(/COMPUTER SCIENCE/gi, 'CS')
    .replace(/CHEMISTRY/gi, 'Chem')
    .replace(/BIOLOGY/gi, 'Bio')
    .replace(/LITERATURE/gi, 'Lit')
    .replace(/AMERICAN/gi, 'Am.')
    .replace(/BRITISH/gi, 'Brit.')
    .replace(/STATISTICS/gi, 'Stats')
    .replace(/STUDIO ART/gi, 'Art')
    .replace(/DIGITAL PHOTOGRAPHY/gi, 'Photo')
    .replace(/DRAWING & PAINTING/gi, 'D&P')
    .replace(/CERAMICS/gi, 'Cer.')
    .replace(/PRECALCULUS/gi, 'Pre-Calc')
    .replace(/CALCULUS/gi, 'Calc')
    .replace(/\s+1-2|\s+3-4|\s+5-6|\s+7-8|\s+9-10/g, '') // Remove course number suffixes
    .trim();

  // If still too long, take first 20 characters
  return abbreviated.length > 20 ? abbreviated.substring(0, 20) + '...' : abbreviated;
}

// Find linked course for a given course ID
function findLinkedCourse(courseId, courseCatalog) {
  for (const rule of LINKED_COURSE_RULES) {
    if (rule.type === 'bidirectional' && rule.courses) {
      const [courseA, courseB] = rule.courses;
      if (courseA === courseId) {
        return courseCatalog[courseB];
      } else if (courseB === courseId) {
        return courseCatalog[courseA];
      }
    } else if (rule.type === 'sequential') {
      if (rule.first === courseId) {
        return courseCatalog[rule.second];
      }
    } else if (rule.type === 'one_way') {
      if (rule.trigger === courseId) {
        return courseCatalog[rule.adds];
      }
    }
  }
  return null;
}

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
  courseCatalog,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onGradeChange,
  onRemove
}) {
  const courseNumber = courseInfo.course_numbers && courseInfo.course_numbers.length > 0
    ? courseInfo.course_numbers.join(' - ')
    : '';

  // Find linked course if exists
  const linkedCourse = findLinkedCourse(course.courseId, courseCatalog);

  return (
    <div
      draggable={true}
      onDragStart={(e) => onDragStart(e, course, year, quarter)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, year, quarter, slotIndex)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, year, quarter, slotIndex)}
      className={`rounded-lg p-3 transition-all border-l-4 border-r border-t border-b bg-white shadow-sm cursor-move relative min-h-[110px] ${pathwayColor} ${
        isOptionalSlot ? 'border-gray-300' : 'border-gray-200'
      } ${
        isDragging ? 'opacity-50 border-blue-400' : 'hover:shadow-md'
      } ${
        isDropTarget ? 'ring-2 ring-blue-400 bg-blue-50' : ''
      }`}
    >
      <div className="flex flex-col gap-2">
        {/* Top section: Course name and info */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-start gap-1.5 mb-1">
            {courseInfo.is_ap_or_honors_pair && <Award className="text-purple-600 flex-shrink-0 mt-0.5" size={16} />}
            <div className="font-bold text-sm text-gray-900 line-clamp-3 leading-tight">{courseInfo.full_name}</div>
          </div>
          <div className="text-xs text-gray-500">
            {courseNumber && <span>{courseNumber} | </span>}
            <span>{courseInfo.pathway}</span>
          </div>
          {courseInfo.notes && (
            <div className="text-xs text-gray-600 mt-1 line-clamp-3 leading-relaxed">
              {courseInfo.notes}
            </div>
          )}
          <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
            {/* Show linked course with link icon if exists */}
            {linkedCourse && (
              <div className="flex items-center gap-1">
                <Link2 className="text-blue-500 flex-shrink-0" size={12} />
                <span className="text-blue-600">{abbreviateCourseName(linkedCourse.full_name)}</span>
              </div>
            )}
            {linkedCourse && courseInfo.uc_csu_category && ' • '}
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

        {/* Bottom section: Credits, CTE icon, and delete button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-400">
              {courseInfo.credits} cr.
            </div>
            {ctePathway && ctePathwayIcons[ctePathway] && (
              <div className="flex items-center">
                {React.createElement(ctePathwayIcons[ctePathway].icon, {
                  className: `${ctePathwayIcons[ctePathway].color} flex-shrink-0`,
                  size: 16
                })}
              </div>
            )}
          </div>
          <button
            onClick={() => onRemove(course.id)}
            className="text-red-600 hover:text-red-700 text-xl font-bold flex-shrink-0"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
