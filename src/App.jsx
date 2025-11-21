import React, { useState, useMemo, useRef } from 'react';
import { Plus, CheckCircle2, AlertCircle, Circle, GraduationCap, Award, Briefcase, Beaker, Palette, Wrench, Laptop, Music, Video } from 'lucide-react';
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

// Load course catalog from JSON
const COURSE_CATALOG = courseCatalogData.courses.reduce((acc, course) => {
  acc[course.course_id] = course;
  return acc;
}, {});

// Create normalized catalog (fixes pathway inconsistencies)
const NORMALIZED_CATALOG = getNormalizedCatalog(COURSE_CATALOG);

// Initialize scheduling engine
const schedulingEngine = new SchedulingEngine(courseCatalogData.courses);

// Courses no longer offered (do not delete from catalog, just prevent selection/suggestion)
const DEPRECATED_COURSES = [
  'MOBILE_APP_0002',      // Mobile App Development 1-2
  'WRITING_SEMINAR_0003', // Writing Seminar 1-2
  'SPANISH_910_0004'      // Spanish 9-10
];

const WESTVIEW_REQUIREMENTS = {
  'English': { needed: 40, pathways: ['English'] },
  'Math': { needed: 30, pathways: ['Math'] },
  'Biological Science': { needed: 10, pathways: ['Science - Biological'] },
  'Physical Science': { needed: 10, pathways: ['Science - Physical'] },
  'History/Social Science': { needed: 30, pathways: ['History/Social Science'] },
  'Fine Arts/Foreign Language/CTE': { needed: 10, pathways: ['Fine Arts', 'Foreign Language', 'CTE'] },
  'Health Science': { needed: 5, pathways: ['Physical Education'], specialCourses: ['ENS 1-2'] },
  'Physical Education': { needed: 20, pathways: ['Physical Education'] },
  'Electives': { needed: 85, pathways: ['Electives', 'Clubs/Athletics'] }
};

const AG_REQUIREMENTS = {
  'A': { name: 'History/Social Science', needed: 2, short: 'History', recommended: 2 },
  'B': { name: 'English', needed: 4, short: 'English', recommended: 4 },
  'C': { name: 'Mathematics (including Geometry)', needed: 3, short: 'Math (including Geometry)', recommended: 4 },
  'D': { name: 'Laboratory Science', needed: 2, short: 'Science', recommended: 3 },
  'E': { name: 'Language Other Than English', needed: 2, short: 'Foreign Language', recommended: 3 },
  'F': { name: 'Visual & Performing Arts', needed: 1, short: 'Arts', recommended: 1 },
  'G': { name: 'College Prep Elective', needed: 1, short: 'College Prep Elective', recommended: 1 }
};

const GRADE_OPTIONS = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];

// Pathway Color Mapping (for left border stripe on course cards) - Pastel Rainbow Theme
const PATHWAY_COLORS = {
  'English': 'border-l-[#E53E3E]',           // Classic Red
  'Math': 'border-l-[#3182CE]',              // Strong Blue
  'Physical Education': 'border-l-[#ED8936]', // Orange
  'History/Social Science': 'border-l-[#805AD5]', // Purple
  'Science - Biological': 'border-l-[#D69E2E]',   // Gold/Yellow
  'Science - Physical': 'border-l-[#D69E2E]',     // Gold/Yellow
  'Foreign Language': 'border-l-[#38A169]',  // Kelly Green
  'Fine Arts': 'border-l-[#38A169]',         // Kelly Green
  'CTE': 'border-l-[#38A169]',               // Kelly Green
  'Electives': 'border-l-[#D53F8C]',         // Pink/Magenta
  'Off-Roll': 'border-l-[#D53F8C]',          // Pink/Magenta
  'Clubs/Athletics': 'border-l-[#D53F8C]',   // Pink/Magenta (same as Electives)
  'Health': 'border-l-[#00B5D8]'             // Cyan/Teal
};

// CTE Pathway Icon Mapping (for course cards)
const CTE_PATHWAY_ICONS = {
  'business': { icon: Briefcase, color: 'text-blue-600' },
  'biotech': { icon: Beaker, color: 'text-purple-600' },
  'design': { icon: Palette, color: 'text-pink-600' },
  'engineering': { icon: Wrench, color: 'text-orange-600' },
  'ict': { icon: Laptop, color: 'text-green-600' },
  'performingArts': { icon: Music, color: 'text-red-600' },
  'productionArts': { icon: Video, color: 'text-indigo-600' }
};

// Test Subjects by Type
const TEST_SUBJECTS = {
  'AP': [
    'AP Biology', 'AP Calculus AB', 'AP Calculus BC', 'AP Chemistry', 'AP Physics 1',
    'AP Physics 2', 'AP Physics C: Mechanics', 'AP Physics C: Electricity and Magnetism',
    'AP English Language and Composition', 'AP English Literature and Composition',
    'AP United States History', 'AP World History', 'AP European History',
    'AP United States Government & Politics', 'AP Comparative Government & Politics',
    'AP Human Geography', 'AP Psychology', 'AP Economics (Macro)', 'AP Economics (Micro)',
    'AP Statistics', 'AP Computer Science A', 'AP Computer Science Principles',
    'AP Environmental Science', 'AP Spanish Language', 'AP Spanish Literature',
    'AP French Language', 'AP German Language', 'AP Chinese Language', 'AP Japanese Language',
    'AP Latin', 'AP Art History', 'AP Music Theory', 'AP Studio Art'
  ],
  'IB': [
    'IB Biology HL', 'IB Chemistry HL', 'IB Physics HL', 'IB Mathematics HL',
    'IB English A: Literature HL', 'IB English A: Language and Literature HL',
    'IB History HL', 'IB Geography HL', 'IB Economics HL', 'IB Psychology HL',
    'IB Spanish HL', 'IB French HL', 'IB German HL', 'IB Chinese HL',
    'IB Theatre HL', 'IB Visual Arts HL', 'IB Music HL'
  ],
  'CLEP': [
    'CLEP Biology', 'CLEP Chemistry', 'CLEP Calculus', 'CLEP College Algebra',
    'CLEP Precalculus', 'CLEP College Mathematics', 'CLEP American Literature',
    'CLEP English Literature', 'CLEP College Composition', 'CLEP Humanities',
    'CLEP United States History I', 'CLEP United States History II', 'CLEP Western Civilization I',
    'CLEP Western Civilization II', 'CLEP American Government', 'CLEP Psychology',
    'CLEP Sociology', 'CLEP Economics (Macro)', 'CLEP Economics (Micro)',
    'CLEP Spanish Language (Level 1)', 'CLEP Spanish Language (Level 2)',
    'CLEP French Language (Level 1)', 'CLEP French Language (Level 2)',
    'CLEP German Language (Level 1)', 'CLEP German Language (Level 2)'
  ],
  'A-Level': [
    'A-Level Biology', 'A-Level Chemistry', 'A-Level Physics', 'A-Level Mathematics',
    'A-Level Further Mathematics', 'A-Level English Literature', 'A-Level History',
    'A-Level Geography', 'A-Level Economics', 'A-Level Psychology', 'A-Level Sociology',
    'A-Level French', 'A-Level Spanish', 'A-Level German', 'A-Level Chinese',
    'A-Level Computer Science', 'A-Level Art and Design', 'A-Level Music'
  ]
};

