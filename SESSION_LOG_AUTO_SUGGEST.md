# Auto-Suggest Bug Fixes - Session Log

**Date:** 2025-11-20
**Goal:** Fix auto-suggest feature for course recommendations

---

## Issues Reported by User

1. **Foreign Language Duplication:** Auto-suggest was adding 2 different foreign languages (Spanish AND Chinese) in the same semester for Year 1
2. **Blank Semester Bug:** Year 2/3 could only auto-suggest one semester, not both (if Fall filled, Spring stayed blank and vice versa)
3. **PE Requirements Wrong:** PE being suggested for wrong years
4. **Year 1 Fall Only Suggests 2 Courses:** Should suggest 4 courses

---

## Fixes Applied

### 1. Foreign Language Duplication Bug ✅ FIXED
**Root Cause:** Elective "fill to target count" logic (App.jsx lines 2549-2600) was suggesting Foreign Language as filler without checking if one was already suggested.

**Fix:** Added `alreadySuggestedLanguage` check before allowing Foreign Language in elective suggestions.

**Location:** `src/App.jsx` lines 2549-2600

**User Confirmed:** Only sees Spanish 3-4 now, not multiple languages ✅

---

### 2. PE Requirements ✅ FIXED
**Requirements:**
- Year 1 Fall: ENS 3-4
- Year 1 Spring: ENS 1-2
- Years 2-3: NO PE
- Year 4: One PE class (not ENS)

**Fix:** Completely rewrote PE suggestion logic at lines 2069-2161.

**Location:** `src/App.jsx` lines 2069-2161

---

### 3. Math/AP Filtering Rules ✅ FIXED
**Rules Added:**
- Never suggest Integrated Math I or II in Year 12
- Never suggest AP classes in Year 1
- Suggest at most 2 AP classes per semester in Years 2-3

**Fix:** Added filtering logic at multiple locations:
- Lines 2172-2191: Math filtering
- Lines 2569-2600: AP count checking for electives

**Location:** `src/App.jsx`

---

### 4. Course Catalog Data Quality Issue ✅ FIXED
**Root Cause:** All Math and Science courses had incomplete `grades_allowed` arrays - only listed [9, 12] instead of [9, 10, 11, 12].

**Affected Courses:**
- INTEGRATED MATHEMATICS Ia-Ib, IIa-IIb, IIIa-IIIb
- All Chemistry courses
- All Biology courses
- All Physics courses
- 44 total courses updated

**Fix:** Ran `fix-grades-allowed.js` to update all Math and Science courses to include grades 10 and 11.

**Location:** `src/data/courses_complete.json`

**Before:**
```json
{
  "course_id": "...",
  "full_name": "INTEGRATED MATHEMATICS IIa-IIb",
  "grades_allowed": [9, 12]  // Missing 10, 11!
}
```

**After:**
```json
{
  "course_id": "...",
  "full_name": "INTEGRATED MATHEMATICS IIa-IIb",
  "grades_allowed": [9, 10, 11, 12]  // Fixed!
}
```

---

## Issues Still Outstanding ⚠️

### Year 2 Fall Suggesting Wrong Courses
**Current Behavior:**
- ENGLISH 3-4 ✅ Correct
- INTEGRATED MATHEMATICS Ia-Ib ❌ Should be IIa-IIb for Grade 10
- AP CHEMISTRY 3-4 ❌ Should be regular Chemistry
- HONORS WORLD HISTORY 1-2 ❌ Should be regular World History

**Problem:** Suggestion logic is picking the FIRST course in filtered lists instead of grade-appropriate courses:
- Math: Lines 2189-2191 prefer "INTEGRATED MATHEMATICS I" for all years except 12
- Science: No filtering for non-AP Chemistry
- History: No filtering for non-Honors World History

**Need to Fix:**
1. Math should suggest Integrated Math II for Grade 10, not Math I
2. Science should exclude AP/Honors when regular versions exist
3. History should exclude Honors when regular versions exist

---

## Test Files Created

All Playwright tests in project root:
- `test-autosuggest.js` - Initial test (couldn't find buttons)
- `test-year2-autosuggest.js` - Year 2 test attempt
- `debug-page.js` - Discovered buttons are "Auto-fill Fall/Spring Semester" not "Auto-Suggest"
- `test-year1-fall-fixed.js` - Working test for Year 1 Fall
- `test-year1-fall.js` - Original Year 1 Fall test
- `test-year2-fall.js` - Test for Year 2 Fall (fixed button index from 2 to 1)
- `test-year2-debug.js` - Debug Year 2 suggestions (fixed button index from 2 to 1)

**Important:** Button indices are:
- Index 0: Grade 9 (Year 1) Fall
- Index 1: Grade 10 (Year 2) Fall ← Correct for Year 2
- Index 2: Grade 11 (Year 3) Fall
- Index 3: Grade 12 (Year 4) Fall

---

## Key Code Locations

### Auto-Suggestion Logic
**Main Functions:**
- `generateCourseSuggestions(term)` - Lines 2018-2615 - Generates ALL suggestions for all years
- `suggestCoursesForTerm(year, term)` - Lines 2621-2715 - Filters and adds suggestions for specific year/term

**Core Course Suggestions:**
- English: Lines 2029-2067
- PE/ENS: Lines 2069-2161
- Math: Lines 2163-2202
- Science: Lines 2204-2252
- History: Lines 2254-2293

**Fill to Target Count (4 courses per semester for grades 9-11):**
- Foreign Language: Lines 2404-2478
- Fine Arts: Lines 2486-2507
- History/Social Science: Lines 2515-2548
- General Electives: Lines 2550-2615

---

## Course Naming Convention

**Important:** Course names like "English 1-2" mean 2 quarters in the SAME semester (Q1+Q2 OR Q3+Q4), NOT yearlong.

- "English 1-2" = English 1 (Q1 or Q3) + English 2 (Q2 or Q4) in same semester
- Most students take ONE English per year
- Core courses (English, Math, Science, History) check entire YEAR, not per term
- Elective fillers check per TERM

---

## User Preferences

- **Never ask to check localhost** - Always use Playwright to verify before asking user
- **Make changes in branches, not main** - All work should be on feature branches
- **No apologies** - Give correct solution, not quick solution
- **Use systematic-debugging skill** - Required by CLAUDE.md for all bugs

---

## Commands to Resume Work

```bash
# Check what courses Grade 10 has available
node check-grade10-all.js

# Test Year 2 Fall auto-fill
node test-year2-debug.js

# Test Year 1 Fall auto-fill
node test-year1-fall-fixed.js

# Start dev server
npm run dev
```

---

## Next Steps

1. Fix Math suggestion to use grade-appropriate level (Math II for Grade 10, not Math I)
2. Fix Science/History to prefer regular over AP/Honors when available
3. Test all 4 years × 2 semesters = 8 auto-fill scenarios
4. Verify PE requirements work correctly
5. Verify second semester auto-fill works (original blank semester bug)

---

## Files Modified

- `src/App.jsx` - Auto-fill logic fixes (PE, AP filtering, Foreign Language)
- `src/data/courses_complete.json` - Fixed grades_allowed for 44 Math/Science courses
