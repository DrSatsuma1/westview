import React, { useState, useMemo, useRef } from 'react';
// lucide-react icons now in EmptySlot component
import { useLocalStorage, useLocalStorageNullable } from './hooks/useLocalStorage';
import courseCatalogData from './data/courses_complete.json';
import { SchedulingEngine } from './scheduling/SchedulingEngine.js';
import { SettingsDropdown } from './components/SettingsDropdown.jsx';
import { EarlyGradButton } from './components/EarlyGradButton.jsx';
import { QuarterColumn } from './components/course/QuarterColumn.jsx';
import { WarningBanner } from './components/ui/WarningBanner.jsx';
import { RequirementsSidebar } from './components/progress/RequirementsSidebar.jsx';
import { TestScoreForm } from './components/test-scores/TestScoreForm.jsx';
import { CollegeCreditsSummary } from './components/test-scores/CollegeCreditsSummary.jsx';
import { Header } from './components/layout/Header.jsx';
import { SemesterControls } from './components/layout/SemesterControls.jsx';
import { getNormalizedCatalog } from './utils/CatalogNormalizer.js';
import { SuggestionEngine } from './utils/SuggestionEngine.js';
import { getSemesterCredits, calculateSemesterTotal, calculateYearTotal } from './domain/creditCalculation.js';
import {
  GRADE_OPTIONS,
  PATHWAY_COLORS,
  CTE_PATHWAY_ICONS,
  TEST_SUBJECTS,
  CTE_PATHWAYS,
  RECOMMENDED_9TH_GRADE,
  DEPRECATED_COURSES,
  AVID_COURSES,
  MAX_SEMESTER_CREDITS
} from './config';

// Progress calculations moved to useCourseProgress hook
import { WESTVIEW_REQUIREMENTS } from './domain/progress/westview.js';
import { AG_REQUIREMENTS } from './domain/progress/ag.js';
import { validateSemesterCompletion as validateSemesterCompletionLogic } from './domain/semesterValidation.js';
import {
  checkCourseEligibility as checkCourseEligibilityLogic,
  checkForeignLanguagePrereqs as checkFLPrereqsLogic,
  LINKED_REQUIREMENTS
} from './domain/courseEligibility.js';
import { validateCourseAddition } from './domain/courseValidation.js';
import {
  filterSuggestionsForTerm,
  buildCoursesFromSuggestions,
  processLinkedCourseRules
} from './hooks/useSuggestionEngine.js';
import { calculateCourseAdditions } from './domain/CourseAddition.js';
import { useCourseProgress } from './hooks/useCourseProgress.js';
import { useCourseSchedule } from './hooks/useCourseSchedule.js';
import { useDragAndDrop } from './hooks/useDragAndDrop.js';

// Load course catalog from JSON
const COURSE_CATALOG = courseCatalogData.courses.reduce((acc, course) => {
  acc[course.course_id] = course;
  return acc;
}, {});

// Create normalized catalog (fixes pathway inconsistencies)
const NORMALIZED_CATALOG = getNormalizedCatalog(COURSE_CATALOG);

// Initialize scheduling engine
const schedulingEngine = new SchedulingEngine(courseCatalogData.courses);

// WESTVIEW_REQUIREMENTS and AG_REQUIREMENTS imported from domain modules
// Config constants (GRADE_OPTIONS, PATHWAY_COLORS, etc.) imported from ./config

