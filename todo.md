# Westview Planner - Todo List

## Active
- [ ] Code Review - BusinessRules edge cases, check other subject sequences

## Completed (Nov 21, 2025 - Session 3)
- [x] Add Undo Button (5-state history, Ctrl+Z / Cmd+Z support)
- [x] Fix AP Human Geography (yearlong → semester, pathway → History/Social Science)
- [x] Fix Internship (yearlong → semester, grades_allowed → [12] only)
- [x] Fix Statistics (yearlong → semester, 10 → 5 credits)
- [x] Fix College Algebra (yearlong → semester, 10 → 5 credits)
- [x] Fix AP/IB/CLEP Test Scores box alignment with course cards
- [x] Suggest 4 courses per semester in Year 4 (was 3, minimum still 2)
- [x] Show specific schedule validation errors instead of generic "Grade X" message
- [x] Verify AP Award Icon removal from Course Cards
- [x] Verify AP Test Scores Section Alignment

## Completed (Nov 21, 2025 - Session 2)
- [x] Fix Course Card Heights (140px → 160px uniform)
- [x] Fix Elective Credits Counting (excess credits from all subjects count toward electives)
- [x] Add 80 credit/year cap for graduation
- [x] Fix Foreign Language UC counting (1-2=1yr, 3-4=2yr, 5-6=3yr, 7-8=4yr, Honors 7-8=5yr, AP=6yr)
- [x] Fix Math UC counting (Math I=1yr, II=2yr, III=3yr, Pre-Calc=4yr, AP Calc=5yr)
- [x] Show recommended years in UC tracker (4 rec. for Math, 3 rec. for Science/FL)
- [x] Add Edit functionality for AP Test Scores (pencil icon, Update/Cancel buttons)

## Completed (Nov 21, 2025 - Session 1)
- [x] Math sequencing bug fix (Math II not suggested when Math I in later quarter)
- [x] Pathway normalization rewrite (UC/CSU category as source of truth)
- [x] Civil Engineering term length fix (yearlong → semester)
- [x] History UC requirements verified
- [x] Target suggestion counts (Years 1-3: 4 courses, Year 4: 3 courses)
- [x] Semester Lock/Unlock feature
- [x] Course exclusions (never suggest ROTC/Newcomer)
- [x] A-G gaps highest priority in Years 10-11
- [x] Clear All respects locked semesters
- [x] Auto-fill 45 credit limit
- [x] Math sequence fix (lower-level blocking)
- [x] Lock prevents drag/drop
- [x] Double-click course selection
- [x] American Literature pathway fix (History → English)

## Test Plan - Course Suggestions (to implement)
### 1. A-G Requirement Gap Tests
- Empty schedule → suggest English, Math, Science, History, FL, Arts, PE
- Partial A-G → suggest remaining categories
- Complete A-G → suggest electives/advanced courses

### 2. Grade-Level Restriction Tests
- Grade 9: No upperclassmen AP courses
- Grade 10: PE required, Geometry/Math II
- Grade 11: US History priority, 3rd year Math/Science
- Grade 12: Civics/Econ, Off-Roll allowed, Internship

### 3. Prerequisite Validation Tests
- Math: Calc requires Pre-Calc, Math III requires II
- Foreign Language: 3-4 requires 1-2, etc.
- Science: AP Bio requires Honors Bio

### 4. Course Exclusion Tests
- ROTC: never suggested
- Newcomer English: never suggested
- Special Ed: only with setting enabled

### 5. Yearlong vs Semester Tests
- Yearlong → auto-add both semesters
- Semester → single quarter only
- AP Human Geography: single semester
- Statistics/College Algebra: single semester each

## Notes
- Yearbook: Defaults yearlong, user can manually take 1 semester
- Robotics: Defaults 4 quarters, user can drop early (Q1, Q1/Q2, Q1/Q2/Q3)

## Backlog
- [ ] Transcript PDF parsing
- [ ] Backend/persistence
