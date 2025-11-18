import React, { useState, useMemo } from 'react';
import { Search, BookOpen, Award, GraduationCap, ArrowRight } from 'lucide-react';
import {
  loadCourseCatalog,
  createCourseLookup,
  getUniquePathways,
  getCoursesByPathway,
  searchCourses,
  getCourseSequence,
  isYearLong,
  isAPorHonors,
} from '../utils/courseUtils';

/**
 * Course Explorer Component
 *
 * This component demonstrates how to use the new course schema.
 * It provides a UI for browsing and searching courses.
 */
export default function CourseExplorer() {
  const catalog = useMemo(() => loadCourseCatalog(), []);
  const courseLookup = useMemo(() => createCourseLookup(catalog.courses), [catalog]);
  const pathways = useMemo(() => getUniquePathways(catalog.courses), [catalog]);

  const [selectedPathway, setSelectedPathway] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Filter courses based on pathway and search query
  const filteredCourses = useMemo(() => {
    let courses = catalog.courses;

    // Filter by pathway
    if (selectedPathway !== 'all') {
      courses = getCoursesByPathway(courses, selectedPathway);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      courses = searchCourses(courses, searchQuery);
    }

    return courses;
  }, [catalog.courses, selectedPathway, searchQuery]);

  // Get course sequence if a course is selected
  const courseSequence = useMemo(() => {
    if (selectedCourse) {
      return getCourseSequence(selectedCourse, courseLookup);
    }
    return [];
  }, [selectedCourse, courseLookup]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Course Explorer
          </h1>
          <p className="text-gray-600">
            Explore the {catalog.generated_for} catalog
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Schema Version: {catalog.schema_version}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Filters and Search */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Search</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Pathway</h2>
              <select
                value={selectedPathway}
                onChange={(e) => setSelectedPathway(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Pathways</option>
                {pathways.map(pathway => (
                  <option key={pathway} value={pathway}>
                    {pathway}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Statistics</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Courses:</span>
                  <span className="font-semibold">{catalog.courses.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Filtered:</span>
                  <span className="font-semibold">{filteredCourses.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pathways:</span>
                  <span className="font-semibold">{pathways.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Course List and Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold">
                  Courses ({filteredCourses.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {filteredCourses.map(course => (
                  <button
                    key={course.course_id}
                    onClick={() => setSelectedCourse(course)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      selectedCourse?.course_id === course.course_id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {course.full_name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {course.pathway}
                          </span>
                          {course.uc_csu_category && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                              A-G: {course.uc_csu_category}
                            </span>
                          )}
                          {isAPorHonors(course) && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              AP/Honors
                            </span>
                          )}
                          {course.is_graduation_requirement && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded flex items-center gap-1">
                              <GraduationCap className="w-3 h-3" />
                              Required
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {course.credits} credits
                        </div>
                        <div className="text-xs text-gray-500">
                          {isYearLong(course) ? 'Year-long' : course.term_length}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Course Details Panel */}
            {selectedCourse && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {selectedCourse.full_name}
                </h2>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Course ID</h3>
                    <p className="text-gray-900">{selectedCourse.course_id}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Course Numbers</h3>
                    <p className="text-gray-900">{selectedCourse.course_numbers.join(', ')}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Credits</h3>
                    <p className="text-gray-900">{selectedCourse.credits} ({selectedCourse.credit_type})</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">UC/CSU Category</h3>
                    <p className="text-gray-900">{selectedCourse.uc_csu_category || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Grades Allowed</h3>
                    <p className="text-gray-900">{selectedCourse.grades_allowed.join(', ')}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Term Length</h3>
                    <p className="text-gray-900 capitalize">{selectedCourse.term_length}</p>
                  </div>
                </div>

                {selectedCourse.prerequisites_required.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">Required Prerequisites</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCourse.prerequisites_required.map(prereqId => (
                        <span
                          key={prereqId}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                        >
                          {courseLookup[prereqId]?.full_name || prereqId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCourse.prerequisites_recommended.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">Recommended Prerequisites</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCourse.prerequisites_recommended.map(prereqId => (
                        <span
                          key={prereqId}
                          className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
                        >
                          {courseLookup[prereqId]?.full_name || prereqId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {courseSequence.length > 1 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">Course Sequence</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {courseSequence.map((course, index) => (
                        <React.Fragment key={course.course_id}>
                          <span
                            className={`px-3 py-1 rounded ${
                              course.course_id === selectedCourse.course_id
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {course.full_name}
                          </span>
                          {index < courseSequence.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCourse.notes && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">Notes</h3>
                    <p className="text-gray-700 text-sm">{selectedCourse.notes}</p>
                  </div>
                )}

                {selectedCourse.semester_restrictions && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">Semester Restrictions</h3>
                    <p className="text-gray-900 capitalize">{selectedCourse.semester_restrictions}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
