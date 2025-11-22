/**
 * QuarterColumn Component
 *
 * Renders a single quarter column with course slots, add course form,
 * and semester credit total.
 */
import React from 'react';
import { CourseCard } from './CourseCard.jsx';
import { AddCourseForm } from './AddCourseForm.jsx';
import { EmptySlot } from './EmptySlot.jsx';
import { calculateSemesterTotal } from '../../domain/creditCalculation.js';

export function QuarterColumn({
  year,
  quarter,
  displayYear,
  quarterCourses,
  showAddCourse,
  setShowAddCourse,
  // Course catalog and config
  courseCatalog,
  pathwayColors,
  agRequirements,
  gradeOptions,
  ctePathways,
  ctePathwayIcons,
  // GPA mode
  gpaMode,
  // Drag state
  draggedCourse,
  dragOverSlot,
  // Drag handlers
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  // Course actions
  onRemoveCourse,
  onGradeChange,
  // Add course form state
  error,
  warning,
  selectedCategory,
  setSelectedCategory,
  newCourse,
  setNewCourse,
  coursesInPathway,
  pathways,
  hideAPClasses,
  hideSpecialEdClasses,
  courseSearchQuery,
  setCourseSearchQuery,
  searchResults,
  onAddCourse,
  // Concurrent enrollment
  concurrentCourses,
  setConcurrentCourses,
  showConcurrentForm,
  setShowConcurrentForm,
  newConcurrentCourse,
  setNewConcurrentCourse,
  convertCollegeUnitsToHSCredits,
  // Semester total calculation
  getCoursesForQuarter,
  setError,
  setWarning
}) {
  const slots = Array.from({ length: 6 }, (_, i) => quarterCourses[i] || null);

  // Calculate semester totals for Q2/Q4
  const renderSemesterTotal = () => {
    if (quarter !== 'Q2' && quarter !== 'Q4') return null;

    const semesterQuarters = quarter === 'Q2' ? ['Q1', 'Q2'] : ['Q3', 'Q4'];
    const semesterCourses = semesterQuarters.flatMap(q => getCoursesForQuarter(year, q));

    if (semesterCourses.length === 0) return null;

    // Use unique course IDs to avoid double-counting yearlong courses
    const uniqueCourseIds = [...new Set(semesterCourses.map(c => c.courseId))];
    const semesterTotal = calculateSemesterTotal(uniqueCourseIds, courseCatalog);

    return (
      <div className="mt-3 pt-3 border-t border-gray-300">
        <div className="text-sm font-semibold text-[#718096]">
          Semester Total: {semesterTotal} credits
        </div>
      </div>
    );
  };

  return (
    <div className="p-5">
      <div className="mb-4">
        <h4 className="font-bold text-[#718096] text-base">
          {quarter} {displayYear}
        </h4>
      </div>

      {/* Course Slots */}
      <div className="space-y-2">
        {slots.map((course, slotIndex) => {
          const isAddingHere = showAddCourse?.year === year &&
            showAddCourse?.quarter === quarter &&
            showAddCourse?.slot === slotIndex;
          const isOptionalSlot = slotIndex >= 4;

          if (course) {
            return (
              <CourseCard
                key={course.id}
                course={course}
                year={year}
                quarter={quarter}
                slotIndex={slotIndex}
                isOptionalSlot={isOptionalSlot}
                gpaMode={gpaMode}
                draggedCourse={draggedCourse}
                dragOverSlot={dragOverSlot}
                courseCatalog={courseCatalog}
                pathwayColors={pathwayColors}
                agRequirements={agRequirements}
                gradeOptions={gradeOptions}
                ctePathways={ctePathways}
                ctePathwayIcons={ctePathwayIcons}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onRemove={onRemoveCourse}
                onGradeChange={onGradeChange}
              />
            );
          } else if (isAddingHere) {
            return (
              <AddCourseForm
                key={`slot-${slotIndex}`}
                year={year}
                quarter={quarter}
                error={error}
                warning={warning}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                newCourse={newCourse}
                setNewCourse={setNewCourse}
                coursesInPathway={coursesInPathway}
                pathways={pathways}
                hideAPClasses={hideAPClasses}
                hideSpecialEdClasses={hideSpecialEdClasses}
                searchQuery={courseSearchQuery}
                setSearchQuery={setCourseSearchQuery}
                searchResults={searchResults}
                onAdd={onAddCourse}
                onCancel={() => {
                  setShowAddCourse(null);
                  setSelectedCategory('');
                  setNewCourse({ courseId: '' });
                  setCourseSearchQuery('');
                  setError(null);
                  setWarning(null);
                }}
                concurrentCourses={concurrentCourses}
                setConcurrentCourses={setConcurrentCourses}
                showConcurrentForm={showConcurrentForm}
                setShowConcurrentForm={setShowConcurrentForm}
                newConcurrentCourse={newConcurrentCourse}
                setNewConcurrentCourse={setNewConcurrentCourse}
                convertCollegeUnitsToHSCredits={convertCollegeUnitsToHSCredits}
              />
            );
          } else {
            const isDropTarget = dragOverSlot?.year === year &&
              dragOverSlot?.quarter === quarter &&
              dragOverSlot?.slot === slotIndex;
            return (
              <EmptySlot
                key={`slot-${slotIndex}`}
                year={year}
                quarter={quarter}
                slotIndex={slotIndex}
                isOptionalSlot={isOptionalSlot}
                isDropTarget={isDropTarget}
                onSlotClick={() => {
                  setShowAddCourse({ year, quarter, slot: slotIndex });
                  setSelectedCategory('');
                  setNewCourse({ courseId: '' });
                  setError(null);
                  setWarning(null);
                }}
                onDragOver={(e) => onDragOver(e, year, quarter, slotIndex)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, year, quarter, slotIndex)}
              />
            );
          }
        })}
      </div>

      {renderSemesterTotal()}
    </div>
  );
}
