# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ENFORCEMENT: Non-Negotiable Rules

**BEFORE making ANY code changes:**
1. Run `git branch --show-current` to check current branch
2. If on `main` → STOP and create a branch FIRST (`git checkout -b fix/descriptive-name`)
3. NEVER edit code while on main. No exceptions.

**Other mandatory rules:**
- If Claude sees any error → MUST use superpowers:systematic-debugging FIRST
- If Claude reads JSON → MUST verify structure with `cat file.json | head -20` FIRST
- When adding dependencies → ONLY use permissive licenses (MIT, Apache 2.0, BSD, ISC)
- NEVER use GPL/AGPL or revenue-sharing licenses (this is a commercial product)
- Prefer existing npm packages over writing code from scratch (saves tokens)

Violations of these rules = Claude is not following instructions

## Git Workflow

**ABSOLUTE RULE: NEVER commit to main. ALWAYS use a branch.**

This is not optional. This is not "for major changes only." This is for ALL changes.

**Before ANY code edit (even 1 line):**
```bash
git branch --show-current  # If this says "main", STOP
git checkout -b fix/short-description  # Create branch FIRST
```

**Branch naming:**
- `fix/` - Bug fixes
- `feature/` - New features
- `refactor/` - Code restructuring

**Workflow:**
1. Check branch (`git branch --show-current`)
2. If on main, create branch
3. Make changes
4. Commit to branch
5. User decides when to merge

## Project Overview

Westview UC/CSU A-G Course Planner - A web application for Westview High School students to plan their 4-year course schedule, track graduation requirements (230 credits), and ensure UC/CSU A-G eligibility.

**Tech Stack:** React 18 + Vite + Tailwind CSS (client-side only, no backend)

## Code Modularity Guidelines

When adding new features or changes, follow these guidelines:

1. **BIAS TOWARDS MODULARITY**: If a new feature requires significant logic (>20 lines), prefer extracting it into a custom hook or utility function rather than adding more state to the component.

2. **CHECK FOR BLOAT**: Before outputting code, briefly evaluate if the current file is becoming hard to read. If it is, propose a quick refactor (like moving sub-components or constants out) alongside the feature implementation.

3. **KEEP IT RUNNABLE**: Don't over-fragment. Only split files when there is a clear "Separation of Concerns." Avoid creating new files for trivial logic.

4. **CONTEXT AWARE**: If you extract code, explicitly tell me where to put it and how to import it.

## Mandatory Workflow: Superpowers Debugging Skills

**CRITICAL:** When working on this codebase, you MUST use the superpowers debugging skills. This is not optional.

### Required Skills for Bug Fixes

**ALWAYS use these skills when encountering errors, failures, or unexpected behavior:**

1. **systematic-debugging** - MANDATORY for ANY bug, test failure, or unexpected behavior
   - Four-phase framework: Root Cause Investigation → Pattern Analysis → Hypothesis Testing → Implementation
   - NEVER propose fixes before completing Phase 1 (Root Cause Investigation)
   - Use this skill BEFORE attempting ANY fix

2. **root-cause-tracing** - Use when errors occur deep in execution
   - Systematically trace bugs backward through call stack
   - Add instrumentation when needed to identify source of invalid data
   - Find the ORIGINAL trigger, not just the symptom

3. **verification-before-completion** - MANDATORY before claiming work is complete
   - Run verification commands and confirm output
   - Evidence before assertions always
   - Never claim "fixed" without proof

4. **defense-in-depth** - Use when invalid data causes failures
   - Validate at every layer data passes through
   - Make bugs structurally impossible
   - Multiple validation layers, not just one check

### Working Philosophy

**Correctness over speed:** Never rush to a "quick solution" when a correct solution requires more investigation. Take the time to understand the root cause before attempting fixes.

**No trial-and-error debugging:** Random fixes without understanding the problem are unacceptable. Always trace the root cause first.

**Evidence-based development:** Browser console errors, compilation output, and test results are the source of truth. Never guess at what might be wrong.

### Common Failure Patterns to Avoid

- Making changes without understanding why they're needed
- Trying multiple fixes in rapid succession without verification
- Assuming the error message is misleading rather than investigating it
- Skipping skill usage because "this seems simple"
- Moving on before verifying the fix actually worked

### When to Use Each Skill

- **See blank page / compilation error** → Use systematic-debugging + root-cause-tracing
- **About to commit / create PR** → Use verification-before-completion
- **Data validation failing** → Use defense-in-depth
- **Test is flaky** → Use condition-based-waiting skill
- **Any error occurs** → Use systematic-debugging (mandatory, no exceptions)

## File Editing Safety Protocol

**CRITICAL: When using the Edit tool:**

1. **Keep old_string matches small** (< 20 lines)
   - Large matches increase risk of unintended deletions
   - Use precise, unique strings for matching

2. **Always Read before Edit** to verify exact context
   - Check line numbers and surrounding code
   - Ensure you understand what will be replaced

