import React, { useState, useMemo } from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, XCircle, Plus, X } from 'lucide-react';

// Simplified Course Catalog from Westview High School
const COURSE_CATALOG = {
  // Mathematics (A-G Category: C)
  'MATH-I': { name: 'Integrated Math I', credits: 10, ag: 'C', category: 'Math' },
  'MATH-II': { name: 'Integrated Math II', credits: 10, ag: 'C', category: 'Math' },
  'MATH-III': { name: 'Integrated Math III', credits: 10, ag: 'C', category: 'Math' },
  'AP-PRECALC': { name: 'AP Pre-Calculus', credits: 10, ag: 'C', category: 'Math', ap: true },
  'AP-CALC-AB': { name: 'AP Calculus AB', credits: 10, ag: 'C', category: 'Math', ap: true },
  'AP-CALC-BC': { name: 'AP Calculus BC', credits: 10, ag: 'C', category: 'Math', ap: true },
  'AP-STATS': { name: 'AP Statistics', credits: 10, ag: 'C', category: 'Math', ap: true },
  
  // English (A-G Category: B)
  'ENG-1-2': { name: 'English 1-2', credits: 10, ag: 'B', category: 'English' },
  'ENG-3-4': { name: 'English 3-4', credits: 10, ag: 'B', category: 'English' },
  'ENG-AM-LIT': { name: 'American Literature', credits: 10, ag: 'B', category: 'English' },
  'AP-ENG-LANG': { name: 'AP English Language', credits: 10, ag: 'B', category: 'English', ap: true },
  'AP-ENG-LIT': { name: 'AP English Literature', credits: 10, ag: 'B', category: 'English', ap: true },
  
  // Science (A-G Category: D)
  'BIO': { name: 'Biology', credits: 10, ag: 'D', category: 'Life Science' },
  'CHEM': { name: 'Chemistry', credits: 10, ag: 'D', category: 'Physical Science' },
  'PHYSICS': { name: 'Physics', credits: 10, ag: 'D', category: 'Physical Science' },
  'AP-BIO': { name: 'AP Biology', credits: 10, ag: 'D', category: 'Life Science', ap: true },
  'AP-CHEM': { name: 'AP Chemistry', credits: 10, ag: 'D', category: 'Physical Science', ap: true },
  'AP-PHYSICS': { name: 'AP Physics', credits: 10, ag: 'D', category: 'Physical Science', ap: true },
  
  // History/Social Science (A-G Category: A)
  'WORLD-HIST': { name: 'World History', credits: 10, ag: 'A', category: 'History' },
  'US-HIST': { name: 'US History', credits: 10, ag: 'A', category: 'History' },
  'AP-WORLD': { name: 'AP World History', credits: 20, ag: 'A', category: 'History', ap: true },
  'AP-US-HIST': { name: 'AP US History', credits: 20, ag: 'A', category: 'History', ap: true },
  'CIVICS-ECON': { name: 'Civics/Economics', credits: 10, ag: 'A', category: 'Social Science' },
  
  // Foreign Language (A-G Category: E)
  'SPAN-1-2': { name: 'Spanish 1-2', credits: 10, ag: 'E', category: 'Foreign Language', years: 1 },
  'SPAN-3-4': { name: 'Spanish 3-4', credits: 10, ag: 'E', category: 'Foreign Language', years: 1 },
  'SPAN-5-6': { name: 'Spanish 5-6', credits: 10, ag: 'E', category: 'Foreign Language', years: 3 },
  'FRENCH-1-2': { name: 'French 1-2', credits: 10, ag: 'E', category: 'Foreign Language', years: 1 },
  'FRENCH-3-4': { name: 'French 3-4', credits: 10, ag: 'E', category: 'Foreign Language', years: 1 },
  
  // Visual & Performing Arts (A-G Category: F)
  'CERAMICS': { name: 'Ceramics', credits: 10, ag: 'F', category: 'Visual Arts' },
  'DRAMA-1-2': { name: 'Drama 1-2', credits: 10, ag: 'F', category: 'Performing Arts' },
  'BAND': { name: 'Band', credits: 10, ag: 'F', category: 'Performing Arts' },
  
  // College Prep Electives (A-G Category: G)
  'AP-COMP-SCI': { name: 'AP Computer Science', credits: 10, ag: 'G', category: 'Elective', ap: true },
  'PLTW-IED': { name: 'PLTW Engineering', credits: 10, ag: 'G', category: 'Elective' },
  
  // Non-A-G Courses
  'ENS-1-2': { name: 'ENS 1-2 (PE/Health)', credits: 10, ag: null, category: 'PE' },
  'ENS-3-4': { name: 'ENS 3-4 (PE)', credits: 10, ag: null, category: 'PE' }
};

const GRADE_OPTIONS = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];

// UC/CSU A-G Requirements
const AG_REQUIREMENTS = {
  'A': { name: 'History/Social Science', needed: 2, label: 'History' },
  'B': { name: 'English', needed: 4, label: 'English' },
  'C': { name: 'Mathematics', needed: 3, label: 'Math' },
  'D': { name: 'Laboratory Science', needed: 2, label: 'Science' },
  'E': { name: 'Language Other Than English', needed: 2, label: 'Foreign Language' },
  'F': { name: 'Visual & Performing Arts', needed: 1, label: 'Arts' },
  'G': { name: 'College Prep Elective', needed: 1, label: 'Elective' }
};

