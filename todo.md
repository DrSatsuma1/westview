# Westview Planner - Todo List

## Active
(none)

## Completed (Nov 22, 2025 - Session 7)
- [x] Fix Spring Year 3 only getting 3 courses instead of 4
  - Root cause: Credit calculation double-counted yearlong courses (Q3 + Q4 entries)
  - Fix: Use unique course IDs when calculating existing credits
- [x] Don't suggest BAND in Year 3/4 if not taken before
  - Added checkBandContinuation() in BusinessRules.js
  - Blocks BAND suggestions in Grade 11/12 unless taken in Grade 9/10

## Completed (Nov 22, 2025 - Session 6)
- [x] Fix yearlong courses in suggestion approval (approveSuggestion) - was only adding to 2 quarters
- [x] Fix yearlong courses in Auto-fill (auto-fill Fall/Spring) - was only adding to 2 quarters
- [x] Verified fix with playwright tests: BAND, YEARBOOK now appear in all 4 quarters

## Completed (Nov 22, 2025 - Session 5)
- [x] Add California Resident toggle in Settings (default: CA)
- [x] Update GPA threshold (3.0 for CA, 3.4 for non-residents)
- [x] Fix uc_honors_weight to match official UC A-G list (31 courses)
  - Removed from: HONORS WORLD HISTORY, BIOLOGY, CHEMISTRY, ENGLISH, HUMANITIES, FRENCH 7-8, SPANISH 7-8
  - Kept on: All AP courses + HONORS AMERICAN LITERATURE + HONORS FILIPINO 7-8 + HONORS PLTW (Medical/Engineering)

## Completed (Nov 22, 2025 - Session 4)
- [x] GPA calculation already implemented (discovered existing)
  - Grading scale: A=4, B=3, C=2, D=1, F=0 (weighted: A=5, B=4, C=3 for AP/Honors)
  - UC GPA uses 10th-11th grade only, max 8 semesters of honors weight
- [x] Fill in prerequisites_recommended_ids for all 700+ courses
- [x] Add course descriptions (3-line) to CourseCard from notes field
- [x] Add PLTW Biomedical sequence warning
- [x] Fix yearlong courses to populate all 4 quarters (Fall AND Spring)
- [x] Fix BusinessRules checkDuplicates bug (course.id → course.course_id)
- [x] Fix Off-Roll year restriction (allow grades 9, 11, 12 - not just 12)
- [x] Code Review - BusinessRules edge cases

## Completed (Nov 21, 2025 - Session 3)
- [x] Add Undo Button (5-state history, Ctrl+Z / Cmd+Z support)
- [x] Fix AP Human Geography (yearlong → semester, pathway → History/Social Science)
- [x] Fix Internship (yearlong → semester, grades_allowed → [12] only)
- [x] Fix Statistics (yearlong → semester, 10 → 5 credits)
- [x] Fix College Algebra (yearlong → semester, 10 → 5 credits)
- [x] Fix AP/IB/CLEP Test Scores box alignment with course cards
- [x] Suggest 4 courses per semester in Year 4 (was 3, minimum still 2)
- [x] Show specific schedule validation errors instead of generic "Grade X" message

## Completed (Nov 21, 2025 - Session 2)
- [x] Fix Course Card Heights (140px → 160px uniform)
- [x] Fix Elective Credits Counting (excess credits from all subjects count toward electives)
- [x] Add 80 credit/year cap for graduation
- [x] Fix Foreign Language UC counting (1-2=1yr, 3-4=2yr, 5-6=3yr, etc.)
- [x] Fix Math UC counting (Math I=1yr, II=2yr, III=3yr, Pre-Calc=4yr, AP Calc=5yr)
- [x] Show recommended years in UC tracker
- [x] Add Edit functionality for AP Test Scores

## Completed (Nov 21, 2025 - Session 1)
- [x] Math sequencing bug fix
- [x] Pathway normalization rewrite
- [x] Civil Engineering term length fix
- [x] Semester Lock/Unlock feature
- [x] A-G gaps highest priority in Years 10-11
- [x] Clear All respects locked semesters
- [x] Auto-fill 45 credit limit

## Backlog
- [ ] Westview Gmail login for free access (Google OAuth with @powayusd.com domain verification)
- [ ] Westview GPA calculation (separate from UC GPA, uses different weighting)
- [ ] GPA Optimizer mode - prioritize UC Honors courses to maximize weighted GPA
- [ ] Make UI more teen-friendly (toggle for casual vs formal language)
- [ ] Transcript PDF parsing
- [ ] Backend/persistence
- [ ] PLTW Engineering sequence warning (IED → POE/CIM/Civil Engineering)

## Technical Notes
- `uc_honors_weight: "A=5, B=4, C=3"` on 31 UC-certified honors courses (per UC A-G list)
- `never_suggest: true` on Honors POE
- Course hierarchies in SuggestionEngine.js (higher courses satisfy lower prereqs)
- Equivalent courses mapping (Honors ≈ Regular at same level)
