# Westview Planner - Todo List

## Active
- [ ] Add Undo Button (track course history, Ctrl+Z / Cmd+Z support, limit 10-20 actions)
- [ ] Code Review - BusinessRules edge cases, check other subject sequences

## Needs Verification (visual check required)
- [ ] Remove AP Award Icon from Course Cards (may already be removed - check UI)
- [ ] Fix AP Test Scores Section Alignment (check left padding matches other sections)

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

## Backlog
- [ ] Transcript PDF parsing
- [ ] Backend/persistence