3. **Immediately verify Edit results** by checking:
   - Line count didn't decrease unexpectedly
   - Run: `git diff --stat <file>` after each edit
   - If deletions > 50 lines, STOP and review

4. **For multi-location changes** (like color palettes):
   - Edit ONE location at a time
   - Verify after EACH edit
   - Don't batch multiple edits without verification

5. **After any Edit, check:**
   ```bash
   git diff --stat <file>
   ```
   If you see massive deletions (>100 lines), immediately:
   ```bash
   git restore <file>
   ```
   Then investigate what went wrong before trying again.

6. **Emergency recovery:**
   - If you accidentally delete code: `git restore <file>`
   - Check `.bak` files if available
   - Never continue with broken code - fix immediately

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (auto-opens at http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm preview
```

## Core Architecture

### Data Layer

**Two Course Catalogs Coexist:**
- `src/data/courses_complete.json` - Full Westview course catalog (700+ courses), currently used by App.jsx
- `src/data/courses.json` - New robust schema (32 courses), with detailed prerequisite tracking

**Key Distinction:** The app currently uses `courses_complete.json` loaded into `COURSE_CATALOG` object in App.jsx:1-10. The new schema in `courses.json` is available but not yet integrated.

### Scheduling Engine (`src/scheduling/SchedulingEngine.js`)

Centralized validation logic for course scheduling constraints:

**Pattern 1: Term Length Handling**
- Year-long courses (e.g., Spanish 3-4) must appear in BOTH Fall and Spring semesters
- Semester courses can be scheduled in one semester only
- Use `getTermRequirements(courseId)` to determine scheduling behavior

**Pattern 2: Schedule Validation**
- `validateSchedule({ fall: [...courseIds], spring: [...courseIds] })` checks:
  - Year-long courses present in both semesters
  - Courses offered in correct terms
  - Returns `{ valid: boolean, errors: [], warnings: [] }`

**Pattern 3: Grade-Level Eligibility**
- Each course has `grades_allowed: [9, 10, 11, 12]`
- Use `canTakeCourse(courseId, gradeLevel)` before adding to schedule

**Pattern 4: Semester Availability**
- Courses have `offered_terms: ['fall', 'spring']` and optional `semester_restrictions`
- Use `canScheduleInSemester(courseId, 'fall'|'spring')` to validate placement

### Main App Component (`src/App.jsx`)

**State Management:**
- `courses` array: `[{ id, courseId, year, semester }]` - user's selected courses
- `showAddCourse`: tracks which slot has the add-course form open
- `selectedCategory`: two-step course selection (1. pick pathway, 2. pick course)

**Credit Counting Architecture:**
- Semester totals: Lines 586-590 calculate credits for each semester
- Year totals: Lines 829-846 sum Fall + Spring credits for each grade
- Overall progress: Lines 47-64 calculate Westview graduation requirements
- UC/CSU progress: Lines 74-95 track A-G categories (counts YEARS not credits)

**Validation Rules (lines 229-474):**
1. **Foreign Language Prerequisites** - Warning only, allows adding but shows message
2. **AP Calculus AB/BC Conflict** - BLOCKS adding if both exist (error)
3. **English Sequence** - BLOCKS adding lower levels after completing higher (error)
4. **Off-Roll Restrictions** - Grade 12 only, maximum 2 courses (error)
5. **Duplicate Prevention** - Cannot add same course twice in same semester (error)
6. **Multiple Foreign Language** - Cannot take 2 of same language in one semester (error)
7. **Year-long Course Rules** - Must start in Fall, auto-adds to Spring (error)

### Requirements Tracking

**Westview Graduation (230 credits):** `WESTVIEW_REQUIREMENTS` lines 15-24
- Maps subject areas to pathways: e.g., 'Science' → ['Science - Biological', 'Science - Physical']
- Progress calculated by summing `credits` from matching courses

**UC/CSU A-G (15+ courses):** `AG_REQUIREMENTS` lines 26-34
- Maps A-G categories to display names
- Progress calculated by counting COURSES (not credits) with matching `uc_csu_category`
- Special case: Category E (Foreign Language) counts year-long courses as 1 year each

### Course Selection Flow

**Two-Step Selection Pattern (lines 634-791):**
1. User clicks "Add Course" → Opens form with pathway buttons
2. User selects pathway (e.g., "Math") → Shows dropdown of courses in that pathway
3. Validation runs on "Add" click → Either adds course or shows error/warning

**Special Pathway Handling:**
- **Off-Roll:** Auto-adds immediately without dropdown (line 659-664)
- **Foreign Language:** Groups by language (Spanish, Chinese, etc.) in optgroups (line 692-720)
- **English:** Groups by type (English, Writing, Literature, ELL, Special Ed) (line 721-758)

### Course Data Schema

**Active Schema (courses_complete.json):**
```javascript
{
  course_id: "MATH_IMATH_I",
  full_name: "Integrated Mathematics I 1-2",
  pathway: "Math",
  uc_csu_category: "C",
  credits: 10,
  term_length: "yearlong",
  offered_terms: ["fall", "spring"],
  grades_allowed: [9, 10, 11, 12],
  is_ap_or_honors_pair: false,
  semester_restrictions: null
}
```

**New Schema Available (courses.json):**
- Includes detailed `prerequisites_required` and `prerequisites_recommended` arrays
- Has `linked_courses` for sequence tracking
- See COURSE_SCHEMA.md for full documentation
- Not yet integrated into App.jsx (migration guide in INTEGRATION_GUIDE.md)

## Key Behavioral Patterns

### Year-Long Course Handling
When adding a year-long course in Fall semester (App.jsx:462-465):
```javascript
// Automatically creates TWO entries: one for Fall, one for Spring
const fall = { ...newCourse, id: Date.now(), year, semester: 'Fall' };
const spring = { ...newCourse, id: Date.now() + 1, year, semester: 'Spring' };
setCourses([...courses, fall, spring]);
```

### Warning vs Error Distinction
- **Errors** (red banner): Block course from being added, clear user action required
- **Warnings** (yellow banner): Allow course to be added, inform user of potential issue
- Set via `setError()` and `setWarning()` in validation logic (lines 301-473)

### Validation Warnings Display
Compact warning banners (lines 510-565) show:
- Schedule validation errors from SchedulingEngine
- Missing English in any year with courses
- Missing PE in Grade 9 or 10
- Foreign language prerequisite gaps

## Important Constraints

### Off-Roll Courses
- **Grade restriction:** Only Grade 12 (line 376-378)
- **Quantity limit:** Maximum 2 per student (line 382-391)
- Validation runs BEFORE course is added

### Foreign Language Rules
- **Same-language limit:** Cannot take two non-literature courses of same language in one semester (lines 403-433)
- **Literature exception:** Language literature courses exempt from same-semester rule
- **Prerequisite validation:** Checks for sequential levels (1-2 → 3-4 → 5-6 → 7-8 → 9-10) but only warns (lines 155-212, 229-293)

### English Progression Rules
- Cannot add English 1-2 after completing 3-4 or higher (lines 337-349)
- Cannot add English 3-4 after completing 5-6 or higher (lines 352-363)
- Enforced as hard block (error, not warning)

## Testing Approach

**Manual Testing Flow:**
1. Start dev server: `npm run dev`
2. Add courses to different years/semesters
3. Verify semester totals appear below each column
4. Verify year totals appear at bottom of each grade card
5. Check sidebar shows progress toward Westview (230 credits) and UC/CSU (A-G)

**Common Test Cases:**
- Add year-long course in Fall → should auto-add to Spring
- Try adding year-long course in Spring → should show error
- Add same course twice in one semester → should show error
- Add Spanish 5-6 without 3-4 → should show warning but allow
- Add Off-Roll course in Grade 11 → should show error
- Add 3 Off-Roll courses in Grade 12 → third should error

## Credit Calculation Logic

**Westview Credits (lines 47-67):**
```javascript
// For each requirement category, sum credits from matching courses
const credits = relevantCourses.reduce((sum, c) =>
  sum + COURSE_CATALOG[c.courseId].credits, 0
);
```

**UC/CSU A-G Years (lines 74-95):**
```javascript
// Count COURSES not credits (each course = 1 year for non-language)
let years = cat === 'E'
  ? relevantCourses.length  // Each yearlong foreign language = 1 year
  : relevantCourses.length;
```

**Semester/Year Totals:**
- Semester: Sum credits of all courses in that semester (lines 586-590)
- Year: Sum credits from both Fall and Spring (lines 829-836)

## File Organization

```
src/
├── App.jsx                    # Main component (940 lines, handles all state & validation)
├── index.jsx                  # Entry point
├── index.css                  # Global styles (Tailwind imports)
├── components/
│   └── CourseExplorer.jsx     # Demo component for new schema (not used in main app)
├── data/
│   ├── courses_complete.json  # Active course catalog (700+ courses)
│   └── courses.json           # New schema (32 courses, not yet integrated)
├── scheduling/
│   └── SchedulingEngine.js    # Validation logic (346 lines)
├── types/
│   └── course.ts              # TypeScript types for new schema
└── utils/
    ├── courseUtils.js         # Helper functions for new schema
    └── courseUtils.ts         # TypeScript version
```

## Task Tracking

**Read `todo.md` at start of each session for task tracking.**

- Update `todo.md` directly when tasks are added/completed
- Do NOT read session logs for todo tracking (wastes context)
- Session logs are only for debugging/history reference

## Known Limitations

- No backend: All data stored in component state, lost on refresh
- No TypeScript in main app: App.jsx is JavaScript despite .ts utilities existing
- Two course schemas: Migration from `courses_complete.json` to `courses.json` incomplete
- Text-based prerequisites: Current catalog lacks structured prerequisite course IDs
- Manual credit entry: No transcript PDF parsing yet
