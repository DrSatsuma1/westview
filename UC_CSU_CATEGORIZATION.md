# UC/CSU A-G Course Categorization

## Overview
This document explains the UC/CSU A-G categorization applied to Westview High School courses based on the official UC Course List (2025-26).

## Categories

### A - History/Social Science (2 years required)
Includes:
- AP Government and Politics
- AP Human Geography
- AP United States History
- AP World History
- Civics
- U.S. History 1-2
- World Geography and Cultures
- World History 1-2
- Honors World History 1-2

### B - English (4 years required)
Includes:
- Academic Literacy courses
- Advanced Composition
- American Literature (regular and honors)
- AP English Language and Composition
- AP English Literature and Composition
- British Literature
- Expository Reading and Writing
- High School English (all levels, regular and honors)
- Humanities (honors)
- World Literature

### C - Mathematics (3 years required, 4 recommended)
Includes:
- AP Calculus AB/BC
- AP Computer Science A
- AP Precalculus
- AP Statistics
- College Algebra
- Integrated Mathematics I, II, III
- Introduction to Data Science
- Mobile App Development
- Pre-Calculus (regular and honors)
- Statistics
- Trigonometry

### D - Laboratory Science (2 years required, 3 recommended)
Includes:
- AP Biology, Chemistry, Physics (all levels)
- AP Computer Science Principles
- AP Environmental Science
- Biology courses (regular and honors)
- Chemistry courses (regular and honors)
- Physics of the Universe
- PLTW Engineering courses
- PLTW Biomedical Science courses
- Marine Science
- Zoology
- Geoscience

### E - Language Other Than English (2 years required, 3 recommended)
Includes:
- AP Chinese, French, Spanish Language and Culture
- Chinese levels 1-2 through 7-8
- Filipino levels 1-2 through 7-8 (including honors)
- French levels 1-2 through 7-8
- Spanish levels 1-2 through 9-10 (including honors)

### F - Visual & Performing Arts (1 year required)
Includes:
- 3D Computer Animation
- Advanced Dance
- AP Art courses (2D, 3D, Art History, Drawing)
- AP Music Theory
- Broadcast Journalism (advanced levels)
- Ceramics
- Concert Band, Choir, Orchestra
- Dance courses
- Design and Mixed Media
- Digital Media Production
- Digital Photography
- Drama (all levels)
- Drawing and Painting
- Graphic Design
- Photography
- Studio Art
- Technical Production for Theater
- Theatre Arts Study & Performance
- Web Design
- Wind Ensemble

### G - College-Preparatory Elective (1 year required)
Includes:
- AP Psychology
- AVID (all years)
- Broadcast Journalism 1-2
- Business courses
- Child Development & Psychology
- Computer Science & Software Engineering
- Data Structures
- Economics courses
- Ethnic Studies
- Film Studies
- JROTC/ROTC Naval Science
- Journalism
- Marketing Economics
- Psychology
- Sociology
- Writing Seminar
- Yearbook
- You and the Law

## Courses Not Counted Toward A-G
The following types of courses do not count toward UC/CSU A-G requirements:
- Physical Education courses
- Special Education support courses
- English Language Development (ELD) courses
- Academic support/tutoring courses
- Teacher Assistant courses

## Implementation
- All course data is stored in `src/data/courses_complete.json`
- Each course has a `uc_csu_category` field (A-G or null)
- 130 out of 190 total courses are UC/CSU A-G approved
- Progress toward A-G requirements is automatically calculated in the app

## Verification
Course categories were verified against:
- Official UC Course List PDF for Westview High School (2025-26)
- Course List Manager: Kimberly Carroll
- College Board Code: 052986

## Notes
- The PDF provided is valid for both UC and CSU systems
- Concurrent Enrollment courses (college courses) are handled separately
- Some course name variations exist in the system; mappings handle multiple name formats
