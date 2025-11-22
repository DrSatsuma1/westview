/**
 * AddCourseForm Component
 *
 * Form for adding courses to a schedule slot.
 * Handles pathway selection, course search, and grouped dropdowns.
 */
import React from 'react';
import { WarningBanner } from '../ui/WarningBanner.jsx';
import { RECOMMENDED_9TH_GRADE } from '../../config';

/**
 * Check if a course is recommended for 9th grade
 */
function isRecommended9thGrade(courseName) {
  if (!courseName) return false;
  const upper = courseName.toUpperCase();
  return RECOMMENDED_9TH_GRADE.some(rec =>
    upper.includes(rec.toUpperCase())
  );
}

export function AddCourseForm({
  year,
  quarter,
  error,
  warning,
  selectedCategory,
  setSelectedCategory,
  newCourse,
  setNewCourse,
  coursesInPathway,
  pathways,
  hideAPClasses,
  hideSpecialEdClasses,
  searchQuery,
  setSearchQuery,
  searchResults,
  onAdd,
  onCancel
}) {
  return (
    <div className="bg-blue-50 rounded-lg p-3 border-2 border-blue-300">
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
                    setTimeout(() => onAdd(year, quarter), 0);
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
          <button
            onClick={onCancel}
            className="w-full bg-[#EDF2F7] text-[#718096] px-3 py-2 rounded hover:bg-[#E2E8F0] text-sm font-medium"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          {/* Step 2: Select or Search Course */}
          <div className="mb-2">
            <button
              onClick={() => {
                setSelectedCategory('');
                setNewCourse({ courseId: '' });
              }}
              className="text-blue-600 hover:text-blue-800 text-sm mb-2"
            >
              ← Back to pathways
            </button>
          </div>

          {selectedCategory === 'Search' ? (
            // Search mode
            <>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses..."
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-2"
                autoFocus
              />
              {searchQuery.length >= 2 && (
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded mb-2">
                  {searchResults.length > 0 ? (
                    searchResults.slice(0, 20).map(course => {
                      const isAP = course.full_name.toUpperCase().startsWith('AP ');
                      const isSpecialEd = course.full_name.startsWith('Special Ed');
                      const shouldDisable = (hideAPClasses && isAP) || (hideSpecialEdClasses && isSpecialEd);
                      return (
                        <button
                          key={course.id}
                          onClick={() => {
                            if (!shouldDisable) {
                              setNewCourse({ courseId: course.id });
                              setSearchQuery('');
                            }
                          }}
                          disabled={shouldDisable}
                          className={`w-full text-left px-3 py-2 text-sm border-b border-gray-100 last:border-b-0 ${
                            shouldDisable
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : newCourse.courseId === course.id
                              ? 'bg-blue-100 text-blue-800'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <span className="font-medium">{course.full_name}</span>
                          <span className="text-xs text-gray-500 ml-2">({course.pathway})</span>
                          {shouldDisable && <span className="text-xs ml-1">(Hidden)</span>}
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">No courses found</div>
                  )}
                </div>
              )}
              {newCourse.courseId && (
                <div className="mb-2 p-2 bg-blue-100 rounded text-sm">
                  Selected: {searchResults.find(c => c.id === newCourse.courseId)?.full_name || coursesInPathway.find(c => c.id === newCourse.courseId)?.full_name}
                </div>
              )}
            </>
          ) : (
            // Dropdown mode with grouped options
            <select
              value={newCourse.courseId}
              onChange={(e) => setNewCourse({ courseId: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-2"
            >
              <option value="">Select a course...</option>
              {selectedCategory === 'Foreign Language' ? (
                // Group Foreign Language by language
                <ForeignLanguageOptions
                  courses={coursesInPathway}
                  year={year}
                  hideAPClasses={hideAPClasses}
                />
              ) : selectedCategory === 'English' ? (
                // Group English courses by type
                <EnglishOptions
                  courses={coursesInPathway}
                  year={year}
                  hideAPClasses={hideAPClasses}
                  hideSpecialEdClasses={hideSpecialEdClasses}
                />
              ) : selectedCategory === 'Electives' || selectedCategory === 'CTE' ? (
                // Group Electives and CTE by subject
                <ElectivesOptions
                  courses={coursesInPathway}
                  year={year}
                  hideAPClasses={hideAPClasses}
                  hideSpecialEdClasses={hideSpecialEdClasses}
                />
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
                      {course.full_name}{year === '9' && isRecommended9thGrade(course.full_name) ? ' ⭐ Recommended' : ''}{shouldDisable ? ' (Hidden)' : ''}
                    </option>
                  );
                })
              )}
            </select>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => onAdd(year, quarter)}
              disabled={!newCourse.courseId}
              className="flex-1 bg-[#2B6CB0] text-white px-3 py-2 rounded hover:bg-[#1E4E8C] text-sm font-medium disabled:bg-gray-300"
            >
              Add
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-[#EDF2F7] text-[#718096] px-3 py-2 rounded hover:bg-[#E2E8F0] text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Foreign Language grouped options
 */
function ForeignLanguageOptions({ courses, year, hideAPClasses }) {
  const grouped = {};
  courses.forEach(course => {
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
          {course.full_name}{year === '9' && isRecommended9thGrade(course.full_name) ? ' ⭐ Recommended' : ''}
        </option>
      ))}
    </optgroup>
  ));
}

/**
 * English grouped options
 */
function EnglishOptions({ courses, year, hideAPClasses, hideSpecialEdClasses }) {
  const grouped = {
    'English': [],
    'Writing': [],
    'Literature': [],
    'English Language Learner (ELL)': [],
    'Special Education': []
  };

  courses.forEach(course => {
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
              {course.full_name}{year === '9' && isRecommended9thGrade(course.full_name) ? ' ⭐ Recommended' : ''}{shouldDisable ? ' (Hidden)' : ''}
            </option>
          );
        })}
      </optgroup>
    ));
}

/**
 * Electives/CTE grouped options
 */
function ElectivesOptions({ courses, year, hideAPClasses, hideSpecialEdClasses }) {
  const grouped = {
    'Journalism': [],
    'AVID': [],
    'PLTW Engineering': [],
    'PLTW Biomedical': [],
    'Computer Science': [],
    'Other': []
  };

  courses.forEach(course => {
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
              {course.full_name}{year === '9' && isRecommended9thGrade(course.full_name) ? ' ⭐ Recommended' : ''}{shouldDisable ? ' (Hidden)' : ''}
            </option>
          );
        })}
      </optgroup>
    ));
}
