/**
 * useCourseSchedule Hook
 *
 * Centralized hook for course schedule state management.
 * Handles: courses array, history for undo, localStorage persistence.
 *
 * This extraction removes ~50 lines from App.jsx while providing a clean
 * API for course mutations.
 */
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'westview-courses';
const MAX_HISTORY = 5;

/**
 * Load courses from localStorage with migration handling
 * @returns {Array} - Initial courses array
 */
function loadInitialCourses() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    const parsed = JSON.parse(saved);

    // Migration: Check if data is from old semester-based system
    // If any course has a 'semester' field instead of 'quarter', clear the data
    const hasOldData = parsed.some(c => c.semester !== undefined);
    if (hasOldData) {
      console.log('Detected old semester-based data. Clearing localStorage for quarter system migration.');
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('westview-completed-semesters');
      return [];
    }

    return parsed;
  } catch (error) {
    console.error('Error loading courses from localStorage:', error);
    return [];
  }
}

/**
 * Course schedule state management hook
 *
 * @returns {Object} - Schedule state and actions
 */
export function useCourseSchedule() {
  // Core state
  const [courses, setCourses] = useState(loadInitialCourses);
  const [courseHistory, setCourseHistory] = useState([]);

  // Persist courses to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  }, [courses]);

  /**
   * Update courses with history tracking for undo
   * @param {Array|Function} newCoursesOrUpdater - New courses array or updater function
   */
  const updateCourses = useCallback((newCoursesOrUpdater) => {
    setCourseHistory(prev => {
      // Push current state to history before update
      const updated = [...prev, courses];
      return updated.slice(-MAX_HISTORY); // Keep last N states
    });

    if (typeof newCoursesOrUpdater === 'function') {
      setCourses(prev => newCoursesOrUpdater(prev));
    } else {
      setCourses(newCoursesOrUpdater);
    }
  }, [courses]);

  /**
   * Undo last course change
   */
  const undo = useCallback(() => {
    if (courseHistory.length === 0) return;

    const previousState = courseHistory[courseHistory.length - 1];
    setCourseHistory(prev => prev.slice(0, -1));
    setCourses(previousState); // Direct set, no history push
  }, [courseHistory]);

  /**
   * Clear all courses (optionally preserving locked semesters)
   * @param {Object} options - Clear options
   * @param {Object} [options.lockedSemesters] - Locked semesters to preserve
   * @returns {Array} - Preserved courses (for UI to handle)
   */
  const clearAll = useCallback((options = {}) => {
    const { lockedSemesters = {} } = options;

    // Calculate preserved courses
    const preservedCourses = courses.filter(c => {
      const semester = ['Q1', 'Q2'].includes(c.quarter) ? 'fall' : 'spring';
      const semesterKey = `${c.year}-${semester}`;
      return lockedSemesters[semesterKey];
    });

    updateCourses(preservedCourses);
    return preservedCourses;
  }, [courses, updateCourses]);

  /**
   * Get courses for a specific quarter
   * @param {string} year - Grade year ('9', '10', '11', '12')
   * @param {string} quarter - Quarter ('Q1', 'Q2', 'Q3', 'Q4')
   * @returns {Array} - Courses in that quarter
   */
  const getCoursesForQuarter = useCallback((year, quarter) => {
    return courses.filter(c => c.year === year && c.quarter === quarter);
  }, [courses]);

  /**
   * Check if undo is available
   */
  const canUndo = courseHistory.length > 0;

  return {
    // State
    courses,
    courseHistory,
    canUndo,

    // Actions
    setCourses,           // Direct setter (use sparingly)
    updateCourses,        // Preferred: with history tracking
    undo,
    clearAll,

    // Helpers
    getCoursesForQuarter
  };
}
