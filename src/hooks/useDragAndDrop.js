/**
 * useDragAndDrop Hook
 *
 * Encapsulates drag-and-drop state and handlers for course scheduling.
 * Handles yearlong and semester course movement between quarters.
 */
import { useState, useCallback } from 'react';

/**
 * Drag and drop hook for course scheduling
 *
 * @param {Object} params
 * @param {Array} params.courses - Current courses array
 * @param {Function} params.updateCourses - Function to update courses (with history)
 * @param {Object} params.lockedSemesters - Locked semesters object
 * @param {Function} params.getCourseInfo - Function to get course info from catalog
 * @returns {Object} - Drag state and handlers
 */
export function useDragAndDrop({
  courses,
  updateCourses,
  lockedSemesters,
  getCourseInfo
}) {
  const [draggedCourse, setDraggedCourse] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);

  /**
   * Handle drag start
   */
  const handleDragStart = useCallback((e, course, year, quarter) => {
    // Check if source semester is locked
    const sourceSemester = ['Q1', 'Q2'].includes(quarter) ? 'fall' : 'spring';
    const sourceSemesterKey = `${year}-${sourceSemester}`;
    if (lockedSemesters[sourceSemesterKey]) {
      e.preventDefault();
      return; // Don't allow dragging from locked semester
    }

    setDraggedCourse({ course, year, quarter });
    e.dataTransfer.effectAllowed = 'move';
    // Add semi-transparent effect
    e.currentTarget.style.opacity = '0.5';
  }, [lockedSemesters]);

  /**
   * Handle drag end
   */
  const handleDragEnd = useCallback((e) => {
    setDraggedCourse(null);
    setDragOverSlot(null);
    e.currentTarget.style.opacity = '1';
  }, []);

  /**
   * Handle drag over
   */
  const handleDragOver = useCallback((e, targetYear, targetQuarter, slotIndex) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot({ year: targetYear, quarter: targetQuarter, slot: slotIndex });
  }, []);

  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback(() => {
    setDragOverSlot(null);
  }, []);

  /**
   * Get quarter pair for a given quarter
   * @param {string} q - Quarter ('Q1', 'Q2', 'Q3', 'Q4')
   * @returns {Array} - Pair of quarters
   */
  const getQuarterPair = (q) => {
    if (q === 'Q1' || q === 'Q2') return ['Q1', 'Q2'];
    return ['Q3', 'Q4'];
  };

  /**
   * Handle drop
   */
  const handleDrop = useCallback((e, targetYear, targetQuarter, slotIndex) => {
    e.preventDefault();

    if (!draggedCourse) return;

    const { course, year: sourceYear, quarter: sourceQuarter } = draggedCourse;
    const courseInfo = getCourseInfo(course.courseId);

    // Check if target semester is locked
    const targetSemester = ['Q1', 'Q2'].includes(targetQuarter) ? 'fall' : 'spring';
    const targetSemesterKey = `${targetYear}-${targetSemester}`;
    if (lockedSemesters[targetSemesterKey]) {
      setDraggedCourse(null);
      setDragOverSlot(null);
      return; // Don't allow dropping into locked semester
    }

    // Don't do anything if dropping in the same location
    if (sourceYear === targetYear && sourceQuarter === targetQuarter) {
      setDraggedCourse(null);
      setDragOverSlot(null);
      return;
    }

    // Check if course is yearlong or semester (both span 2 quarters of a term)
    if (courseInfo.term_length === 'yearlong' || courseInfo.term_length === 'semester') {
      // For yearlong/semester courses, we need to move both quarters of the term
      const targetPair = getQuarterPair(targetQuarter);
      const [targetQ1, targetQ2] = targetPair;

      // Update courses by removing from both source quarters and adding to both target quarters
      updateCourses(prev => {
        // Remove from both source quarters (all instances of this course in source year)
        const withoutSource = prev.filter(c =>
          !(c.courseId === course.courseId && c.year === sourceYear)
        );

        // Add to both target quarters
        return [
          ...withoutSource,
          { ...course, year: targetYear, quarter: targetQ1, id: `${course.courseId}-${targetYear}-${targetQ1}` },
          { ...course, year: targetYear, quarter: targetQ2, id: `${course.courseId}-${targetYear}-${targetQ2}` }
        ];
      });
    } else {
      // For semester courses, just move to the target semester
      updateCourses(prev => prev.map(c => {
        if (c.id === course.id) {
          return { ...c, year: targetYear, quarter: targetQuarter, id: `${c.courseId}-${targetYear}-${targetQuarter}` };
        }
        return c;
      }));
    }

    setDraggedCourse(null);
    setDragOverSlot(null);
  }, [draggedCourse, lockedSemesters, getCourseInfo, updateCourses]);

  return {
    // State
    draggedCourse,
    dragOverSlot,

    // Handlers
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop
  };
}
