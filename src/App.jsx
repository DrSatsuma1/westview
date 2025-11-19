import React, { useState, useMemo } from 'react';
import { Plus, CheckCircle2, AlertCircle, Circle, GraduationCap, Award } from 'lucide-react';
import courseCatalogData from './data/courses_complete.json';
import { SchedulingEngine } from './scheduling/SchedulingEngine.js';

// Load course catalog from JSON
const COURSE_CATALOG = courseCatalogData.courses.reduce((acc, course) => {
  acc[course.course_id] = course;
  return acc;
}, {});

// Initialize scheduling engine
const schedulingEngine = new SchedulingEngine(courseCatalogData.courses);

const WESTVIEW_REQUIREMENTS = {
  'English': { needed: 40, pathways: ['English'] },
  'Math': { needed: 30, pathways: ['Math'] },
  'Biological Science': { needed: 10, pathways: ['Science - Biological'] },
  'Physical Science': { needed: 10, pathways: ['Science - Physical'] },
  'History/Social Science': { needed: 30, pathways: ['History/Social Science'] },
  'Fine Arts/Foreign Language/CTE': { needed: 10, pathways: ['Fine Arts', 'Foreign Language', 'CTE'] },
  'Health Science': { needed: 5, pathways: ['Physical Education'], specialCourses: ['ENS 1-2'] },
  'Physical Education': { needed: 20, pathways: ['Physical Education'] },
  'Electives': { needed: 85, pathways: ['Electives'] }
};

const AG_REQUIREMENTS = {
  'A': { name: 'History/Social Science', needed: 2, short: 'History' },
  'B': { name: 'English', needed: 4, short: 'English' },
  'C': { name: 'Mathematics', needed: 3, short: 'Math' },
  'D': { name: 'Laboratory Science', needed: 2, short: 'Science' },
  'E': { name: 'Language Other Than English', needed: 2, short: 'Language' },
  'F': { name: 'Visual & Performing Arts', needed: 1, short: 'Arts' },
  'G': { name: 'College Prep Elective', needed: 1, short: 'College Prep Elective' }
};

const GRADE_OPTIONS = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];

// CTE Pathway Requirements
const CTE_PATHWAYS = {
  business: {
    name: 'Business & Finance',
    courses: [
      { name: 'BUSINESS PRINCIPLES', level: 'Capstone', grades: [9, 10] },
      { name: 'INTRO TO FINANCE', level: 'Concentrator', grades: [9, 10] },
      { name: 'MARKETING ECONOMICS', level: 'Capstone', grades: [10, 11] },
      { name: 'ECONOMICS OF BUSINESS OWNERSHIP', level: 'Capstone', grades: [10, 11] },
      { name: 'INTERNSHIP', level: 'Capstone', grades: [11, 12] }
    ]
  },
  biotech: {
    name: 'Biotechnology',
    courses: [
      { name: 'PRINCIPLES OF BIOMEDICAL SCIENCE', level: 'Concentrator', grades: [9, 10] },
      { name: 'HUMAN BODY SYSTEMS', level: 'Concentrator', grades: [9, 10] },
      { name: 'MEDICAL INTERVENTIONS', level: 'Capstone', grades: [10, 11, 12] }
    ]
  },
  design: {
    name: 'Design, Visual, and Media Arts',
    courses: [
      { name: '3D COMPUTER ANIMATION', level: 'Concentrator', grades: [9, 10, 11, 12] },
      { name: 'DIGITAL PHOTOGRAPHY', level: 'Concentrator/Capstone', grades: [9, 10, 11, 12] },
      { name: 'GRAPHIC DESIGN', level: 'Concentrator/Capstone', grades: [9, 10, 11, 12] },
      { name: 'STUDIO ART', level: 'Capstone', grades: [9, 10, 11, 12] }
    ]
  },
  engineering: {
    name: 'Engineering & Architecture',
    courses: [
      { name: 'INTRODUCTION TO ENGINEERING DESIGN', level: 'Concentrator', grades: [9, 10] },
      { name: 'PRINCIPLES OF ENGINEERING', level: 'Capstone', grades: [9, 10] },
      { name: 'CIVIL ENGINEERING AND ARCHITECTURE', level: 'Capstone', grades: [10, 11] },
      { name: 'COMPUTER INTEGRATED MANUFACTURING', level: 'Capstone', grades: [10, 11] },
      { name: 'DIGITAL ELECTRONICS', level: 'Capstone', grades: [11, 12] }
    ]
  },
  ict: {
    name: 'Information & Communication Technology',
    courses: [
      { name: 'COMPUTER INFORMATION SYSTEMS', level: 'Concentrator', grades: [9, 10, 11, 12] },
      { name: 'WEB DESIGN', level: 'Capstone', grades: [9, 10, 11, 12] },
      { name: 'AP COMPUTER SCIENCE PRINCIPLES', level: 'Capstone', grades: [10, 11] },
      { name: 'AP COMPUTER SCIENCE A', level: 'Capstone', grades: [10, 11] },
      { name: 'MOBILE APP DEVELOPMENT', level: 'Capstone', grades: [11, 12] }
    ]
  },
  performingArts: {
    name: 'Performing Arts',
    courses: [
      { name: 'DRAMA 1-2', level: 'Concentrator', grades: [9, 10, 11, 12] },
      { name: 'DRAMA 3-4', level: 'Capstone', grades: [9, 10, 11, 12] },
      { name: 'DRAMA 5-6', level: 'Capstone', grades: [9, 10, 11, 12] },
      { name: 'THEATER ARTS STUDY', level: 'Capstone', grades: [9, 10, 11, 12] }
    ]
  },
  productionArts: {
    name: 'Production & Managerial Arts',
    courses: [
      { name: 'DIGITAL MEDIA PRODUCTION 1-2', level: 'Concentrator', grades: [9, 10] },
      { name: 'DIGITAL MEDIA PRODUCTION', level: 'Capstone', grades: [9, 10, 11, 12] },
      { name: 'BROADCAST JOURNALISM', level: 'Capstone', grades: [10, 11, 12] },
      { name: 'TECHNICAL PRODUCTION FOR THEATER', level: 'Concentrator', grades: [9, 10, 11, 12] }
    ]
  }
};

// Recommended Electives for 9th Grade
const RECOMMENDED_9TH_GRADE = {
  'World Language': [
    'CHINESE 1-2', 'CHINESE 3-4', 'CHINESE 5-6',
    'FILIPINO 1-2', 'FILIPINO 3-4', 'FILIPINO 5-6',
    'FRENCH 1-2', 'FRENCH 3-4', 'FRENCH 5-6',
    'SPANISH 1-2', 'SPANISH 3-4', 'SPANISH 5-6'
  ],
  'Business': ['BUSINESS PRINCIPLES'],
  'Computer Science': ['COMPUTER INFORMATION SYSTEMS', 'WEB DESIGN 1-2'],
  'Engineering': ['INTRODUCTION TO ENGINEERING DESIGN', 'HONORS PLTW PRINCIPLES OF ENGINEERING'],
  'Fine Arts': [
    '3D COMPUTER ANIMATION 1-2',
    'BAND WITH COMPETITIVE MARCHING',
    'BAND WITH NON-COMPETITIVE MARCHING',
    'CERAMICS 1-2',
    'DESIGN AND MIXED MEDIA 1-2',
    'DIGITAL MEDIA PRODUCTION 1-2',
    'DIGITAL PHOTOGRAPHY 1-2',
    'DRAMA 1-2',
    'DRAWING AND PAINTING 1-2',
    'DRAWING & PAINTING 1-2',
    'GRAPHIC DESIGN 1-2',
    'ORCHESTRA 1-2',
    'ORCHESTRA/STRING ENSEMBLE 1-2',
    'TECHNICAL PRODUCTION FOR THEATER 1-',
    'DANCE PROP'
  ]
};