// Westview High School Graduation Requirements (in credits)
const HS_REQUIREMENTS = {
  'English': { needed: 40, label: 'English' },
  'Math': { needed: 30, label: 'Math' },
  'Life Science': { needed: 10, label: 'Science (Life)' },
  'Physical Science': { needed: 10, label: 'Science (Physical)' },
  'History': { needed: 30, label: 'History' },
  'Social Science': { needed: 5, label: 'Social Science' },
  'Foreign Language': { needed: 10, label: 'Foreign Language' },
  'Visual Arts': { needed: 10, label: 'Fine Arts' },
  'Performing Arts': { needed: 10, label: 'Fine Arts' },
  'PE': { needed: 25, label: 'PE/Health' },
  'Elective': { needed: 60, label: 'Electives' }
};

function App() {
  const [courses, setCourses] = useState([]);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({ courseId: '', grade: 'A' });

  // Calculate UC/CSU A-G progress
  const agProgress = useMemo(() => {
    const progress = {};
    Object.keys(AG_REQUIREMENTS).forEach(category => {
      const relevantCourses = courses.filter(c => {
        const courseInfo = COURSE_CATALOG[c.courseId];
        return courseInfo.ag === category && ['A', 'B', 'C'].includes(c.grade[0]); // C or better
      });
      
      let years = relevantCourses.length;
      
      // Special case: Spanish 5-6 counts as 3 years
      if (category === 'E') {
        years = relevantCourses.reduce((sum, c) => {
          const courseInfo = COURSE_CATALOG[c.courseId];
          return sum + (courseInfo.years || 1);
        }, 0);
      }
      
      progress[category] = {
        earned: years,
        needed: AG_REQUIREMENTS[category].needed,
        remaining: Math.max(0, AG_REQUIREMENTS[category].needed - years),
        met: years >= AG_REQUIREMENTS[category].needed
      };
    });
    return progress;
  }, [courses]);

  // Calculate HS graduation progress
  const hsProgress = useMemo(() => {
    const progress = {};
    Object.keys(HS_REQUIREMENTS).forEach(category => {
      const relevantCourses = courses.filter(c => {
        const courseInfo = COURSE_CATALOG[c.courseId];
        return courseInfo.category === category && c.grade !== 'F'; // D or better
      });
      
      const earned = relevantCourses.reduce((sum, c) => {
        const courseInfo = COURSE_CATALOG[c.courseId];
        return sum + courseInfo.credits;
      }, 0);
      
      progress[category] = {
        earned,
        needed: HS_REQUIREMENTS[category].needed,
        remaining: Math.max(0, HS_REQUIREMENTS[category].needed - earned),
        met: earned >= HS_REQUIREMENTS[category].needed
      };
    });
    
    const totalEarned = Object.values(progress).reduce((sum, p) => sum + p.earned, 0);
    progress['Total'] = {
      earned: totalEarned,
      needed: 230,
      remaining: Math.max(0, 230 - totalEarned),
      met: totalEarned >= 230
    };
    
    return progress;
  }, [courses]);

  // Check overall UC/CSU eligibility
  const ucsuEligible = useMemo(() => {
    return Object.values(agProgress).every(p => p.met);
  }, [agProgress]);

  // Get deficiencies
  const deficiencies = useMemo(() => {
    return Object.entries(agProgress)
      .filter(([_, progress]) => !progress.met)
      .map(([category, progress]) => ({
        category,
        name: AG_REQUIREMENTS[category].label,
        remaining: progress.remaining
      }));
  }, [agProgress]);

  const addCourse = () => {
    if (newCourse.courseId) {
      setCourses([...courses, { ...newCourse, id: Date.now() }]);
      setNewCourse({ courseId: '', grade: 'A' });
      setIsAddingCourse(false);
    }
  };

  const removeCourse = (id) => {
    setCourses(courses.filter(c => c.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            UC/CSU A-G Course Planner
          </h1>
          <p className="text-gray-600">Westview High School • Poway Unified School District</p>
        </div>

        {/* PRIORITY 1: UC/CSU DEFICIENCIES - Show problems first and largest */}
        {deficiencies.length > 0 && (
          <div className="bg-red-50 border-2 border-red-400 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="text-red-600 flex-shrink-0 mt-1" size={32} />
              <div>
                <h2 className="text-2xl font-bold text-red-900 mb-1">
                  NOT UC/CSU ELIGIBLE YET
                </h2>
                <p className="text-red-700 text-lg">
                  Your child needs more courses to qualify for UC/CSU admission:
                </p>
              </div>
            </div>
            
            <div className="space-y-3 ml-11">
              {deficiencies.map(def => (
                <div key={def.category} className="bg-white rounded-md p-4 border border-red-200">
                  <p className="text-xl font-semibold text-red-900">
                    {def.name}: Need {def.remaining} more year{def.remaining !== 1 ? 's' : ''}
                  </p>
                  <p className="text-gray-600 text-sm mt-1">
                    Must earn C or better
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUCCESS MESSAGE */}
        {ucsuEligible && (
          <div className="bg-green-50 border-2 border-green-400 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0" size={32} />
              <div>
                <h2 className="text-2xl font-bold text-green-900 mb-1">
                  UC/CSU ELIGIBLE! ✓
                </h2>
                <p className="text-green-700 text-lg">
                  Your child has completed all required courses for UC/CSU admission
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Course List */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Courses Completed</h2>
            <button
              onClick={() => setIsAddingCourse(!isAddingCourse)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold"
            >
              <Plus size={20} />
              Add Course
            </button>
          </div>

          {isAddingCourse && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">Add New Course</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={newCourse.courseId}
                  onChange={(e) => setNewCourse({ ...newCourse, courseId: e.target.value })}
                  className="border border-gray-300 rounded-md p-2"
                >
                  <option value="">Select a course...</option>
                  {Object.entries(COURSE_CATALOG).map(([id, course]) => (
                    <option key={id} value={id}>
                      {course.name} {course.ag ? `(${course.ag})` : ''}
                    </option>
                  ))}
                </select>
                
                <select
                  value={newCourse.grade}
                  onChange={(e) => setNewCourse({ ...newCourse, grade: e.target.value })}
                  className="border border-gray-300 rounded-md p-2"
                >
                  {GRADE_OPTIONS.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={addCourse}
                  disabled={!newCourse.courseId}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add Course
                </button>
                <button
                  onClick={() => setIsAddingCourse(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {courses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No courses added yet. Click "Add Course" to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {courses.map(course => {
                const courseInfo = COURSE_CATALOG[course.courseId];
                const passesUC = ['A', 'B', 'C'].includes(course.grade[0]);
                const passesHS = course.grade !== 'F';
                
                return (
                  <div key={course.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{courseInfo.name}</span>
                        {courseInfo.ap && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">AP</span>
                        )}
                        {courseInfo.ag && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {AG_REQUIREMENTS[courseInfo.ag].label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span className="text-gray-600">Grade: <strong>{course.grade}</strong></span>
                        <span className="text-gray-600">{courseInfo.credits} credits</span>
                        {courseInfo.ag && (
                          <span className={`font-semibold ${passesUC ? 'text-green-600' : 'text-red-600'}`}>
                            {passesUC ? '✓ Counts for UC/CSU' : '✗ Too low for UC/CSU (need C)'}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeCourse(course.id)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      <X size={20} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* UC/CSU Requirements Detail */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">UC/CSU A-G Requirements</h2>
          <p className="text-gray-600 mb-4">All courses must be completed with C or better</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(AG_REQUIREMENTS).map(([category, req]) => {
              const progress = agProgress[category];
              const percentage = (progress.earned / progress.needed) * 100;
              
              return (
                <div key={category} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-semibold text-gray-900">{req.label}</span>
                      <span className="text-gray-500 text-sm ml-2">
                        {progress.earned} / {progress.needed} years
                      </span>
                    </div>
                    {progress.met ? (
                      <CheckCircle className="text-green-600" size={24} />
                    ) : progress.earned > 0 ? (
                      <AlertCircle className="text-orange-500" size={24} />
                    ) : (
                      <XCircle className="text-red-500" size={24} />
                    )}
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        progress.met ? 'bg-green-500' : 
                        progress.earned > 0 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                  
                  {!progress.met && (
                    <p className="text-sm text-gray-600 mt-2">
                      Need {progress.remaining} more year{progress.remaining !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* High School Graduation Requirements */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Westview Graduation Requirements</h2>
          <p className="text-gray-600 mb-4">Minimum 230 credits needed • D or better to pass</p>
          
          <div className="mb-4 border-l-4 border-blue-600 bg-blue-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Credits</p>
                <p className="text-2xl font-bold text-gray-900">
                  {hsProgress['Total'].earned} / 230
                </p>
              </div>
              <div className="text-right">
                {hsProgress['Total'].met ? (
                  <span className="text-green-600 font-semibold flex items-center gap-2">
                    <CheckCircle size={24} />
                    Ready to Graduate
                  </span>
                ) : (
                  <span className="text-orange-600 font-semibold">
                    Need {hsProgress['Total'].remaining} more credits
                  </span>
                )}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${Math.min((hsProgress['Total'].earned / 230) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {Object.entries(HS_REQUIREMENTS).map(([category, req]) => {
              const progress = hsProgress[category];
              if (!progress) return null;
              
              return (
                <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <span className="text-gray-700">{req.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${progress.met ? 'text-green-600' : 'text-gray-900'}`}>
                      {progress.earned} / {progress.needed}
                    </span>
                    {progress.met ? (
                      <CheckCircle className="text-green-600" size={16} />
                    ) : (
                      <AlertCircle className="text-orange-500" size={16} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>UC/CSU A-G Planner • Westview High School • Poway Unified School District</p>
          <p className="mt-1">Helping students plan their path to California colleges</p>
        </div>
      </div>
    </div>
  );
}

export default App;
