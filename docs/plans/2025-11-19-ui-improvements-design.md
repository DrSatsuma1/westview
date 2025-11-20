# UI Improvements Design
**Date:** November 19, 2025
**Status:** Design Complete - Ready for Implementation

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

### 2. Header Simplification ✓ DESIGNED

**Objective:** Reduce header clutter by moving most controls into a settings menu while keeping essential actions visible.

**Header Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Westview High School Course Planner                            │
│ Plan your path through high school                             │
│                                                                 │
│                    [Early Grad: Off ▼] [Clear All] [⚙️ Settings]│
└─────────────────────────────────────────────────────────────────┘
```

**Visible Controls (right-aligned):**
1. **Early Graduation Button** - Dropdown button showing current state
   - States: "Early Grad: Off", "Early Grad: 3 Years", "Early Grad: 3.5 Years"
   - Click reveals dropdown with three options
   - Green/blue styling when enabled, gray when off

2. **Clear All Courses** - Standalone red button
   - Destructive action stays prominent
   - Confirmation dialog on click (existing behavior)

3. **Settings Icon** - Gear icon (⚙️) opens settings dropdown

**Settings Dropdown Menu (300-400px wide):**

Organized in three sections with visual separators:

**Planning Modes**
- GPA Mode [toggle switch]
- Ignore UC/CSU Requirements [toggle switch]
- AP/IB/CLEP/A-Level Scores [toggle switch]

**Course Filters**
- Hide AP Classes [toggle switch]
- Hide Special Ed Classes [toggle switch]

**CTE Pathways**
- Dropdown selector: "Select CTE Pathway..."
- Options: Business & Finance, Engineering & Architecture, Health Science & Medical Tech, Manufacturing & Product Development, Marketing Sales & Service, Production Arts, Public Safety
- Shows "None" when no pathway selected

**Settings Menu Behavior:**
- Click gear icon → dropdown appears below/left-aligned to icon
- Click outside or X button to close
- Settings persist during session
- Dropdown has subtle shadow and border for depth

### 3. Spacing & Consistency ✓ DESIGNED

**Objective:** Standardize spacing throughout the interface using Tailwind's built-in scale for visual consistency and hierarchy.

**Spacing System:**
Use Tailwind's default spacing scale consistently:
- `gap-2` (8px) - Within related items
- `gap-4` (16px) - Between items
- `gap-6` (24px) - Between sections
- `gap-8` (32px) - Between major sections

**Course Grid Spacing Hierarchy:**
```
┌─ Grade 9 ─────────────────┐ ←─ gap-8 (32px) to Grade 10
│  ┌─ Fall ────────────┐    │
│  │ Q1    Q2          │    │ ←─ gap-4 (16px) between quarters
│  │ [Card] [Card]     │    │ ←─ gap-2 (8px) between cards
│  │ [Card] [Card]     │    │    p-3 (12px) card padding
│  └───────────────────┘    │
│         ↓ gap-6 (24px)    │
│  ┌─ Spring ──────────┐    │
│  │ Q3    Q4          │    │
│  └───────────────────┘    │
└────────────────────────────┘
```

**Specific Applications:**
- **Course cards:** `p-3` padding, `gap-2` between cards in same quarter
- **Quarters (Q1-Q2, Q3-Q4):** `gap-4` horizontal spacing
- **Semesters (Fall-Spring):** `gap-6` vertical spacing
- **Grade years (9-10-11-12):** `gap-8` vertical spacing
- **Card shadows:** Enhance from `shadow-sm` to `shadow-md` for better separation against cream background

**Header & Sidebar Spacing:**
- Header buttons: `gap-4` between buttons (Early Grad, Clear All, Settings)
- Sidebar requirement cards: `gap-6` between Westview/UC sections
- Card padding: `p-6` for requirement cards, `p-4` for smaller containers
- Settings dropdown: `p-4` overall, `gap-3` between sections

**Consistency Rules:**
- All toggle buttons use same size classes
- All cards use white background with consistent border radius `rounded-lg`
- All buttons use consistent hover states
- All dropdowns use consistent styling

### 4. Auto-Suggest Clarity ✓ DESIGNED

**Objective:** Make it clear that auto-suggest fills courses for an entire academic year (both Fall and Spring semesters), not individual quarters.

**Changes:**
1. **Button Text:** Change from "Auto-suggest" to "Auto-fill Year"
2. **Helper Text:** Add subtle gray text below button: "Suggests courses for Fall and Spring semesters"
3. **Behavior:** Keep existing functionality (fills both semesters at once)

**Rationale:** Users may expect "auto-suggest" to work per quarter, but it actually fills the entire year. Clearer labeling prevents confusion.

## Implementation Summary

All four design sections are complete and ready for implementation:

1. ✓ **Background Color** - Cream background (#FAF9F6), enhanced shadows
2. ✓ **Header Simplification** - Minimal header with settings dropdown
3. ✓ **Spacing & Consistency** - Tailwind scale with progressive hierarchy
4. ✓ **Auto-Suggest Clarity** - Renamed to "Auto-fill Year" with helper text

## Next Steps

1. **Create implementation plan** using superpowers:writing-plans skill
2. **Set up isolated workspace** using superpowers:using-git-worktrees
3. **Implement changes** following incremental-refactoring discipline
4. **Test and verify** all UI changes work correctly

## Notes

- Design brainstorming session conducted with user on 2025-11-19
- User provided screenshot showing current interface state
- Focus on minimal, high-impact changes
- Maintain existing functionality while improving visual consistency
