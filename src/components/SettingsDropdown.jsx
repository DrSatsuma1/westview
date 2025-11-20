import React, { useState, useRef, useEffect } from 'react';
import { Settings, X } from 'lucide-react';

export function SettingsDropdown({
  gpaMode,
  setGpaMode,
  westviewGradOnly,
  setWestviewGradOnly,
  showTestScores,
  setShowTestScores,
  hideAPClasses,
  setHideAPClasses,
  hideSpecialEdClasses,
  setHideSpecialEdClasses,
  ctePathwayMode,
  setCtePathwayMode,
  ctePathways,
  testScoresRef
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const ctePathwayOptions = [
    { value: null, label: 'None' },
    { value: 'business', label: 'Business & Finance' },
    { value: 'engineering', label: 'Engineering & Architecture' },
    { value: 'health', label: 'Health Science & Medical Tech' },
    { value: 'manufacturing', label: 'Manufacturing & Product Development' },
    { value: 'marketing', label: 'Marketing, Sales & Service' },
    { value: 'production', label: 'Production Arts' },
    { value: 'public_safety', label: 'Public Safety' }
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 hover:opacity-70 transition-opacity"
        title="Settings"
      >
        <Settings className="text-slate-700" size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
          {/* Header */}
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-900">Settings</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={18} />
            </button>
          </div>

          {/* Planning Modes Section */}
          <div className="mb-4">
            <h4 className="text-xs font-bold text-gray-700 mb-2">Planning Modes</h4>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer">
                <span className="text-sm text-gray-900">GPA Mode</span>
                <input
                  type="checkbox"
                  checked={gpaMode}
                  onChange={(e) => setGpaMode(e.target.checked)}
                  className="w-4 h-4"
                />
              </label>
              <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer">
                <span className="text-sm text-gray-900">Ignore UC/CSU Requirements</span>
                <input
                  type="checkbox"
                  checked={westviewGradOnly}
                  onChange={(e) => setWestviewGradOnly(e.target.checked)}
                  className="w-4 h-4"
                />
              </label>
              <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer">
                <span className="text-sm text-gray-900">AP/IB/CLEP/A-Level Scores</span>
                <input
                  type="checkbox"
                  checked={showTestScores}
                  onChange={(e) => {
                    setShowTestScores(e.target.checked);
                    if (e.target.checked) {
                      setTimeout(() => {
                        testScoresRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                      }, 100);
                    }
                  }}
                  className="w-4 h-4"
                />
              </label>
            </div>
          </div>

          {/* Course Filters Section */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h4 className="text-xs font-bold text-gray-700 mb-2">Course Filters</h4>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer">
                <span className="text-sm text-gray-900">Hide AP Classes</span>
                <input
                  type="checkbox"
                  checked={hideAPClasses}
                  onChange={(e) => setHideAPClasses(e.target.checked)}
                  className="w-4 h-4"
                />
              </label>
              <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer">
                <span className="text-sm text-gray-900">Hide Special Ed Classes</span>
                <input
                  type="checkbox"
                  checked={hideSpecialEdClasses}
                  onChange={(e) => setHideSpecialEdClasses(e.target.checked)}
                  className="w-4 h-4"
                />
              </label>
            </div>
          </div>

          {/* CTE Pathways Section */}
          <div className="pb-4 border-b border-gray-200">
            <h4 className="text-xs font-bold text-gray-700 mb-2">CTE Pathways</h4>
            <select
              value={ctePathwayMode.pathway || ''}
              onChange={(e) => {
                const value = e.target.value;
                setCtePathwayMode(
                  value ? { enabled: true, pathway: value } : { enabled: false, pathway: null }
                );
              }}
              className="w-full p-2 border border-gray-300 rounded text-sm"
            >
              {ctePathwayOptions.map(option => (
                <option key={option.value || 'none'} value={option.value || ''}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Button */}
          <div className="mt-4">
            <button
              onClick={() => {
                if (window.confirm('Reset all settings to default values?')) {
                  setGpaMode(false);
                  setWestviewGradOnly(false);
                  setShowTestScores(false);
                  setHideAPClasses(false);
                  setHideSpecialEdClasses(false);
                  setCtePathwayMode({ enabled: false, pathway: null });
                }
              }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded text-sm font-medium transition-colors border border-slate-300"
            >
              Reset All Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