// CTE Pathway Requirements
const CTE_PATHWAYS = {
  business: {
    name: 'Business & Finance',
    courses: [
      { name: 'BUSINESS PRINCIPLES', level: 'Capstone', grades: [9, 10] },
      { name: 'INTRO TO FINANCE', level: 'Concentrator', grades: [9, 10] },
      { name: 'MARKETING ECONOMICS', level: 'Capstone', grades: [10, 11] },
      { name: 'ECONOMICS OF BUSINESS OWNERSHIP', level: 'Capstone', grades: [10, 11] },
      { name: 'INTERNSHIP', level: 'Capstone', grades: [12] }
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
  const [hideAPClasses, setHideAPClasses] = useState(() => {
    const saved = localStorage.getItem('westview-hide-ap-classes');
    return saved ? JSON.parse(saved) : false;
  });
  const [hideSpecialEdClasses, setHideSpecialEdClasses] = useState(() => {
    const saved = localStorage.getItem('westview-hide-special-ed-classes');
    return saved ? JSON.parse(saved) : false;
  });
  const [westviewGradOnly, setWestviewGradOnly] = useState(() => {
    const saved = localStorage.getItem('westview-grad-only');
    return saved ? JSON.parse(saved) : false;
  });
  const [gpaMode, setGpaMode] = useState(() => {
    const saved = localStorage.getItem('westview-gpa-mode');
    return saved ? JSON.parse(saved) : false;
  });
  const [showTestScores, setShowTestScores] = useState(false);
  const [allowRepeatCourses, setAllowRepeatCourses] = useState(false);
  const [testScores, setTestScores] = useState(() => {
    const saved = localStorage.getItem('westview-test-scores');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedTestType, setSelectedTestType] = useState('');

  // Drag and drop state
  const [draggedCourse, setDraggedCourse] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);

  // Ref for scrolling to test scores section
  const testScoresRef = useRef(null);

  // Semester completion tracking
  const [completedSemesters, setCompletedSemesters] = useState(() => {
    const saved = localStorage.getItem('westview-completed-semesters');
    return saved ? JSON.parse(saved) : {};
  });
  const [semesterValidation, setSemesterValidation] = useState(null);

  // Course suggestions
  const [suggestedCourses, setSuggestedCourses] = useState([]);

  // Initialize suggestion engine (ONE-TIME setup with normalized catalog)
  const [suggestionEngine] = useState(() => {
    return new SuggestionEngine(NORMALIZED_CATALOG, DEPRECATED_COURSES);
  });

  // Track if student met Foreign Language requirement in grades 7/8
  const [metForeignLanguageIn78, setMetForeignLanguageIn78] = useState(() => {
    const saved = localStorage.getItem('westview-met-fl-in-78');
    return saved ? JSON.parse(saved) : false;
  });

  // Preferred foreign language for auto-suggestions
  const [preferredLanguage, setPreferredLanguage] = useState(() => {
    const saved = localStorage.getItem('westview-preferred-language');
    return saved ? JSON.parse(saved) : null; // null means not set yet
  });

  // Locked semesters - prevent auto-suggest from replacing courses
  const [lockedSemesters, setLockedSemesters] = useState(() => {
    const saved = localStorage.getItem('westview-locked-semesters');
    return saved ? JSON.parse(saved) : {};
  });

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

  // Save Westview Grad Only mode to localStorage
  React.useEffect(() => {
    localStorage.setItem('westview-grad-only', JSON.stringify(westviewGradOnly));
  }, [westviewGradOnly]);

  // Save hide AP classes preference to localStorage
  React.useEffect(() => {
    localStorage.setItem('westview-hide-ap-classes', JSON.stringify(hideAPClasses));
  }, [hideAPClasses]);

  // Save hide Special Ed classes preference to localStorage
  React.useEffect(() => {
    localStorage.setItem('westview-hide-special-ed-classes', JSON.stringify(hideSpecialEdClasses));
  }, [hideSpecialEdClasses]);

  // Save GPA mode preference to localStorage
  React.useEffect(() => {
    localStorage.setItem('westview-gpa-mode', JSON.stringify(gpaMode));
  }, [gpaMode]);

  // Save test scores to localStorage
  React.useEffect(() => {
    localStorage.setItem('westview-test-scores', JSON.stringify(testScores));
  }, [testScores]);

  // Save Foreign Language met in 7/8 grade flag to localStorage
  React.useEffect(() => {
    localStorage.setItem('westview-met-fl-in-78', JSON.stringify(metForeignLanguageIn78));
  }, [metForeignLanguageIn78]);

  // Save locked semesters to localStorage
  React.useEffect(() => {
    localStorage.setItem('westview-locked-semesters', JSON.stringify(lockedSemesters));
  }, [lockedSemesters]);

  // Save preferred language to localStorage
  React.useEffect(() => {
    if (preferredLanguage !== null) {
      localStorage.setItem('westview-preferred-language', JSON.stringify(preferredLanguage));
    }
  }, [preferredLanguage]);

  // Calculate Westview graduation progress
  const westviewProgress = useMemo(() => {
    const progress = {};
    Object.entries(WESTVIEW_REQUIREMENTS).forEach(([name, req]) => {
      const relevantCourses = courses.filter(c => {
        const info = COURSE_CATALOG[c.courseId];
        return info && req.pathways.includes(info.pathway);
      });

      // Deduplicate courses by courseId + year to avoid counting semester/yearlong courses multiple times
      const uniqueCourses = [];
      const seen = new Set();
      relevantCourses.forEach(c => {
        const key = `${c.courseId}-${c.year}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueCourses.push(c);
        }
      });

      let credits = 0;

      // Special handling for dual-credit courses
      if (name === 'Health Science') {
        // Health Science only counts ENS 1-2 (5 credits)
        credits = uniqueCourses.reduce((sum, c) => {
          const info = COURSE_CATALOG[c.courseId];
          if (req.specialCourses && req.specialCourses.includes(info.full_name)) {
            return sum + 5; // ENS 1-2 contributes 5 credits to Health Science
          }
          return sum;
        }, 0);
      } else if (name === 'Physical Education') {
        // PE counts all PE courses, but some courses only contribute partial credits
        credits = uniqueCourses.reduce((sum, c) => {
          const info = COURSE_CATALOG[c.courseId];
          if (info.full_name === 'ENS 1-2') {
            return sum + 5; // ENS 1-2 contributes only 5 credits to PE (other 5 go to Health)
          } else if (info.full_name === 'MARCHING PE FLAGS/TALL FLAGS (DANCE PROP)') {
            return sum + 5; // MARCHING PE FLAGS contributes only 5 credits to PE (other 5 go to Fine Arts)
          }
          return sum + info.credits;
        }, 0);

        // Add 10 PE credits from Naval Science courses (if any exist in Electives pathway)
        // Deduplicate by courseId + year to avoid counting same course multiple times
        const navalScienceCourses = courses.filter(c => {
          const info = COURSE_CATALOG[c.courseId];
          return info && info.full_name && info.full_name.toUpperCase().includes('NAVAL SCIENCE');
        });

        const uniqueNaval = [];
        const seenNaval = new Set();
        navalScienceCourses.forEach(c => {
          const key = `${c.courseId}-${c.year}`;
          if (!seenNaval.has(key)) {
            seenNaval.add(key);
            uniqueNaval.push(c);
          }
        });

        uniqueNaval.forEach(c => {
          const info = COURSE_CATALOG[c.courseId];
          // Naval Science yearlong courses provide 10 PE credits
          if (info.term_length === 'yearlong') {
            credits += 10;
          }
        });
      } else if (name === 'Fine Arts/Foreign Language/CTE') {
        // Fine Arts counts all Fine Arts/Foreign Language/CTE courses
        // PLUS 5 credits from MARCHING PE FLAGS (which is in PE pathway)
        // Use uniqueCourses which is already deduplicated
        credits = uniqueCourses.reduce((sum, c) => sum + COURSE_CATALOG[c.courseId].credits, 0);

        // Also check for MARCHING PE FLAGS in PE pathway courses
        const peCourses = courses.filter(c => {
          const info = COURSE_CATALOG[c.courseId];
          return info && info.pathway === 'Physical Education';
        });

        // Add 5 credits from MARCHING PE FLAGS if present
        const hasMarchingPE = peCourses.some(c => {
          const info = COURSE_CATALOG[c.courseId];
          return info && info.full_name === 'MARCHING PE FLAGS/TALL FLAGS (DANCE PROP)';
        });

        if (hasMarchingPE) {
          credits += 5; // Add the Fine Arts portion of MARCHING PE FLAGS
        }
      } else if (name === 'Electives') {
        // ELECTIVES = Direct elective courses + excess credits from other subjects
        // 1. Direct elective pathway courses (full credits)
        credits = uniqueCourses.reduce((sum, c) => sum + COURSE_CATALOG[c.courseId].credits, 0);

        // 2. Add excess credits from other subject areas (beyond minimum requirements)
        // We need to calculate other categories first, then add their excess here
        // This will be done in a second pass after the loop - mark for later
        // Store placeholder for now, will be updated after first pass

        // 3. Add 10 Elective credits from Naval Science courses (which are in Science pathway, not Electives)
        // Deduplicate by courseId + year
        const navalScienceCourses = courses.filter(c => {
          const info = COURSE_CATALOG[c.courseId];
          return info && info.full_name && info.full_name.toUpperCase().includes('NAVAL SCIENCE');
        });

        const uniqueNavalElec = [];
        const seenNavalElec = new Set();
        navalScienceCourses.forEach(c => {
          const key = `${c.courseId}-${c.year}`;
          if (!seenNavalElec.has(key)) {
            seenNavalElec.add(key);
            uniqueNavalElec.push(c);
          }
        });

        uniqueNavalElec.forEach(c => {
          const info = COURSE_CATALOG[c.courseId];
          // Naval Science yearlong courses provide 10 Elective credits
          // (in addition to counting toward Science requirement)
          if (info.term_length === 'yearlong') {
            credits += 10;
          }
        });
      } else {
        // All other requirements count full credits
        credits = uniqueCourses.reduce((sum, c) => sum + COURSE_CATALOG[c.courseId].credits, 0);
      }

      progress[name] = {
        earned: credits,
        needed: req.needed,
        met: credits >= req.needed
      };
    });

    // SECOND PASS: Add excess credits from other categories to Electives
    // Electives receive any credits beyond the minimum requirement for each subject
    if (progress['Electives']) {
      let excessCredits = 0;
      Object.entries(progress).forEach(([name, data]) => {
        if (name !== 'Electives') {
          const excess = data.earned - data.needed;
          if (excess > 0) {
            excessCredits += excess;
          }
        }
      });
      progress['Electives'].earned += excessCredits;
      progress['Electives'].met = progress['Electives'].earned >= progress['Electives'].needed;
    }

    return progress;
  }, [courses]);

  // Calculate total credits toward graduation with 80 credit/year cap
  // Maximum 80 credits count per year, regardless of how many courses are taken
  const totalCredits = useMemo(() => {
    // Deduplicate courses by courseId + year
    const uniqueCourses = [];
    const seen = new Set();
    courses.forEach(c => {
      const key = `${c.courseId}-${c.year}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueCourses.push(c);
      }
    });

    // Calculate credits per year, capped at 80 each
    const yearsCredits = {};
    ['9', '10', '11', '12'].forEach(year => {
      const yearCourses = uniqueCourses.filter(c => c.year === year);
      const rawCredits = yearCourses.reduce((sum, c) => {
        const info = COURSE_CATALOG[c.courseId];
        return sum + (info ? info.credits : 0);
      }, 0);
      yearsCredits[year] = Math.min(rawCredits, 80); // Cap at 80 per year
    });

    return Object.values(yearsCredits).reduce((sum, credits) => sum + credits, 0);
  }, [courses]);

  const westviewGraduationReady = totalCredits >= 230 && Object.values(westviewProgress).every(p => p.met);

  // Calculate early graduation eligibility and requirements
  const earlyGradEligibility = useMemo(() => {
    // Deduplicate courses by courseId + year
    const uniqueCoursesForEarlyGrad = [];
    const seen = new Set();
    courses.forEach(c => {
      const key = `${c.courseId}-${c.year}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueCoursesForEarlyGrad.push(c);
      }
    });

    const grade11Courses = uniqueCoursesForEarlyGrad.filter(c => c.year === '11');
    const grade11Credits = grade11Courses.reduce((sum, c) => {
      const info = COURSE_CATALOG[c.courseId];
      return sum + (info ? info.credits : 0);
    }, 0);

    const creditsThrough11 = uniqueCoursesForEarlyGrad
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
  const getCoursesForQuarter = (year, quarter) => {
    return courses.filter(c => c.year === year && c.quarter === quarter);
  };

  // Calculate UC/CSU progress
  const agProgress = useMemo(() => {
    const progress = {};

    // First, calculate A-F categories
    ['A', 'B', 'C', 'D', 'E', 'F'].forEach(cat => {
      const relevantCourses = courses.filter(c => {
        const info = COURSE_CATALOG[c.courseId];
        return info && info.uc_csu_category === cat;
      });

      // Deduplicate courses by courseId + year to avoid counting semester/yearlong courses multiple times
      // A semester course at Westview (2 quarters) = 1 year at UC/CSU
      const uniqueCourses = [];
      const seen = new Set();
      relevantCourses.forEach(c => {
        const key = `${c.courseId}-${c.year}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueCourses.push(c);
        }
      });

      // Count unique courses (each course = 1 year at UC/CSU)
      let years = uniqueCourses.length;

      // Special handling for Math (Category C):
      // UC/CSU counts: Math I=1yr, Math II=2yr, Math III=3yr, Honors Pre-Calc=4yr, AP Calc AB/BC=5yr
      if (cat === 'C') {
        let highestMathYear = 0;

        uniqueCourses.forEach(c => {
          const info = COURSE_CATALOG[c.courseId];
          if (!info || info.pathway !== 'Math') return;

          const nameUpper = info.full_name.toUpperCase();
          let impliedYears = 1; // Default: 1 year

          // AP Calculus AB or BC = 5 years (implies Math I/II/III + Honors Pre-Calc + AP Calc)
          if (nameUpper.includes('AP') && nameUpper.includes('CALCULUS')) {
            impliedYears = 5;
          }
          // Honors Pre-Calculus = 4 years
          else if (nameUpper.includes('PRECALCULUS') || nameUpper.includes('PRE-CALCULUS')) {
            impliedYears = 4;
          }
          // Integrated Math III = 3 years
          else if (nameUpper.includes('MATHEMATICS III') || nameUpper.includes('MATH III')) {
            impliedYears = 3;
          }
          // Integrated Math II = 2 years
          else if (nameUpper.includes('MATHEMATICS II') || nameUpper.includes('MATH II')) {
            impliedYears = 2;
          }
          // Integrated Math I = 1 year
          else if (nameUpper.includes('MATHEMATICS I') || nameUpper.includes('MATH I')) {
            impliedYears = 1;
          }
          // Statistics = 4 years (typically taken after Math III)
          else if (nameUpper.includes('STATISTICS')) {
            impliedYears = 4;
          }

          if (impliedYears > highestMathYear) {
            highestMathYear = impliedYears;
          }
        });

        years = highestMathYear > 0 ? highestMathYear : uniqueCourses.length;
      }

      // Special handling for Foreign Language (Category E):
      // UC/CSU counts by highest level: 1-2=1yr, 3-4=2yr, 5-6=3yr, 7-8=4yr, Honors 7-8=5yr, AP=6yr
      if (cat === 'E') {
        let highestLevelYears = 0;

        uniqueCourses.forEach(c => {
          const info = COURSE_CATALOG[c.courseId];
          if (!info || info.pathway !== 'Foreign Language') return;

          const nameUpper = info.full_name.toUpperCase();
          let impliedYears = 0;

          // AP Language courses = 6 years (highest level)
          if (nameUpper.includes('AP ')) {
            impliedYears = 6;
          }
          // Honors 7-8 or 9-10 = 5 years (comes after non-honors 7-8)
          else if (nameUpper.includes('HONORS') && (nameUpper.includes('7-8') || nameUpper.includes('9-10'))) {
            impliedYears = 5;
          }
          // Regular numbered courses
          else {
            const levelMatch = nameUpper.match(/(\d+)-(\d+)/);
            if (levelMatch) {
              const levelNum = parseInt(levelMatch[1]);
              // Level 1-2 = 1 year, 3-4 = 2 years, 5-6 = 3 years, 7-8 = 4 years
              impliedYears = Math.ceil(levelNum / 2);
            }
          }

          if (impliedYears > highestLevelYears) {
            highestLevelYears = impliedYears;
          }
        });

        years = highestLevelYears;

        // Add 2 years if met in grades 7/8
        if (metForeignLanguageIn78) {
          years += 2;
        }
      }

      progress[cat] = {
        earned: years,
        needed: AG_REQUIREMENTS[cat].needed,
        recommended: AG_REQUIREMENTS[cat].recommended,
        met: years >= AG_REQUIREMENTS[cat].needed,
        meetsRecommended: years >= AG_REQUIREMENTS[cat].recommended
      };
    });

    // Calculate G: courses marked as 'G' + extra courses from A-F beyond minimums
    const gCourses = courses.filter(c => {
      const info = COURSE_CATALOG[c.courseId];
      return info && info.uc_csu_category === 'G';
    });

    // Deduplicate G courses
    const uniqueGCourses = [];
    const seenG = new Set();
    gCourses.forEach(c => {
      const key = `${c.courseId}-${c.year}`;
      if (!seenG.has(key)) {
        seenG.add(key);
        uniqueGCourses.push(c);
      }
    });

    // Count extra courses from A-F that exceed requirements
    let extraAFCourses = 0;
    ['A', 'B', 'C', 'D', 'E', 'F'].forEach(cat => {
      const extra = progress[cat].earned - progress[cat].needed;
      if (extra > 0) {
        extraAFCourses += extra;
      }
    });

    const gYears = uniqueGCourses.length + extraAFCourses;
    progress['G'] = {
      earned: gYears,
      needed: AG_REQUIREMENTS['G'].needed,
      recommended: AG_REQUIREMENTS['G'].recommended,
      met: gYears >= AG_REQUIREMENTS['G'].needed,
      meetsRecommended: gYears >= AG_REQUIREMENTS['G'].recommended
    };

    return progress;
  }, [courses, metForeignLanguageIn78]);

  const ucsuEligible = Object.values(agProgress).every(p => p.met);

  // Calculate UC GPA (grades 10-11, A-G courses only)
  const ucGPA = useMemo(() => {
    if (!gpaMode) return null;

    // Filter for A-G courses from grades 10-11 with grades
    const agCourses = courses.filter(c => {
      const info = COURSE_CATALOG[c.courseId];
      return info &&
             info.uc_csu_category &&
             (c.year === '10' || c.year === '11') &&
             c.grade &&
             c.grade !== '';
    });

    if (agCourses.length === 0) return null;

    // Helper to convert letter grade to base points (no +/-)
    const getBasePoints = (grade) => {
      const letter = grade.replace('+', '').replace('-', '');
      const points = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'F': 0 };
      return points[letter] || 0;
    };

    // Calculate total grade points
    let totalGradePoints = 0;
    let totalGrades = 0;

    agCourses.forEach(c => {
      totalGradePoints += getBasePoints(c.grade);
      totalGrades++;
    });

    const unweightedGPA = totalGrades > 0 ? totalGradePoints / totalGrades : 0;

    // Calculate honors points (AP and IB courses with grades C or better)
    let grade10HonorsCount = 0;
    let grade11HonorsCount = 0;

    agCourses.forEach(c => {
      const info = COURSE_CATALOG[c.courseId];
      const basePoints = getBasePoints(c.grade);

      // Only give honors points for C or better grades
      if (basePoints >= 2 && info.is_ap_or_honors_pair) {
        if (c.year === '10') grade10HonorsCount++;
        if (c.year === '11') grade11HonorsCount++;
      }
    });

    // Capped: max 4 semesters from grade 10, max 4 from grade 11, total max 8
    const cappedGrade10Honors = Math.min(grade10HonorsCount, 4);
    const cappedGrade11Honors = Math.min(grade11HonorsCount, 4);
    const totalCappedHonors = Math.min(cappedGrade10Honors + cappedGrade11Honors, 8);

    const weightedCappedGPA = totalGrades > 0 ? (totalGradePoints + totalCappedHonors) / totalGrades : 0;

    // Fully weighted: all honors points
    const totalFullyWeightedHonors = grade10HonorsCount + grade11HonorsCount;
    const fullyWeightedGPA = totalGrades > 0 ? (totalGradePoints + totalFullyWeightedHonors) / totalGrades : 0;

    return {
      unweighted: Math.floor(unweightedGPA * 100) / 100,
      weightedCapped: Math.floor(weightedCappedGPA * 100) / 100,
      fullyWeighted: Math.floor(fullyWeightedGPA * 100) / 100,
      totalGrades,
      grade10Honors: grade10HonorsCount,
      grade11Honors: grade11HonorsCount,
      cappedHonorsUsed: totalCappedHonors
    };
  }, [courses, gpaMode]);

  // Calculate State Seal of Biliteracy eligibility
  const biliteracySealEligibility = useMemo(() => {
    // Check English requirement: 4 years of English with 3.0 GPA (if in GPA mode)
    const englishCourses = courses.filter(c => {
      const info = COURSE_CATALOG[c.courseId];
      return info && info.pathway === 'English';
    });

    // Group by year to check 4-year requirement
    const englishYears = new Set(englishCourses.map(c => c.year));
    const has4YearsEnglish = englishYears.size >= 4;

    let englishGPAMet = true; // Assume met if not in GPA mode
    if (gpaMode) {
      const englishWithGrades = englishCourses.filter(c => c.grade && c.grade !== '');
      if (englishWithGrades.length > 0) {
        const getBasePoints = (grade) => {
          const letter = grade.replace('+', '').replace('-', '');
          const points = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'F': 0 };
          return points[letter] || 0;
        };
        const totalPoints = englishWithGrades.reduce((sum, c) => sum + getBasePoints(c.grade), 0);
        const englishGPA = totalPoints / englishWithGrades.length;
        englishGPAMet = englishGPA >= 3.0;
      } else {
        englishGPAMet = false; // No grades entered yet
      }
    }

    // Check world language requirement: 4 years with 3.0 GPA (if in GPA mode)
    const worldLangCourses = courses.filter(c => {
      const info = COURSE_CATALOG[c.courseId];
      return info && info.pathway === 'Foreign Language';
    });

    // Find the language with the most years
    const languageYears = {};
    worldLangCourses.forEach(c => {
      const info = COURSE_CATALOG[c.courseId];
      const name = info.full_name.toUpperCase();
      let lang = 'Other';
      if (name.includes('SPANISH')) lang = 'Spanish';
      else if (name.includes('CHINESE')) lang = 'Chinese';
      else if (name.includes('FRENCH')) lang = 'French';
      else if (name.includes('JAPANESE')) lang = 'Japanese';
      else if (name.includes('GERMAN')) lang = 'German';
      else if (name.includes('ASL') || name.includes('SIGN LANGUAGE')) lang = 'ASL';

      if (!languageYears[lang]) {
        languageYears[lang] = new Set();
      }
      languageYears[lang].add(c.year);
    });

    let primaryLanguage = null;
    let maxYears = 0;
    Object.entries(languageYears).forEach(([lang, years]) => {
      if (years.size > maxYears) {
        maxYears = years.size;
        primaryLanguage = lang;
      }
    });

    const has4YearsLanguage = maxYears >= 4;

    let languageGPAMet = true; // Assume met if not in GPA mode
    if (gpaMode && primaryLanguage) {
      const langCoursesWithGrades = worldLangCourses.filter(c => {
        const info = COURSE_CATALOG[c.courseId];
        const name = info.full_name.toUpperCase();
        let lang = 'Other';
        if (name.includes('SPANISH')) lang = 'Spanish';
        else if (name.includes('CHINESE')) lang = 'Chinese';
        else if (name.includes('FRENCH')) lang = 'French';
        else if (name.includes('JAPANESE')) lang = 'Japanese';
        else if (name.includes('GERMAN')) lang = 'German';
        else if (name.includes('ASL') || name.includes('SIGN LANGUAGE')) lang = 'ASL';

        return lang === primaryLanguage && c.grade && c.grade !== '';
      });

      if (langCoursesWithGrades.length > 0) {
        const getBasePoints = (grade) => {
          const letter = grade.replace('+', '').replace('-', '');
          const points = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'F': 0 };
          return points[letter] || 0;
        };
        const totalPoints = langCoursesWithGrades.reduce((sum, c) => sum + getBasePoints(c.grade), 0);
        const langGPA = totalPoints / langCoursesWithGrades.length;
        languageGPAMet = langGPA >= 3.0;
      } else {
        languageGPAMet = false; // No grades entered yet
      }
    }

    const isEligible = has4YearsEnglish && englishGPAMet && has4YearsLanguage && languageGPAMet;

    return {
      eligible: isEligible,
      has4YearsEnglish,
      englishGPAMet,
      has4YearsLanguage,
      languageGPAMet,
      primaryLanguage,
      languageYears: maxYears,
      englishYears: englishYears.size
    };
  }, [courses, gpaMode]);

  // Calculate College Credits from test scores
  const collegeCredits = useMemo(() => {
    if (testScores.length === 0) return { csu: 0, uc: 0, details: [] };

    let csuTotal = 0;
    let ucTotal = 0;
    const details = [];

    testScores.forEach(test => {
      let csuCredits = 0;
      let ucCredits = 0;
      const subject = test.subject.toUpperCase();
      const score = parseInt(test.score);

      if (test.type === 'AP' && score >= 3) {
        // CSU AP Credits (all are semester units)
        if (subject.includes('CALCULUS BC')) {
          csuCredits = 6;
          ucCredits = 5.3; // UC uses semester for Berkeley/Merced, but we'll use semester for consistency
        } else if (subject.includes('CALCULUS AB') || subject.includes('CALCULUS')) {
          csuCredits = 3;
          ucCredits = 2.6;
        } else if (subject.includes('BIOLOGY') || subject.includes('CHEMISTRY')) {
          csuCredits = 6;
          ucCredits = 5.3;
        } else if (subject.includes('PHYSICS')) {
          csuCredits = 4;
          ucCredits = 5.3;
        } else if (subject.includes('ENGLISH') || subject.includes('LITERATURE')) {
          csuCredits = 6;
          ucCredits = 5.3;
        } else if (subject.includes('HISTORY') || subject.includes('GOVERNMENT')) {
          csuCredits = subject.includes('US HISTORY') || subject.includes('WORLD') || subject.includes('EUROPEAN') ? 6 : 3;
          ucCredits = subject.includes('US HISTORY') || subject.includes('WORLD') || subject.includes('EUROPEAN') ? 5.3 : 2.6;
        } else if (subject.includes('LANGUAGE') || subject.includes('SPANISH') || subject.includes('FRENCH') || subject.includes('CHINESE') || subject.includes('GERMAN') || subject.includes('JAPANESE') || subject.includes('LATIN')) {
          csuCredits = 6;
          ucCredits = 5.3;
        } else if (subject.includes('PSYCHOLOGY') || subject.includes('ECONOMICS') || subject.includes('STATISTICS') || subject.includes('HUMAN GEOGRAPHY')) {
          csuCredits = 3;
          ucCredits = 2.6;
        } else if (subject.includes('COMPUTER SCIENCE')) {
          csuCredits = score >= 3 ? 6 : 3;
          ucCredits = 5.3;
        } else if (subject.includes('ENVIRONMENTAL')) {
          csuCredits = 4;
          ucCredits = 2.6;
        } else if (subject.includes('ART')) {
          csuCredits = subject.includes('HISTORY') ? 6 : 3;
          ucCredits = subject.includes('HISTORY') ? 5.3 : 5.3;
        } else {
          csuCredits = 3; // Default
          ucCredits = 2.6;
        }
      } else if (test.type === 'IB' && score >= 4) {
        // IB HL exams (score 4+): 6 credits CSU, 8 quarter units UC (5.3 semester)
        if ((score >= 5 && (subject.includes('BIOLOGY') || subject.includes('CHEMISTRY') || subject.includes('PHYSICS') ||
             subject.includes('ECONOMICS') || subject.includes('GEOGRAPHY') || subject.includes('HISTORY') ||
             subject.includes('PSYCHOLOGY'))) ||
            (score >= 4 && (subject.includes('LANGUAGE') || subject.includes('LITERATURE') || subject.includes('MATHEMATICS') ||
             subject.includes('THEATRE')))) {
          csuCredits = 6;
          ucCredits = 5.3; // 8 quarter = 5.3 semester
        }
      } else if (test.type === 'CLEP' && score >= 50) {
        // CLEP: mostly 3 credits CSU
        if (subject.includes('CALCULUS') || subject.includes('CHEMISTRY') || subject.includes('BIOLOGY') ||
            subject.includes('COLLEGE ALGEBRA') || subject.includes('PRE-CALCULUS')) {
          csuCredits = 3;
        } else if (subject.includes('HISTORY') || subject.includes('GOVERNMENT') || subject.includes('ECONOMICS') ||
                   subject.includes('PSYCHOLOGY') || subject.includes('SOCIOLOGY')) {
          csuCredits = 3;
        } else if (subject.includes('HUMANITIES') || subject.includes('LITERATURE')) {
          csuCredits = 3;
        } else if (subject.includes('SPANISH') || subject.includes('FRENCH') || subject.includes('GERMAN')) {
          if (score >= 63) {
            csuCredits = 9; // Level II
          } else if (score >= 50) {
            csuCredits = 6; // Level I
          }
        }
        // UC doesn't typically grant credit for CLEP
      } else if (test.type === 'A-Level' && ['A', 'B', 'C'].includes(test.score)) {
        // A-Level: UC grants up to 12 quarter (8 semester) units
        ucCredits = 5.3; // 8 semester units
        // CSU doesn't have standardized A-Level credit
      }

      if (csuCredits > 0 || ucCredits > 0) {
        csuTotal += csuCredits;
        ucTotal += ucCredits;
        details.push({
          exam: `${test.type} ${test.subject}`,
          score: test.score,
          csu: csuCredits,
          uc: ucCredits
        });
      }
    });

    return {
      csu: Math.round(csuTotal * 10) / 10,
      uc: Math.round(ucTotal * 10) / 10,
      details
    };
  }, [testScores]);

  // Validate schedule using SchedulingEngine
  const scheduleValidation = useMemo(() => {
    const validation = { errors: [], warnings: [] };

    ['9', '10', '11', '12'].forEach(year => {
      const q1Courses = getCoursesForQuarter(year, 'Q1');
      const q2Courses = getCoursesForQuarter(year, 'Q2');
      const q3Courses = getCoursesForQuarter(year, 'Q3');
      const q4Courses = getCoursesForQuarter(year, 'Q4');

      // For scheduling engine compatibility, combine Q1+Q2 as "fall" and Q3+Q4 as "spring"
      const fallCourses = [...q1Courses, ...q2Courses];
      const springCourses = [...q3Courses, ...q4Courses];

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
      const hasCoursesInAnyQuarter = q1Courses.length > 0 || q2Courses.length > 0 || q3Courses.length > 0 || q4Courses.length > 0;
      if (hasCoursesInAnyQuarter) {
        const allYearCourses = [...q1Courses, ...q2Courses, ...q3Courses, ...q4Courses];

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

  // Helper function to check if student is eligible for a course (has met prerequisites)
  // Returns: { eligible: boolean, warning: string|null, blocking: boolean }
  const checkCourseEligibility = (courseId, targetYear) => {
    const courseInfo = COURSE_CATALOG[courseId];
    if (!courseInfo) return { eligible: true, warning: null, blocking: false };

    const allCourses = courses;
    const yearCourses = courses.filter(c => c.year === targetYear);

    // Check Foreign Language prerequisites (warning only, not blocking)
    if (courseInfo.pathway === 'Foreign Language') {
      const flPrereqCheck = checkForeignLanguagePrereqs(courseId);
      if (flPrereqCheck) {
        return {
          eligible: true, // Don't block, but warn
          warning: `${flPrereqCheck.language} ${flPrereqCheck.currentLevel} typically requires: ${flPrereqCheck.missingLevels.join(', ')}`,
          blocking: false
        };
      }
    }

    // Check linked course requirements (these ARE blocking)
    const linkedRequirementsCheck = {
      // AVID courses require English/History (but English/History can be alone)
      'AVID_12_0015': { requires: 'HIGH_SCHOOL_0003', name: 'English 1-2' },
      'AVID_34_0015': { requires: 'HIGH_SCHOOL', name: 'English 3-4' },
      'AVID_56_0015': { requires: 'UNITED_STATES_0013', name: 'US History 1-2' },

      // AP CS A group - NONE can be standalone, must have at least one partner
      'AP_COMPUTER_0010': {
        requiresOneOf: ['COMPUTER_SCIENCE_0009', 'DATA_STRUCTURES_0010', 'STUDIO_ART_0003'],
        names: ['Computer Science & Software Engineering 1-2', 'Data Structures 1-2', 'Studio Art 1-2: Graphic Design']
      },
      'COMPUTER_SCIENCE_0009': { requires: 'AP_COMPUTER_0010', name: 'AP Computer Science A 1-2' },
      'DATA_STRUCTURES_0010': { requires: 'AP_COMPUTER_0010', name: 'AP Computer Science A 1-2' },
      'STUDIO_ART_0003': { requires: 'AP_COMPUTER_0010', name: 'AP Computer Science A 1-2' },

      // Bidirectional required pairs (neither can be alone)
      'HON_SPANISH_0004': { requires: 'AP_SPANISH_0004', name: 'AP Spanish Language 1-2' },
      'AP_SPANISH_0004': { requires: 'HON_SPANISH_0004', name: 'Honors Spanish 7-8' },
      'AP_PRECALCULUS_0010': { requires: 'AP_CALCULUS_0010', name: 'AP Calculus AB 1-2' },
      'AP_CALCULUS_0010': { requires: 'AP_PRECALCULUS_0010', name: 'AP Pre-Calculus 1-2' },
      'BRITISH_LITERATURE_0003': { requires: 'AP_ENGLISH', name: 'AP English Literature 1-2' },
      'AP_ENGLISH': { requires: 'BRITISH_LITERATURE_0003', name: 'British Literature 1-2' },
      'HON_AMERICAN_0003': { requires: 'AP_UNITED', name: 'AP United States History 1-2' },
      'AP_UNITED': { requires: 'HON_AMERICAN_0003', name: 'Honors American Literature 1-2' },
      'AP_PHYSICS_0001': { requires: 'AP_PHYSICS', name: 'AP Physics C: Electricity & Magnetism 1-2' },
      'AP_PHYSICS': { requires: 'AP_PHYSICS_0001', name: 'AP Physics C: Mechanics 1-2' },
      'HON_BIOLOGY_0012': { requires: 'AP_BIOLOGY_0012', name: 'AP Biology 3-4' },
      'AP_BIOLOGY_0012': { requires: 'HON_BIOLOGY_0012', name: 'Honors Biology 1-2' },
      'HON_CHEMISTRY_0012': { requires: 'AP_CHEMISTRY_0012', name: 'AP Chemistry 3-4' },
      'AP_CHEMISTRY_0012': { requires: 'HON_CHEMISTRY_0012', name: 'Honors Chemistry 1-2' },
      'HON_WORLD_0013': { requires: 'AP_WORLD_0013', name: 'AP World History 1-2' },
      'AP_WORLD_0013': { requires: 'HON_WORLD_0013', name: 'Honors World History 1-2' },
      'COLLEGE_ALGEBRA_0010': { requires: 'AP_STATISTICS_0010', name: 'AP Statistics 1-2' },
      'STATISTICS_0010': { requires: 'AP_STATISTICS_0010', name: 'AP Statistics 1-2' },
      'AP_STATISTICS_0010': {
        requiresOneOf: ['COLLEGE_ALGEBRA_0010', 'STATISTICS_0010'],
        names: ['College Algebra 1', 'Statistics']
      },
      'STUDIO_ART_0001': { requires: 'AP_STUDIO', name: 'AP Studio Art 3D: Ceramics' },
      'AP_STUDIO': { requires: 'STUDIO_ART_0001', name: 'Studio Art 1-2: Ceramics' },
      'STUDIO_ART_0002': { requires: 'AP_STUDIO_0002', name: 'AP Studio Art: Drawing & Painting' },
      'AP_STUDIO_0002': { requires: 'STUDIO_ART_0002', name: 'Studio Art 1-2: Drawing & Painting' },
      'STUDIO_ART': { requires: 'AP_STUDIO_0001', name: 'AP Studio Art 2D: Photography' },
      'AP_STUDIO_0001': { requires: 'STUDIO_ART', name: 'Studio Art 1-2: Digital Photography' },
      'MARCHING_PE_0011': { requires: 'DANCE_PROP_0011', name: 'Dance Prop (Tall Flags)' },
      'DANCE_PROP_0011': { requires: 'MARCHING_PE_0011', name: 'Marching PE Flags/Tall Flags' },
    };

    if (linkedRequirementsCheck[courseId]) {
      const requirement = linkedRequirementsCheck[courseId];

      // Handle "requires one of"
      if (requirement.requiresOneOf) {
        const hasAnyPartner = requirement.requiresOneOf.some(partnerId =>
          yearCourses.some(c => c.courseId === partnerId)
        );

        if (!hasAnyPartner) {
          const partnerNames = requirement.names.join(', or ');
          return {
            eligible: false,
            warning: `${courseInfo.full_name} must be taken with one of: ${partnerNames}`,
            blocking: true
          };
        }
      }
      // Handle standard single requirement
      else if (requirement.requires) {
        const hasRequiredCourse = yearCourses.some(c => c.courseId === requirement.requires);

        if (!hasRequiredCourse) {
          return {
            eligible: false,
            warning: `${courseInfo.full_name} must be taken with ${requirement.name}`,
            blocking: true
          };
        }
      }
    }

    // All checks passed
    return { eligible: true, warning: null, blocking: false };
  };

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

  // Validate semester completion
  const validateSemesterCompletion = (year, quarter) => {
    const quarterCourses = getCoursesForQuarter(year, quarter);
    const issues = [];
    const warnings = [];
    const info = [];

    // Check if quarter has any courses
    if (quarterCourses.length === 0) {
      issues.push('No courses scheduled for this semester');
      return { valid: false, issues, warnings, info };
    }

    // Check minimum course count for the term (both quarters combined)
    // Determine which term this quarter belongs to
    const termQuarters = (quarter === 'Q1' || quarter === 'Q2') ? ['Q1', 'Q2'] : ['Q3', 'Q4'];
    const termCourses = courses.filter(c =>
      c.year === year && termQuarters.includes(c.quarter)
    );

    // Minimum 3 courses per term for grades 9-11, minimum 2 for grade 12
    const yearInt = parseInt(year);
    const minCourses = yearInt === 12 ? 2 : 3;

    if (termCourses.length < minCourses) {
      issues.push(`Minimum ${minCourses} courses required per semester (currently ${termCourses.length} in this term)`);
      return { valid: false, issues, warnings, info };
    }

    // Check for required courses based on grade

    // Check for English (required all 4 years)
    const hasEnglish = quarterCourses.some(c => {
      const info = getCourseInfo(c.courseId);
      return info?.pathway === 'English';
    });

    if (!hasEnglish) {
      // Check if English is in ANY other quarter of this year (for year-long courses)
      const allQuarters = ['Q1', 'Q2', 'Q3', 'Q4'];
      const otherQuarters = allQuarters.filter(q => q !== quarter);
      const hasEnglishElsewhere = otherQuarters.some(q => {
        const otherCourses = getCoursesForQuarter(year, q);
        return otherCourses.some(c => {
          const info = getCourseInfo(c.courseId);
          return info?.pathway === 'English';
        });
      });

      if (!hasEnglishElsewhere) {
        issues.push('Missing English course - required all 4 years');
      }
    }

    // Check for PE (required grades 9-10)
    if (yearInt === 9 || yearInt === 10) {
      const hasPE = quarterCourses.some(c => {
        const info = getCourseInfo(c.courseId);
        return info?.pathway === 'Physical Education';
      });

      if (!hasPE) {
        // Check if PE is in ANY other quarter of this year
        const allQuarters = ['Q1', 'Q2', 'Q3', 'Q4'];
        const otherQuarters = allQuarters.filter(q => q !== quarter);
        const hasPEElsewhere = otherQuarters.some(q => {
          const otherCourses = getCoursesForQuarter(year, q);
          return otherCourses.some(c => {
            const info = getCourseInfo(c.courseId);
            return info?.pathway === 'Physical Education';
          });
        });

        if (!hasPEElsewhere) {
          issues.push(`PE required for Grade ${year}`);
        }
      }
    }

    // Check for Integrated Math I requirement (or higher level math)
    // All students must pass Integrated Math I, OR start at a higher level (Math II, III, etc.)
    if (yearInt === 12 && quarter === 'Q4') {
      // Only check at graduation (end of senior year - Q4 of grade 12)
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

    // Check for yearlong courses that should be in both quarters of the term
    quarterCourses.forEach(course => {
      const courseInfo = getCourseInfo(course.courseId);
      if (courseInfo?.term_length === 'yearlong') {
        // Determine the opposite quarter in the same term
        let oppositeQuarter;
        if (quarter === 'Q1') oppositeQuarter = 'Q2';
        else if (quarter === 'Q2') oppositeQuarter = 'Q1';
        else if (quarter === 'Q3') oppositeQuarter = 'Q4';
        else oppositeQuarter = 'Q3';

        const oppositeCourses = getCoursesForQuarter(year, oppositeQuarter);
        const hasOpposite = oppositeCourses.some(c => c.courseId === course.courseId);

        if (!hasOpposite) {
          const termName = (quarter === 'Q1' || quarter === 'Q2') ? 'Fall' : 'Spring';
          issues.push(`Year-long course "${courseInfo.full_name}" must be in both quarters of ${termName} term`);
        }
      }

      // Check for UNIFIED PE and O.C.I.S./P.E. courses that require counselor consultation
      if (courseInfo?.full_name && (courseInfo.full_name.toUpperCase().includes('UNIFIED PE') || courseInfo.full_name.toUpperCase().includes('O.C.I.S./P.E.'))) {
        warnings.push(`⚠️ ${courseInfo.full_name} credit allocation varies - consult your counselor to determine how many credits count toward PE vs. Electives`);
      }
    });

    // Check semester capacity
    // Standard load is 3 courses per semester
    if (quarterCourses.length > 8) {
      issues.push(`Overloaded schedule (${quarterCourses.length} courses). Maximum is 8 courses per quarter.`);
    } else if (quarterCourses.length >= 5) {
      warnings.push(`Above standard load (${quarterCourses.length} courses). Standard is 3 courses per quarter. Consider your workload carefully.`);
    }

    // Check UC A-G progress for juniors and seniors
    if (yearInt >= 11) {
      // Count total UC A-G courses completed up to this point
      const yearsToCheck = yearInt === 11 ? ['9', '10', '11'] : ['9', '10', '11', '12'];
      let agCoursesCompleted = 0;

      const quarterOrder = ['Q1', 'Q2', 'Q3', 'Q4'];
      const currentQuarterIndex = quarterOrder.indexOf(quarter);

      yearsToCheck.forEach(checkYear => {
        quarterOrder.forEach((checkQuarter, qIndex) => {
          // Only count if we're checking up to the current quarter
          if (parseInt(checkYear) < yearInt ||
              (parseInt(checkYear) === yearInt && qIndex <= currentQuarterIndex)) {

            const quarterCourses = getCoursesForQuarter(checkYear, checkQuarter);
            quarterCourses.forEach(c => {
              const info = getCourseInfo(c.courseId);
              if (info?.uc_csu_category) {
                agCoursesCompleted++;
              }
            });
          }
        });
      });

      // Remove duplicates (yearlong courses counted multiple times)
      const uniqueAGCourses = new Set();
      yearsToCheck.forEach(checkYear => {
        quarterOrder.forEach((checkQuarter, qIndex) => {
          if (parseInt(checkYear) < yearInt ||
              (parseInt(checkYear) === yearInt && qIndex <= currentQuarterIndex)) {

            const quarterCourses = getCoursesForQuarter(checkYear, checkQuarter);
            quarterCourses.forEach(c => {
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
      if (yearInt === 11 && quarter === 'Q4') {
        if (uniqueCount < 11) {
          issues.push(`UC requirement: Need 11 A-G courses by end of junior year. Currently have ${uniqueCount}.`);
        } else {
          info.push(`✓ UC requirement met: ${uniqueCount} A-G courses by end of junior year`);
        }
      }

      // Total requirement: 15 A-G courses by graduation
      if (yearInt === 12 && quarter === 'Q4') {
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

    // Linked course validation - prevent adding courses that require linked pairs
    const linkedRequirements = {
      // AVID courses require English/History (but English/History can be alone)
      'AVID_12_0015': { requires: 'HIGH_SCHOOL_0003', name: 'English 1-2' },
      'AVID_34_0015': { requires: 'HIGH_SCHOOL', name: 'English 3-4' },
      'AVID_56_0015': { requires: 'UNITED_STATES_0013', name: 'US History 1-2' },

      // AP CS A group - NONE can be standalone, must have at least one partner
      'AP_COMPUTER_0010': {
        requiresOneOf: ['COMPUTER_SCIENCE_0009', 'DATA_STRUCTURES_0010', 'STUDIO_ART_0003'],
        names: ['Computer Science & Software Engineering 1-2', 'Data Structures 1-2', 'Studio Art 1-2: Graphic Design']
      },
      'COMPUTER_SCIENCE_0009': { requires: 'AP_COMPUTER_0010', name: 'AP Computer Science A 1-2' },
      'DATA_STRUCTURES_0010': { requires: 'AP_COMPUTER_0010', name: 'AP Computer Science A 1-2' },
      'STUDIO_ART_0003': { requires: 'AP_COMPUTER_0010', name: 'AP Computer Science A 1-2' },

      // Bidirectional required pairs (neither can be alone)
      'HON_SPANISH_0004': { requires: 'AP_SPANISH_0004', name: 'AP Spanish Language 1-2' },
      'AP_SPANISH_0004': { requires: 'HON_SPANISH_0004', name: 'Honors Spanish 7-8' },

      'AP_PRECALCULUS_0010': { requires: 'AP_CALCULUS_0010', name: 'AP Calculus AB 1-2' },
      'AP_CALCULUS_0010': { requires: 'AP_PRECALCULUS_0010', name: 'AP Pre-Calculus 1-2' },

      'BRITISH_LITERATURE_0003': { requires: 'AP_ENGLISH', name: 'AP English Literature 1-2' },
      'AP_ENGLISH': { requires: 'BRITISH_LITERATURE_0003', name: 'British Literature 1-2' },

      'HON_AMERICAN_0003': { requires: 'AP_UNITED', name: 'AP United States History 1-2' },
      'AP_UNITED': { requires: 'HON_AMERICAN_0003', name: 'Honors American Literature 1-2' },

      'AP_PHYSICS_0001': { requires: 'AP_PHYSICS', name: 'AP Physics C: Electricity & Magnetism 1-2' },
      'AP_PHYSICS': { requires: 'AP_PHYSICS_0001', name: 'AP Physics C: Mechanics 1-2' },

      // Science pairs
      'HON_BIOLOGY_0012': { requires: 'AP_BIOLOGY_0012', name: 'AP Biology 3-4' },
      'AP_BIOLOGY_0012': { requires: 'HON_BIOLOGY_0012', name: 'Honors Biology 1-2' },

      'HON_CHEMISTRY_0012': { requires: 'AP_CHEMISTRY_0012', name: 'AP Chemistry 3-4' },
      'AP_CHEMISTRY_0012': { requires: 'HON_CHEMISTRY_0012', name: 'Honors Chemistry 1-2' },

      'HON_WORLD_0013': { requires: 'AP_WORLD_0013', name: 'AP World History 1-2' },
      'AP_WORLD_0013': { requires: 'HON_WORLD_0013', name: 'Honors World History 1-2' },

      // Statistics/College Algebra pair
      'COLLEGE_ALGEBRA_0010': { requires: 'AP_STATISTICS_0010', name: 'AP Statistics 1-2' },
      'STATISTICS_0010': { requires: 'AP_STATISTICS_0010', name: 'AP Statistics 1-2' },
      'AP_STATISTICS_0010': {
        requiresOneOf: ['COLLEGE_ALGEBRA_0010', 'STATISTICS_0010'],
        names: ['College Algebra 1', 'Statistics']
      },

      // Studio Art pairs
      'STUDIO_ART_0001': { requires: 'AP_STUDIO', name: 'AP Studio Art 3D: Ceramics' },
      'AP_STUDIO': { requires: 'STUDIO_ART_0001', name: 'Studio Art 1-2: Ceramics' },

      'STUDIO_ART_0002': { requires: 'AP_STUDIO_0002', name: 'AP Studio Art: Drawing & Painting' },
      'AP_STUDIO_0002': { requires: 'STUDIO_ART_0002', name: 'Studio Art 1-2: Drawing & Painting' },

      'STUDIO_ART': { requires: 'AP_STUDIO_0001', name: 'AP Studio Art 2D: Photography' },
      'AP_STUDIO_0001': { requires: 'STUDIO_ART', name: 'Studio Art 1-2: Digital Photography' },

      // Dance/Marching PE pair
      'MARCHING_PE_0011': { requires: 'DANCE_PROP_0011', name: 'Dance Prop (Tall Flags)' },
      'DANCE_PROP_0011': { requires: 'MARCHING_PE_0011', name: 'Marching PE Flags/Tall Flags' },
    };

    // Sequential prerequisite requirements (must complete prerequisite BEFORE taking course)
    // Note: This is different from linkedRequirements (which are taken AT THE SAME TIME)
    const coursePrerequisites = {
      // Math sequence - must complete previous level first
      // Note: Students can test into higher levels, so these are WARNING only

      // Science sequences - AP/Honors pairs require base course first
      // These are handled by linkedRequirements since they're taken together

      // AP courses that require honors/regular versions
      // (Most are linked and taken together, but check for any sequential ones)

      // Foreign Language - handled by checkForeignLanguagePrereqs() function

      // Add any course-specific prerequisites here
      // Format: 'COURSE_ID': { prerequisiteIds: ['PREREQ1', 'PREREQ2'], warningMessage: 'message' }
    };

    if (linkedRequirements[newCourse.courseId]) {
      const requirement = linkedRequirements[newCourse.courseId];

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

    // Add course(s) - yearlong and semester courses automatically add to both quarters of the term
    // In 4x4 block schedule: yearlong = all 4 quarters, semester = both quarters of one term
    const needsBothQuarters = termReqs.requiresBothSemesters || termReqs.type === 'semester';

    if (needsBothQuarters) {
      // Determine the quarter pair based on which quarter was selected
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

    // Check if this is a yearlong or semester course (needs both quarters)
    const termReqs = schedulingEngine.getTermRequirements(courseToRemove.courseId);
    const needsBothQuarters = termReqs.requiresBothSemesters || termReqs.type === 'semester';

    if (needsBothQuarters) {
      // Remove ALL instances of this courseId in the same year
      // (both quarters of the semester)
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
      const existingTermCredits = courses
        .filter(c => c.year === year && termQuarters.includes(c.quarter))
        .reduce((sum, c) => {
          const info = COURSE_CATALOG[c.courseId];
          return sum + (info ? info.credits : 0);
        }, 0);

      // Track credits being added (max 45 per semester, target 40)
      const MAX_SEMESTER_CREDITS = 45;
      let addedCredits = 0;

      termSuggestions.forEach(suggestion => {
        const courseInfo = COURSE_CATALOG[suggestion.courseId];
        if (!courseInfo) return;

        // Check if adding this course would exceed credit limit
        const totalAfterAdd = existingTermCredits + addedCredits + courseInfo.credits;
        if (totalAfterAdd > MAX_SEMESTER_CREDITS) {
          return; // Skip this course - would exceed credit limit
        }

        const termReqs = schedulingEngine.getTermRequirements(suggestion.courseId);
        const needsBothQuarters = termReqs.requiresBothSemesters || termReqs.type === 'semester';

        if (needsBothQuarters) {
          // Add to both quarters of the term
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
          // Only quarter-length course
          newCourses.push({
            courseId: suggestion.courseId,
            id: Date.now() + newCourses.length,
            year: suggestion.year,
            quarter: suggestion.quarter
          });
        }

        // Track credits added
        addedCredits += courseInfo.credits;
      });

      // Complex linked course relationships
      // BIDIRECTIONAL: Both courses trigger each other
      // SEQUENTIAL: First course must trigger second
      // ONE-WAY: First course can exist alone, triggers second
      const linkedCourseRules = [
        // AVID Program (bidirectional, but English/History CAN be standalone)
        { type: 'bidirectional', courses: ['HIGH_SCHOOL_0003', 'AVID_12_0015'] }, // English 1-2 ↔ AVID 1-2
        { type: 'bidirectional', courses: ['HIGH_SCHOOL', 'AVID_34_0015'] },      // English 3-4 ↔ AVID 3-4
        { type: 'bidirectional', courses: ['UNITED_STATES_0013', 'AVID_56_0015'] }, // US History ↔ AVID 5-6

        // BIDIRECTIONAL REQUIRED (neither can be alone)
        { type: 'bidirectional', courses: ['HON_SPANISH_0004', 'AP_SPANISH_0004'] },       // Honors Spanish 7-8 ↔ AP Spanish
        { type: 'bidirectional', courses: ['AP_PRECALCULUS_0010', 'AP_CALCULUS_0010'] },   // AP Pre-Calc ↔ AP Calc AB
        { type: 'bidirectional', courses: ['BRITISH_LITERATURE_0003', 'AP_ENGLISH'] },     // Brit Lit ↔ AP English Lit
        { type: 'bidirectional', courses: ['HON_AMERICAN_0003', 'AP_UNITED'] },           // Hon Am Lit ↔ AP US History

        // Science pairs - ALWAYS TOGETHER
        { type: 'bidirectional', courses: ['HON_BIOLOGY_0012', 'AP_BIOLOGY_0012'] },       // Honors Biology ↔ AP Biology 3-4
        { type: 'bidirectional', courses: ['HON_CHEMISTRY_0012', 'AP_CHEMISTRY_0012'] },   // Honors Chemistry ↔ AP Chemistry 3-4
        { type: 'bidirectional', courses: ['HON_WORLD_0013', 'AP_WORLD_0013'] },           // Honors World History ↔ AP World History

        // Statistics pair - ALWAYS TOGETHER (AP Stats needs one of two prerequisite courses)
        { type: 'bidirectional', courses: ['COLLEGE_ALGEBRA_0010', 'AP_STATISTICS_0010'] }, // College Algebra ↔ AP Statistics
        { type: 'bidirectional', courses: ['STATISTICS_0010', 'AP_STATISTICS_0010'] },      // Statistics ↔ AP Statistics

        // Studio Art pairs - ALWAYS TOGETHER
        { type: 'bidirectional', courses: ['STUDIO_ART', 'AP_STUDIO_0001'] },              // Studio Art Digital Photography ↔ AP Studio 2D
        { type: 'bidirectional', courses: ['STUDIO_ART_0002', 'AP_STUDIO_0002'] },         // Studio Art Drawing & Painting ↔ AP Studio Drawing
        { type: 'bidirectional', courses: ['STUDIO_ART_0001', 'AP_STUDIO'] },              // Studio Art Ceramics ↔ AP Studio 3D

        // Dance Prop/Marching PE pair - ALWAYS TOGETHER
        { type: 'bidirectional', courses: ['MARCHING_PE_0011', 'DANCE_PROP_0011'] },       // Marching PE Flags ↔ Dance Prop (Tall Flags)

        // SEQUENTIAL REQUIRED (first triggers second, both required together)
        { type: 'sequential', first: 'AP_PHYSICS_0001', second: 'AP_PHYSICS' },  // AP Physics C: Mechanics → E&M

        // BIDIRECTIONAL (Computer Science courses)
        { type: 'bidirectional', courses: ['COMPUTER_SCIENCE_0009', 'AP_COMPUTER_0010'] }, // CS ↔ AP CS A
        { type: 'bidirectional', courses: ['DATA_STRUCTURES_0010', 'AP_COMPUTER_0010'] },  // Data Struct ↔ AP CS A
        { type: 'bidirectional', courses: ['STUDIO_ART_0003', 'AP_COMPUTER_0010'] },       // Studio Art Graphic Design ↔ AP CS A

        // ONE-WAY TRIGGERS (first can be alone, optionally triggers second)
        { type: 'one_way', trigger: 'AP_UNITED_0013', adds: 'CIVICS__0013' },      // AP US Gov → Civics (Civics can be solo)
        { type: 'one_way', trigger: 'PHYSICS_OF_0012', adds: 'AP_PHYSICS_0012' },  // Physics → AP Physics 1A-1B
      ];

      // Process each rule
      linkedCourseRules.forEach(rule => {
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
        // NEVER auto-suggest AVID courses - they are student choice only
        const AVID_COURSES = ['AVID_12_0015', 'AVID_34_0015', 'AVID_56_0015'];
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

    // Yearlong and semester courses need both quarters of the term
    const needsBothQuarters = termReqs.requiresBothSemesters || termReqs.type === 'semester';

    if (needsBothQuarters) {
      // Determine the quarter pair based on which quarter was suggested
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
      // Only quarter-length courses
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
                {/* Schedule Validation Errors */}
                {scheduleValidation.errors.length > 0 && (
                  <WarningBanner
                    type="error"
                    compact={true}
                    message={
                      <>
                        <span className="font-semibold">Schedule Issues:</span>{' '}
                        {scheduleValidation.errors.map((err, idx) => (
                          <span key={idx}>
                            {idx > 0 && ', '}Grade {err.year}
                          </span>
                        ))}
                      </>
                    }
                  />
                )}

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
                              const semesterTotal = semesterCourses.reduce((sum, c) => {
                                const info = COURSE_CATALOG[c.courseId];
                                return sum + (info ? info.credits : 0);
                              }, 0);

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
                      const yearCredits = [...fallCourses, ...springCourses].reduce((sum, c) => {
                        const info = COURSE_CATALOG[c.courseId];
                        return sum + (info ? info.credits : 0);
                      }, 0);

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