function App() {
  // Load courses from localStorage on initial render
  const [courses, setCourses] = useState(() => {
    const saved = localStorage.getItem('westview-courses');
    return saved ? JSON.parse(saved) : [];
  });
  const [showAddCourse, setShowAddCourse] = useState(null); // null or { year, semester, slot }
  const [selectedCategory, setSelectedCategory] = useState(''); // Track selected category
  const [newCourse, setNewCourse] = useState({ courseId: '' });
  const [courseSearchQuery, setCourseSearchQuery] = useState(''); // For searching all courses
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [earlyGradMode, setEarlyGradMode] = useState(() => {
    const saved = localStorage.getItem('westview-early-grad-mode');
    return saved ? JSON.parse(saved) : { enabled: false, targetYear: null }; // null, '3year', or '3.5year'
  });
  const [ctePathwayMode, setCtePathwayMode] = useState(() => {
    const saved = localStorage.getItem('westview-cte-pathway');
    return saved ? JSON.parse(saved) : { enabled: false, pathway: null }; // null, 'business', 'biotech', 'design', 'engineering'
  });
  const [concurrentCourses, setConcurrentCourses] = useState(() => {
    const saved = localStorage.getItem('westview-concurrent-courses');
    return saved ? JSON.parse(saved) : []; // Array of {id, name, collegeUnits, credits} for custom concurrent enrollment courses
  });
  const [showConcurrentForm, setShowConcurrentForm] = useState(false);
  const [newConcurrentCourse, setNewConcurrentCourse] = useState({ name: '', collegeUnits: 3 });

  // Drag and drop state
  const [draggedCourse, setDraggedCourse] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);

  // Semester completion tracking
  const [completedSemesters, setCompletedSemesters] = useState(() => {
    const saved = localStorage.getItem('westview-completed-semesters');
    return saved ? JSON.parse(saved) : {};
  });
  const [semesterValidation, setSemesterValidation] = useState(null);

  // Course suggestions
  const [suggestedCourses, setSuggestedCourses] = useState([]);

  // Save courses to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('westview-courses', JSON.stringify(courses));
  }, [courses]);

  // Save completed semesters to localStorage
  React.useEffect(() => {
    localStorage.setItem('westview-completed-semesters', JSON.stringify(completedSemesters));
  }, [completedSemesters]);

  // Save early grad mode to localStorage
  React.useEffect(() => {
    localStorage.setItem('westview-early-grad-mode', JSON.stringify(earlyGradMode));
  }, [earlyGradMode]);

  // Save CTE pathway mode to localStorage
  React.useEffect(() => {
    localStorage.setItem('westview-cte-pathway', JSON.stringify(ctePathwayMode));
  }, [ctePathwayMode]);

  // Save concurrent courses to localStorage
  React.useEffect(() => {
    localStorage.setItem('westview-concurrent-courses', JSON.stringify(concurrentCourses));
  }, [concurrentCourses]);

  // Calculate Westview graduation progress
  const westviewProgress = useMemo(() => {
    const progress = {};
    Object.entries(WESTVIEW_REQUIREMENTS).forEach(([name, req]) => {
      const relevantCourses = courses.filter(c => {
        const info = COURSE_CATALOG[c.courseId];
        return info && req.pathways.includes(info.pathway);
      });

      let credits = 0;

      // Special handling for dual-credit courses
      if (name === 'Health Science') {
        // Health Science only counts ENS 1-2 (5 credits)
        credits = relevantCourses.reduce((sum, c) => {
          const info = COURSE_CATALOG[c.courseId];
          if (req.specialCourses && req.specialCourses.includes(info.full_name)) {
            return sum + 5; // ENS 1-2 contributes 5 credits to Health Science
          }
          return sum;
        }, 0);
      } else if (name === 'Physical Education') {
        // PE counts all PE courses, but some courses only contribute partial credits
        credits = relevantCourses.reduce((sum, c) => {
          const info = COURSE_CATALOG[c.courseId];
          if (info.full_name === 'ENS 1-2') {
            return sum + 5; // ENS 1-2 contributes only 5 credits to PE (other 5 go to Health)
          } else if (info.full_name === 'MARCHING PE FLAGS/TALL FLAGS (DANCE PROP)') {
            return sum + 5; // MARCHING PE FLAGS contributes only 5 credits to PE (other 5 go to Fine Arts)
          }
          return sum + info.credits;
        }, 0);
      } else if (name === 'Fine Arts/Foreign Language/CTE') {
        // Fine Arts counts all Fine Arts/Foreign Language/CTE courses
        // PLUS 5 credits from MARCHING PE FLAGS (which is in PE pathway)
        const allCourses = courses.filter(c => {
          const info = COURSE_CATALOG[c.courseId];
          return info && req.pathways.includes(info.pathway);
        });

        // Also check for MARCHING PE FLAGS in PE pathway courses
        const peCourses = courses.filter(c => {
          const info = COURSE_CATALOG[c.courseId];
          return info && info.pathway === 'Physical Education';
        });

        credits = allCourses.reduce((sum, c) => sum + COURSE_CATALOG[c.courseId].credits, 0);

        // Add 5 credits from MARCHING PE FLAGS if present
        const hasMarchingPE = peCourses.some(c => {
          const info = COURSE_CATALOG[c.courseId];
          return info && info.full_name === 'MARCHING PE FLAGS/TALL FLAGS (DANCE PROP)';
        });

        if (hasMarchingPE) {
          credits += 5; // Add the Fine Arts portion of MARCHING PE FLAGS
        }
      } else {
        // All other requirements count full credits
        credits = relevantCourses.reduce((sum, c) => sum + COURSE_CATALOG[c.courseId].credits, 0);
      }

      progress[name] = {
        earned: credits,
        needed: req.needed,
        met: credits >= req.needed
      };
    });
    return progress;
  }, [courses]);

  const totalCredits = Object.values(westviewProgress).reduce((sum, p) => sum + p.earned, 0);
  const westviewGraduationReady = totalCredits >= 230 && Object.values(westviewProgress).every(p => p.met);

  // Calculate early graduation eligibility and requirements
  const earlyGradEligibility = useMemo(() => {
    const grade11Courses = courses.filter(c => c.year === '11');
    const grade11Credits = grade11Courses.reduce((sum, c) => {
      const info = COURSE_CATALOG[c.courseId];
      return sum + (info ? info.credits : 0);
    }, 0);

    const creditsThrough11 = courses
      .filter(c => ['9', '10', '11'].includes(c.year))
      .reduce((sum, c) => {
        const info = COURSE_CATALOG[c.courseId];
        return sum + (info ? info.credits : 0);
      }, 0);

    const hasSeniorEnglish = grade11Courses.some(c => {
      const info = COURSE_CATALOG[c.courseId];
      if (!info || info.pathway !== 'English') return false;
      const name = info.full_name.toUpperCase();
      return name.includes('AMERICAN LIT') || name.includes('ETHNIC LIT') ||
             name.includes('EXPOSITORY') || name.includes('WORLD LIT') ||
             name.includes('AP ENGLISH');
    });

    const hasCivicsEcon = grade11Courses.some(c => {
      const info = COURSE_CATALOG[c.courseId];
      if (!info) return false;
      const name = info.full_name.toUpperCase();
      return name.includes('CIVICS') && name.includes('ECONOMICS');
    });

    return {
      eligible3Year: creditsThrough11 >= 170 && hasSeniorEnglish && hasCivicsEcon,
      eligible3_5Year: creditsThrough11 >= 170,
      creditsThrough11,
      hasSeniorEnglish,
      hasCivicsEcon
    };
  }, [courses]);

  // Calculate CTE Pathway Progress
  // CTE Pathway Completion Requirements:
  // - (Concentrator + Capstone) OR (2 Capstones)
  const ctePathwayProgress = useMemo(() => {
    if (!ctePathwayMode.enabled || !ctePathwayMode.pathway) {
      return {
        completed: [],
        missing: [],
        totalRequired: 0,
        totalCompleted: 0,
        hasConcentrator: false,
        capstoneCount: 0,
        isPathwayCompleter: false,
        completionStatus: ''
      };
    }

    const pathway = CTE_PATHWAYS[ctePathwayMode.pathway];
    if (!pathway) {
      return {
        completed: [],
        missing: [],
        totalRequired: 0,
        totalCompleted: 0,
        hasConcentrator: false,
        capstoneCount: 0,
        isPathwayCompleter: false,
        completionStatus: ''
      };
    }

    const completed = [];
    const missing = [];
    let hasConcentrator = false;
    let capstoneCount = 0;

    pathway.courses.forEach(requiredCourse => {
      const hasCourse = courses.some(c => {
        const info = COURSE_CATALOG[c.courseId];
        if (!info) return false;
        const courseName = info.full_name.toUpperCase();
        return courseName.includes(requiredCourse.name);
      });

      if (hasCourse) {
        completed.push(requiredCourse);

        // Track level completion
        if (requiredCourse.level.includes('Concentrator')) {
          hasConcentrator = true;
        }
        if (requiredCourse.level.includes('Capstone')) {
          capstoneCount++;
        }
      } else {
        missing.push(requiredCourse);
      }
    });

    // Determine pathway completion status
    // Complete if: (has Concentrator AND has Capstone) OR (has 2+ Capstones)
    const isPathwayCompleter = (hasConcentrator && capstoneCount >= 1) || (capstoneCount >= 2);

    let completionStatus = '';
    if (isPathwayCompleter) {
      completionStatus = 'Pathway Completer! Certificate, transcript notation, and diploma seal earned.';
    } else if (hasConcentrator && capstoneCount === 0) {
      completionStatus = 'Need 1 Capstone course to complete pathway';
    } else if (capstoneCount === 1 && !hasConcentrator) {
      completionStatus = 'Need 1 more Capstone OR 1 Concentrator to complete pathway';
    } else if (hasConcentrator || capstoneCount > 0) {
      completionStatus = `Progress: ${hasConcentrator ? 'Concentrator ✓' : ''} ${capstoneCount > 0 ? `${capstoneCount} Capstone${capstoneCount > 1 ? 's' : ''} ✓` : ''}`;
    } else {
      completionStatus = 'Need Concentrator + Capstone OR 2 Capstones';
    }

    return {
      completed,
      missing,
      totalRequired: pathway.courses.length,
      totalCompleted: completed.length,
      pathwayName: pathway.name,
      hasConcentrator,
      capstoneCount,
      isPathwayCompleter,
      completionStatus
    };
  }, [courses, ctePathwayMode]);

  // Get courses for a specific semester (defined before useMemo that uses it)
  const getCoursesForSemester = (year, semester) => {
    return courses.filter(c => c.year === year && c.semester === semester);
  };

  // Calculate UC/CSU progress
  const agProgress = useMemo(() => {
    const progress = {};
    Object.keys(AG_REQUIREMENTS).forEach(cat => {
      const relevantCourses = courses.filter(c => {
        const info = COURSE_CATALOG[c.courseId];
        return info && info.uc_csu_category === cat;
      });

      // For language courses, count years based on term_length
      let years = cat === 'E'
        ? relevantCourses.length  // Each yearlong course = 1 year
        : relevantCourses.length;

      progress[cat] = {
        earned: years,
        needed: AG_REQUIREMENTS[cat].needed,
        met: years >= AG_REQUIREMENTS[cat].needed
      };
    });
    return progress;
  }, [courses]);

  const ucsuEligible = Object.values(agProgress).every(p => p.met);

  // Validate schedule using SchedulingEngine
  const scheduleValidation = useMemo(() => {
    const validation = { errors: [], warnings: [] };

    ['9', '10', '11', '12'].forEach(year => {
      const fallCourses = getCoursesForSemester(year, 'Fall');
      const springCourses = getCoursesForSemester(year, 'Spring');

      const schedule = {
        fall: fallCourses.map(c => c.courseId),
        spring: springCourses.map(c => c.courseId)
      };

      // Use scheduling engine to validate
      const result = schedulingEngine.validateSchedule(schedule);
      if (!result.valid) {
        result.errors.forEach(err => {
          validation.errors.push({ ...err, year });
        });
      }

      // Check for missing mandatory courses in years with courses
      const hasCoursesInBothSemesters = fallCourses.length > 0 && springCourses.length > 0;
      if (hasCoursesInBothSemesters) {
        const allYearCourses = [...fallCourses, ...springCourses];

        // Check for English (required all 4 years)
        const hasEnglish = allYearCourses.some(c => {
          const info = COURSE_CATALOG[c.courseId];
          return info && info.pathway === 'English';
        });

        if (!hasEnglish) {
          validation.warnings.push({
            type: 'missing_english',
            year,
            message: `Missing English in Grade ${year}`
          });
        }

        // Check for PE (required at least 2 years, typically 9 and 10)
        const hasPE = allYearCourses.some(c => {
          const info = COURSE_CATALOG[c.courseId];
          return info && info.pathway === 'Physical Education';
        });

        if (!hasPE && (year === '9' || year === '10')) {
          validation.warnings.push({
            type: 'missing_pe',
            year,
            message: `Missing PE in Grade ${year}`
          });
        }
      }
    });

    // Check for foreign language prerequisite gaps across all courses
    courses.forEach(course => {
      const courseInfo = COURSE_CATALOG[course.courseId];
      if (!courseInfo || courseInfo.pathway !== 'Foreign Language') return;

      const courseName = courseInfo.full_name.toUpperCase();
      let language = null;
      let level = null;

      // Detect language
      if (courseName.includes('SPANISH')) language = 'Spanish';
      else if (courseName.includes('CHINESE')) language = 'Chinese';
      else if (courseName.includes('FRENCH')) language = 'French';
      else if (courseName.includes('FILIPINO')) language = 'Filipino';
      else if (courseName.includes('GERMAN')) language = 'German';
      else if (courseName.includes('JAPANESE')) language = 'Japanese';
      else if (courseName.includes('LATIN')) language = 'Latin';

      if (!language) return;

      // Detect level
      const levelPatterns = ['1-2', '3-4', '5-6', '7-8', '9-10'];
      for (const pattern of levelPatterns) {
        if (courseName.includes(pattern)) {
          level = pattern;
          break;
        }
      }

      if (!level || level === '1-2') return;

      // Check for previous levels
      const previousLevels = {
        '3-4': ['1-2'],
        '5-6': ['1-2', '3-4'],
        '7-8': ['1-2', '3-4', '5-6'],
        '9-10': ['1-2', '3-4', '5-6', '7-8']
      };

      const requiredLevels = previousLevels[level] || [];
      const allCourseNames = courses.map(c => COURSE_CATALOG[c.courseId]?.full_name?.toUpperCase() || '');

      const missingLevels = requiredLevels.filter(reqLevel => {
        const hasLevel = allCourseNames.some(name =>
          name.includes(language.toUpperCase()) && name.includes(reqLevel)
        );
        return !hasLevel;
      });

      if (missingLevels.length > 0) {
        const missingWithLanguage = missingLevels.map(lvl => `${language} ${lvl}`);
        validation.warnings.push({
          type: 'missing_prerequisites',
          year: course.year,
          message: `${language} ${level} missing prerequisites: ${missingWithLanguage.join(', ')}`
        });
      }
    });

    return validation;
  }, [courses]);

  const englishWarnings = scheduleValidation.warnings
    .filter(w => w.type === 'missing_english')
    .map(w => w.year);

  const peWarnings = scheduleValidation.warnings
    .filter(w => w.type === 'missing_pe')
    .map(w => w.year);

  const prereqWarnings = scheduleValidation.warnings
    .filter(w => w.type === 'missing_prerequisites');

  // Helper function to check for missing foreign language prerequisites
  const checkForeignLanguagePrereqs = (courseId) => {
    const courseInfo = COURSE_CATALOG[courseId];
    if (!courseInfo || courseInfo.pathway !== 'Foreign Language') {
      return null;
    }

    const courseName = courseInfo.full_name.toUpperCase();

    // Extract language and level
    let language = null;
    let level = null;

    // Detect language
    if (courseName.includes('SPANISH')) language = 'SPANISH';
    else if (courseName.includes('CHINESE')) language = 'CHINESE';
    else if (courseName.includes('FRENCH')) language = 'FRENCH';
    else if (courseName.includes('FILIPINO')) language = 'FILIPINO';
    else if (courseName.includes('GERMAN')) language = 'GERMAN';
    else if (courseName.includes('JAPANESE')) language = 'JAPANESE';
    else if (courseName.includes('LATIN')) language = 'LATIN';

    if (!language) return null;

    // Detect level
    const levelPatterns = ['1-2', '3-4', '5-6', '7-8', '9-10'];
    for (const pattern of levelPatterns) {
      if (courseName.includes(pattern)) {
        level = pattern;
        break;
      }
    }

    if (!level) return null;

    // If level is 1-2, no prerequisites needed
    if (level === '1-2') return null;

    // Check for previous levels in schedule
    const previousLevels = {
      '3-4': ['1-2'],
      '5-6': ['1-2', '3-4'],
      '7-8': ['1-2', '3-4', '5-6'],
      '9-10': ['1-2', '3-4', '5-6', '7-8']
    };

    const requiredLevels = previousLevels[level] || [];
    const scheduledCourses = courses.map(c => COURSE_CATALOG[c.courseId]?.full_name?.toUpperCase() || '');

    const missingLevels = requiredLevels.filter(reqLevel => {
      const hasLevel = scheduledCourses.some(name =>
        name.includes(language) && name.includes(reqLevel)
      );
      return !hasLevel;
    });

    if (missingLevels.length > 0) {
      return {
        language: language.charAt(0) + language.slice(1).toLowerCase(),
        currentLevel: level,
        missingLevels: missingLevels
      };
    }

    return null;
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
  const handleDragStart = (e, course, year, semester) => {
    setDraggedCourse({ course, year, semester });
    e.dataTransfer.effectAllowed = 'move';
    // Add semi-transparent effect
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    setDraggedCourse(null);
    setDragOverSlot(null);
    e.currentTarget.style.opacity = '1';
  };

  const handleDragOver = (e, targetYear, targetSemester, slotIndex) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot({ year: targetYear, semester: targetSemester, slot: slotIndex });
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = (e, targetYear, targetSemester, slotIndex) => {
    e.preventDefault();

    if (!draggedCourse) return;

    const { course, year: sourceYear, semester: sourceSemester } = draggedCourse;
    const courseInfo = getCourseInfo(course.courseId);

    // Don't do anything if dropping in the same location
    if (sourceYear === targetYear && sourceSemester === targetSemester) {
      setDraggedCourse(null);
      setDragOverSlot(null);
      return;
    }

    // Check if course is yearlong
    if (courseInfo.term_length === 'yearlong') {
      // For yearlong courses, we need to move both semesters
      // Find the course in both fall and spring
      const oppositeSemester = sourceSemester === 'Fall' ? 'Spring' : 'Fall';
      const oppositeTargetSemester = targetSemester === 'Fall' ? 'Spring' : 'Fall';

      // Update courses by removing from both source semesters and adding to both target semesters
      setCourses(prev => {
        // Remove from both source semesters
        const withoutSource = prev.filter(c =>
          !(c.courseId === course.courseId && c.year === sourceYear)
        );

        // Add to both target semesters
        return [
          ...withoutSource,
          { ...course, year: targetYear, semester: targetSemester, id: `${course.courseId}-${targetYear}-${targetSemester}` },
          { ...course, year: targetYear, semester: oppositeTargetSemester, id: `${course.courseId}-${targetYear}-${oppositeTargetSemester}` }
        ];
      });
    } else {
      // For semester courses, just move to the target semester
      setCourses(prev => prev.map(c => {
        if (c.id === course.id) {
          return { ...c, year: targetYear, semester: targetSemester, id: `${c.courseId}-${targetYear}-${targetSemester}` };
        }
        return c;
      }));
    }

    setDraggedCourse(null);
    setDragOverSlot(null);
  };

  // Validate semester completion
  const validateSemesterCompletion = (year, semester) => {
    const semesterCourses = getCoursesForSemester(year, semester);
    const issues = [];
    const warnings = [];
    const info = [];

    // Check minimum course load (typically 6-7 courses)
    if (semesterCourses.length === 0) {
      issues.push('No courses scheduled for this semester');
      return { valid: false, issues, warnings, info };
    }

    if (semesterCourses.length < 5) {
      warnings.push(`Light course load (${semesterCourses.length} courses). Most students take 6-7 courses per semester.`);
    }

    // Check for required courses based on grade
    const yearInt = parseInt(year);

    // Check for English (required all 4 years)
    const hasEnglish = semesterCourses.some(c => {
      const info = getCourseInfo(c.courseId);
      return info?.pathway === 'English';
    });

    if (!hasEnglish) {
      // Check if English is in the opposite semester (year-long)
      const oppositeSemester = semester === 'Fall' ? 'Spring' : 'Fall';
      const oppositeCourses = getCoursesForSemester(year, oppositeSemester);
      const hasEnglishOpposite = oppositeCourses.some(c => {
        const info = getCourseInfo(c.courseId);
        return info?.pathway === 'English' && info?.term_length === 'yearlong';
      });

      if (!hasEnglishOpposite) {
        issues.push('Missing English course - required all 4 years');
      }
    }

    // Check for PE (required grades 9-10)
    if (yearInt === 9 || yearInt === 10) {
      const hasPE = semesterCourses.some(c => {
        const info = getCourseInfo(c.courseId);
        return info?.pathway === 'Physical Education';
      });

      if (!hasPE) {
        const oppositeSemester = semester === 'Fall' ? 'Spring' : 'Fall';
        const oppositeCourses = getCoursesForSemester(year, oppositeSemester);
        const hasPEOpposite = oppositeCourses.some(c => {
          const info = getCourseInfo(c.courseId);
          return info?.pathway === 'Physical Education' && info?.term_length === 'yearlong';
        });

        if (!hasPEOpposite) {
          issues.push(`PE required for Grade ${year}`);
        }
      }
    }

    // Check for Integrated Math I requirement (or higher level math)
    // All students must pass Integrated Math I, OR start at a higher level (Math II, III, etc.)
    if (yearInt === 12 && semester === 'Spring') {
      // Only check at graduation (end of senior year)
      const allCourses = courses.filter(c => parseInt(c.year) <= 12);
      const hasMathI = allCourses.some(c => {
        const info = getCourseInfo(c.courseId);
        return info && /INTEGRATED MATHEMATICS I[^I]/i.test(info.full_name);
      });
      const hasHigherMath = allCourses.some(c => {
        const info = getCourseInfo(c.courseId);
        return info && /INTEGRATED MATHEMATICS (II|III)/i.test(info.full_name);
      });

      if (!hasMathI && !hasHigherMath) {
        warnings.push('Integrated Math I (or higher) is required for graduation');
      }
    }

    // Check for yearlong courses that should be in both semesters
    semesterCourses.forEach(course => {
      const courseInfo = getCourseInfo(course.courseId);
      if (courseInfo?.term_length === 'yearlong') {
        const oppositeSemester = semester === 'Fall' ? 'Spring' : 'Fall';
        const oppositeCourses = getCoursesForSemester(year, oppositeSemester);
        const hasOpposite = oppositeCourses.some(c => c.courseId === course.courseId);

        if (!hasOpposite) {
          issues.push(`Year-long course "${courseInfo.full_name}" must be in both Fall and Spring`);
        }
      }

      // Check for UNIFIED PE courses that require counselor consultation
      if (courseInfo?.full_name && courseInfo.full_name.toUpperCase().includes('UNIFIED PE')) {
        warnings.push(`⚠️ UNIFIED PE credit allocation varies - consult your counselor to determine how many credits count toward PE vs. Electives`);
      }
    });

    // Check semester capacity
    // Standard load is 3 courses per semester
    if (semesterCourses.length > 8) {
      issues.push(`Overloaded schedule (${semesterCourses.length} courses). Maximum is 8 courses per semester.`);
    } else if (semesterCourses.length >= 5) {
      warnings.push(`Above standard load (${semesterCourses.length} courses). Standard is 3 courses per semester. Consider your workload carefully.`);
    } else if (semesterCourses.length === 4) {
      info.push(`Moderate load (${semesterCourses.length} courses). Standard is 3 courses per semester.`);
    }

    // Calculate credits for the semester
    const semesterCredits = semesterCourses.reduce((sum, c) => {
      const info = getCourseInfo(c.courseId);
      return sum + (info ? info.credits : 0);
    }, 0);

    info.push(`${semesterCourses.length} courses scheduled`);
    info.push(`${semesterCredits} credits for this semester`);

    // Check UC A-G progress for juniors and seniors
    if (yearInt >= 11) {
      // Count total UC A-G courses completed up to this point
      const yearsToCheck = yearInt === 11 ? ['9', '10', '11'] : ['9', '10', '11', '12'];
      let agCoursesCompleted = 0;

      yearsToCheck.forEach(checkYear => {
        ['Fall', 'Spring'].forEach(checkSemester => {
          // Only count if we're checking up to the current semester
          if (parseInt(checkYear) < yearInt ||
              (parseInt(checkYear) === yearInt && (checkSemester === 'Fall' || (checkSemester === 'Spring' && semester === 'Spring')))) {

            const semCourses = getCoursesForSemester(checkYear, checkSemester);
            semCourses.forEach(c => {
              const info = getCourseInfo(c.courseId);
              if (info?.uc_csu_category) {
                agCoursesCompleted++;
              }
            });
          }
        });
      });

      // Remove duplicates (yearlong courses counted twice)
      const uniqueAGCourses = new Set();
      yearsToCheck.forEach(checkYear => {
        ['Fall', 'Spring'].forEach(checkSemester => {
          if (parseInt(checkYear) < yearInt ||
              (parseInt(checkYear) === yearInt && (checkSemester === 'Fall' || (checkSemester === 'Spring' && semester === 'Spring')))) {

            const semCourses = getCoursesForSemester(checkYear, checkSemester);
            semCourses.forEach(c => {
              const info = getCourseInfo(c.courseId);
              if (info?.uc_csu_category) {
                uniqueAGCourses.add(c.courseId);
              }
            });
          }
        });
      });

      const uniqueCount = uniqueAGCourses.size;

      // UC requirement: 11 A-G courses by end of junior year
      if (yearInt === 11 && semester === 'Spring') {
        if (uniqueCount < 11) {
          issues.push(`UC requirement: Need 11 A-G courses by end of junior year. Currently have ${uniqueCount}.`);
        } else {
          info.push(`✓ UC requirement met: ${uniqueCount} A-G courses by end of junior year`);
        }
      }

      // Total requirement: 15 A-G courses by graduation
      if (yearInt === 12 && semester === 'Spring') {
        if (uniqueCount < 15) {
          issues.push(`UC requirement: Need 15 A-G courses total for graduation. Currently have ${uniqueCount}.`);
        } else {
          info.push(`✓ UC requirement met: ${uniqueCount} A-G courses completed`);
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
      info
    };
  };

  // Handle marking semester as complete
  const markSemesterComplete = (year, semester) => {
    const validation = validateSemesterCompletion(year, semester);
    setSemesterValidation({ year, semester, ...validation });

    if (validation.valid) {
      setCompletedSemesters(prev => ({
        ...prev,
        [`${year}-${semester}`]: true
      }));
    }
  };

  // Handle unmarking semester
  const unmarkSemesterComplete = (year, semester) => {
    setCompletedSemesters(prev => {
      const newCompleted = { ...prev };
      delete newCompleted[`${year}-${semester}`];
      return newCompleted;
    });
    setSemesterValidation(null);
  };

  const addCourse = (year, semester) => {
    if (!newCourse.courseId) return;

    const courseInfo = getCourseInfo(newCourse.courseId);
    if (!courseInfo) return;

    setError(null);
    setWarning(null);

    // Get semester courses early for validation checks
    const semesterCourses = getCoursesForSemester(year, semester);

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

          // Show warning if they haven't added these yet
          if (!earlyGradEligibility.hasSeniorEnglish && !isSeniorEnglish && semester === 'Fall') {
            setWarning('Early Graduation: Remember to add a Senior English course in Grade 11');
          }
          if (!earlyGradEligibility.hasCivicsEcon && !isCivicsEcon && semester === 'Fall') {
            setWarning('Early Graduation: Remember to add Civics/Economics in Grade 11');
          }
        }
      } else if (earlyGradMode.targetYear === '3.5year') {
        // 3.5-year plan: Can add courses to grade 12 Fall only
        if (year === '12' && semester === 'Spring') {
          setError('Early Graduation (3.5 years): Cannot add courses to Grade 12 Spring');
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
      if (courseName.includes('ENGLISH 1-2') || courseName.includes('ENGLISH IA-IB')) {
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
      if (courseName.includes('ENGLISH 3-4') || courseName.includes('ENGLISH IIA-IIB')) {
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
    }

    // Check for foreign language prerequisites (warning only, doesn't block)
    const prereqCheck = checkForeignLanguagePrereqs(newCourse.courseId);
    if (prereqCheck) {
      setWarning(
        `You're adding ${prereqCheck.language} ${prereqCheck.currentLevel} without completing: ${prereqCheck.missingLevels.join(', ')}. Have you met the prerequisites?`
      );
    }

    // Check for Off-Roll restrictions
    if (courseInfo.pathway === 'Off-Roll') {
      // Off-Roll allowed in grades 9, 11, 12 (not 10)
      if (year === '10') {
        setError('Off-Roll courses are not allowed in Grade 10');
        return;
      }

      // Count existing Off-Roll courses in this semester
      const semesterOffRollCount = semesterCourses.filter(c => {
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
    const alreadyHasCourse = semesterCourses.some(c => c.courseId === newCourse.courseId);
    if (alreadyHasCourse) {
      setError('This course is already in this semester');
      return;
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

    // Check school service course limit (max 1 per semester)
    const isSchoolService = courseName.includes('ACADEMIC TUTOR') ||
                            (courseName.includes('LIBRARY') && courseName.includes('ASSISTANT')) ||
                            courseName.includes('WORK EXPERIENCE') ||
                            courseName.includes('TEACHER') && courseName.includes('ASSISTANT');

    if (isSchoolService) {
      const hasSchoolService = semesterCourses.some(c => {
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
      const hasOtherSchoolService = semesterCourses.some(c => {
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
          const hasSameLanguage = semesterCourses.some(c => {
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

    // Use scheduling engine to get term requirements
    const termReqs = schedulingEngine.getTermRequirements(newCourse.courseId);

    // Year-long validation
    if (termReqs.requiresBothSemesters && semester === 'Spring') {
      setError('Year-long courses must start in Fall');
      return;
    }

    // Check if year-long course would duplicate in Spring semester
    if (termReqs.requiresBothSemesters && semester === 'Fall') {
      const springSemesterCourses = getCoursesForSemester(year, 'Spring');
      const alreadyInSpring = springSemesterCourses.some(c => c.courseId === newCourse.courseId);
      if (alreadyInSpring) {
        setError('This year-long course is already in Spring semester');
        return;
      }
    }

    // Check if course can be scheduled in this semester
    const semesterName = semester.toLowerCase();
    if (!schedulingEngine.canScheduleInSemester(newCourse.courseId, semesterName)) {
      setError(`This course is not offered in ${semester}`);
      return;
    }

    // Add course(s) - yearlong courses automatically add to both semesters
    if (termReqs.requiresBothSemesters && semester === 'Fall') {
      const fall = { ...newCourse, id: Date.now(), year, semester: 'Fall' };
      const spring = { ...newCourse, id: Date.now() + 1, year, semester: 'Spring' };
      setCourses([...courses, fall, spring]);
    } else {
      setCourses([...courses, { ...newCourse, id: Date.now(), year, semester }]);
    }

    setNewCourse({ courseId: '' });
    setSelectedCategory('');
    setShowAddCourse(null);
    // Don't clear warning here - let it persist so user sees the prerequisite warning
  };

  const removeCourse = (id) => {
    setCourses(courses.filter(c => c.id !== id));
  };

  // Generate course suggestions based on missing requirements
  const generateCourseSuggestions = () => {
    const suggestions = [];

    // Determine which years to check based on early graduation mode
    const yearsToCheck = earlyGradMode.enabled
      ? (earlyGradMode.targetYear === '3year' ? ['9', '10', '11'] : ['9', '10', '11', '12'])
      : ['9', '10', '11', '12'];

    // Check for missing English courses (required all years)
    yearsToCheck.forEach(year => {
      const yearCourses = courses.filter(c => c.year === year);
      const hasEnglish = yearCourses.some(c => {
        const info = COURSE_CATALOG[c.courseId];
        return info && info.pathway === 'English';
      });

      if (!hasEnglish) {
        // Suggest grade-appropriate English course
        const englishCourses = Object.entries(COURSE_CATALOG)
          .filter(([_, course]) =>
            course.pathway === 'English' &&
            course.grades_allowed.includes(parseInt(year)) &&
            !course.full_name.toUpperCase().includes('AP')
          )
          .map(([id, course]) => ({ id, ...course }));

        if (englishCourses.length > 0) {
          // For Grade 9, prefer ENGLISH 1-2 or HONORS ENGLISH 1-2
          let suggestedEnglish = englishCourses[0];
          if (year === '9') {
            suggestedEnglish = englishCourses.find(c =>
              c.full_name.toUpperCase().includes('ENGLISH 1-2')
            ) || englishCourses[0];
          }

          suggestions.push({
            courseId: suggestedEnglish.id,
            year,
            semester: 'Fall',
            reason: `Grade ${year} requires an English course`,
            courseName: suggestedEnglish.full_name
          });
        }
      }
    });

    // Check for missing ENS/PE in grades 9-10
    ['9', '10'].forEach(year => {
      if (!yearsToCheck.includes(year)) return; // Skip if year not applicable

      const yearCourses = courses.filter(c => c.year === year);
      const fallCourses = yearCourses.filter(c => c.semester === 'Fall');
      const springCourses = yearCourses.filter(c => c.semester === 'Spring');

      const hasPEInFall = fallCourses.some(c => {
        const info = COURSE_CATALOG[c.courseId];
        return info && info.pathway === 'Physical Education';
      });

      const hasPEInSpring = springCourses.some(c => {
        const info = COURSE_CATALOG[c.courseId];
        return info && info.pathway === 'Physical Education';
      });

      // For Grade 9, suggest ENS 3-4 in Fall and ENS 1-2 in Spring
      if (year === '9') {
        if (!hasPEInFall) {
          const ens34 = Object.entries(COURSE_CATALOG)
            .find(([_, course]) =>
              course.full_name.toUpperCase().includes('ENS 3-4') &&
              course.grades_allowed.includes(9)
            );

          if (ens34) {
            const [courseId, courseInfo] = ens34;
            suggestions.push({
              courseId,
              year: '9',
              semester: 'Fall',
              reason: 'ENS 3-4 recommended for Grade 9 Fall',
              courseName: courseInfo.full_name
            });
          }
        }

        if (!hasPEInSpring) {
          const ens12 = Object.entries(COURSE_CATALOG)
            .find(([_, course]) =>
              course.full_name.toUpperCase().includes('ENS 1-2') &&
              course.grades_allowed.includes(9)
            );

          if (ens12) {
            const [courseId, courseInfo] = ens12;
            suggestions.push({
              courseId,
              year: '9',
              semester: 'Spring',
              reason: 'ENS 1-2 recommended for Grade 9 Spring',
              courseName: courseInfo.full_name
            });
          }
        }
      } else {
        // For Grade 10, suggest any PE course if missing
        const hasPE = yearCourses.some(c => {
          const info = COURSE_CATALOG[c.courseId];
          return info && info.pathway === 'Physical Education';
        });

        if (!hasPE) {
          const peCourses = Object.entries(COURSE_CATALOG)
            .filter(([_, course]) =>
              course.pathway === 'Physical Education' &&
              course.grades_allowed.includes(parseInt(year))
            )
            .map(([id, course]) => ({ id, ...course }));

          if (peCourses.length > 0) {
            suggestions.push({
              courseId: peCourses[0].id,
              year,
              semester: 'Fall',
              reason: `PE required for Grade ${year}`,
              courseName: peCourses[0].full_name
            });
          }
        }
      }
    });

    // Check for missing Math courses
    yearsToCheck.forEach(year => {
      const yearCourses = courses.filter(c => c.year === year);
      const hasMath = yearCourses.some(c => {
        const info = COURSE_CATALOG[c.courseId];
        return info && info.pathway === 'Math';
      });

      if (!hasMath) {
        // Suggest appropriate math course based on grade
        const mathCourses = Object.entries(COURSE_CATALOG)
          .filter(([_, course]) =>
            course.pathway === 'Math' &&
            course.grades_allowed.includes(parseInt(year)) &&
            !course.full_name.toUpperCase().includes('HONORS') &&
            !course.full_name.toUpperCase().includes('AP')
          )
          .map(([id, course]) => ({ id, ...course }));

        if (mathCourses.length > 0) {
          // Prefer Integrated Math sequence
          let suggestedMath = mathCourses.find(c => c.full_name.includes('INTEGRATED MATHEMATICS I')) || mathCourses[0];

          suggestions.push({
            courseId: suggestedMath.id,
            year,
            semester: 'Fall',
            reason: `Math course required for Grade ${year}`,
            courseName: suggestedMath.full_name
          });
        }
      }
    });

    // Check for missing Science courses (need both biological and physical)
    yearsToCheck.forEach(year => {
      const yearCourses = courses.filter(c => c.year === year);
      const hasScience = yearCourses.some(c => {
        const info = COURSE_CATALOG[c.courseId];
        return info && (info.pathway === 'Science - Biological' || info.pathway === 'Science - Physical');
      });

      if (!hasScience && year === '9') {
        // Suggest Biology for grade 9
        const biologyCourses = Object.entries(COURSE_CATALOG)
          .filter(([_, course]) =>
            course.pathway === 'Science - Biological' &&
            course.grades_allowed.includes(9) &&
            !course.full_name.toUpperCase().includes('AP')
          )
          .map(([id, course]) => ({ id, ...course }));

        if (biologyCourses.length > 0) {
          suggestions.push({
            courseId: biologyCourses[0].id,
            year: '9',
            semester: 'Fall',
            reason: 'Biological science required',
            courseName: biologyCourses[0].full_name
          });
        }
      } else if (!hasScience && year === '10') {
        // Suggest Chemistry for grade 10
        const chemistryCourses = Object.entries(COURSE_CATALOG)
          .filter(([_, course]) =>
            course.pathway === 'Science - Physical' &&
            course.grades_allowed.includes(10) &&
            course.full_name.toUpperCase().includes('CHEMISTRY')
          )
          .map(([id, course]) => ({ id, ...course }));

        if (chemistryCourses.length > 0) {
          suggestions.push({
            courseId: chemistryCourses[0].id,
            year: '10',
            semester: 'Fall',
            reason: 'Physical science required',
            courseName: chemistryCourses[0].full_name
          });
        }
      }
    });

    // Check for missing History/Social Science
    yearsToCheck.forEach(year => {
      const yearCourses = courses.filter(c => c.year === year);
      const hasHistory = yearCourses.some(c => {
        const info = COURSE_CATALOG[c.courseId];
        return info && info.pathway === 'History/Social Science';
      });

      if (!hasHistory && (year === '10' || year === '11' || year === '12')) {
        const historyCourses = Object.entries(COURSE_CATALOG)
          .filter(([_, course]) =>
            course.pathway === 'History/Social Science' &&
            course.grades_allowed.includes(parseInt(year)) &&
            !course.full_name.toUpperCase().includes('AP')
          )
          .map(([id, course]) => ({ id, ...course }));

        if (historyCourses.length > 0) {
          let suggestedCourse = historyCourses[0];

          // Prefer World History for grade 10, US History for grade 11, Civics for grade 12
          if (year === '10') {
            suggestedCourse = historyCourses.find(c => c.full_name.toUpperCase().includes('WORLD HISTORY')) || suggestedCourse;
          } else if (year === '11') {
            suggestedCourse = historyCourses.find(c => c.full_name.toUpperCase().includes('UNITED STATES HISTORY')) || suggestedCourse;
          } else if (year === '12') {
            suggestedCourse = historyCourses.find(c => c.full_name.toUpperCase().includes('CIVICS')) || suggestedCourse;
          }

          suggestions.push({
            courseId: suggestedCourse.id,
            year,
            semester: 'Fall',
            reason: `History/Social Science required for Grade ${year}`,
            courseName: suggestedCourse.full_name
          });
        }
      }
    });

    // CTE Pathway Suggestions
    if (ctePathwayMode.enabled && ctePathwayMode.pathway) {
      const pathway = CTE_PATHWAYS[ctePathwayMode.pathway];
      const allCourses = courses;

      // Check for concentrator course
      const concentratorCourses = pathway.courses.filter(c => c.level === 'Concentrator');
      const hasConcentrator = concentratorCourses.some(cteCourse => {
        return allCourses.some(scheduledCourse => {
          const info = COURSE_CATALOG[scheduledCourse.courseId];
          return info && info.full_name.toUpperCase().includes(cteCourse.name.toUpperCase());
        });
      });

      if (!hasConcentrator && concentratorCourses.length > 0) {
        // Suggest first concentrator course
        const cteCourse = concentratorCourses[0];
        const matchingCourse = Object.entries(COURSE_CATALOG)
          .find(([_, course]) => course.full_name.toUpperCase().includes(cteCourse.name.toUpperCase()));

        if (matchingCourse) {
          const [courseId, courseInfo] = matchingCourse;
          // Find earliest applicable grade from yearsToCheck
          const suggestedYear = yearsToCheck.find(y => cteCourse.grades.includes(parseInt(y)));

          if (suggestedYear) {
            suggestions.push({
              courseId,
              year: suggestedYear,
              semester: 'Fall',
              reason: `CTE ${pathway.name} - Concentrator course required`,
              courseName: courseInfo.full_name
            });
          }
        }
      }

      // Check for capstone course
      const capstoneCourses = pathway.courses.filter(c => c.level === 'Capstone');
      const hasCapstone = capstoneCourses.some(cteCourse => {
        return allCourses.some(scheduledCourse => {
          const info = COURSE_CATALOG[scheduledCourse.courseId];
          return info && info.full_name.toUpperCase().includes(cteCourse.name.toUpperCase());
        });
      });

      if (!hasCapstone && capstoneCourses.length > 0 && hasConcentrator) {
        // Suggest first capstone course (only if concentrator is present)
        const cteCourse = capstoneCourses[0];
        const matchingCourse = Object.entries(COURSE_CATALOG)
          .find(([_, course]) => course.full_name.toUpperCase().includes(cteCourse.name.toUpperCase()));

        if (matchingCourse) {
          const [courseId, courseInfo] = matchingCourse;
          // Find latest applicable grade from yearsToCheck
          const suggestedYear = yearsToCheck.reverse().find(y => cteCourse.grades.includes(parseInt(y)));

          if (suggestedYear) {
            suggestions.push({
              courseId,
              year: suggestedYear,
              semester: 'Fall',
              reason: `CTE ${pathway.name} - Capstone course required`,
              courseName: courseInfo.full_name
            });
          }
        }
      }
    }

    setSuggestedCourses(suggestions);
  };

  // Approve and add a suggested course
  const approveSuggestion = (suggestion) => {
    // Remove from suggestions
    setSuggestedCourses(suggestedCourses.filter(s =>
      !(s.courseId === suggestion.courseId && s.year === suggestion.year && s.semester === suggestion.semester)
    ));

    // Add the course
    const courseInfo = COURSE_CATALOG[suggestion.courseId];
    if (!courseInfo) return;

    const termReqs = schedulingEngine.getTermRequirements(suggestion.courseId);

    if (termReqs.requiresBothSemesters && suggestion.semester === 'Fall') {
      const fall = { courseId: suggestion.courseId, id: Date.now(), year: suggestion.year, semester: 'Fall' };
      const spring = { courseId: suggestion.courseId, id: Date.now() + 1, year: suggestion.year, semester: 'Spring' };
      setCourses([...courses, fall, spring]);
    } else {
      setCourses([...courses, { courseId: suggestion.courseId, id: Date.now(), year: suggestion.year, semester: suggestion.semester }]);
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
      .filter(([_, course]) => course.pathway === selectedCategory)
      .map(([id, course]) => ({ id, ...course }));
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">Westview High School Course Planner</h1>
              <p className="text-gray-600 mt-1 mb-3">Plan your path through high school</p>

              {/* CTE Pathway Selection */}
              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                <p className="text-sm font-bold text-gray-900 mb-3">CTE Pathways</p>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => setCtePathwayMode(prev =>
                      prev.pathway === 'business' ? { enabled: false, pathway: null } : { enabled: true, pathway: 'business' }
                    )}
                    className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                      ctePathwayMode.pathway === 'business'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-purple-50 border border-gray-300'
                    }`}
                  >
                    Business & Finance
                  </button>
                  <button
                    onClick={() => setCtePathwayMode(prev =>
                      prev.pathway === 'biotech' ? { enabled: false, pathway: null } : { enabled: true, pathway: 'biotech' }
                    )}
                    className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                      ctePathwayMode.pathway === 'biotech'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-purple-50 border border-gray-300'
                    }`}
                  >
                    Biotechnology
                  </button>
                  <button
                    onClick={() => setCtePathwayMode(prev =>
                      prev.pathway === 'design' ? { enabled: false, pathway: null } : { enabled: true, pathway: 'design' }
                    )}
                    className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                      ctePathwayMode.pathway === 'design'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-purple-50 border border-gray-300'
                    }`}
                  >
                    Design & Media
                  </button>
                  <button
                    onClick={() => setCtePathwayMode(prev =>
                      prev.pathway === 'engineering' ? { enabled: false, pathway: null } : { enabled: true, pathway: 'engineering' }
                    )}
                    className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                      ctePathwayMode.pathway === 'engineering'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-purple-50 border border-gray-300'
                    }`}
                  >
                    Engineering
                  </button>
                  <button
                    onClick={() => setCtePathwayMode(prev =>
                      prev.pathway === 'ict' ? { enabled: false, pathway: null } : { enabled: true, pathway: 'ict' }
                    )}
                    className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                      ctePathwayMode.pathway === 'ict'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-purple-50 border border-gray-300'
                    }`}
                  >
                    Info & Comm Tech
                  </button>
                  <button
                    onClick={() => setCtePathwayMode(prev =>
                      prev.pathway === 'performingArts' ? { enabled: false, pathway: null } : { enabled: true, pathway: 'performingArts' }
                    )}
                    className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                      ctePathwayMode.pathway === 'performingArts'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-purple-50 border border-gray-300'
                    }`}
                  >
                    Performing Arts
                  </button>
                  <button
                    onClick={() => setCtePathwayMode(prev =>
                      prev.pathway === 'productionArts' ? { enabled: false, pathway: null } : { enabled: true, pathway: 'productionArts' }
                    )}
                    className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                      ctePathwayMode.pathway === 'productionArts'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-purple-50 border border-gray-300'
                    }`}
                  >
                    Production Arts
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              {/* Early Graduation Mode Toggle */}
              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 min-w-[280px]">
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    id="earlyGradMode"
                    checked={earlyGradMode.enabled}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setEarlyGradMode({ enabled: true, targetYear: '3year' });
                      } else {
                        setEarlyGradMode({ enabled: false, targetYear: null });
                      }
                    }}
                    className="w-5 h-5 text-blue-600"
                  />
                  <label htmlFor="earlyGradMode" className="text-sm font-bold text-gray-900 cursor-pointer">
                    Early Graduation Mode
                  </label>
                </div>

                {earlyGradMode.enabled && (
                  <div className="ml-8 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="earlyGradTarget"
                        checked={earlyGradMode.targetYear === '3year'}
                        onChange={() => setEarlyGradMode({ enabled: true, targetYear: '3year' })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">3 years (end of 11th grade)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="earlyGradTarget"
                        checked={earlyGradMode.targetYear === '3.5year'}
                        onChange={() => setEarlyGradMode({ enabled: true, targetYear: '3.5year' })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">3.5 years (mid 12th grade)</span>
                    </label>
                  </div>
                )}

                {/* Eligibility indicator */}
                {earlyGradEligibility.creditsThrough11 >= 170 && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <div className="text-xs font-bold text-green-700">
                      ✓ Eligible: {earlyGradEligibility.creditsThrough11} credits through Grade 11
                    </div>
                    {!earlyGradEligibility.hasSeniorEnglish && (
                      <div className="text-xs text-orange-600 mt-1">⚠ Need Senior English in Grade 11</div>
                    )}
                    {!earlyGradEligibility.hasCivicsEcon && (
                      <div className="text-xs text-orange-600 mt-1">⚠ Need Civics/Economics in Grade 11</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pathway progress indicator */}
          {ctePathwayMode.enabled && ctePathwayProgress.totalRequired > 0 && (
            <div className="mt-4">
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                <div className="text-sm font-bold text-purple-900 mb-2">
                  {ctePathwayProgress.pathwayName}
                </div>
                <div className="text-xs text-gray-700 mb-1">
                  Courses: {ctePathwayProgress.totalCompleted}/{ctePathwayProgress.totalRequired}
                  {ctePathwayProgress.hasConcentrator && <span className="ml-2">• Concentrator ✓</span>}
                  {ctePathwayProgress.capstoneCount > 0 && <span className="ml-2">• {ctePathwayProgress.capstoneCount} Capstone{ctePathwayProgress.capstoneCount > 1 ? 's' : ''} ✓</span>}
                </div>
                {ctePathwayProgress.isPathwayCompleter ? (
                  <div className="text-xs font-bold text-green-700 mt-2 p-2 bg-green-50 rounded border border-green-200">
                    🎓 {ctePathwayProgress.completionStatus}
                  </div>
                ) : (
                  <div className="text-xs text-orange-600 mt-1">
                    {ctePathwayProgress.completionStatus}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Overall Progress Summary Bar */}
      {courses.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-10 shadow-md">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <GraduationCap size={24} />
                <div>
                  <div className="text-sm font-medium opacity-90">Total Credits</div>
                  <div className="text-2xl font-bold">{totalCredits} / 230</div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-sm font-medium opacity-90">Westview Graduation</div>
                  <div className="flex items-center gap-2 mt-1">
                    {westviewGraduationReady ? (
                      <>
                        <CheckCircle2 size={20} className="text-green-300" />
                        <span className="font-semibold">Ready!</span>
                      </>
                    ) : (
                      <>
                        <Circle size={20} className="text-yellow-300" />
                        <span className="font-semibold">{230 - totalCredits} credits needed</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="h-12 w-px bg-white opacity-30"></div>

                <div className="text-center">
                  <div className="text-sm font-medium opacity-90">UC/CSU A-G</div>
                  <div className="flex items-center gap-2 mt-1">
                    {ucsuEligible ? (
                      <>
                        <CheckCircle2 size={20} className="text-green-300" />
                        <span className="font-semibold">Eligible!</span>
                      </>
                    ) : (
                      <>
                        <Circle size={20} className="text-yellow-300" />
                        <span className="font-semibold">
                          {Object.values(agProgress).filter(p => !p.met).length} requirements left
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="h-12 w-px bg-white opacity-30"></div>

                <div className="text-center">
                  <div className="text-sm font-medium opacity-90">Courses Planned</div>
                  <div className="text-xl font-bold mt-1">{courses.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suggest Courses Button and Suggestions */}
      <div className="max-w-[1800px] mx-auto px-6 pt-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={generateCourseSuggestions}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-colors flex items-center gap-2"
          >
            <GraduationCap size={20} />
            Suggest Courses
          </button>
          {suggestedCourses.length > 0 && (
            <span className="text-sm text-gray-600">
              {suggestedCourses.length} suggestion{suggestedCourses.length !== 1 ? 's' : ''} found
            </span>
          )}
        </div>

        {/* Display Suggestions */}
        {suggestedCourses.length > 0 && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <AlertCircle size={18} />
              Suggested Courses (Click to approve and add)
            </h3>
            <div className="space-y-2">
              {suggestedCourses.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => approveSuggestion(suggestion)}
                  className="w-full bg-white hover:bg-blue-100 border border-blue-300 rounded-lg p-3 text-left transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{suggestion.courseName}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Grade {suggestion.year} • {suggestion.semester} Semester
                      </div>
                      <div className="text-xs text-blue-700 mt-1">{suggestion.reason}</div>
                    </div>
                    <div className="text-blue-600 font-bold text-sm">Click to Add</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-[1800px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Main Content - 4-Year Grid */}
          <div className="lg:col-span-3">

            {/* Compact Warnings Row */}
            {(scheduleValidation.errors.length > 0 || englishWarnings.length > 0 || peWarnings.length > 0 || prereqWarnings.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {/* Schedule Validation Errors */}
                {scheduleValidation.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-400 rounded-lg px-3 py-2 flex items-center gap-2 min-w-fit max-w-[48%]">
                    <AlertCircle className="text-red-600 flex-shrink-0" size={16} />
                    <div className="text-sm text-red-800">
                      <span className="font-semibold">Schedule Issues:</span>{' '}
                      {scheduleValidation.errors.map((err, idx) => (
                        <span key={idx}>
                          {idx > 0 && ', '}Grade {err.year}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* English Warning */}
                {englishWarnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-400 rounded-lg px-3 py-2 flex items-center gap-2 min-w-fit max-w-[48%]">
                    <AlertCircle className="text-yellow-600 flex-shrink-0" size={16} />
                    <div className="text-sm text-yellow-800">
                      <span className="font-semibold">Missing English:</span>{' '}
                      Grade{englishWarnings.length > 1 ? 's' : ''} {englishWarnings.join(', ')}
                    </div>
                  </div>
                )}

                {/* PE Warning */}
                {peWarnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-400 rounded-lg px-3 py-2 flex items-center gap-2 min-w-fit max-w-[48%]">
                    <AlertCircle className="text-yellow-600 flex-shrink-0" size={16} />
                    <div className="text-sm text-yellow-800">
                      <span className="font-semibold">Missing PE:</span>{' '}
                      Grade{peWarnings.length > 1 ? 's' : ''} {peWarnings.join(', ')}
                    </div>
                  </div>
                )}

                {/* Prerequisite Warnings */}
                {prereqWarnings.length > 0 && (
                  <div className="bg-orange-50 border border-orange-400 rounded-lg px-3 py-2 flex items-center gap-2 min-w-fit max-w-[48%]">
                    <AlertCircle className="text-orange-600 flex-shrink-0" size={16} />
                    <div className="text-sm text-orange-800">
                      <span className="font-semibold">Prerequisites:</span>{' '}
                      {prereqWarnings.map((w, idx) => (
                        <span key={idx}>
                          {idx > 0 && ' • '}{w.message}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4-Year Course Grid */}
            <div className="space-y-6">
              {['9', '10', '11', '12'].map((year, yearIndex) => {
                const baseYear = 2025 + yearIndex;
                const fallYear = baseYear;
                const springYear = baseYear + 1;

                return (
                  <div key={year} className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                    <div className="bg-gray-100 px-6 py-4 border-b-2 border-gray-200">
                      <h3 className="text-xl font-bold text-gray-900">Grade {year}</h3>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-gray-200">
                      {['Fall', 'Spring'].map(semester => {
                        const semesterCourses = getCoursesForSemester(year, semester);
                        const slots = Array.from({ length: 6 }, (_, i) => semesterCourses[i] || null);
                        const displayYear = semester === 'Fall' ? fallYear : springYear;

                        // Calculate semester credits
                        const semesterCredits = semesterCourses.reduce((sum, c) => {
                          const info = COURSE_CATALOG[c.courseId];
                          return sum + (info ? info.credits : 0);
                        }, 0);

                        // Check semester capacity
                        // Standard load is 3 courses
                        const isOverloaded = semesterCourses.length >= 5;
                        const isMaxCapacity = semesterCourses.length >= 8;

                        const isCompleted = completedSemesters[`${year}-${semester}`];

                        return (
                          <div key={semester} className="p-5">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-bold text-gray-700 text-base">
                                {semester} {displayYear}
                              </h4>
                              <div className="flex items-center gap-2">
                                {isOverloaded && (
                                  <div className={`text-xs font-semibold px-2 py-1 rounded ${isMaxCapacity ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {isMaxCapacity ? '⚠ Max Load' : '⚠ Heavy Load'}
                                  </div>
                                )}
                                {semesterCourses.length > 0 && (
                                  isCompleted ? (
                                    <button
                                      onClick={() => unmarkSemesterComplete(year, semester)}
                                      className="text-xs font-semibold px-3 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 border border-green-300"
                                    >
                                      ✓ Done
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => markSemesterComplete(year, semester)}
                                      className="text-xs font-semibold px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300"
                                    >
                                      Mark Done
                                    </button>
                                  )
                                )}
                              </div>
                            </div>

                          {/* 6 Course Slots */}
                          <div className="space-y-2">
                            {slots.map((course, slotIndex) => {
                              const isAddingHere = showAddCourse?.year === year && showAddCourse?.semester === semester && showAddCourse?.slot === slotIndex;

                              if (course) {
                                // Filled slot with course
                                const info = COURSE_CATALOG[course.courseId];
                                const isYearLong = info.term_length === 'yearlong';
                                const isDragging = draggedCourse?.course?.id === course.id;
                                const isDropTarget = dragOverSlot?.year === year && dragOverSlot?.semester === semester && dragOverSlot?.slot === slotIndex;

                                return (
                                  <div
                                    key={course.id}
                                    draggable={true}
                                    onDragStart={(e) => handleDragStart(e, course, year, semester)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={(e) => handleDragOver(e, year, semester, slotIndex)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, year, semester, slotIndex)}
                                    className={`bg-gray-50 rounded-lg p-3 transition-all border border-gray-200 cursor-move ${
                                      isDragging ? 'opacity-50 border-blue-400' : 'hover:bg-gray-100'
                                    } ${
                                      isDropTarget ? 'ring-2 ring-blue-400 bg-blue-50' : ''
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          {info.is_ap_or_honors_pair && <Award className="text-purple-600 flex-shrink-0" size={16} />}
                                          <div className="font-medium text-base text-gray-900 truncate">{info.full_name}</div>
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">
                                          {info.uc_csu_category && (
                                            <span className="text-blue-600 font-medium">
                                              {AG_REQUIREMENTS[info.uc_csu_category]?.short || info.uc_csu_category}
                                            </span>
                                          )}
                                          {info.uc_csu_category && ' • '}
                                          {info.credits} cr
                                          {isYearLong && ' • Year-long'}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => removeCourse(course.id)}
                                        className="text-red-600 hover:text-red-700 text-xl font-bold flex-shrink-0"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  </div>
                                );
                              } else if (isAddingHere) {
                                // Empty slot with form open
                                return (
                                  <div key={`slot-${slotIndex}`} className="bg-blue-50 rounded-lg p-3 border-2 border-blue-300">
                                    {error && (
                                      <div className="bg-red-100 border border-red-300 text-red-800 px-3 py-2 rounded text-sm mb-2">
                                        {error}
                                      </div>
                                    )}
                                    {warning && (
                                      <div className="bg-yellow-100 border border-yellow-400 text-yellow-900 px-3 py-2 rounded text-sm mb-2">
                                        {warning}
                                      </div>
                                    )}

                                    {/* Step 1: Select Pathway */}
                                    {!selectedCategory ? (
                                      <>
                                        <p className="text-xs text-gray-600 mb-2 font-medium">Select a subject or search:</p>
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                          <button
                                            onClick={() => setSelectedCategory('Search')}
                                            className="col-span-2 bg-blue-600 text-white border-2 border-blue-600 hover:bg-blue-700 rounded px-3 py-2 text-sm font-medium transition-colors"
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
                                                  setTimeout(() => addCourse(year, semester), 0);
                                                } else {
                                                  setSelectedCategory(pathway);
                                                }
                                              }}
                                              className="bg-white border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 rounded px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors"
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
                                          <p className="text-xs text-gray-600 font-medium">{selectedCategory}</p>
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
                                            const allCourses = Object.values(COURSE_CATALOG);
                                            const searchResults = courseSearchQuery.length >= 2
                                              ? allCourses.filter(course =>
                                                  course.full_name.toLowerCase().includes(query) &&
                                                  course.grades_allowed.includes(parseInt(year))
                                                ).slice(0, 20)
                                              : [];

                                            return (
                                              <div className="space-y-2">
                                                <input
                                                  type="text"
                                                  placeholder="Type course name... (e.g., AP Computer Science)"
                                                  value={courseSearchQuery}
                                                  onChange={(e) => setCourseSearchQuery(e.target.value)}
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
                                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm max-h-48 overflow-y-auto"
                                                    size={Math.min(searchResults.length + 1, 10)}
                                                  >
                                                    <option value="">Select from {searchResults.length} results...</option>
                                                    {searchResults.map(course => (
                                                      <option key={course.id} value={course.id}>
                                                        {course.full_name} ({course.credits} cr{course.term_length === 'yearlong' ? ', Year-long' : ''})
                                                      </option>
                                                    ))}
                                                  </select>
                                                )}
                                                <div className="flex gap-2">
                                                  <button
                                                    onClick={() => addCourse(year, semester)}
                                                    disabled={!newCourse.courseId}
                                                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm font-medium disabled:bg-gray-300"
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
                                                    className="bg-gray-200 text-gray-700 px-3 py-2 rounded hover:bg-gray-300 text-sm font-medium"
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
                                                    <p className="text-xs text-gray-600 mb-2 font-medium">Previously entered courses:</p>
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
                                                <p className="text-xs text-gray-600 font-medium">Enter college course details:</p>
                                                <input
                                                  type="text"
                                                  placeholder="Course name (e.g., BIO 101)"
                                                  value={newConcurrentCourse.name}
                                                  onChange={(e) => setNewConcurrentCourse({ ...newConcurrentCourse, name: e.target.value })}
                                                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                                  autoFocus
                                                />
                                                <div>
                                                  <label className="block text-xs text-gray-600 mb-1">College Semester Units</label>
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
                                                        setTimeout(() => addCourse(year, semester), 0);
                                                      }
                                                    }}
                                                    disabled={!newConcurrentCourse.name || newConcurrentCourse.collegeUnits <= 0}
                                                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm font-medium disabled:bg-gray-300"
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
                                                    {courses.map(course => (
                                                      <option key={course.id} value={course.id}>
                                                        {course.full_name}{year === 9 && isRecommended9thGrade(course.full_name) ? ' ⭐ Recommended' : ''}
                                                      </option>
                                                    ))}
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
                                                    {courses.map(course => (
                                                      <option key={course.id} value={course.id}>
                                                        {course.full_name}{year === 9 && isRecommended9thGrade(course.full_name) ? ' ⭐ Recommended' : ''}
                                                      </option>
                                                    ))}
                                                  </optgroup>
                                                ));
                                            })()
                                          ) : (
                                            // Regular list for other pathways
                                            coursesInPathway.map(course => (
                                              <option key={course.id} value={course.id}>
                                                {course.full_name}{year === 9 && isRecommended9thGrade(course.full_name) ? ' ⭐ Recommended' : ''}
                                              </option>
                                            ))
                                          )}
                                        </select>
                                          <div className="flex gap-2">
                                            <button
                                              onClick={() => addCourse(year, semester)}
                                              disabled={!newCourse.courseId}
                                              className="flex-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm font-medium disabled:bg-gray-300"
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
                                              className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded hover:bg-gray-300 text-sm font-medium"
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
                                const isDropTarget = dragOverSlot?.year === year && dragOverSlot?.semester === semester && dragOverSlot?.slot === slotIndex;

                                return (
                                  <div
                                    key={`slot-${slotIndex}`}
                                    onClick={() => {
                                      setShowAddCourse({ year, semester, slot: slotIndex });
                                      setSelectedCategory('');
                                      setNewCourse({ courseId: '' });
                                      setError(null);
                                      setWarning(null);
                                    }}
                                    onDragOver={(e) => handleDragOver(e, year, semester, slotIndex)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, year, semester, slotIndex)}
                                    className={`w-full bg-white rounded-lg p-3 border-2 border-dashed transition-all text-sm font-medium flex items-center justify-center min-h-[56px] cursor-pointer ${
                                      isDropTarget
                                        ? 'border-blue-400 bg-blue-50 text-blue-600 ring-2 ring-blue-400'
                                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-400 hover:text-blue-600'
                                    }`}
                                  >
                                    <Plus size={18} className="mr-1" />
                                    Add Course
                                  </div>
                                );
                              }
                            })}
                          </div>

                          {/* Semester Credit Total */}
                          {semesterCourses.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-300">
                              <div className="text-sm font-semibold text-gray-700">
                                Semester Total: {semesterCredits} credits
                              </div>
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>

                    {/* Semester Validation Modal - appears only for this year */}
                    {semesterValidation && semesterValidation.year === year && (
                      <div className="mx-6 mb-4 mt-4 bg-white border-2 border-gray-300 rounded-lg p-4 shadow-lg">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-bold text-lg text-gray-900">
                            {semesterValidation.semester} Semester - Grade {semesterValidation.year} Validation
                          </h3>
                          <button
                            onClick={() => setSemesterValidation(null)}
                            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                          >
                            ×
                          </button>
                        </div>

                        {/* Issues (blocking) */}
                        {semesterValidation.issues.length > 0 && (
                          <div className="mb-3 bg-red-50 border border-red-300 rounded-lg p-3">
                            <div className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                              <AlertCircle size={18} className="text-red-600" />
                              Issues Found
                            </div>
                            <ul className="list-disc list-inside space-y-1">
                              {semesterValidation.issues.map((issue, idx) => (
                                <li key={idx} className="text-sm text-red-800">{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Warnings */}
                        {semesterValidation.warnings.length > 0 && (
                          <div className="mb-3 bg-yellow-50 border border-yellow-300 rounded-lg p-3">
                            <div className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                              <AlertCircle size={18} className="text-yellow-600" />
                              Warnings
                            </div>
                            <ul className="list-disc list-inside space-y-1">
                              {semesterValidation.warnings.map((warning, idx) => (
                                <li key={idx} className="text-sm text-yellow-800">{warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Info */}
                        {semesterValidation.info.length > 0 && (
                          <div className="mb-3 bg-blue-50 border border-blue-300 rounded-lg p-3">
                            <div className="font-semibold text-blue-800 mb-2">Summary</div>
                            <ul className="list-disc list-inside space-y-1">
                              {semesterValidation.info.map((info, idx) => (
                                <li key={idx} className="text-sm text-blue-800">{info}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Overall Status */}
                        {semesterValidation.valid ? (
                          <div className="bg-green-50 border border-green-300 rounded-lg p-3 text-center">
                            <div className="text-green-800 font-bold text-lg">✓ Semester Looks Good!</div>
                            <div className="text-sm text-green-700 mt-1">No blocking issues found. You can proceed to the next semester.</div>
                          </div>
                        ) : (
                          <div className="bg-red-50 border border-red-300 rounded-lg p-3 text-center">
                            <div className="text-red-800 font-bold text-lg">⚠ Issues Need Attention</div>
                            <div className="text-sm text-red-700 mt-1">Please resolve the issues above before marking this semester as complete.</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Year Total */}
                    {(() => {
                      const fallCourses = getCoursesForSemester(year, 'Fall');
                      const springCourses = getCoursesForSemester(year, 'Spring');
                      const yearCredits = [...fallCourses, ...springCourses].reduce((sum, c) => {
                        const info = COURSE_CATALOG[c.courseId];
                        return sum + (info ? info.credits : 0);
                      }, 0);

                      if (fallCourses.length > 0 || springCourses.length > 0) {
                        return (
                          <div className="bg-gray-50 px-6 py-3 border-t-2 border-gray-200">
                            <div className="text-base font-bold text-gray-900">
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
          <div className="space-y-6">
            {/* Westview Graduation Requirements */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Westview Graduation</h3>
              <p className="text-sm text-gray-600 mb-4">230 credits required</p>
              <div className="space-y-4">
                {Object.entries(WESTVIEW_REQUIREMENTS).map(([name, req]) => {
                  const prog = westviewProgress[name];
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
                            <AlertCircle className="text-orange-500" size={18} />
                          ) : (
                            <Circle className="text-gray-300" size={18} />
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            prog.met ? 'bg-green-500' : prog.earned > 0 ? 'bg-orange-500' : 'bg-gray-300'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* UC/CSU Requirements */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">UC/CSU Eligibility</h3>
              <p className="text-sm text-gray-600 mb-4">A-G Requirements</p>
              <div className="space-y-4">
                {Object.entries(AG_REQUIREMENTS).map(([cat, req]) => {
                  const prog = agProgress[cat];
                  const pct = Math.min((prog.earned / prog.needed) * 100, 100);
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{req.short}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">
                            {prog.earned}/{prog.needed} {prog.needed === 1 ? 'year' : 'years'}
                          </span>
                          {prog.met ? (
                            <CheckCircle2 className="text-green-600" size={18} />
                          ) : prog.earned > 0 ? (
                            <AlertCircle className="text-orange-500" size={18} />
                          ) : (
                            <Circle className="text-gray-300" size={18} />
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            prog.met ? 'bg-green-500' : prog.earned > 0 ? 'bg-orange-500' : 'bg-gray-300'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-600 text-center mt-4 pt-4 border-t border-gray-200">
                Grade of C or better required
              </p>
            </div>
          </div>

        </div>

        {/* Suggested Courses By Grade Level */}
        <div className="max-w-[1800px] mx-auto px-6 py-8">
          <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
            <div className="bg-gray-100 px-6 py-4 border-b-2 border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Suggested Courses By Grade Level</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 border-r border-gray-200 w-1/4">9th</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 border-r border-gray-200 w-1/4">10th</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 border-r border-gray-200 w-1/4">11th</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 w-1/4">12th</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-200">
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-200 align-top">English 1-2 or Honors English 1-2</td>
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-200 align-top">English 3-4 or Honors Humanities 1-2</td>
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-200 align-top">American Literature; Honors American Literature; or AP English Language</td>
                    <td className="px-4 py-3 text-sm text-gray-800 align-top">Ethnic Literature; Expository Reading & Writing; World Literature; AP English Literature/British Literature; or AP English Language</td>
                  </tr>
                  <tr className="border-t border-gray-200 bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-200 align-top">Math*</td>
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-200 align-top">Math</td>
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-200 align-top">Math</td>
                    <td className="px-4 py-3 text-sm text-gray-800 align-top">Math</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-200 align-top">Science (Biology)</td>
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-200 align-top">Science (Chemistry)</td>
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-200 align-top">Science (Physics)</td>
                    <td className="px-4 py-3 text-sm text-gray-800 align-top">Science or Elective</td>
                  </tr>
                  <tr className="border-t border-gray-200 bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-200 align-top">ENS 1-2</td>
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-200 align-top">World History 1-2 or AP World History 1-2/Honors World History 1-2</td>
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-200 align-top">United States History 1-2 or AP US History 1-2</td>
                    <td className="px-4 py-3 text-sm text-gray-800 align-top">Civics/Economics or AP US Government & Politics/Civics/Economics</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-200 align-top">ENS 3-4; JROTC; Marching</td>
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-200 align-top">PE</td>
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-200 align-top">Foreign Language 1-2**</td>
                    <td className="px-4 py-3 text-sm text-gray-800 align-top">Foreign Language 5-6</td>
                  </tr>
                  <tr className="border-t border-gray-200 bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-200 align-top">Fine Art</td>
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-200 align-top">Foreign Language 3-4**</td>
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-200 align-top">Elective</td>
                    <td className="px-4 py-3 text-sm text-gray-800 align-top">Elective</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-200 align-top">Elective or Off Roll^</td>
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-200 align-top">Elective or Off Roll^</td>
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-200 align-top">Elective or Off Roll^</td>
                    <td className="px-4 py-3 text-sm text-gray-800 align-top">Elective or Off Roll^</td>
                  </tr>
                  <tr className="border-t border-gray-200 bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-200 align-top">Elective or Off Roll^</td>
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-200 align-top">Elective or Off Roll^</td>
                    <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-200 align-top">Elective or Off Roll^</td>
                    <td className="px-4 py-3 text-sm text-gray-800 align-top">Elective or Off Roll^</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
