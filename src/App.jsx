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
  const [selectedYear, setSelectedYear] = useState('9');
  const [selectedSemester, setSelectedSemester] = useState('Fall');
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({ courseId: '', grade: 'A' });
  const [error, setError] = useState(null);

  // Calculate UC/CSU progress
  const agProgress = useMemo(() => {
    const progress = {};
    Object.keys(AG_REQUIREMENTS).forEach(cat => {
      const relevantCourses = courses.filter(c => {
        const info = COURSE_CATALOG[c.courseId];
        return info.ag === cat && ['A', 'B', 'C'].includes(c.grade[0]);
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

  // Get courses for selected semester
  const semesterCourses = courses.filter(
    c => c.year === selectedYear && c.semester === selectedSemester
  );

  const addCourse = () => {
    if (!newCourse.courseId) return;

    const courseInfo = COURSE_CATALOG[newCourse.courseId];
    setError(null);

    // Year-long validation
    if (courseInfo.yearLong && selectedSemester === 'Spring') {
      setError('Year-long courses must start in Fall');
      return;
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
    if (courseInfo.yearLong && selectedSemester === 'Fall') {
      const fall = { ...newCourse, id: Date.now(), year: selectedYear, semester: 'Fall' };
      const spring = { ...newCourse, id: Date.now() + 1, year: selectedYear, semester: 'Spring' };
      setCourses([...courses, fall, spring]);
    } else {
      setCourses([...courses, { ...newCourse, id: Date.now(), year: selectedYear, semester: selectedSemester }]);
    }

    setNewCourse({ courseId: '', grade: 'A' });
    setShowAddCourse(false);
  };

  const removeCourse = (id) => {
    setCourses(courses.filter(c => c.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900">UC/CSU Course Planner</h1>
          <p className="text-gray-600 mt-1">Westview High School</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content - Course Grid */}
          <div className="lg:col-span-2 space-y-6">

            {/* Status Bar */}
            <div className={`rounded-xl p-6 ${ucsuEligible ? 'bg-green-50 border-2 border-green-200' : 'bg-blue-50 border-2 border-blue-200'}`}>
              <div className="flex items-center gap-3">
                {ucsuEligible ? (
                  <>
                    <CheckCircle2 className="text-green-600" size={32} />
                    <div>
                      <h2 className="text-xl font-bold text-green-900">UC/CSU Eligible</h2>
                      <p className="text-green-700">All requirements met</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="text-blue-600" size={32} />
                    <div>
                      <h2 className="text-xl font-bold text-blue-900">Keep Going</h2>
                      <p className="text-blue-700">Add courses to meet UC/CSU requirements</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Year/Semester Selector */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['9', '10', '11', '12'].map(year => (
                      <button
                        key={year}
                        onClick={() => setSelectedYear(year)}
                        className={`py-2 px-4 rounded-lg font-semibold transition-colors ${
                          selectedYear === year
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Fall', 'Spring'].map(sem => (
                      <button
                        key={sem}
                        onClick={() => setSelectedSemester(sem)}
                        className={`py-2 px-4 rounded-lg font-semibold transition-colors ${
                          selectedSemester === sem
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {sem}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Courses for Selected Semester */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Grade {selectedYear} • {selectedSemester}
                </h3>
                <button
                  onClick={() => setShowAddCourse(!showAddCourse)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  <Plus size={20} />
                  Add Course
                </button>
              </div>

              {/* Add Course Form */}
              {showAddCourse && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4 space-y-3">
                  {error && (
                    <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={newCourse.courseId}
                      onChange={(e) => setNewCourse({ ...newCourse, courseId: e.target.value })}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Select course...</option>
                      {Object.entries(COURSE_CATALOG).map(([id, course]) => (
                        <option key={id} value={id}>
                          {course.name} {course.ag ? `(${course.ag})` : ''}
                        </option>
                      ))}
                    </select>
                    <select
                      value={newCourse.grade}
                      onChange={(e) => setNewCourse({ ...newCourse, grade: e.target.value })}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={addCourse}
                      disabled={!newCourse.courseId}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:bg-gray-300"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowAddCourse(false)}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Course List */}
              {semesterCourses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <GraduationCap size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>No courses added</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {semesterCourses.map(course => {
                    const info = COURSE_CATALOG[course.courseId];
                    const passes = ['A', 'B', 'C'].includes(course.grade[0]);
                    return (
                      <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          {info.ap && <Award className="text-purple-600" size={20} />}
                          <div>
                            <div className="font-semibold text-gray-900">{info.name}</div>
                            <div className="text-sm text-gray-600">
                              {info.ag && (
                                <span className={`${passes ? 'text-green-600' : 'text-red-600'} font-medium`}>
                                  {AG_REQUIREMENTS[info.ag].short} •
                                </span>
                              )}
                              {' '}{info.credits} credits
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg text-gray-900">{course.grade}</span>
                          <button
                            onClick={() => removeCourse(course.id)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Requirements */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">UC/CSU Requirements</h3>
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