function App() {
  // Course schedule state management (extracted to hooks/useCourseSchedule.js)
  const {
    courses,
    courseHistory,
    canUndo,
    updateCourses,
    undo: handleUndo,
    clearAll: clearAllCourses,
    getCoursesForQuarter
  } = useCourseSchedule();
  const [showAddCourse, setShowAddCourse] = useState(null); // null or { year, quarter, slot }
  const [selectedCategory, setSelectedCategory] = useState(''); // Track selected category
  const [newCourse, setNewCourse] = useState({ courseId: '' });
  const [courseSearchQuery, setCourseSearchQuery] = useState(''); // For searching all courses
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  // Persisted settings (auto-saved to localStorage)
  const [earlyGradMode, setEarlyGradMode] = useLocalStorage('westview-early-grad-mode', { enabled: false, targetYear: null });
  const [ctePathwayMode, setCtePathwayMode] = useLocalStorage('westview-cte-pathway', { enabled: false, pathway: null });
  const [concurrentCourses, setConcurrentCourses] = useLocalStorage('westview-concurrent-courses', []);
  const [showConcurrentForm, setShowConcurrentForm] = useState(false);
  const [newConcurrentCourse, setNewConcurrentCourse] = useState({ name: '', collegeUnits: 3 });
  const [hideAPClasses, setHideAPClasses] = useLocalStorage('westview-hide-ap-classes', false);
  const [hideSpecialEdClasses, setHideSpecialEdClasses] = useLocalStorage('westview-hide-special-ed-classes', false);
  const [westviewGradOnly, setWestviewGradOnly] = useLocalStorage('westview-grad-only', false);
  const [gpaMode, setGpaMode] = useLocalStorage('westview-gpa-mode', false);
  const [isCaliforniaResident, setIsCaliforniaResident] = useLocalStorage('westview-ca-resident', true);
  const [showTestScores, setShowTestScores] = useState(false);
  const [allowRepeatCourses, setAllowRepeatCourses] = useState(false);
  const [testScores, setTestScores] = useLocalStorage('westview-test-scores', []);
  const [selectedTestType, setSelectedTestType] = useState('');

  // Drag and drop state and handlers (extracted to hooks/useDragAndDrop.js)
  // Note: useDragAndDrop needs getCourseInfo, which is defined below, so we initialize it after getCourseInfo

  // Ref for scrolling to test scores section
  const testScoresRef = useRef(null);

  // Semester completion tracking
  const [completedSemesters, setCompletedSemesters] = useLocalStorage('westview-completed-semesters', {});
  const [semesterValidation, setSemesterValidation] = useState(null);

  // Course suggestions
  const [suggestedCourses, setSuggestedCourses] = useState([]);

  // Initialize suggestion engine (ONE-TIME setup with normalized catalog)
  const [suggestionEngine] = useState(() => {
    return new SuggestionEngine(NORMALIZED_CATALOG, DEPRECATED_COURSES);
  });

  // Track if student met Foreign Language requirement in grades 7/8
  const [metForeignLanguageIn78, setMetForeignLanguageIn78] = useLocalStorage('westview-met-fl-in-78', false);

  // Preferred foreign language for auto-suggestions
  const [preferredLanguage, setPreferredLanguage] = useLocalStorageNullable('westview-preferred-language', null);

  // Locked semesters - prevent auto-suggest from replacing courses
  const [lockedSemesters, setLockedSemesters] = useLocalStorage('westview-locked-semesters', {});

  // Keyboard shortcut for undo (Ctrl+Z / Cmd+Z)
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo]);

  // Clear all courses (except locked semesters)
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all courses from your schedule? Locked semesters will be preserved.')) {
      // Use hook's clearAll with locked semesters
      clearAllCourses({ lockedSemesters });

      // Clear completedSemesters for non-locked semesters only
      const preservedCompleted = {};
      Object.keys(completedSemesters).forEach(key => {
        if (lockedSemesters[key]) {
          preservedCompleted[key] = completedSemesters[key];
        }
      });
      setCompletedSemesters(preservedCompleted);

      // Close add course dialog if open
      setShowAddCourse(null);
      setSelectedCategory('');
      setNewCourse({ courseId: '' });
    }
  };

  // Note: localStorage persistence for settings is now handled automatically by useLocalStorage hook
  // The following state variables are auto-persisted: earlyGradMode, ctePathwayMode, concurrentCourses,
  // hideAPClasses, hideSpecialEdClasses, westviewGradOnly, gpaMode, isCaliforniaResident, testScores,
  // completedSemesters, metForeignLanguageIn78, preferredLanguage, lockedSemesters
  // getCoursesForQuarter is now provided by useCourseSchedule hook

  // All progress, GPA, and validation calculations (extracted to hooks/useCourseProgress.js)
  const {
    westviewProgress,
    totalCredits,
    westviewGraduationReady,
    earlyGradEligibility,
    ctePathwayProgress,
    agProgress,
    ucsuEligible,
    ucGPA,
    biliteracySealEligibility,
    collegeCredits,
    scheduleValidation,
    warnings: { english: englishWarnings, pe: peWarnings, prereq: prereqWarnings }
  } = useCourseProgress({
    courses,
    courseCatalog: COURSE_CATALOG,
    schedulingEngine,
    settings: { ctePathwayMode, gpaMode, metForeignLanguageIn78, testScores }
  });

  // Helper function to check if student is eligible for a course (extracted to domain/courseEligibility.js)
  const checkCourseEligibility = (courseId, targetYear) => {
    return checkCourseEligibilityLogic(courseId, targetYear, courses, COURSE_CATALOG);
  };

  // Helper function to check for missing foreign language prerequisites (extracted to domain/courseEligibility.js)
  const checkForeignLanguagePrereqs = (courseId) => {
    return checkFLPrereqsLogic(courseId, courses, COURSE_CATALOG);
  };

  // Convert college units to high school credits
  const convertCollegeUnitsToHSCredits = (collegeUnits) => {
    if (collegeUnits === 2) return 2.5;
    if (collegeUnits === 3) return 5;
    if (collegeUnits === 4) return 5;
    if (collegeUnits === 5) return 10;
    // For other values, use a proportional conversion (2.5 credits per unit)
    return collegeUnits * 2.5;
  };

  // Helper function to check if a course is recommended for 9th grade
  const isRecommended9thGrade = (courseName) => {
    const upperName = courseName.toUpperCase();
    return Object.values(RECOMMENDED_9TH_GRADE).flat().some(recommended =>
      upperName.includes(recommended.toUpperCase()) || recommended.toUpperCase().includes(upperName)
    );
  };

  // Helper function to get course info (handles both catalog and concurrent courses)
  const getCourseInfo = (courseId) => {
    if (courseId.startsWith('CONCURRENT_')) {
      const concurrentCourse = concurrentCourses.find(c => c.id === courseId);
      if (!concurrentCourse) return null;

      return {
        course_id: concurrentCourse.id,
        full_name: concurrentCourse.name,
        credits: concurrentCourse.credits,
        pathway: 'Electives',
        term_length: 'semester',
        offered_terms: ['fall', 'spring'],
        uc_csu_category: null
      };
    }
    return COURSE_CATALOG[courseId] || null;
  };

  // Drag-and-drop state and handlers (extracted to hooks/useDragAndDrop.js)
  const {
    draggedCourse,
    dragOverSlot,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop
  } = useDragAndDrop({
    courses,
    updateCourses,
    lockedSemesters,
    getCourseInfo
  });

  // Validate semester completion (extracted to domain/semesterValidation.js)
  const validateSemesterCompletion = (year, quarter) => {
    return validateSemesterCompletionLogic(year, quarter, courses, getCourseInfo);
  };

  // Handle marking semester as complete
  const markSemesterComplete = (year, quarter) => {
    const validation = validateSemesterCompletion(year, quarter);
    setSemesterValidation({ year, quarter, ...validation });

    if (validation.valid) {
      setCompletedSemesters(prev => ({
        ...prev,
        [`${year}-${quarter}`]: true
      }));
    }
  };

  // Handle unmarking semester
  const unmarkSemesterComplete = (year, quarter) => {
    setCompletedSemesters(prev => {
      const newCompleted = { ...prev };
      delete newCompleted[`${year}-${quarter}`];
      return newCompleted;
    });
    setSemesterValidation(null);
  };

  const addCourse = (year, quarter) => {
    if (!newCourse.courseId) return;

    const courseInfo = getCourseInfo(newCourse.courseId);
    if (!courseInfo) return;

    setError(null);
    setWarning(null);

    // Get semester courses early for validation checks
    const quarterCourses = getCoursesForQuarter(year, quarter);
    const yearCourses = courses.filter(c => c.year === year);

    // Validate course addition using domain logic
    const validation = validateCourseAddition({
      courseId: newCourse.courseId,
      year,
      quarter,
      courseInfo,
      allCourses: courses,
      quarterCourses,
      yearCourses,
      courseCatalog: COURSE_CATALOG,
      earlyGradMode,
      earlyGradEligibility,
      ctePathwayMode,
      ctePathwayProgress,
      ctePathways: CTE_PATHWAYS,
      currentSlot: showAddCourse?.slot,
      allowRepeatCourses,
      getTermRequirements: (id) => schedulingEngine.getTermRequirements(id),
      canScheduleInSemester: (id, sem) => schedulingEngine.canScheduleInSemester(id, sem),
      getCoursesForQuarter,
      checkCourseEligibility
    });

    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    if (validation.warning) {
      setWarning(validation.warning);
    }

    // Calculate all course entries (main + linked courses) using extracted domain logic
    // Bug fix: linked semester courses now placed in OPPOSITE semester from main course
    const result = calculateCourseAdditions({
      courseId: newCourse.courseId,
      year,
      quarter,
      currentCourses: courses,
      getTermRequirements: (id) => schedulingEngine.getTermRequirements(id),
      courseCatalog: COURSE_CATALOG,
      maxCredits: MAX_SEMESTER_CREDITS
    });

    // Show warning if linked course addition would exceed semester credits
    if (result.warning) {
      setWarning(result.warning);
    }

    updateCourses([...courses, ...result.courses]);

    setNewCourse({ courseId: '' });
    setSelectedCategory('');
    setShowAddCourse(null);
    // Don't clear warning here - let it persist so user sees the prerequisite warning
  };

  const removeCourse = (id) => {
    // Find the course being removed
    const courseToRemove = courses.find(c => c.id === id);
    if (!courseToRemove) return;

    const courseInfo = COURSE_CATALOG[courseToRemove.courseId];
    if (!courseInfo) {
      // Just remove this instance if no catalog info
      updateCourses(courses.filter(c => c.id !== id));
      return;
    }

    // Check if this is a yearlong or semester course
    const termReqs = schedulingEngine.getTermRequirements(courseToRemove.courseId);
    const isYearlongOrSemester = termReqs.type === 'yearlong' || termReqs.type === 'semester';

    if (isYearlongOrSemester) {
      // Remove ALL instances of this courseId in the same year
      // (all 4 quarters for yearlong, both quarters of term for semester)
      updateCourses(courses.filter(c =>
        !(c.courseId === courseToRemove.courseId && c.year === courseToRemove.year)
      ));
    } else {
      // Just remove this single instance
      updateCourses(courses.filter(c => c.id !== id));
    }
  };

  // Helper function to determine if a course is truly yearlong
  // Checks both term_length field and notes for "Year-Long" or "linked w/"
  const isYearlongCourse = (course) => {
    if (course.term_length === 'yearlong') return true;
    if (course.notes) {
      const notesUpper = course.notes.toUpperCase();
      return notesUpper.includes('YEAR-LONG') || notesUpper.includes('LINKED W/');
    }
    return false;
  };

  // Generate course suggestions based on missing requirements
  // term parameter: 'fall' or 'spring' - to check requirements per term, not per year
  const generateCourseSuggestions = (term = null) => {
    // Determine which years to check based on early graduation mode
    const yearsToCheck = earlyGradMode.enabled
      ? (earlyGradMode.targetYear === '3year' ? ['9', '10', '11'] : ['9', '10', '11', '12'])
      : ['9', '10', '11', '12'];

    const allSuggestions = [];

    // Generate suggestions for each year
    for (const year of yearsToCheck) {
      const yearSuggestions = suggestionEngine.generateSuggestions({
        courses,
        year,
        term: term || 'fall', // Default to fall if no term specified
        westviewReqs: WESTVIEW_REQUIREMENTS,
        agReqs: AG_REQUIREMENTS,
        checkEligibility: checkCourseEligibility, // Pass prerequisite checker
        preferredLanguage // Pass user's preferred foreign language
      });

      allSuggestions.push(...yearSuggestions);
    }

    setSuggestedCourses(allSuggestions);
    return allSuggestions; // Return suggestions for direct use
  };

  // Generate and add suggestions for a specific term (Fall or Spring)
  const suggestCoursesForTerm = (year, term) => {
    // Check if this semester is locked
    const semesterKey = `${year}-${term}`;
    if (lockedSemesters[semesterKey]) {
      console.log(`Semester ${year} ${term} is locked - skipping auto-suggest`);
      return;
    }

    // Generate suggestions
    const allSuggestions = generateCourseSuggestions(term);

    // Filter for this term
    const termSuggestions = filterSuggestionsForTerm(
      allSuggestions, year, term, courses, COURSE_CATALOG
    );

    if (termSuggestions.length > 0) {
      // Build course entries from suggestions
      const newCourses = buildCoursesFromSuggestions({
        termSuggestions,
        year,
        term,
        courses,
        courseCatalog: COURSE_CATALOG,
        schedulingEngine,
        maxCredits: MAX_SEMESTER_CREDITS
      });

      // Process linked course rules
      processLinkedCourseRules({
        termSuggestions,
        year,
        term,
        courses,
        newCourses
      });

      // Add all courses at once
      updateCourses([...courses, ...newCourses]);
    }
  };

  // Toggle lock state for a semester
  const toggleSemesterLock = (year, term) => {
    const semesterKey = `${year}-${term}`;
    setLockedSemesters(prev => ({
      ...prev,
      [semesterKey]: !prev[semesterKey]
    }));
  };

  // Approve and add a suggested course
  const approveSuggestion = (suggestion) => {
    // Remove from suggestions
    setSuggestedCourses(suggestedCourses.filter(s =>
      !(s.courseId === suggestion.courseId && s.year === suggestion.year && s.quarter === suggestion.quarter)
    ));

    // Add the course
    const courseInfo = COURSE_CATALOG[suggestion.courseId];
    if (!courseInfo) return;

    const termReqs = schedulingEngine.getTermRequirements(suggestion.courseId);

    if (termReqs.type === 'yearlong') {
      // Yearlong courses need ALL 4 quarters (Q1, Q2, Q3, Q4)
      const q1Course = { courseId: suggestion.courseId, id: Date.now(), year: suggestion.year, quarter: 'Q1' };
      const q2Course = { courseId: suggestion.courseId, id: Date.now() + 1, year: suggestion.year, quarter: 'Q2' };
      const q3Course = { courseId: suggestion.courseId, id: Date.now() + 2, year: suggestion.year, quarter: 'Q3' };
      const q4Course = { courseId: suggestion.courseId, id: Date.now() + 3, year: suggestion.year, quarter: 'Q4' };
      updateCourses([...courses, q1Course, q2Course, q3Course, q4Course]);
    } else if (termReqs.type === 'semester') {
      // Semester courses need both quarters of ONE term (Q1+Q2 OR Q3+Q4)
      let firstQuarter, secondQuarter;
      if (suggestion.quarter === 'Q1' || suggestion.quarter === 'Q2') {
        // Fall term - add to both Q1 and Q2
        firstQuarter = 'Q1';
        secondQuarter = 'Q2';
      } else {
        // Spring term - add to both Q3 and Q4
        firstQuarter = 'Q3';
        secondQuarter = 'Q4';
      }
      const q1Course = { courseId: suggestion.courseId, id: Date.now(), year: suggestion.year, quarter: firstQuarter };
      const q2Course = { courseId: suggestion.courseId, id: Date.now() + 1, year: suggestion.year, quarter: secondQuarter };
      updateCourses([...courses, q1Course, q2Course]);
    } else {
      // Quarter-length courses - add only to the suggested quarter
      updateCourses([...courses, { courseId: suggestion.courseId, id: Date.now(), year: suggestion.year, quarter: suggestion.quarter }]);
    }
  };

  // Get unique pathways for course selection
  const pathways = useMemo(() => {
    const uniquePathways = [...new Set(Object.values(COURSE_CATALOG).map(c => c.pathway))];
    // Add Concurrent Enrollment as a special category
    uniquePathways.push('Concurrent Enrollment');
    return uniquePathways.sort();
  }, []);

  // Get courses for selected pathway
  const coursesInPathway = useMemo(() => {
    if (!selectedCategory) return [];
    return Object.entries(COURSE_CATALOG)
      .filter(([id, course]) =>
        course.pathway === selectedCategory &&
        !DEPRECATED_COURSES.includes(id) // Exclude courses no longer offered
      )
      .map(([id, course]) => ({ id, ...course }));
  }, [selectedCategory]);

  // Search results for course search
  const searchResults = useMemo(() => {
    if (!courseSearchQuery || courseSearchQuery.length < 2) return [];
    const query = courseSearchQuery.toLowerCase();
    return Object.entries(COURSE_CATALOG)
      .filter(([id, course]) =>
        !DEPRECATED_COURSES.includes(id) &&
        (course.full_name.toLowerCase().includes(query) ||
         course.pathway.toLowerCase().includes(query) ||
         id.toLowerCase().includes(query))
      )
      .map(([id, course]) => ({ id, ...course }))
      .slice(0, 30);
  }, [courseSearchQuery]);

  return (
    <div className="min-h-screen bg-[#F4F7FA]">
      <Header
        preferredLanguage={preferredLanguage}
        setPreferredLanguage={setPreferredLanguage}
        setShowTestScores={setShowTestScores}
        earlyGradMode={earlyGradMode}
        setEarlyGradMode={setEarlyGradMode}
        earlyGradEligibility={earlyGradEligibility}
        courseHistory={courseHistory}
        onUndo={handleUndo}
        onClearAll={handleClearAll}
        gpaMode={gpaMode}
        setGpaMode={setGpaMode}
        westviewGradOnly={westviewGradOnly}
        setWestviewGradOnly={setWestviewGradOnly}
        showTestScores={showTestScores}
        hideAPClasses={hideAPClasses}
        setHideAPClasses={setHideAPClasses}
        hideSpecialEdClasses={hideSpecialEdClasses}
        setHideSpecialEdClasses={setHideSpecialEdClasses}
        ctePathwayMode={ctePathwayMode}
        setCtePathwayMode={setCtePathwayMode}
        testScoresRef={testScoresRef}
        allowRepeatCourses={allowRepeatCourses}
        setAllowRepeatCourses={setAllowRepeatCourses}
        isCaliforniaResident={isCaliforniaResident}
        setIsCaliforniaResident={setIsCaliforniaResident}
        ctePathwayProgress={ctePathwayProgress}
      />

      <div className="max-w-[1800px] mx-auto px-12 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Main Content - 4-Year Grid */}
          <div className="lg:col-span-3">

            {/* Compact Warnings Row */}
            {(scheduleValidation.errors.length > 0 || englishWarnings.length > 0 || peWarnings.length > 0 || prereqWarnings.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {/* Schedule Validation Errors - show specific issues, not just grades */}
                {scheduleValidation.errors.length > 0 && scheduleValidation.errors.map((err, idx) => (
                  <WarningBanner
                    key={idx}
                    type="error"
                    compact={true}
                    message={
                      <>
                        <span className="font-semibold">Grade {err.year}:</span>{' '}
                        {err.message || 'Schedule issue'}
                      </>
                    }
                  />
                ))}

                {/* English Warning */}
                {englishWarnings.length > 0 && (
                  <WarningBanner
                    type="warning"
                    compact={true}
                    message={
                      <>
                        <span className="font-semibold">Missing English:</span>{' '}
                        Grade{englishWarnings.length > 1 ? 's' : ''} {englishWarnings.join(', ')}
                      </>
                    }
                  />
                )}

                {/* PE Warning */}
                {peWarnings.length > 0 && (
                  <WarningBanner
                    type="warning"
                    compact={true}
                    message={
                      <>
                        <span className="font-semibold">Missing PE:</span>{' '}
                        Grade{peWarnings.length > 1 ? 's' : ''} {peWarnings.join(', ')}
                      </>
                    }
                  />
                )}

                {/* Prerequisite Warnings */}
                {prereqWarnings.length > 0 && (
                  <WarningBanner
                    type="orange"
                    compact={true}
                    message={
                      <>
                        <span className="font-semibold">Prerequisites:</span>{' '}
                        {prereqWarnings.map((w, idx) => (
                          <span key={idx}>
                            {idx > 0 && ' • '}{w.message}
                          </span>
                        ))}
                      </>
                    }
                  />
                )}
              </div>
            )}

            {/* 4-Year Course Grid */}
            <div className="space-y-8">
              {['9', '10', '11', '12'].map((year, yearIndex) => {
                const baseYear = 2025 + yearIndex;
                const fallYear = baseYear;
                const springYear = baseYear + 1;

                return (
                  <div key={year} className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                    <div className="bg-gray-100 px-6 py-4 border-b-2 border-gray-200">
                      <h3 className="text-xl font-bold text-[#1A202C]">Grade {year}</h3>
                    </div>

                    {/* Suggestion buttons per semester */}
                    <div className="grid grid-cols-2 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <SemesterControls
                        year={year}
                        term="fall"
                        isLocked={lockedSemesters[`${year}-fall`]}
                        onAutoFill={suggestCoursesForTerm}
                        onToggleLock={toggleSemesterLock}
                      />
                      <SemesterControls
                        year={year}
                        term="spring"
                        isLocked={lockedSemesters[`${year}-spring`]}
                        onAutoFill={suggestCoursesForTerm}
                        onToggleLock={toggleSemesterLock}
                      />
                    </div>

                    {/* Semester Labels */}
                    <div className="grid grid-cols-2 bg-gray-50 border-t border-gray-200">
                      <div className="px-6 py-3 border-r border-gray-200">
                        <h3 className="text-center font-bold text-[#1A202C] text-lg">Fall Semester</h3>
                      </div>
                      <div className="px-6 py-3">
                        <h3 className="text-center font-bold text-[#1A202C] text-lg">Spring Semester</h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 divide-x divide-gray-200">
                      {['Q1', 'Q2', 'Q3', 'Q4'].map(quarter => {
                        const displayYear = (quarter === 'Q1' || quarter === 'Q2') ? fallYear : springYear;
                        return (
                          <QuarterColumn
                            key={quarter}
                            year={year}
                            quarter={quarter}
                            displayYear={displayYear}
                            quarterCourses={getCoursesForQuarter(year, quarter)}
                            showAddCourse={showAddCourse}
                            setShowAddCourse={setShowAddCourse}
                            courseCatalog={COURSE_CATALOG}
                            pathwayColors={PATHWAY_COLORS}
                            agRequirements={AG_REQUIREMENTS}
                            gradeOptions={GRADE_OPTIONS}
                            ctePathways={CTE_PATHWAYS}
                            ctePathwayIcons={CTE_PATHWAY_ICONS}
                            gpaMode={gpaMode}
                            draggedCourse={draggedCourse}
                            dragOverSlot={dragOverSlot}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onRemoveCourse={removeCourse}
                            onGradeChange={(courseId, grade) => {
                              const updatedCourses = courses.map(c =>
                                c.id === courseId ? { ...c, grade } : c
                              );
                              updateCourses(updatedCourses);
                            }}
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
                            courseSearchQuery={courseSearchQuery}
                            setCourseSearchQuery={setCourseSearchQuery}
                            searchResults={searchResults}
                            onAddCourse={addCourse}
                            concurrentCourses={concurrentCourses}
                            setConcurrentCourses={setConcurrentCourses}
                            showConcurrentForm={showConcurrentForm}
                            setShowConcurrentForm={setShowConcurrentForm}
                            newConcurrentCourse={newConcurrentCourse}
                            setNewConcurrentCourse={setNewConcurrentCourse}
                            convertCollegeUnitsToHSCredits={convertCollegeUnitsToHSCredits}
                            getCoursesForQuarter={getCoursesForQuarter}
                            setError={setError}
                            setWarning={setWarning}
                          />
                        );
                      })}
                    </div>


                    {/* Year Total */}
                    {(() => {
                      const fallCourses = getCoursesForQuarter(year, 'Fall');
                      const springCourses = getCoursesForQuarter(year, 'Spring');
                      // Use unique course IDs to avoid double-counting yearlong courses
                      const allYearCourses = [...fallCourses, ...springCourses];
                      const uniqueYearCourseIds = [...new Set(allYearCourses.map(c => c.courseId))];
                      // Use domain function for year total (full credits for yearlong courses)
                      const yearCredits = calculateYearTotal(uniqueYearCourseIds, COURSE_CATALOG);

                      if (fallCourses.length > 0 || springCourses.length > 0) {
                        return (
                          <div className="bg-gray-50 px-6 py-3 border-t-2 border-gray-200">
                            <div className="text-base font-bold text-[#1A202C]">
                              Year Total: {yearCredits} credits
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar - Requirements */}
          <RequirementsSidebar
            westviewProgress={westviewProgress}
            totalCredits={totalCredits}
            westviewRequirements={WESTVIEW_REQUIREMENTS}
            agProgress={agProgress}
            agRequirements={AG_REQUIREMENTS}
            ucGPA={ucGPA}
            biliteracySealEligibility={biliteracySealEligibility}
            westviewGradOnly={westviewGradOnly}
            gpaMode={gpaMode}
            isCaliforniaResident={isCaliforniaResident}
            metForeignLanguageIn78={metForeignLanguageIn78}
            setMetForeignLanguageIn78={setMetForeignLanguageIn78}
          />

        </div>

        {/* AP/IB/CLEP/A-Level Test Scores Input Section */}
        {showTestScores && (
          <div id="test-scores-section" className="max-w-[1800px] mx-auto px-12 mt-12">
            <div className="lg:pr-[calc(25%+1.5rem)]">
                <TestScoreForm
                  testScores={testScores}
                  selectedTestType={selectedTestType}
                  testSubjects={TEST_SUBJECTS}
                  onAddScore={(type, subject, score, agCategory) => {
                    setTestScores([...testScores, { type, subject, score, agCategory }]);
                  }}
                  onRemoveScore={(idx) => {
                    const updated = testScores.filter((_, i) => i !== idx);
                    setTestScores(updated);
                  }}
                  onUpdateScore={(idx, type, subject, score, agCategory) => {
                    const updated = [...testScores];
                    updated[idx] = { type, subject, score, agCategory };
                    setTestScores(updated);
                  }}
                  onTestTypeChange={setSelectedTestType}
                  testScoresRef={testScoresRef}
                />
            </div>
          </div>
        )}

        {/* College Credits from Test Scores - Bottom Section */}
        {testScores.length > 0 && (
          <CollegeCreditsSummary collegeCredits={collegeCredits} />
        )}
      </div>
    </div>
  );
}

export default App;
