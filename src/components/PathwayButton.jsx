import React from 'react';

export function PathwayButton({ pathway, label, currentPathway, onToggle }) {
  const isSelected = currentPathway === pathway;

  return (
    <button
      onClick={() => onToggle(pathway)}
      className={`px-2 py-2 rounded text-xs font-medium transition-colors whitespace-normal ${
        isSelected
          ? 'bg-purple-600 text-white'
          : 'bg-white text-gray-700 hover:bg-purple-50 border border-gray-300'
      }`}
    >
      {label}
    </button>
  );
}
