# Session Notes - Architecture Cleanup Refactor

## IMPORTANT: Use Superpowers Skills

**Before doing ANY work, check available skills with the Skill tool:**
- `superpowers:systematic-debugging` - MANDATORY for any bug/error
- `superpowers:verification-before-completion` - Before claiming anything is fixed
- `superpowers:brainstorming` - Before implementing new features

## Refactoring Approach

We are using **domain-driven design** to break up a god component:

1. **Extract business logic to `/src/domain/`** - validation, calculations, eligibility checks
2. **Extract reusable UI to `/src/components/`** - organized by feature (course/, layout/, progress/, test-scores/, ui/)
3. **Extract stateful logic to `/src/hooks/`** - useLocalStorage, useSuggestionEngine
4. **Keep App.jsx as orchestrator** - state management, event handlers, component composition

**Goal:** App.jsx under 1,000 lines while maintaining functionality. NOT sacrificing code quality for line count.

## Current State (Nov 21, 2025)

**Branch:** `refactor/architecture-cleanup`
**App.jsx:** 1,009 lines (down from 2,140 - 53% reduction)

## What We Did

Refactored App.jsx from a 2,140-line god component to ~1,000 lines using domain-driven design:

1. Extracted domain logic to `/src/domain/`:
   - courseValidation.js - addCourse validation (394 lines)
   - creditCalculation.js - semester/year credit totals
   - Various progress calculators

2. Extracted components:
   - QuarterColumn.jsx - quarter course slots (185 lines)
   - CollegeCreditsSummary.jsx - test score credits table
   - AddCourseForm.jsx, EmptySlot.jsx, CourseCard.jsx (existed, integrated)
   - Header.jsx, SemesterControls.jsx

3. Extracted hooks:
   - useSuggestionEngine.js - auto-fill suggestion utilities

## Pending Tasks

### 1. BAND/YEARBOOK Suggestion Bug (PRIORITY)
User reports auto-fill still suggests BAND and YEARBOOK courses on localhost:3001.
- Check `src/utils/SuggestionEngine.js` for how suggestions are generated
- Check `src/config/index.js` for any BAND/YEARBOOK in RECOMMENDED_9TH_GRADE
- May need to add exclusion list for elective-only courses

### 2. Further Extractions (Optional)
- Drag-drop handlers (lines 322-416) → useDragAndDrop hook
- YearCard component (the whole grade card with semester labels)

## Key Files

- `/src/App.jsx` - Main component (1,009 lines)
- `/src/domain/courseValidation.js` - addCourse validation logic
- `/src/hooks/useSuggestionEngine.js` - Auto-fill utilities
- `/src/utils/SuggestionEngine.js` - Course suggestion engine
- `/src/config/index.js` - RECOMMENDED_9TH_GRADE and other configs

## Git Status

All changes committed and pushed to `origin/refactor/architecture-cleanup`.
Ready for PR when done.

## Commands

```bash
npm run dev      # Start dev server (port 3000 or 3001)
npm run build    # Verify no errors
wc -l src/App.jsx  # Check line count
```
