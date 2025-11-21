/**
 * TestScoreForm Component
 *
 * Purpose: Allows users to enter and manage AP/IB/CLEP/A-Level test scores
 * for tracking college credit eligibility and A-G requirement fulfillment.
 * Automatically categorizes tests into UC/CSU A-G categories based on subject.
 *
 * Used by: App.jsx (header section, conditionally shown when showTestScores is true)
 *
 * Props:
 *   - testScores (array): List of test scores
 *       Format: [{ type, subject, score, agCategory }, ...]
 *   - selectedTestType (string): Currently selected test type for the form
 *   - testSubjects (object): Available subjects by test type
 *       Format: { 'AP': ['AP Biology', ...], 'IB': [...], ... }
 *   - onAddScore (function): Callback when adding a new test score
 *       Signature: (type, subject, score, agCategory) => void
 *   - onRemoveScore (function): Callback when removing a test score
 *       Signature: (index) => void
 *   - onTestTypeChange (function): Callback when test type selection changes
 *       Signature: (testType) => void
 *   - testScoresRef (React ref): Ref for scrolling to this section
 *
 * Features:
 *   - Displays list of entered test scores with remove buttons
 *   - Shows A-G category badge for each test
 *   - Four test types: AP, IB, CLEP, A-Level
 *   - Dynamic subject dropdown based on selected test type
 *   - Score input validation (1-7 range)
 *   - Automatic A-G category detection based on subject keywords
 *   - Clears form after successful addition
 *
 * A-G Category Mapping:
 *   - A (History): History, Government, Geography subjects
 *   - B (English): English, Literature subjects
 *   - C (Math): Calculus, Statistics, Precalculus subjects
 *   - D (Science): Biology, Chemistry, Physics, Environmental subjects
 *   - E (Language): Spanish, French, Chinese, Japanese, German, Latin subjects
 *   - F (Arts): Art, Music, Theater, Dance subjects
 *   - G (Elective): Computer Science, Economics, Psychology subjects
 */

import React, { useState } from 'react';
import { Pencil } from 'lucide-react';

export function TestScoreForm({
  testScores,
  selectedTestType,
  testSubjects,
  onAddScore,
  onRemoveScore,
  onUpdateScore,
  onTestTypeChange,
  testScoresRef
}) {
  // Local state for form inputs
  const [subject, setSubject] = useState('');
  const [score, setScore] = useState('');
  const [editingIndex, setEditingIndex] = useState(null); // Track which test is being edited

  // Determine A-G category based on subject keywords
  const determineAGCategory = (subject) => {
    const subjectUpper = subject.toUpperCase();

    if (subjectUpper.includes('HISTORY') || subjectUpper.includes('GOVERNMENT') || subjectUpper.includes('GEOGRAPHY')) {
      return 'A';
    } else if (subjectUpper.includes('ENGLISH') || subjectUpper.includes('LITERATURE')) {
      return 'B';
    } else if (subjectUpper.includes('CALCULUS') || subjectUpper.includes('STATISTICS') || subjectUpper.includes('PRECALC')) {
      return 'C';
    } else if (subjectUpper.includes('BIOLOGY') || subjectUpper.includes('CHEMISTRY') || subjectUpper.includes('PHYSICS') || subjectUpper.includes('ENVIRONMENTAL')) {
      return 'D';
    } else if (subjectUpper.includes('SPANISH') || subjectUpper.includes('FRENCH') || subjectUpper.includes('CHINESE') || subjectUpper.includes('JAPANESE') || subjectUpper.includes('GERMAN') || subjectUpper.includes('LATIN')) {
      return 'E';
    } else if (subjectUpper.includes('ART') || subjectUpper.includes('MUSIC') || subjectUpper.includes('THEATER') || subjectUpper.includes('DANCE')) {
      return 'F';
    } else if (subjectUpper.includes('COMPUTER SCIENCE') || subjectUpper.includes('ECONOMICS') || subjectUpper.includes('PSYCHOLOGY')) {
      return 'G';
    }

    return null; // No A-G category
  };

  // Handle adding or updating a test score
  const handleAddScore = () => {
    if (selectedTestType && subject && score) {
      const agCategory = determineAGCategory(subject);

      if (editingIndex !== null) {
        // Update existing score
        onUpdateScore(editingIndex, selectedTestType, subject, parseInt(score), agCategory);
        setEditingIndex(null);
      } else {
        // Add new score
        onAddScore(selectedTestType, subject, parseInt(score), agCategory);
      }

      // Clear form
      setSubject('');
      setScore('');
      onTestTypeChange('');
    }
  };

  // Handle editing a test score - populate form with existing data
  const handleEdit = (idx) => {
    const test = testScores[idx];
    onTestTypeChange(test.type);
    setSubject(test.subject);
    setScore(test.score.toString());
    setEditingIndex(idx);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setSubject('');
    setScore('');
    onTestTypeChange('');
    setEditingIndex(null);
  };

  return (
    <div ref={testScoresRef} className="mt-4">
      <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
        <div className="text-sm font-bold text-gray-900 mb-3">AP/IB/CLEP/A-Level Test Scores</div>

        {/* Test Scores List */}
        <div className="space-y-2 mb-3">
          {testScores.map((test, idx) => (
            <div key={idx} className={`flex items-center justify-between rounded-lg p-2 border ${editingIndex === idx ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50 border-gray-200'}`}>
              <div className="text-sm">
                <span className="font-medium">{test.type} {test.subject}</span>
                <span className="text-gray-600 ml-2">Score: {test.score}</span>
                {test.agCategory && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                    A-G: {test.agCategory}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(idx)}
                  className="text-blue-600 hover:text-blue-700 p-1"
                  title="Edit"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => onRemoveScore(idx)}
                  className="text-red-600 hover:text-red-700 text-lg font-bold"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Test Form */}
        <div className="grid grid-cols-4 gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          {/* Test Type Selector */}
          <select
            value={selectedTestType}
            onChange={(e) => {
              onTestTypeChange(e.target.value);
              setSubject(''); // Clear subject when type changes
            }}
            className="text-xs border border-gray-300 rounded px-2 py-1.5"
          >
            <option value="">Type</option>
            <option value="AP">AP</option>
            <option value="IB">IB</option>
            <option value="CLEP">CLEP</option>
            <option value="A-Level">A-Level</option>
          </select>

          {/* Subject Selector (disabled until test type is selected) */}
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1.5"
            disabled={!selectedTestType}
          >
            <option value="">Subject</option>
            {selectedTestType && testSubjects[selectedTestType]?.map(subj => (
              <option key={subj} value={subj}>{subj}</option>
            ))}
          </select>

          {/* Score Input */}
          <select
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1.5"
          >
            <option value="">Score</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
          </select>

          {/* Add/Update Button */}
          <div className="flex gap-1">
            <button
              onClick={handleAddScore}
              className={`text-white text-xs font-medium rounded px-2 py-1.5 ${
                editingIndex !== null
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {editingIndex !== null ? 'Update' : 'Add'}
            </button>
            {editingIndex !== null && (
              <button
                onClick={handleCancelEdit}
                className="bg-gray-400 hover:bg-gray-500 text-white text-xs font-medium rounded px-2 py-1.5"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
