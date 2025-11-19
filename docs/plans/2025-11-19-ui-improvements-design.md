# UI Improvements Design
**Date:** November 19, 2025
**Status:** In Progress (Part 1 Complete)

## Overview
Redesign the Westview Course Planner interface to reduce eye strain, improve visual consistency, and simplify the header navigation.

## Goals
1. Create a warmer, more eye-friendly color scheme
2. Standardize spacing throughout the interface
3. Simplify header to essential controls only
4. Maintain readability and accessibility

## Design Decisions

### 1. Background Color & Visual Foundation ✓ APPROVED

**Objective:** Reduce eye strain and create a warmer, more inviting interface while maintaining readability.

**Background Color Scheme:**
- **Page background:** Soft cream `#FAF9F6` (warm neutral, easy on eyes)
- **Course cards:** Keep white `#FFFFFF` for contrast and readability
- **Card shadows:** Enhance from `shadow-sm` to `shadow-md` for better separation against cream background

**Rationale:**
The cream background creates a paper-like, calm atmosphere that's significantly easier on the eyes during extended planning sessions. By keeping cards white, we maintain excellent contrast for reading course names and information. This is a minimal change with maximum impact.

**Implementation:**
- Apply `bg-[#FAF9F6]` to main page container (likely the outermost div in App.jsx)
- Keep existing card styling with `bg-white`
- Update card shadow classes from `shadow-sm` to `shadow-md`
- Blue progress bar at top remains unchanged (blue on cream provides good contrast)

### 2. Header Simplification (TO BE DETAILED)

**Key Requirements:**
- Remove "Planning Mode" toggle button entirely
- Keep "Clear All Courses" as standalone visible button (important destructive action)
- Move all other controls into a settings menu (gear icon)
- Left-align layout: Title/logo on left, buttons on right

### 3. Spacing & Consistency (TO BE DETAILED)

**Problem Areas Identified:**
- Header buttons have inconsistent sizes and spacing
- Need uniform spacing system throughout interface
- Areas to standardize:
  - Course card padding vs spacing between cards
  - Gap between quarters within a term
  - Gap between terms (Fall/Spring)
  - Gap between year sections (Grade 9, 10, 11, 12)

### 4. Auto-Suggest Clarity (TO BE DETAILED)

**Current behavior:** Auto-suggest fills courses for entire year at once (not per quarter)
**Need to:** Make this clearer in the UI/button text

## Next Steps

1. **Complete design sections:**
   - Header Simplification details
   - Spacing system specifications
   - Auto-suggest UI improvements

2. **Create implementation plan:**
   - Break down into specific file changes
   - Identify Tailwind classes to update
   - Plan component restructuring if needed

3. **Implementation:**
   - Apply cream background color
   - Restructure header
   - Standardize spacing with design system
   - Update auto-suggest button text/behavior

## Notes

- Design brainstorming session conducted with user on 2025-11-19
- User provided screenshot showing current interface state
- Focus on minimal, high-impact changes
- Maintain existing functionality while improving visual consistency
