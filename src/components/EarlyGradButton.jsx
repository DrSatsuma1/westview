import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export function EarlyGradButton({ earlyGradMode, setEarlyGradMode, earlyGradEligibility }) {
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

  const getButtonText = () => {
    if (!earlyGradMode.enabled) return 'Standard 4 Year Track';
    if (earlyGradMode.targetYear === '3year') return 'Early Grad: 3 Years';
    if (earlyGradMode.targetYear === '3.5year') return 'Early Grad: 3.5 Years';
    return 'Standard 4 Year Track';
  };

  const getButtonStyles = () => {
    if (earlyGradMode.enabled) {
      return 'bg-green-100 border-green-400 text-green-900';
    }
    return 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors min-w-[180px] justify-center ${getButtonStyles()}`}
      >
        <span className="text-sm font-bold">{getButtonText()}</span>
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50">
          <button
            onClick={() => {
              setEarlyGradMode({ enabled: false, targetYear: null });
              setIsOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${
              !earlyGradMode.enabled ? 'bg-gray-100 font-medium' : ''
            }`}
          >
            Standard 4 Year Track
          </button>
          <button
            onClick={() => {
              setEarlyGradMode({ enabled: true, targetYear: '3.5year' });
              setIsOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${
              earlyGradMode.enabled && earlyGradMode.targetYear === '3.5year'
                ? 'bg-gray-100 font-medium'
                : ''
            }`}
          >
            3.5 Years (mid 12th grade)
          </button>
          <button
            onClick={() => {
              setEarlyGradMode({ enabled: true, targetYear: '3year' });
              setIsOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${
              earlyGradMode.enabled && earlyGradMode.targetYear === '3year'
                ? 'bg-gray-100 font-medium'
                : ''
            }`}
          >
            3 Years (end of 11th grade)
          </button>

          {/* Eligibility indicator */}
          {earlyGradMode.enabled && earlyGradEligibility.creditsThrough11 >= 170 && (
            <div className="mt-2 pt-2 border-t border-gray-200 px-3 py-2">
              <div className="text-xs font-bold text-green-700">
                ✓ Eligible: {earlyGradEligibility.creditsThrough11} credits through Grade 11
              </div>
              {!earlyGradEligibility.hasSeniorEnglish && (
                <div className="text-xs text-amber-600 mt-1">
                  ⚠ Need Senior English in Grade 11
                </div>
              )}
              {!earlyGradEligibility.hasCivicsEcon && (
                <div className="text-xs text-amber-600 mt-1">
                  ⚠ Need Civics/Economics in Grade 11
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
