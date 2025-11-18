import React, { useState, useMemo } from 'react';
import { Plus, CheckCircle2, AlertCircle, Circle, GraduationCap, Award } from 'lucide-react';

// Course catalog - same data, new design
const COURSE_CATALOG = {
  'MATH-I': { name: 'Integrated Math I', credits: 10, ag: 'C', category: 'Math' },
  'MATH-II': { name: 'Integrated Math II', credits: 10, ag: 'C', category: 'Math' },
  'MATH-III': { name: 'Integrated Math III', credits: 10, ag: 'C', category: 'Math' },
  'AP-PRECALC': { name: 'AP Pre-Calculus', credits: 10, ag: 'C', category: 'Math', ap: true, yearLong: true },
  'AP-CALC-AB': { name: 'AP Calculus AB', credits: 10, ag: 'C', category: 'Math', ap: true, yearLong: true },
  'AP-CALC-BC': { name: 'AP Calculus BC', credits: 10, ag: 'C', category: 'Math', ap: true },
  'AP-STATS': { name: 'AP Statistics', credits: 10, ag: 'C', category: 'Math', ap: true, yearLong: true },
  'ENG-1-2': { name: 'English 1-2', credits: 10, ag: 'B', category: 'English' },
  'ENG-3-4': { name: 'English 3-4', credits: 10, ag: 'B', category: 'English' },
  'ENG-AM-LIT': { name: 'American Literature', credits: 10, ag: 'B', category: 'English' },
  'AP-ENG-LANG': { name: 'AP English Language', credits: 10, ag: 'B', category: 'English', ap: true },
  'AP-ENG-LIT': { name: 'AP English Literature', credits: 10, ag: 'B', category: 'English', ap: true, yearLong: true },
  'BIO': { name: 'Biology', credits: 10, ag: 'D', category: 'Life Science' },
  'CHEM': { name: 'Chemistry', credits: 10, ag: 'D', category: 'Physical Science' },
  'PHYSICS': { name: 'Physics', credits: 10, ag: 'D', category: 'Physical Science' },
  'AP-BIO': { name: 'AP Biology', credits: 10, ag: 'D', category: 'Life Science', ap: true, yearLong: true },
  'AP-CHEM': { name: 'AP Chemistry', credits: 10, ag: 'D', category: 'Physical Science', ap: true, yearLong: true },
  'AP-PHYSICS': { name: 'AP Physics', credits: 10, ag: 'D', category: 'Physical Science', ap: true, yearLong: true },
  'WORLD-HIST': { name: 'World History', credits: 10, ag: 'A', category: 'History' },
  'US-HIST': { name: 'US History', credits: 10, ag: 'A', category: 'History' },
  'AP-WORLD': { name: 'AP World History', credits: 10, ag: 'A', category: 'History', ap: true, yearLong: true },
  'AP-US-HIST': { name: 'AP US History', credits: 10, ag: 'A', category: 'History', ap: true, yearLong: true },
  'CIVICS-ECON': { name: 'Civics/Economics', credits: 10, ag: 'A', category: 'Social Science' },
  'AP-GOV': { name: 'AP U.S. Government', credits: 10, ag: 'A', category: 'Social Science', ap: true, yearLong: true },
  'SPAN-1-2': { name: 'Spanish 1-2', credits: 10, ag: 'E', category: 'Foreign Language', years: 1 },
  'SPAN-3-4': { name: 'Spanish 3-4', credits: 10, ag: 'E', category: 'Foreign Language', years: 1 },
  'SPAN-5-6': { name: 'Spanish 5-6', credits: 10, ag: 'E', category: 'Foreign Language', years: 3 },
  'AP-SPAN': { name: 'AP Spanish Language', credits: 10, ag: 'E', category: 'Foreign Language', ap: true, yearLong: true },
  'FRENCH-1-2': { name: 'French 1-2', credits: 10, ag: 'E', category: 'Foreign Language', years: 1 },
  'FRENCH-3-4': { name: 'French 3-4', credits: 10, ag: 'E', category: 'Foreign Language', years: 1 },
  'CERAMICS': { name: 'Ceramics', credits: 10, ag: 'F', category: 'Visual Arts' },
  'DRAMA-1-2': { name: 'Drama 1-2', credits: 10, ag: 'F', category: 'Performing Arts' },
  'BAND': { name: 'Band', credits: 10, ag: 'F', category: 'Performing Arts' },
  'AP-COMP-SCI': { name: 'AP Computer Science', credits: 10, ag: 'G', category: 'Elective', ap: true, yearLong: true },
  'PLTW-IED': { name: 'PLTW Engineering', credits: 10, ag: 'G', category: 'Elective' },
  'ENS-1-2': { name: 'PE/Health', credits: 10, ag: null, category: 'PE' },
  'ENS-3-4': { name: 'PE', credits: 10, ag: null, category: 'PE' },
  'ACAD-TUTOR': { name: 'Academic Tutor', credits: 5, ag: null, category: 'Elective', schoolService: true },
  'LIB-TA': { name: 'Library TA', credits: 5, ag: null, category: 'Elective', schoolService: true },
  'WORK-EXP': { name: 'Work Experience', credits: 10, ag: null, category: 'Elective', schoolService: true, workExperience: true }
};

