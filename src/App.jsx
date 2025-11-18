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
  'Science': { needed: 30, pathways: ['Science - Biological', 'Science - Physical'] },
  'History': { needed: 30, pathways: ['History/Social Science'] },
  'Foreign Language': { needed: 20, pathways: ['Foreign Language'] },
  'Fine Arts': { needed: 10, pathways: ['Fine Arts'] },
  'PE': { needed: 20, pathways: ['Physical Education'] },
  'Electives': { needed: 50, pathways: ['Electives', 'CTE'] }
};

const AG_REQUIREMENTS = {
  'A': { name: 'History/Social Science', needed: 2, short: 'History' },
  'B': { name: 'English', needed: 4, short: 'English' },
  'C': { name: 'Mathematics', needed: 3, short: 'Math' },
  'D': { name: 'Laboratory Science', needed: 2, short: 'Science' },
  'E': { name: 'Language Other Than English', needed: 2, short: 'Language' },
  'F': { name: 'Visual & Performing Arts', needed: 1, short: 'Arts' },
  'G': { name: 'College Prep Elective', needed: 1, short: 'Elective' }
};

const GRADE_OPTIONS = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];

function App() {
  const [courses, setCourses] = useState([]);
  const [showAddCourse, setShowAddCourse] = useState(null); // null or { year, semester, slot }
  const [selectedCategory, setSelectedCategory] = useState(''); // Track selected category
  const [newCourse, setNewCourse] = useState({ courseId: '' });
  const [error, setError] = useState(null);

  // Calculate Westview graduation progress
  const westviewProgress = useMemo(() => {
    const progress = {};
    Object.entries(WESTVIEW_REQUIREMENTS).forEach(([name, req]) => {
      const relevantCourses = courses.filter(c => {
        const info = COURSE_CATALOG[c.courseId];
        return info && req.pathways.includes(info.pathway);
      });

      const credits = relevantCourses.reduce((sum, c) => sum + COURSE_CATALOG[c.courseId].credits, 0);

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

      // Check for missing English in completed years
      const hasCoursesInBothSemesters = fallCourses.length > 0 && springCourses.length > 0;
      if (hasCoursesInBothSemesters) {
        const allYearCourses = [...fallCourses, ...springCourses];
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
      }
    });

    return validation;
  }, [courses]);

  const englishWarnings = scheduleValidation.warnings
    .filter(w => w.type === 'missing_english')
    .map(w => w.year);

  const addCourse = (year, semester) => {
    if (!newCourse.courseId) return;

    const courseInfo = COURSE_CATALOG[newCourse.courseId];
    if (!courseInfo) return;

    setError(null);

    // Check for duplicate course in same semester
    const semesterCourses = getCoursesForSemester(year, semester);
    const alreadyHasCourse = semesterCourses.some(c => c.courseId === newCourse.courseId);
    if (alreadyHasCourse) {
      setError('This course is already in this semester');
      return;
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
  };

  const removeCourse = (id) => {
    setCourses(courses.filter(c => c.id !== id));
  };

  // Get unique pathways for course selection
  const pathways = useMemo(() => {
    const uniquePathways = [...new Set(Object.values(COURSE_CATALOG).map(c => c.pathway))];
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
          <h1 className="text-3xl font-bold text-gray-900">Westview High School Course Planner</h1>
          <p className="text-gray-600 mt-1">Plan your path through high school</p>
        </div>
      </header>

      <div className="max-w-[1800px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Main Content - 4-Year Grid */}
          <div className="lg:col-span-3">

            {/* Schedule Validation Errors */}
            {scheduleValidation.errors.length > 0 && (
              <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
                  <div>
                    <h3 className="font-bold text-red-900 text-lg">Schedule Issues Detected</h3>
                    <div className="mt-2 space-y-1">
                      {scheduleValidation.errors.map((err, idx) => (
                        <p key={idx} className="text-red-800">
                          Grade {err.year}: {err.message}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* English Warning */}
            {englishWarnings.length > 0 && (
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={24} />
                  <div>
                    <h3 className="font-bold text-yellow-900 text-lg">English Required Every Year</h3>
                    <p className="text-yellow-800 mt-1">
                      Missing English in Grade{englishWarnings.length > 1 ? 's' : ''}: {englishWarnings.join(', ')}
                    </p>
                  </div>
                </div>
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

                        return (
                          <div key={semester} className="p-5">
                            <h4 className="font-bold text-gray-700 mb-4 text-base">
                              {semester} {displayYear}
                            </h4>

                          {/* 6 Course Slots */}
                          <div className="space-y-2">
                            {slots.map((course, slotIndex) => {
                              const isAddingHere = showAddCourse?.year === year && showAddCourse?.semester === semester && showAddCourse?.slot === slotIndex;

                              if (course) {
                                // Filled slot with course
                                const info = COURSE_CATALOG[course.courseId];
                                const isYearLong = info.term_length === 'yearlong';
                                return (
                                  <div key={course.id} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors border border-gray-200">
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

                                    {/* Step 1: Select Pathway */}
                                    {!selectedCategory ? (
                                      <>
                                        <p className="text-xs text-gray-600 mb-2 font-medium">Select a subject:</p>
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                          {pathways.map(pathway => (
                                            <button
                                              key={pathway}
                                              onClick={() => setSelectedCategory(pathway)}
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
                                            onClick={() => setSelectedCategory('')}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                          >
                                            ← Change Subject
                                          </button>
                                        </div>
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
                                                      {course.full_name}
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
                                                        {course.full_name}
                                                      </option>
                                                    ))}
                                                  </optgroup>
                                                ));
                                            })()
                                          ) : (
                                            // Regular list for other pathways
                                            coursesInPathway.map(course => (
                                              <option key={course.id} value={course.id}>
                                                {course.full_name}
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
                                            }}
                                            className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded hover:bg-gray-300 text-sm font-medium"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                );
                              } else {
                                // Empty slot
                                return (
                                  <button
                                    key={`slot-${slotIndex}`}
                                    onClick={() => {
                                      setShowAddCourse({ year, semester, slot: slotIndex });
                                      setSelectedCategory('');
                                      setNewCourse({ courseId: '' });
                                    }}
                                    className="w-full bg-white rounded-lg p-3 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600 text-sm font-medium flex items-center justify-center min-h-[56px]"
                                  >
                                    <Plus size={18} className="mr-1" />
                                    Add Course
                                  </button>
                                );
                              }
                            })}
                          </div>
                        </div>
                        );
                      })}
                    </div>
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
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
