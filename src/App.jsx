import React, { useState, useMemo, useRef } from 'react';
import { Plus, CheckCircle2, AlertCircle, Circle, GraduationCap, Award, Briefcase, Beaker, Palette, Wrench, Laptop, Music, Video } from 'lucide-react';
import { useLocalStorage, useLocalStorageNullable } from './hooks/useLocalStorage';
import courseCatalogData from './data/courses_complete.json';
import { SchedulingEngine } from './scheduling/SchedulingEngine.js';
import { SettingsDropdown } from './components/SettingsDropdown.jsx';
import { EarlyGradButton } from './components/EarlyGradButton.jsx';
import { CourseCard } from './components/course/CourseCard.jsx';
import { ProgressBar } from './components/progress/ProgressBar.jsx';
import { WarningBanner } from './components/ui/WarningBanner.jsx';
import { RequirementsSidebar } from './components/progress/RequirementsSidebar.jsx';
import { TestScoreForm } from './components/test-scores/TestScoreForm.jsx';
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
  LINKED_COURSE_RULES,
  AVID_COURSES,
  MAX_SEMESTER_CREDITS
} from './config';
import {
  WESTVIEW_REQUIREMENTS,
  calculateWestviewProgress,
  isGraduationReady
} from './domain/progress/westview.js';
import {
  AG_REQUIREMENTS,
  calculateAGProgress,
  isUCSUEligible
} from './domain/progress/ag.js';
import { calculateUCGPA } from './domain/gpa.js';
import {
  calculateTotalCreditsWithCap,
  calculateEarlyGradEligibility
} from './domain/graduation.js';
import { calculateCTEPathwayProgress } from './domain/cte.js';
import { calculateBiliteracyEligibility } from './domain/biliteracy.js';
import { calculateCollegeCredits } from './domain/collegeCredits.js';
import { validateSchedule as validateScheduleLogic } from './domain/scheduleValidation.js';
import { validateSemesterCompletion as validateSemesterCompletionLogic } from './domain/semesterValidation.js';
import {
  checkCourseEligibility as checkCourseEligibilityLogic,
  checkForeignLanguagePrereqs as checkFLPrereqsLogic,
  LINKED_REQUIREMENTS
} from './domain/courseEligibility.js';

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
  // Load courses from localStorage on initial render
  const [courses, setCourses] = useState(() => {
    const saved = localStorage.getItem('westview-courses');
    if (!saved) return [];

    const parsed = JSON.parse(saved);

    // Migration: Check if data is from old semester-based system
    // If any course has a 'semester' field instead of 'quarter', clear the data
    const hasOldData = parsed.some(c => c.semester !== undefined);
    if (hasOldData) {
      console.log('Detected old semester-based data. Clearing localStorage for quarter system migration.');
      localStorage.removeItem('westview-courses');
      localStorage.removeItem('westview-completed-semesters');
      return [];
    }

    return parsed;
  });
  const [courseHistory, setCourseHistory] = useState([]); // Undo history (max 5 states)
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

  // Drag and drop state
  const [draggedCourse, setDraggedCourse] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);

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

  // Save courses to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('westview-courses', JSON.stringify(courses));
  }, [courses]);

  // Helper to update courses and track history for undo (max 5 states)
  const updateCourses = (newCoursesOrUpdater) => {
    setCourseHistory(prev => {
      const updated = [...prev, courses];
      return updated.slice(-5); // Keep last 5 states
    });
    setCourses(newCoursesOrUpdater);
  };

  // Undo last course change
  const handleUndo = () => {
    if (courseHistory.length === 0) return;
    const previousState = courseHistory[courseHistory.length - 1];
    setCourseHistory(prev => prev.slice(0, -1));
    setCourses(previousState); // Direct set, no history push
  };

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
  }, [courseHistory, courses]);

  // Note: localStorage persistence for settings is now handled automatically by useLocalStorage hook
  // The following state variables are auto-persisted: earlyGradMode, ctePathwayMode, concurrentCourses,
  // hideAPClasses, hideSpecialEdClasses, westviewGradOnly, gpaMode, isCaliforniaResident, testScores,
  // completedSemesters, metForeignLanguageIn78, preferredLanguage, lockedSemesters

  // Calculate Westview graduation progress (extracted to domain/progress/westview.js)
  const westviewProgress = useMemo(() => {
    return calculateWestviewProgress(courses, COURSE_CATALOG);
  }, [courses]);

  // Calculate total credits (extracted to domain/graduation.js)
  const totalCredits = useMemo(() => {
    return calculateTotalCreditsWithCap(courses, COURSE_CATALOG);
  }, [courses]);

  const westviewGraduationReady = totalCredits >= 230 && Object.values(westviewProgress).every(p => p.met);

  // Calculate early graduation eligibility (extracted to domain/graduation.js)
  const earlyGradEligibility = useMemo(() => {
    return calculateEarlyGradEligibility(courses, COURSE_CATALOG);
  }, [courses]);

  // Calculate CTE Pathway Progress (extracted to domain/cte.js)
  const ctePathwayProgress = useMemo(() => {
    return calculateCTEPathwayProgress(courses, COURSE_CATALOG, ctePathwayMode, CTE_PATHWAYS);
  }, [courses, ctePathwayMode]);

  // Get courses for a specific semester (defined before useMemo that uses it)
  const getCoursesForQuarter = (year, quarter) => {
    return courses.filter(c => c.year === year && c.quarter === quarter);
  };

  // Calculate UC/CSU A-G progress (extracted to domain/progress/ag.js)
  const agProgress = useMemo(() => {
    return calculateAGProgress(courses, COURSE_CATALOG, metForeignLanguageIn78);
  }, [courses, metForeignLanguageIn78]);

  const ucsuEligible = Object.values(agProgress).every(p => p.met);

  // Calculate UC GPA (extracted to domain/gpa.js)
  const ucGPA = useMemo(() => {
    if (!gpaMode) return null;
    return calculateUCGPA(courses, COURSE_CATALOG);
  }, [courses, gpaMode]);

  // Calculate State Seal of Biliteracy eligibility (extracted to domain/biliteracy.js)
  const biliteracySealEligibility = useMemo(() => {
    return calculateBiliteracyEligibility(courses, COURSE_CATALOG, gpaMode);
  }, [courses, gpaMode]);

  // Calculate College Credits from test scores (extracted to domain/collegeCredits.js)
  const collegeCredits = useMemo(() => {
    return calculateCollegeCredits(testScores);
  }, [testScores]);

  // Validate schedule using SchedulingEngine (extracted to domain/scheduleValidation.js)
  const scheduleValidation = useMemo(() => {
    return validateScheduleLogic(courses, COURSE_CATALOG, getCoursesForQuarter, schedulingEngine);
  }, [courses]);

  const englishWarnings = scheduleValidation.warnings
    .filter(w => w.type === 'missing_english')
    .map(w => w.year);

  const peWarnings = scheduleValidation.warnings
    .filter(w => w.type === 'missing_pe')
    .map(w => w.year);

  const prereqWarnings = scheduleValidation.warnings
    .filter(w => w.type === 'missing_prerequisites');

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

  // Drag-and-drop handlers
  const handleDragStart = (e, course, year, quarter) => {
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
  };

  const handleDragEnd = (e) => {
    setDraggedCourse(null);
    setDragOverSlot(null);
    e.currentTarget.style.opacity = '1';
  };

  const handleDragOver = (e, targetYear, targetQuarter, slotIndex) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot({ year: targetYear, quarter: targetQuarter, slot: slotIndex });
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = (e, targetYear, targetQuarter, slotIndex) => {
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
      // Determine quarter pairs
      const getQuarterPair = (q) => {
        if (q === 'Q1' || q === 'Q2') return ['Q1', 'Q2'];
        return ['Q3', 'Q4'];
      };

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
  };

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

    // Linked course validation - uses LINKED_REQUIREMENTS from domain/courseEligibility.js
    // Note: Sequential prerequisites are handled by checkCourseEligibility function

    if (LINKED_REQUIREMENTS[newCourse.courseId]) {
      const requirement = LINKED_REQUIREMENTS[newCourse.courseId];

      // Handle "requires one of" (e.g., AP CS A needs CS OR Data Structures OR Studio Art)
      if (requirement.requiresOneOf) {
        const hasAnyPartner = requirement.requiresOneOf.some(partnerId =>
          yearCourses.some(c => c.courseId === partnerId)
        );

        if (!hasAnyPartner) {
          const partnerNames = requirement.names.join(', or ');
          setError(`${courseInfo.full_name} must be taken with one of: ${partnerNames}`);
          return;
        }
      }
      // Handle standard single requirement
      else if (requirement.requires) {
        const hasRequiredCourse = yearCourses.some(c => c.courseId === requirement.requires);

        if (!hasRequiredCourse) {
          setError(`${courseInfo.full_name} must be taken with ${requirement.name}`);
          return;
        }
      }
    }

    // Early graduation mode validations
    if (earlyGradMode.enabled) {
      if (earlyGradMode.targetYear === '3year') {
        // 3-year plan: Can only add courses to grades 9, 10, 11
        if (year === '12') {
          setError('Early Graduation (3 years): Cannot add courses to Grade 12');
          return;
        }

        // In grade 11, must include Senior English and Civics/Economics
        if (year === '11') {
          const courseName = courseInfo.full_name.toUpperCase();
          const isSeniorEnglish = courseInfo.pathway === 'English' && (
            courseName.includes('AMERICAN LIT') || courseName.includes('ETHNIC LIT') ||
            courseName.includes('EXPOSITORY') || courseName.includes('WORLD LIT') ||
            courseName.includes('AP ENGLISH')
          );
          const isCivicsEcon = courseName.includes('CIVICS') && courseName.includes('ECONOMICS');

          // Show warning if they haven't added these yet (check in Q1 of grade 11)
          if (!earlyGradEligibility.hasSeniorEnglish && !isSeniorEnglish && (quarter === 'Q1' || quarter === 'Q2')) {
            setWarning('Early Graduation: Remember to add a Senior English course in Grade 11');
          }
          if (!earlyGradEligibility.hasCivicsEcon && !isCivicsEcon && (quarter === 'Q1' || quarter === 'Q2')) {
            setWarning('Early Graduation: Remember to add Civics/Economics in Grade 11');
          }
        }
      } else if (earlyGradMode.targetYear === '3.5year') {
        // 3.5-year plan: Can add courses to grade 12 Fall (Q1/Q2) only
        if (year === '12' && (quarter === 'Q3' || quarter === 'Q4')) {
          setError('Early Graduation (3.5 years): Cannot add courses to Grade 12 Spring (Q3/Q4)');
          return;
        }
      }
    }

    // CTE Pathway mode validations and guidance
    if (ctePathwayMode.enabled && ctePathwayMode.pathway) {
      const pathway = CTE_PATHWAYS[ctePathwayMode.pathway];
      const courseName = courseInfo.full_name.toUpperCase();

      // Check if this course is part of the selected pathway
      const isPathwayCourse = pathway.courses.some(pathwayCourse =>
        courseName.includes(pathwayCourse.name)
      );

      // Check if this course is from the pathway and meets grade requirements
      if (isPathwayCourse) {
        const pathwayCourse = pathway.courses.find(pc => courseName.includes(pc.name));
        const currentGrade = parseInt(year);

        if (pathwayCourse && !pathwayCourse.grades.includes(currentGrade)) {
          setWarning(`CTE Pathway: ${pathwayCourse.name} is recommended for grades ${pathwayCourse.grades.join(', ')}`);
        }
      }

      // Provide helpful guidance on pathway progress
      if (ctePathwayProgress.totalCompleted < ctePathwayProgress.totalRequired) {
        const nextMissing = ctePathwayProgress.missing[0];
        if (nextMissing && !courseName.includes(nextMissing.name)) {
          // Only show this as a gentle reminder, not a blocker
          const currentGrade = parseInt(year);
          if (nextMissing.grades.includes(currentGrade)) {
            setWarning(`CTE Pathway: Consider adding ${nextMissing.name} (${nextMissing.level})`);
          }
        }
      }
    }

    // Check for AP Calculus AB/BC conflict (blocks adding)
    const courseName = courseInfo.full_name.toUpperCase();
    if (courseName.includes('AP CALCULUS')) {
      const allCourses = courses.map(c => ({
        info: COURSE_CATALOG[c.courseId],
        year: c.year
      }));

      // Check if trying to add AP Calc AB when they have BC (or vice versa)
      if (courseName.includes('CALCULUS AB')) {
        const hasBC = allCourses.some(c =>
          c.info && c.info.full_name.toUpperCase().includes('AP CALCULUS BC')
        );
        if (hasBC) {
          setError('Cannot take AP Calculus AB and BC - choose one');
          return;
        }
      } else if (courseName.includes('CALCULUS BC')) {
        const hasAB = allCourses.some(c =>
          c.info && c.info.full_name.toUpperCase().includes('AP CALCULUS AB')
        );
        if (hasAB) {
          setError('Cannot take AP Calculus AB and BC - choose one');
          return;
        }
      }
    }

    // Check for English course sequence violations (blocks adding)
    if (courseInfo.pathway === 'English') {
      const allCourses = courses.map(c => COURSE_CATALOG[c.courseId]);

      // Check if trying to add English 1-2 when they already have 3-4
      // Only check for regular ENGLISH 1-2, not HIGH SCHOOL ENGLISH 1-2
      const isRegularEnglish12 = (courseName === 'ENGLISH 1-2' || courseName === 'ENGLISH IA-IB' ||
                                   courseName.startsWith('H. ENGLISH 1-2') || courseName.startsWith('HONORS ENGLISH 1-2'));

      if (isRegularEnglish12) {
        const hasHigherEnglish = allCourses.some(c =>
          c && c.pathway === 'English' &&
          (c.full_name.toUpperCase().includes('ENGLISH 3-4') ||
           c.full_name.toUpperCase().includes('ENGLISH IIA-IIB') ||
           c.full_name.toUpperCase().includes('ENGLISH 5-6') ||
           c.full_name.toUpperCase().includes('ENGLISH 7-8'))
        );
        if (hasHigherEnglish) {
          setError('Cannot add English 1-2 after completing higher-level English courses');
          return;
        }
      }

      // Check if trying to add English 3-4 when they already have 5-6 or higher
      // Only check for regular ENGLISH 3-4, not HIGH SCHOOL ENGLISH 3-4
      const isRegularEnglish34 = (courseName === 'ENGLISH 3-4' || courseName === 'ENGLISH IIA-IIB' ||
                                   courseName.startsWith('H. ENGLISH 3-4') || courseName.startsWith('HONORS ENGLISH 3-4'));

      if (isRegularEnglish34) {
        const hasHigherEnglish = allCourses.some(c =>
          c && c.pathway === 'English' &&
          (c.full_name.toUpperCase().includes('ENGLISH 5-6') ||
           c.full_name.toUpperCase().includes('ENGLISH 7-8'))
        );
        if (hasHigherEnglish) {
          setError('Cannot add English 3-4 after completing higher-level English courses');
          return;
        }
      }

      // Prevent taking ENGLISH 1-2 and ENGLISH 3-4 simultaneously in the same year
      if (isRegularEnglish12) {
        const hasEnglish34SameYear = courses.some(c =>
          c.year === year &&
          COURSE_CATALOG[c.courseId] &&
          (COURSE_CATALOG[c.courseId].full_name.toUpperCase() === 'ENGLISH 3-4' ||
           COURSE_CATALOG[c.courseId].full_name.toUpperCase() === 'H. ENGLISH 3-4' ||
           COURSE_CATALOG[c.courseId].full_name.toUpperCase() === 'HONORS ENGLISH 3-4')
        );
        if (hasEnglish34SameYear) {
          setError('Cannot take ENGLISH 1-2 and ENGLISH 3-4 in the same year');
          return;
        }
      }

      if (isRegularEnglish34) {
        const hasEnglish12SameYear = courses.some(c =>
          c.year === year &&
          COURSE_CATALOG[c.courseId] &&
          (COURSE_CATALOG[c.courseId].full_name.toUpperCase() === 'ENGLISH 1-2' ||
           COURSE_CATALOG[c.courseId].full_name.toUpperCase() === 'H. ENGLISH 1-2' ||
           COURSE_CATALOG[c.courseId].full_name.toUpperCase() === 'HONORS ENGLISH 1-2')
        );
        if (hasEnglish12SameYear) {
          setError('Cannot take ENGLISH 3-4 and ENGLISH 1-2 in the same year');
          return;
        }
      }
    }

    // Check course prerequisites and eligibility (warning for non-blocking, error for blocking)
    const eligibility = checkCourseEligibility(newCourse.courseId, year);
    if (eligibility.warning && !eligibility.blocking) {
      // Show warning but allow addition (e.g., Foreign Language prerequisites)
      setWarning(`${eligibility.warning}. Have you met the prerequisites?`);
    }

    // PLTW Biomedical sequence warning
    const pltwBiomedicalCourses = ['PRINCIPLES_OF_0012', 'HUMAN_BODY_0012', 'HON_MEDICAL_0012'];
    if (pltwBiomedicalCourses.includes(newCourse.courseId)) {
      const sequenceInfo = {
        'PRINCIPLES_OF_0012': 'This is the entry point to the PLTW Biomedical pathway.',
        'HUMAN_BODY_0012': 'This is the 2nd course in the PLTW Biomedical pathway. Recommended sequence: Principles of Biomedical Science → Human Body Systems.',
        'HON_MEDICAL_0012': 'This is the 3rd course in the PLTW Biomedical pathway. Recommended sequence: Principles of Biomedical Science → Human Body Systems → Medical Interventions.'
      };
      // Only show if no other warning is already set
      if (!eligibility.warning) {
        setWarning(`PLTW Biomedical: ${sequenceInfo[newCourse.courseId]}`);
      }
    }

    // Check for Off-Roll restrictions
    if (courseInfo.pathway === 'Off-Roll') {
      // Off-Roll can only be in slots 0 (1st class) or 3 (4th class)
      const currentSlot = showAddCourse?.slot;
      if (currentSlot !== undefined && currentSlot !== 0 && currentSlot !== 3) {
        setError('Off-Roll courses can only be selected as the 1st or 4th class of the day (not 2nd, 3rd, 5th, or 6th)');
        return;
      }

      // Off-Roll allowed in grades 9, 11, 12 (not 10)
      if (year === '10') {
        setError('Off-Roll courses are not allowed in Grade 10');
        return;
      }

      // Count existing Off-Roll courses in this semester
      const semesterOffRollCount = quarterCourses.filter(c => {
        const info = COURSE_CATALOG[c.courseId];
        return info && info.pathway === 'Off-Roll';
      }).length;

      // Grade 12: Maximum 2 Off-Roll per semester
      // Grades 9, 11: Maximum 1 Off-Roll per semester
      const maxPerSemester = year === '12' ? 2 : 1;

      if (semesterOffRollCount >= maxPerSemester) {
        if (year === '12') {
          setError('Maximum 2 Off-Roll courses allowed per semester in Grade 12');
        } else {
          setError(`Maximum 1 Off-Roll course allowed per semester in Grade ${year}`);
        }
        return;
      }
    }

    // Check for duplicate course in same semester
    const alreadyHasCourse = quarterCourses.some(c => c.courseId === newCourse.courseId);
    if (alreadyHasCourse) {
      setError('This course is already in this semester');
      return;
    }

    // Check for duplicate course across all 4 years (unless repeat courses allowed)
    if (!allowRepeatCourses) {
      const alreadyHasCourseInSchedule = courses.some(c => c.courseId === newCourse.courseId);
      if (alreadyHasCourseInSchedule) {
        setError('This course is already in your 4-year schedule. Enable "Allow Repeat Courses" in settings to override.');
        return;
      }
    }

    // Check PE credit cap (max 40 credits toward graduation)
    if (courseInfo.pathway === 'Physical Education') {
      const totalPECredits = courses
        .filter(c => {
          const info = COURSE_CATALOG[c.courseId];
          return info && info.pathway === 'Physical Education';
        })
        .reduce((sum, c) => sum + COURSE_CATALOG[c.courseId].credits, 0);

      if (totalPECredits + courseInfo.credits > 40) {
        setError('Maximum 40 credits of Physical Education may be applied toward graduation');
        return;
      }
    }

    // Check Academic Tutor / Library TA credit cap (max 10 credits)
    const isAcademicTutorOrLibrary = courseName.includes('ACADEMIC TUTOR') ||
                                      courseName.includes('LIBRARY') && courseName.includes('ASSISTANT');

    if (isAcademicTutorOrLibrary) {
      const totalTutorCredits = courses
        .filter(c => {
          const info = COURSE_CATALOG[c.courseId];
          if (!info) return false;
          const name = info.full_name.toUpperCase();
          return name.includes('ACADEMIC TUTOR') || (name.includes('LIBRARY') && name.includes('ASSISTANT'));
        })
        .reduce((sum, c) => sum + COURSE_CATALOG[c.courseId].credits, 0);

      if (totalTutorCredits + courseInfo.credits > 10) {
        setError('Maximum 10 credits from Academic Tutor or Library & Information Science TA');
        return;
      }
    }

    // Check school service course limit (max 1 per quarter)
    const isSchoolService = courseName.includes('ACADEMIC TUTOR') ||
                            (courseName.includes('LIBRARY') && courseName.includes('ASSISTANT')) ||
                            courseName.includes('WORK EXPERIENCE') ||
                            courseName.includes('TEACHER') && courseName.includes('ASSISTANT');

    if (isSchoolService) {
      const hasSchoolService = quarterCourses.some(c => {
        const info = COURSE_CATALOG[c.courseId];
        if (!info) return false;
        const name = info.full_name.toUpperCase();
        return name.includes('ACADEMIC TUTOR') ||
               (name.includes('LIBRARY') && name.includes('ASSISTANT')) ||
               name.includes('WORK EXPERIENCE') ||
               (name.includes('TEACHER') && name.includes('ASSISTANT'));
      });

      if (hasSchoolService) {
        setError('No more than one school service course per semester');
        return;
      }
    }

    // Check Work Experience restrictions
    if (courseName.includes('WORK EXPERIENCE')) {
      // Max 10 credits per term
      if (courseInfo.credits > 10) {
        setError('Maximum 10 credits in Work Experience may be earned in one term');
        return;
      }

      // Cannot combine with other school service courses
      const hasOtherSchoolService = quarterCourses.some(c => {
        const info = COURSE_CATALOG[c.courseId];
        if (!info) return false;
        const name = info.full_name.toUpperCase();
        // Check for other school service courses (not Work Experience)
        return !name.includes('WORK EXPERIENCE') && (
          name.includes('ACADEMIC TUTOR') ||
          (name.includes('LIBRARY') && name.includes('ASSISTANT')) ||
          (name.includes('TEACHER') && name.includes('ASSISTANT'))
        );
      });

      if (hasOtherSchoolService) {
        setError('Other school service classes may not be taken by students enrolled in Work Experience');
        return;
      }
    }

    // Check for multiple courses of same foreign language in same semester
    if (courseInfo.pathway === 'Foreign Language') {
      const isLiteratureCourse = courseName.includes('LITERATURE') || courseName.includes('LIT');

      if (!isLiteratureCourse) {
        // Detect which language
        let language = null;
        if (courseName.includes('SPANISH')) language = 'Spanish';
        else if (courseName.includes('CHINESE')) language = 'Chinese';
        else if (courseName.includes('FRENCH')) language = 'French';
        else if (courseName.includes('FILIPINO')) language = 'Filipino';
        else if (courseName.includes('GERMAN')) language = 'German';
        else if (courseName.includes('JAPANESE')) language = 'Japanese';
        else if (courseName.includes('LATIN')) language = 'Latin';

        if (language) {
          const hasSameLanguage = quarterCourses.some(c => {
            const cInfo = COURSE_CATALOG[c.courseId];
            if (!cInfo || cInfo.pathway !== 'Foreign Language') return false;
            const cName = cInfo.full_name.toUpperCase();
            const isLit = cName.includes('LITERATURE') || cName.includes('LIT');
            // Check if same language and not literature
            return !isLit && cName.includes(language.toUpperCase());
          });

          if (hasSameLanguage) {
            setError(`Cannot take two ${language} courses in the same semester`);
            return;
          }
        }
      }
    }

    // Special validation for ROBOTICS club - must be consecutive quarters starting from Q1
    if (courseName === 'ROBOTICS') {
      const yearCourses = courses.filter(c => c.year === year);
      const roboticsCourses = yearCourses.filter(c => {
        const info = COURSE_CATALOG[c.courseId];
        return info && info.full_name === 'ROBOTICS';
      });

      const roboticsQuarters = roboticsCourses.map(c => c.quarter).sort();

      // If adding to a quarter other than Q1 and Q1 doesn't exist, block it
      if (quarter !== 'Q1' && !roboticsQuarters.includes('Q1')) {
        setError('ROBOTICS must start in Q1. You can take it for 1-4 consecutive quarters.');
        return;
      }

      // Check for consecutive quarters: must be Q1, Q1+Q2, Q1+Q2+Q3, or Q1+Q2+Q3+Q4
      if (roboticsQuarters.length > 0) {
        const allQuarters = [...roboticsQuarters, quarter].sort();
        const expectedSequence = ['Q1', 'Q2', 'Q3', 'Q4'].slice(0, allQuarters.length);

        const isConsecutive = allQuarters.every((q, i) => q === expectedSequence[i]);

        if (!isConsecutive) {
          setError('ROBOTICS must be taken in consecutive quarters starting from Q1 (e.g., Q1 only, Q1+Q2, Q1+Q2+Q3, or Q1+Q2+Q3+Q4)');
          return;
        }
      }
    }

    // Use scheduling engine to get term requirements
    const termReqs = schedulingEngine.getTermRequirements(newCourse.courseId);

    // Year-long validation - must start in Fall term (Q1 or Q2)
    // Note: semester courses can be taken in either Fall or Spring, so only check for yearlong
    if (termReqs.type === 'yearlong' && (quarter === 'Q3' || quarter === 'Q4')) {
      setError('Year-long courses must start in Fall term (Q1 or Q2)');
      return;
    }

    // Check if year-long course would duplicate in opposite term
    if (termReqs.type === 'yearlong') {
      if (quarter === 'Q1' || quarter === 'Q2') {
        // Adding to Fall, check if already in Spring
        const springQ3Courses = getCoursesForQuarter(year, 'Q3');
        const springQ4Courses = getCoursesForQuarter(year, 'Q4');
        const alreadyInSpring = [...springQ3Courses, ...springQ4Courses].some(c => c.courseId === newCourse.courseId);
        if (alreadyInSpring) {
          setError('This year-long course is already in Spring term');
          return;
        }
      }
    }

    // Check if semester course would duplicate in same term
    if (termReqs.type === 'semester') {
      const allQuarters = ['Q1', 'Q2', 'Q3', 'Q4'];
      const currentTermQuarters = (quarter === 'Q1' || quarter === 'Q2') ? ['Q1', 'Q2'] : ['Q3', 'Q4'];
      const alreadyInTerm = currentTermQuarters.some(q => {
        const qCourses = getCoursesForQuarter(year, q);
        return qCourses.some(c => c.courseId === newCourse.courseId);
      });
      if (alreadyInTerm) {
        const termName = (quarter === 'Q1' || quarter === 'Q2') ? 'Fall' : 'Spring';
        setError(`This course is already scheduled in ${termName} term`);
        return;
      }
    }

    // Check if course can be scheduled in this semester
    // Map quarters to semesters for scheduling engine: Q1/Q2 = fall, Q3/Q4 = spring
    const semesterName = (quarter === 'Q1' || quarter === 'Q2') ? 'fall' : 'spring';
    if (!schedulingEngine.canScheduleInSemester(newCourse.courseId, semesterName)) {
      const termName = (quarter === 'Q1' || quarter === 'Q2') ? 'Fall' : 'Spring';
      setError(`This course is not offered in ${termName} term (${quarter})`);
      return;
    }

    // Add course(s) - yearlong and semester courses automatically add to appropriate quarters
    // In 4x4 block schedule: yearlong = all 4 quarters, semester = both quarters of one term
    const isYearlong = termReqs.type === 'yearlong';
    const isSemester = termReqs.type === 'semester';

    if (isYearlong) {
      // Yearlong courses must be added to ALL 4 quarters (Fall AND Spring)
      const q1Course = { ...newCourse, id: Date.now(), year, quarter: 'Q1' };
      const q2Course = { ...newCourse, id: Date.now() + 1, year, quarter: 'Q2' };
      const q3Course = { ...newCourse, id: Date.now() + 2, year, quarter: 'Q3' };
      const q4Course = { ...newCourse, id: Date.now() + 3, year, quarter: 'Q4' };
      updateCourses([...courses, q1Course, q2Course, q3Course, q4Course]);
    } else if (isSemester) {
      // Semester courses add to both quarters of the current term only
      let firstQuarter, secondQuarter;
      if (quarter === 'Q1' || quarter === 'Q2') {
        // Fall term - add to both Q1 and Q2
        firstQuarter = 'Q1';
        secondQuarter = 'Q2';
      } else {
        // Spring term - add to both Q3 and Q4
        firstQuarter = 'Q3';
        secondQuarter = 'Q4';
      }
      const q1Course = { ...newCourse, id: Date.now(), year, quarter: firstQuarter };
      const q2Course = { ...newCourse, id: Date.now() + 1, year, quarter: secondQuarter };
      updateCourses([...courses, q1Course, q2Course]);
    } else {
      // Only quarter-length courses go in a single quarter
      updateCourses([...courses, { ...newCourse, id: Date.now(), year, quarter }]);
    }

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
      return; // Exit early if locked
    }

    // Generate all suggestions and get them directly, passing term to check requirements per term
    const allSuggestions = generateCourseSuggestions(term);

    // Filter suggestions for this specific year and term
    // Fall term = Q1, Q2; Spring term = Q3, Q4
    const termQuarters = term === 'fall' ? ['Q1', 'Q2'] : ['Q3', 'Q4'];
    const targetQuarter = term === 'fall' ? 'Q1' : 'Q3';

    // For each suggestion, check if the course already exists in THIS term
    // If not, add it to the target quarter for this term
    const termSuggestions = allSuggestions
      .filter(s => s.year === year)
      // FIRST: Filter to only include suggestions that are for THIS term
      // null quarter means flexible - can be scheduled in any term
      .filter(s => s.quarter === null || termQuarters.includes(s.quarter))
      .map(s => {
        // Check if this course (or its pathway) already exists
        const yearCourses = courses.filter(c => c.year === year);
        const suggestedCourseInfo = COURSE_CATALOG[s.courseId];

        // For semester courses, check only this term (allows same course in both semesters if needed)
        // For other courses, check only this term
        const isSemesterCourse = suggestedCourseInfo.term_length === 'semester';
        const coursesToCheck = yearCourses.filter(c => termQuarters.includes(c.quarter));

        const hasInTerm = coursesToCheck.some(c => {
          // For semester courses: only block if SAME course already exists in THIS TERM
          // (allows different English courses like literature in same semester)
          // For other courses: check same course OR same pathway
          if (isSemesterCourse) {
            return c.courseId === s.courseId;
          } else {
            const info = COURSE_CATALOG[c.courseId];
            return info && (c.courseId === s.courseId || info.pathway === suggestedCourseInfo.pathway);
          }
        });

        // Special check for ENS/PE courses: block if same course exists ANYWHERE in year
        // (prevents ENS 3-4 in both Fall and Spring)
        const isPECourse = suggestedCourseInfo.pathway === 'Physical Education';
        const hasInYear = isPECourse && yearCourses.some(c => c.courseId === s.courseId);

        // Only suggest if not already in this term (or anywhere in year for PE courses)
        if (!hasInTerm && !hasInYear) {
          return { ...s, quarter: targetQuarter };
        }
        return null;
      })
      .filter(s => s !== null);

    // Add all suggested courses silently (no popup)
    if (termSuggestions.length > 0) {
      const newCourses = [];

      // Calculate existing credits in this term
      // Use unique course IDs to avoid double-counting yearlong courses (which have entries in both Q3 and Q4)
      const uniqueTermCourseIds = [...new Set(
        courses
          .filter(c => c.year === year && termQuarters.includes(c.quarter))
          .map(c => c.courseId)
      )];
      // Use domain function that properly divides yearlong course credits
      const existingTermCredits = calculateSemesterTotal(uniqueTermCourseIds, COURSE_CATALOG);

      // Track credits being added (max 45 per semester, target 40)
      const MAX_SEMESTER_CREDITS = 45;
      let addedCredits = 0;

      termSuggestions.forEach(suggestion => {
        const courseInfo = COURSE_CATALOG[suggestion.courseId];
        if (!courseInfo) return;

        // Check if adding this course would exceed credit limit
        // Use semester credits (yearlong courses count as half per semester)
        const courseCreditsPerSemester = getSemesterCredits(courseInfo);
        const totalAfterAdd = existingTermCredits + addedCredits + courseCreditsPerSemester;
        if (totalAfterAdd > MAX_SEMESTER_CREDITS) {
          return; // Skip this course - would exceed credit limit
        }

        const termReqs = schedulingEngine.getTermRequirements(suggestion.courseId);

        if (termReqs.type === 'yearlong') {
          // Yearlong courses need ALL 4 quarters (Q1, Q2, Q3, Q4)
          newCourses.push({
            courseId: suggestion.courseId,
            id: Date.now() + newCourses.length * 4,
            year: suggestion.year,
            quarter: 'Q1'
          });
          newCourses.push({
            courseId: suggestion.courseId,
            id: Date.now() + newCourses.length * 4 + 1,
            year: suggestion.year,
            quarter: 'Q2'
          });
          newCourses.push({
            courseId: suggestion.courseId,
            id: Date.now() + newCourses.length * 4 + 2,
            year: suggestion.year,
            quarter: 'Q3'
          });
          newCourses.push({
            courseId: suggestion.courseId,
            id: Date.now() + newCourses.length * 4 + 3,
            year: suggestion.year,
            quarter: 'Q4'
          });
        } else if (termReqs.type === 'semester') {
          // Semester courses need both quarters of ONE term (Q1+Q2 OR Q3+Q4)
          let firstQuarter, secondQuarter;
          if (suggestion.quarter === 'Q1' || suggestion.quarter === 'Q2') {
            firstQuarter = 'Q1';
            secondQuarter = 'Q2';
          } else {
            firstQuarter = 'Q3';
            secondQuarter = 'Q4';
          }
          newCourses.push({
            courseId: suggestion.courseId,
            id: Date.now() + newCourses.length * 2,
            year: suggestion.year,
            quarter: firstQuarter
          });
          newCourses.push({
            courseId: suggestion.courseId,
            id: Date.now() + newCourses.length * 2 + 1,
            year: suggestion.year,
            quarter: secondQuarter
          });
        } else {
          // Quarter-length courses - add only to the suggested quarter
          newCourses.push({
            courseId: suggestion.courseId,
            id: Date.now() + newCourses.length,
            year: suggestion.year,
            quarter: suggestion.quarter
          });
        }

        // Track credits added (use semester credits for yearlong courses)
        addedCredits += courseCreditsPerSemester;
      });

      // Process linked course rules (from config/constants.js)
      LINKED_COURSE_RULES.forEach(rule => {
        if (rule.type === 'bidirectional') {
          // If either course exists, add the other
          const [courseA, courseB] = rule.courses;
          const hasA = termSuggestions.some(s => s.courseId === courseA);
          const hasB = termSuggestions.some(s => s.courseId === courseB);

          const yearCourses = courses.filter(c => c.year === year);
          const yearHasA = yearCourses.some(c => c.courseId === courseA);
          const yearHasB = yearCourses.some(c => c.courseId === courseB);

          if (hasA && !yearHasB) {
            addLinkedCourse(courseB);
          } else if (hasB && !yearHasA) {
            addLinkedCourse(courseA);
          }
        } else if (rule.type === 'sequential') {
          // If first course exists, add second
          const hasFirst = termSuggestions.some(s => s.courseId === rule.first);
          const yearCourses = courses.filter(c => c.year === year);
          const hasSecond = yearCourses.some(c => c.courseId === rule.second);

          if (hasFirst && !hasSecond) {
            addLinkedCourse(rule.second);
          }
        } else if (rule.type === 'one_way') {
          // If trigger exists, optionally add linked course
          const hasTrigger = termSuggestions.some(s => s.courseId === rule.trigger);
          const yearCourses = courses.filter(c => c.year === year);
          const hasLinked = yearCourses.some(c => c.courseId === rule.adds);

          if (hasTrigger && !hasLinked) {
            addLinkedCourse(rule.adds);
          }
        }
      });

      // Helper function to add a linked course
      function addLinkedCourse(courseId) {
        // NEVER auto-suggest AVID courses - they are student choice only (from config/constants.js)
        if (AVID_COURSES.includes(courseId)) {
          return; // Skip AVID courses during auto-suggest
        }

        // For Honors/AP pairs, place linked course in OPPOSITE semester
        // Example: If auto-filling Fall and suggesting Honors Chem, AP Chem goes in Spring
        const firstQuarter = term === 'fall' ? 'Q3' : 'Q1';  // Opposite semester
        const secondQuarter = term === 'fall' ? 'Q4' : 'Q2'; // Opposite semester

        newCourses.push({
          courseId,
          id: Date.now() + newCourses.length * 2,
          year: year,
          quarter: firstQuarter
        });
        newCourses.push({
          courseId,
          id: Date.now() + newCourses.length * 2 + 1,
          year: year,
          quarter: secondQuarter
        });
      }

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

  return (
    <div className="min-h-screen bg-[#F4F7FA]">
      {/* Simplified Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[1800px] mx-auto px-12 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left: Title */}
            <div className="lg:col-span-3">
              <div className="flex items-center gap-4">
                <div className="flex-grow">
                  <h1 className="text-3xl font-bold text-[#1A202C]">Westview High School</h1>
                  <h2 className="text-2xl font-bold text-[#2D3748]">Course Planner</h2>
                  <p className="text-[#718096] mt-1">Plan your path through high school</p>
                </div>
                {/* Foreign Language Selector */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Language:</label>
                  <select
                    value={preferredLanguage || ''}
                    onChange={(e) => setPreferredLanguage(e.target.value || null)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Select...</option>
                    <option value="Spanish">Spanish</option>
                    <option value="Chinese">Chinese</option>
                    <option value="French">French</option>
                    <option value="Filipino">Filipino</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    setShowTestScores(true);
                    setTimeout(() => {
                      const element = document.getElementById('test-scores-section');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 100);
                  }}
                  className="bg-[#2B6CB0] hover:bg-[#2C5282] text-white border-2 border-[#2B6CB0] rounded-lg px-4 py-3 transition-colors text-sm font-bold whitespace-nowrap min-w-[140px] text-center"
                >
                  Track AP Exams
                </button>
                <EarlyGradButton
                  earlyGradMode={earlyGradMode}
                  setEarlyGradMode={setEarlyGradMode}
                  earlyGradEligibility={earlyGradEligibility}
                />
                <button
                  onClick={handleUndo}
                  disabled={courseHistory.length === 0}
                  className={`rounded-lg px-4 py-3 transition-colors text-sm font-bold min-w-[140px] text-center ${
                    courseHistory.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-2 border-gray-300'
                      : 'bg-[#718096] hover:bg-[#4A5568] text-white border-2 border-[#718096]'
                  }`}
                >
                  Undo
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear all courses from your schedule? Locked semesters will be preserved.')) {
                      // Preserve courses in locked semesters
                      const preservedCourses = courses.filter(c => {
                        const semester = ['Q1', 'Q2'].includes(c.quarter) ? 'fall' : 'spring';
                        const semesterKey = `${c.year}-${semester}`;
                        return lockedSemesters[semesterKey];
                      });
                      updateCourses(preservedCourses);
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
                  }}
                  className="bg-[#C53030] hover:bg-[#9B2C2C] text-white border-2 border-[#C53030] rounded-lg px-4 py-3 transition-colors text-sm font-bold min-w-[140px] text-center"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Right: Settings */}
            <div className="flex justify-end">
              <SettingsDropdown
                gpaMode={gpaMode}
                setGpaMode={setGpaMode}
                westviewGradOnly={westviewGradOnly}
                setWestviewGradOnly={setWestviewGradOnly}
                showTestScores={showTestScores}
                setShowTestScores={setShowTestScores}
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
              />
            </div>
          </div>

          {/* CTE Pathway Button */}
          {ctePathwayMode.enabled && ctePathwayProgress.totalRequired > 0 && (
            <div className="mt-2">
              <button
                className="px-3 py-1.5 rounded-md bg-purple-100 border border-purple-300 hover:bg-purple-200 transition-colors text-xs font-medium text-purple-900"
                title={`${ctePathwayProgress.pathwayName}\nCourses: ${ctePathwayProgress.totalCompleted}/${ctePathwayProgress.totalRequired}\n${ctePathwayProgress.hasConcentrator ? 'Concentrator ✓\n' : ''}${ctePathwayProgress.capstoneCount > 0 ? `${ctePathwayProgress.capstoneCount} Capstone${ctePathwayProgress.capstoneCount > 1 ? 's' : ''} ✓\n` : ''}${ctePathwayProgress.completionStatus}`}
              >
                {ctePathwayProgress.pathwayName.split(' ')[0]} {ctePathwayProgress.totalCompleted}/{ctePathwayProgress.totalRequired}
                {ctePathwayProgress.isPathwayCompleter && ' ✓'}
              </button>
            </div>
          )}

        </div>
      </header>

      {/* Overall Progress Summary Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-10 shadow-md">
          <div className="max-w-7xl mx-auto px-12 py-6">
            <div className="flex items-center justify-start gap-6">
            </div>
          </div>
        </div>

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
                      {/* Fall Semester Controls */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => suggestCoursesForTerm(year, 'fall')}
                          disabled={lockedSemesters[`${year}-fall`]}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                            lockedSemesters[`${year}-fall`]
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-[#2B6CB0] text-white hover:bg-[#1E4E8C]'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          Auto-fill Fall
                        </button>
                        <button
                          onClick={() => toggleSemesterLock(year, 'fall')}
                          className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                            lockedSemesters[`${year}-fall`]
                              ? 'bg-red-500 hover:bg-red-600 text-white'
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                          }`}
                          title={lockedSemesters[`${year}-fall`] ? 'Unlock Fall' : 'Lock Fall'}
                        >
                          {lockedSemesters[`${year}-fall`] ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>

                      {/* Spring Semester Controls */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => suggestCoursesForTerm(year, 'spring')}
                          disabled={lockedSemesters[`${year}-spring`]}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                            lockedSemesters[`${year}-spring`]
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-[#2B6CB0] text-white hover:bg-[#1E4E8C]'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          Auto-fill Spring
                        </button>
                        <button
                          onClick={() => toggleSemesterLock(year, 'spring')}
                          className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                            lockedSemesters[`${year}-spring`]
                              ? 'bg-red-500 hover:bg-red-600 text-white'
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                          }`}
                          title={lockedSemesters[`${year}-spring`] ? 'Unlock Spring' : 'Lock Spring'}
                        >
                          {lockedSemesters[`${year}-spring`] ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
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
                        const quarterCourses = getCoursesForQuarter(year, quarter);
                        const slots = Array.from({ length: 6 }, (_, i) => quarterCourses[i] || null);
                        // Q1 and Q2 are Fall term, Q3 and Q4 are Spring term
                        const displayYear = (quarter === 'Q1' || quarter === 'Q2') ? fallYear : springYear;

                        // Calculate quarter credits
                        const quarterCredits = quarterCourses.reduce((sum, c) => {
                          const info = COURSE_CATALOG[c.courseId];
                          return sum + (info ? info.credits : 0);
                        }, 0);

                        const isCompleted = completedSemesters[`${year}-${quarter}`];

                        return (
                          <div key={quarter} className="p-5">
                            <div className="mb-4">
                              <h4 className="font-bold text-[#718096] text-base">
                                {quarter} {displayYear}
                              </h4>
                            </div>

                          {/* 4 Course Slots */}
                          <div className="space-y-2">
                            {slots.map((course, slotIndex) => {
                              const isAddingHere = showAddCourse?.year === year && showAddCourse?.quarter === quarter && showAddCourse?.slot === slotIndex;
                              const isOptionalSlot = slotIndex >= 4; // Slots 5 and 6 (indices 4 and 5)

                              if (course) {
                                // Filled slot with course - render using CourseCard component
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
                                    courseCatalog={COURSE_CATALOG}
                                    pathwayColors={PATHWAY_COLORS}
                                    agRequirements={AG_REQUIREMENTS}
                                    gradeOptions={GRADE_OPTIONS}
                                    ctePathways={CTE_PATHWAYS}
                                    ctePathwayIcons={CTE_PATHWAY_ICONS}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onRemove={removeCourse}
                                    onGradeChange={(courseId, grade) => {
                                      const updatedCourses = courses.map(c =>
                                        c.id === courseId ? { ...c, grade } : c
                                      );
                                      updateCourses(updatedCourses);
                                    }}
                                  />
                                );
                              } else if (isAddingHere) {
                                // Empty slot with form open
                                return (
                                  <div key={`slot-${slotIndex}`} className="bg-blue-50 rounded-lg p-3 border-2 border-blue-300">
                                    {error && (
                                      <WarningBanner type="error" message={error} icon={false} className="mb-2" />
                                    )}
                                    {warning && (
                                      <WarningBanner type="warning" message={warning} icon={false} className="mb-2" />
                                    )}

                                    {/* Step 1: Select Pathway */}
                                    {!selectedCategory ? (
                                      <>
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                          <button
                                            onClick={() => setSelectedCategory('Search')}
                                            className="col-span-2 bg-[#2B6CB0] text-white border-2 border-blue-600 hover:bg-[#1E4E8C] rounded px-3 py-2 text-sm font-medium transition-colors"
                                          >
                                            🔍 Search All Courses
                                          </button>
                                          {pathways.map(pathway => (
                                            <button
                                              key={pathway}
                                              onClick={() => {
                                                if (pathway === 'Off-Roll') {
                                                  // Auto-add Off-Roll course without showing dropdown
                                                  setNewCourse({ courseId: 'OFF_ROLL_PLACEHOLDER' });
                                                  setTimeout(() => addCourse(year, quarter), 0);
                                                } else {
                                                  setSelectedCategory(pathway);
                                                }
                                              }}
                                              className="bg-white border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 rounded px-3 py-2 text-sm font-medium text-[#718096] hover:text-blue-700 transition-colors"
                                            >
                                              {pathway}
                                            </button>
                                          ))}
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        {/* Step 2: Select Course */}
                                        <div className="flex items-center justify-between mb-2">
                                          <p className="text-xs text-[#718096] font-medium">{selectedCategory}</p>
                                          <button
                                            onClick={() => {
                                              setSelectedCategory('');
                                              setCourseSearchQuery('');
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                          >
                                            ← Change Subject
                                          </button>
                                        </div>
                                        {selectedCategory === 'Search' ? (
                                          // Search All Courses
                                          (() => {
                                            const query = courseSearchQuery.toLowerCase();
                                            const allCourses = Object.entries(COURSE_CATALOG);
                                            const searchResults = courseSearchQuery.length >= 2
                                              ? allCourses
                                                  .filter(([id, course]) =>
                                                    course.full_name.toLowerCase().includes(query) &&
                                                    course.grades_allowed.includes(parseInt(year))
                                                  )
                                                  .slice(0, 20)
                                                  .map(([id, course]) => ({ ...course, id }))
                                              : [];

                                            return (
                                              <div className="space-y-2">
                                                <div className="flex items-center justify-between mb-2">
                                                  <p className="text-xs text-[#718096] font-medium">Search Courses</p>
                                                </div>
                                                <input
                                                  type="text"
                                                  placeholder="Type course name... (e.g., AP Computer Science)"
                                                  value={courseSearchQuery}
                                                  onChange={(e) => setCourseSearchQuery(e.target.value)}
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Escape') {
                                                      setShowAddCourse(null);
                                                      setSelectedCategory('');
                                                      setNewCourse({ courseId: '' });
                                                      setCourseSearchQuery('');
                                                    }
                                                  }}
                                                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                                  autoFocus
                                                />
                                                {courseSearchQuery.length >= 2 && searchResults.length === 0 && (
                                                  <p className="text-sm text-gray-500 italic py-2">No courses found matching "{courseSearchQuery}"</p>
                                                )}
                                                {searchResults.length > 0 && (
                                                  <select
                                                    value={newCourse.courseId}
                                                    onChange={(e) => setNewCourse({ courseId: e.target.value })}
                                                    onDoubleClick={(e) => {
                                                      // Double-click to immediately add the selected course
                                                      if (e.target.value) {
                                                        setNewCourse({ courseId: e.target.value });
                                                        setTimeout(() => addCourse(year, quarter), 0);
                                                      }
                                                    }}
                                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm max-h-48 overflow-y-auto cursor-pointer"
                                                    size={Math.min(searchResults.length + 1, 10)}
                                                    title="Double-click to add course"
                                                  >
                                                    <option value="">Select from {searchResults.length} results... (double-click to add)</option>
                                                    {searchResults.map(course => (
                                                      <option key={course.id} value={course.id}>
                                                        {course.full_name} ({course.credits} cr{course.term_length === 'yearlong' ? ', Year-long' : ''})
                                                      </option>
                                                    ))}
                                                  </select>
                                                )}
                                                <div className="flex gap-2">
                                                  <button
                                                    onClick={() => addCourse(year, quarter)}
                                                    disabled={!newCourse.courseId}
                                                    className="flex-1 bg-[#2B6CB0] text-white px-3 py-2 rounded hover:bg-[#1E4E8C] text-sm font-medium disabled:bg-gray-300"
                                                  >
                                                    Add Course
                                                  </button>
                                                  <button
                                                    onClick={() => {
                                                      setShowAddCourse(null);
                                                      setSelectedCategory('');
                                                      setNewCourse({ courseId: '' });
                                                      setCourseSearchQuery('');
                                                      setError(null);
                                                      setWarning(null);
                                                    }}
                                                    className="bg-[#EDF2F7] text-[#718096] px-3 py-2 rounded hover:bg-[#E2E8F0] text-sm font-medium"
                                                  >
                                                    Cancel
                                                  </button>
                                                </div>
                                              </div>
                                            );
                                          })()
                                        ) : selectedCategory === 'Concurrent Enrollment' ? (
                                          // Special UI for Concurrent Enrollment
                                          <div className="space-y-3">
                                            {!showConcurrentForm ? (
                                              <>
                                                {concurrentCourses.length > 0 && (
                                                  <div>
                                                    <p className="text-xs text-[#718096] mb-2 font-medium">Previously entered courses:</p>
                                                    <select
                                                      value={newCourse.courseId}
                                                      onChange={(e) => setNewCourse({ courseId: e.target.value })}
                                                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                                    >
                                                      <option value="">Select a previous course...</option>
                                                      {concurrentCourses.map(course => (
                                                        <option key={course.id} value={course.id}>
                                                          {course.name} ({course.collegeUnits} college units = {course.credits} HS credits)
                                                        </option>
                                                      ))}
                                                    </select>
                                                  </div>
                                                )}
                                                <button
                                                  onClick={() => {
                                                    setShowConcurrentForm(true);
                                                    setNewConcurrentCourse({ name: '', collegeUnits: 3 });
                                                  }}
                                                  className="w-full bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 text-sm font-medium"
                                                >
                                                  + Enter New College Course
                                                </button>
                                              </>
                                            ) : (
                                              <div className="space-y-2">
                                                <p className="text-xs text-[#718096] font-medium">Enter college course details:</p>
                                                <input
                                                  type="text"
                                                  placeholder="Course name (e.g., BIO 101)"
                                                  value={newConcurrentCourse.name}
                                                  onChange={(e) => setNewConcurrentCourse({ ...newConcurrentCourse, name: e.target.value })}
                                                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                                  autoFocus
                                                />
                                                <div>
                                                  <label className="block text-xs text-[#718096] mb-1">College Semester Units</label>
                                                  <input
                                                    type="number"
                                                    placeholder="Units (e.g., 3)"
                                                    value={newConcurrentCourse.collegeUnits}
                                                    onChange={(e) => setNewConcurrentCourse({ ...newConcurrentCourse, collegeUnits: parseFloat(e.target.value) || 0 })}
                                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                                    min="0"
                                                    max="10"
                                                    step="0.5"
                                                  />
                                                  {newConcurrentCourse.collegeUnits > 0 && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                      = {convertCollegeUnitsToHSCredits(newConcurrentCourse.collegeUnits)} high school credits
                                                    </p>
                                                  )}
                                                </div>
                                                <div className="flex gap-2">
                                                  <button
                                                    onClick={() => {
                                                      if (newConcurrentCourse.name && newConcurrentCourse.collegeUnits > 0) {
                                                        // Create unique ID for this concurrent course
                                                        const courseId = `CONCURRENT_${Date.now()}`;
                                                        const hsCredits = convertCollegeUnitsToHSCredits(newConcurrentCourse.collegeUnits);

                                                        // Add to concurrent courses list if not already there
                                                        const exists = concurrentCourses.find(c => c.name === newConcurrentCourse.name);
                                                        if (!exists) {
                                                          setConcurrentCourses([...concurrentCourses, {
                                                            id: courseId,
                                                            name: newConcurrentCourse.name,
                                                            collegeUnits: newConcurrentCourse.collegeUnits,
                                                            credits: hsCredits
                                                          }]);
                                                        }

                                                        // Set it as the selected course
                                                        setNewCourse({ courseId: exists ? exists.id : courseId });
                                                        setShowConcurrentForm(false);

                                                        // Add the course
                                                        setTimeout(() => addCourse(year, quarter), 0);
                                                      }
                                                    }}
                                                    disabled={!newConcurrentCourse.name || newConcurrentCourse.collegeUnits <= 0}
                                                    className="flex-1 bg-[#2B6CB0] text-white px-3 py-2 rounded hover:bg-[#1E4E8C] text-sm font-medium disabled:bg-gray-300"
                                                  >
                                                    Add Course
                                                  </button>
                                                  <button
                                                    onClick={() => setShowConcurrentForm(false)}
                                                    className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium"
                                                  >
                                                    Cancel
                                                  </button>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <>
                                            <select
                                              value={newCourse.courseId}
                                              onChange={(e) => setNewCourse({ courseId: e.target.value })}
                                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-2"
                                              autoFocus
                                            >
                                            <option value="">Select course...</option>
                                            {selectedCategory === 'Foreign Language' ? (
                                            // Group foreign language courses by language
                                            (() => {
                                              const grouped = {};
                                              coursesInPathway.forEach(course => {
                                                const name = course.full_name.toUpperCase();
                                                let lang = 'Other';
                                                if (name.includes('SPANISH')) lang = 'Spanish';
                                                else if (name.includes('CHINESE')) lang = 'Chinese';
                                                else if (name.includes('FRENCH')) lang = 'French';
                                                else if (name.includes('FILIPINO')) lang = 'Filipino';
                                                else if (name.includes('GERMAN')) lang = 'German';
                                                else if (name.includes('JAPANESE')) lang = 'Japanese';
                                                else if (name.includes('LATIN')) lang = 'Latin';

                                                if (!grouped[lang]) grouped[lang] = [];
                                                grouped[lang].push(course);
                                              });

                                              return Object.keys(grouped).sort().map(lang => (
                                                <optgroup key={lang} label={lang}>
                                                  {grouped[lang].map(course => (
                                                    <option key={course.id} value={course.id}>
                                                      {course.full_name}{year === 9 && isRecommended9thGrade(course.full_name) ? ' ⭐ Recommended' : ''}
                                                    </option>
                                                  ))}
                                                </optgroup>
                                              ));
                                            })()
                                          ) : selectedCategory === 'English' ? (
                                            // Group English courses by type
                                            (() => {
                                              const grouped = {
                                                'English': [],
                                                'Writing': [],
                                                'Literature': [],
                                                'English Language Learner (ELL)': [],
                                                'Special Education': []
                                              };

                                              coursesInPathway.forEach(course => {
                                                const name = course.full_name.toUpperCase();
                                                if (name.includes('SPECIAL ED')) {
                                                  grouped['Special Education'].push(course);
                                                } else if (name.includes('ELL') || name.includes('ENGLISH LANGUAGE LEARNER')) {
                                                  grouped['English Language Learner (ELL)'].push(course);
                                                } else if (name.includes('WRITING')) {
                                                  grouped['Writing'].push(course);
                                                } else if (name.includes('LITERATURE')) {
                                                  grouped['Literature'].push(course);
                                                } else {
                                                  grouped['English'].push(course);
                                                }
                                              });

                                              return Object.entries(grouped)
                                                .filter(([_, courses]) => courses.length > 0)
                                                .map(([group, courses]) => (
                                                  <optgroup key={group} label={group}>
                                                    {courses.map(course => {
                                                      const isAP = course.full_name.toUpperCase().startsWith('AP ');
                                                      const isSpecialEd = course.full_name.startsWith('Special Ed');
                                                      const shouldDisable = (hideAPClasses && isAP) || (hideSpecialEdClasses && isSpecialEd);
                                                      return (
                                                        <option
                                                          key={course.id}
                                                          value={course.id}
                                                          disabled={shouldDisable}
                                                          style={shouldDisable ? { color: '#9ca3af', fontStyle: 'italic' } : {}}
                                                        >
                                                          {course.full_name}{year === 9 && isRecommended9thGrade(course.full_name) ? ' ⭐ Recommended' : ''}{shouldDisable ? ' (Hidden)' : ''}
                                                        </option>
                                                      );
                                                    })}
                                                  </optgroup>
                                                ));
                                            })()
                                          ) : selectedCategory === 'Electives' || selectedCategory === 'CTE' ? (
                                            // Group Electives and CTE by subject
                                            (() => {
                                              const grouped = {
                                                'Journalism': [],
                                                'AVID': [],
                                                'PLTW Engineering': [],
                                                'PLTW Biomedical': [],
                                                'Computer Science': [],
                                                'Other': []
                                              };

                                              coursesInPathway.forEach(course => {
                                                const name = course.full_name.toUpperCase();
                                                if (name.includes('JOURNALISM') || name.includes('YEARBOOK')) {
                                                  grouped['Journalism'].push(course);
                                                } else if (name.includes('AVID')) {
                                                  grouped['AVID'].push(course);
                                                } else if (name.includes('PLTW') && (name.includes('ENGINEERING') || name.includes('ELECTRONICS') || name.includes('ARCHITECTURE') || name.includes('MANUFACTURING'))) {
                                                  grouped['PLTW Engineering'].push(course);
                                                } else if (name.includes('PLTW') || name.includes('BIOMEDICAL') || name.includes('BODY SYSTEMS') || name.includes('MEDICAL INTERVENTIONS')) {
                                                  grouped['PLTW Biomedical'].push(course);
                                                } else if (name.includes('COMPUTER') || name.includes('DATA STRUCTURES')) {
                                                  grouped['Computer Science'].push(course);
                                                } else {
                                                  grouped['Other'].push(course);
                                                }
                                              });

                                              return Object.entries(grouped)
                                                .filter(([_, courses]) => courses.length > 0)
                                                .map(([group, courses]) => (
                                                  <optgroup key={group} label={group}>
                                                    {courses.map(course => {
                                                      const isAP = course.full_name.toUpperCase().startsWith('AP ');
                                                      const isSpecialEd = course.full_name.startsWith('Special Ed');
                                                      const shouldDisable = (hideAPClasses && isAP) || (hideSpecialEdClasses && isSpecialEd);
                                                      return (
                                                        <option
                                                          key={course.id}
                                                          value={course.id}
                                                          disabled={shouldDisable}
                                                          style={shouldDisable ? { color: '#9ca3af', fontStyle: 'italic' } : {}}
                                                        >
                                                          {course.full_name}{year === 9 && isRecommended9thGrade(course.full_name) ? ' ⭐ Recommended' : ''}{shouldDisable ? ' (Hidden)' : ''}
                                                        </option>
                                                      );
                                                    })}
                                                  </optgroup>
                                                ));
                                            })()
                                          ) : (
                                            // Regular list for other pathways
                                            coursesInPathway.map(course => {
                                              const isAP = course.full_name.toUpperCase().startsWith('AP ');
                                              const shouldDisable = hideAPClasses && isAP;
                                              return (
                                                <option
                                                  key={course.id}
                                                  value={course.id}
                                                  disabled={shouldDisable}
                                                  style={shouldDisable ? { color: '#9ca3af', fontStyle: 'italic' } : {}}
                                                >
                                                  {course.full_name}{year === 9 && isRecommended9thGrade(course.full_name) ? ' ⭐ Recommended' : ''}{shouldDisable ? ' (Hidden)' : ''}
                                                </option>
                                              );
                                            })
                                          )}
                                        </select>
                                          <div className="flex gap-2">
                                            <button
                                              onClick={() => addCourse(year, quarter)}
                                              disabled={!newCourse.courseId}
                                              className="flex-1 bg-[#2B6CB0] text-white px-3 py-2 rounded hover:bg-[#1E4E8C] text-sm font-medium disabled:bg-gray-300"
                                            >
                                              Add
                                            </button>
                                            <button
                                              onClick={() => {
                                                setShowAddCourse(null);
                                                setSelectedCategory('');
                                                setNewCourse({ courseId: '' });
                                                setError(null);
                                                setWarning(null);
                                              }}
                                              className="flex-1 bg-[#EDF2F7] text-[#718096] px-3 py-2 rounded hover:bg-[#E2E8F0] text-sm font-medium"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                          </>
                                        )}
                                      </>
                                    )}
                                  </div>
                                );
                              } else {
                                // Empty slot
                                const isDropTarget = dragOverSlot?.year === year && dragOverSlot?.quarter === quarter && dragOverSlot?.slot === slotIndex;

                                return (
                                  <div
                                    key={`slot-${slotIndex}`}
                                    onClick={() => {
                                      setShowAddCourse({ year, quarter, slot: slotIndex });
                                      setSelectedCategory('');
                                      setNewCourse({ courseId: '' });
                                      setError(null);
                                      setWarning(null);
                                    }}
                                    onDragOver={(e) => handleDragOver(e, year, quarter, slotIndex)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, year, quarter, slotIndex)}
                                    className={`w-full rounded-lg p-3 border-2 border-dashed transition-all text-sm font-medium flex items-center justify-center min-h-[56px] cursor-pointer ${
                                      isOptionalSlot
                                        ? 'bg-gray-100 border-gray-300 text-gray-400 opacity-50 hover:opacity-70'
                                        : isDropTarget
                                        ? 'border-blue-400 bg-blue-50 text-blue-600 ring-2 ring-blue-400'
                                        : 'bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-400 hover:text-blue-600'
                                    }`}
                                  >
                                    <Plus size={18} className="mr-1" />
                                    {isOptionalSlot ? 'Add Course (Optional)' : 'Add Course'}
                                  </div>
                                );
                              }
                            })}
                          </div>

                          {/* Semester Credit Total - only show on Q2 and Q4 */}
                          {(quarter === 'Q2' || quarter === 'Q4') && (
                            (() => {
                              // Calculate semester total (Q1+Q2 for Fall, Q3+Q4 for Spring)
                              const semesterQuarters = quarter === 'Q2' ? ['Q1', 'Q2'] : ['Q3', 'Q4'];
                              const semesterCourses = semesterQuarters.flatMap(q => getCoursesForQuarter(year, q));
                              // Use unique course IDs to avoid double-counting yearlong courses
                              const uniqueCourseIds = [...new Set(semesterCourses.map(c => c.courseId))];
                              // Use domain function that handles yearlong course credit division
                              const semesterTotal = calculateSemesterTotal(uniqueCourseIds, COURSE_CATALOG);

                              return semesterCourses.length > 0 ? (
                                <div className="mt-3 pt-3 border-t border-gray-300">
                                  <div className="text-sm font-semibold text-[#718096]">
                                    Semester Total: {semesterTotal} credits
                                  </div>
                                </div>
                              ) : null;
                            })()
                          )}
                        </div>
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
          <div className="max-w-[1800px] mx-auto px-12 pb-16 mt-12">
            <div className="lg:pr-[calc(25%+1.5rem)]">
                <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4">
                    <h3 className="text-2xl font-bold">College Credits from Test Scores</h3>
                  </div>

                  <div className="p-6">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-300">
                          <th className="text-left py-3 px-4 font-bold text-[#1A202C]">Test</th>
                          <th className="text-center py-3 px-4 font-bold text-[#1A202C]">Score</th>
                          <th className="text-center py-3 px-4 font-bold text-[#1A202C]">CSU Units</th>
                          <th className="text-center py-3 px-4 font-bold text-[#1A202C]">UC Units</th>
                        </tr>
                      </thead>
                      <tbody>
                        {collegeCredits.details.map((detail, idx) => (
                          <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="py-3 px-4 text-[#1A202C]">{detail.exam}</td>
                            <td className="py-3 px-4 text-center text-[#718096]">{detail.score}</td>
                            <td className="py-3 px-4 text-center text-[#718096]">{detail.csu}</td>
                            <td className="py-3 px-4 text-center text-[#718096]">{detail.uc}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                        <tr>
                          <td colSpan="2" className="py-4 px-4 text-right font-bold text-[#1A202C]">Total CSU Credits:</td>
                          <td className="py-4 px-4 text-center font-bold text-[#2B6CB0] text-xl">{collegeCredits.csu}</td>
                          <td className="py-4 px-4"></td>
                        </tr>
                        <tr>
                          <td colSpan="2" className="py-4 px-4 text-right font-bold text-[#1A202C]">Total UC Credits:</td>
                          <td className="py-4 px-4"></td>
                          <td className="py-4 px-4 text-center font-bold text-[#2B6CB0] text-xl">{collegeCredits.uc}</td>
                        </tr>
                      </tfoot>
                    </table>

                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <p className="text-xs text-[#718096]">
                        Note: Credit values are estimates based on typical CSU and UC policies. Actual credit awarded may vary by campus.
                        UC credits shown are semester units for Berkeley/Merced (multiply by 1.5 for quarter units at other UCs).
                      </p>
                    </div>
                  </div>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