const WESTVIEW_REQUIREMENTS = {
  'English': { needed: 40, categories: ['English'] },
  'Math': { needed: 30, categories: ['Math'] },
  'Science': { needed: 30, categories: ['Life Science', 'Physical Science'] },
  'History': { needed: 30, categories: ['History', 'Social Science'] },
  'PE': { needed: 20, categories: ['PE'] },
  'Arts': { needed: 10, categories: ['Visual Arts', 'Performing Arts'] },
  'Electives': { needed: 70, categories: ['Elective'] }
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
  const [showAddCourse, setShowAddCourse] = useState(null); // null or { year, semester }
  const [newCourse, setNewCourse] = useState({ courseId: '' });
  const [error, setError] = useState(null);

  // Calculate Westview graduation progress
  const westviewProgress = useMemo(() => {
    const progress = {};
    Object.entries(WESTVIEW_REQUIREMENTS).forEach(([name, req]) => {
      const relevantCourses = courses.filter(c => {
        const info = COURSE_CATALOG[c.courseId];
        return req.categories.includes(info.category);
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

  // Check for missing English in completed years
  const englishWarnings = useMemo(() => {
    const warnings = [];
    ['9', '10', '11', '12'].forEach(year => {
      const fallCourses = getCoursesForSemester(year, 'Fall');
      const springCourses = getCoursesForSemester(year, 'Spring');

      // Consider a year "completed" if it has courses in both Fall and Spring
      const hasCoursesInBothSemesters = fallCourses.length > 0 && springCourses.length > 0;

      if (hasCoursesInBothSemesters) {
        const allYearCourses = [...fallCourses, ...springCourses];
        const hasEnglish = allYearCourses.some(c => {
          const info = COURSE_CATALOG[c.courseId];
          return info.category === 'English';
        });

        if (!hasEnglish) {
          warnings.push(year);
        }
      }
    });
    return warnings;
  }, [courses]);

  // Calculate UC/CSU progress
  const agProgress = useMemo(() => {
    const progress = {};
    Object.keys(AG_REQUIREMENTS).forEach(cat => {
      const relevantCourses = courses.filter(c => {
        const info = COURSE_CATALOG[c.courseId];
        return info.ag === cat;
      });

      let years = cat === 'E'
        ? relevantCourses.reduce((sum, c) => sum + (COURSE_CATALOG[c.courseId].years || 1), 0)
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

  // Get courses for a specific semester
  const getCoursesForSemester = (year, semester) => {
    return courses.filter(c => c.year === year && c.semester === semester);
  };

  const addCourse = (year, semester) => {
    if (!newCourse.courseId) return;

    const courseInfo = COURSE_CATALOG[newCourse.courseId];
    setError(null);

    // Check for duplicate course in same semester
    const semesterCourses = getCoursesForSemester(year, semester);
    const alreadyHasCourse = semesterCourses.some(c => c.courseId === newCourse.courseId);
    if (alreadyHasCourse) {
      setError('This course is already in this semester');
      return;
    }

    // Year-long validation
    if (courseInfo.yearLong && semester === 'Spring') {
      setError('Year-long courses must start in Fall');
      return;
    }

    // Check if year-long course would duplicate in Spring semester
    if (courseInfo.yearLong && semester === 'Fall') {
      const springSemesterCourses = getCoursesForSemester(year, 'Spring');
      const alreadyInSpring = springSemesterCourses.some(c => c.courseId === newCourse.courseId);
      if (alreadyInSpring) {
        setError('This year-long course is already in Spring semester');
        return;
      }
    }

    // School service validation
    if (courseInfo.schoolService) {
      const schoolServiceInSem = semesterCourses.filter(c => COURSE_CATALOG[c.courseId].schoolService);
      if (schoolServiceInSem.length > 0) {
        setError('Only 1 school service course per semester');
        return;
      }
    }

    // Add course(s)
    if (courseInfo.yearLong && semester === 'Fall') {
      const fall = { ...newCourse, id: Date.now(), year, semester: 'Fall' };
      const spring = { ...newCourse, id: Date.now() + 1, year, semester: 'Spring' };
      setCourses([...courses, fall, spring]);
    } else {
      setCourses([...courses, { ...newCourse, id: Date.now(), year, semester }]);
    }

    setNewCourse({ courseId: '' });
    setShowAddCourse(null);
  };

  const removeCourse = (id) => {
    setCourses(courses.filter(c => c.id !== id));
  };

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
              {['9', '10', '11', '12'].map(year => (
                <div key={year} className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                  <div className="bg-gray-100 px-6 py-4 border-b-2 border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900">Grade {year}</h3>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-gray-200">
                    {['Fall', 'Spring'].map(semester => {
                      const semesterCourses = getCoursesForSemester(year, semester);
                      const slots = Array.from({ length: 6 }, (_, i) => semesterCourses[i] || null);

                      return (
                        <div key={semester} className="p-5">
                          <h4 className="font-bold text-gray-700 mb-4 text-base">{semester}</h4>

                          {/* 6 Course Slots */}
                          <div className="space-y-2">
                            {slots.map((course, slotIndex) => {
                              const isAddingHere = showAddCourse?.year === year && showAddCourse?.semester === semester && showAddCourse?.slot === slotIndex;

                              if (course) {
                                // Filled slot with course
                                const info = COURSE_CATALOG[course.courseId];
                                return (
                                  <div key={course.id} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors border border-gray-200">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          {info.ap && <Award className="text-purple-600 flex-shrink-0" size={16} />}
                                          <div className="font-medium text-base text-gray-900 truncate">{info.name}</div>
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">
                                          {info.ag && (
                                            <span className="text-blue-600 font-medium">
                                              {AG_REQUIREMENTS[info.ag].short}
                                            </span>
                                          )}
                                          {info.ag && ' • '}{info.credits} cr
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
                                    <select
                                      value={newCourse.courseId}
                                      onChange={(e) => setNewCourse({ courseId: e.target.value })}
                                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-2"
                                      autoFocus
                                    >
                                      <option value="">Select course...</option>
                                      {Object.entries(COURSE_CATALOG).map(([id, course]) => (
                                        <option key={id} value={id}>
                                          {course.name} {course.ag ? `(${course.ag})` : ''}
                                        </option>
                                      ))}
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
                                        onClick={() => setShowAddCourse(null)}
                                        className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded hover:bg-gray-300 text-sm font-medium"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                );
                              } else {
                                // Empty slot
                                return (
                                  <button
                                    key={`slot-${slotIndex}`}
                                    onClick={() => setShowAddCourse({ year, semester, slot: slotIndex })}
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
              ))}
            </div>
          </div>

          {/* Sidebar - Requirements */}
          <div className="space-y-6">
            {/* Westview Graduation Requirements */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Westview Graduation</h3>
              <p className="text-sm text-gray-600 mb-4">230 credits required</p>
              <div className="space-y-4">
                {Object.entries(WESTVIEW_REQUIREMENTS).map(([name, req]) => {
                  const prog = westviewProgress[name];
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
