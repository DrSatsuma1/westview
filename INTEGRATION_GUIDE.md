# Integration Guide: New Course Schema

This guide explains how to integrate the new robust course schema into your application.

## What's New

The new schema provides:

1. **Structured Course Data** (`src/data/courses.json`) - 32 courses from the 2025-2026 catalog
2. **Type Definitions** (`src/types/course.ts`) - TypeScript types for the schema
3. **Utility Functions** (`src/utils/courseUtils.js`) - Helper functions for working with courses
4. **Example Component** (`src/components/CourseExplorer.jsx`) - Demo UI for browsing courses
5. **Documentation** (`COURSE_SCHEMA.md`) - Complete schema reference

## Quick Start

### 1. Using the Course Explorer Component

To see the new schema in action, you can import and use the `CourseExplorer` component:

```jsx
import CourseExplorer from './components/CourseExplorer';

function App() {
  return <CourseExplorer />;
}
```

### 2. Loading Course Data

```javascript
import { loadCourseCatalog, createCourseLookup } from './utils/courseUtils';

// Load the full catalog
const catalog = loadCourseCatalog();
console.log(catalog.courses); // Array of 32 courses

// Create a lookup map for fast access
const courseLookup = createCourseLookup(catalog.courses);
const mathCourse = courseLookup['MATH_IMATH_I'];
```

### 3. Filtering and Searching Courses

```javascript
import {
  getCoursesByPathway,
  getCoursesByGrade,
  searchCourses,
  getEligibleCourses
} from './utils/courseUtils';

const catalog = loadCourseCatalog();

// Get all math courses
const mathCourses = getCoursesByPathway(catalog.courses, 'Mathematics');

// Get courses for 9th graders
const freshmanCourses = getCoursesByGrade(catalog.courses, 9);

// Search for courses
const results = searchCourses(catalog.courses, 'calculus');

// Get eligible courses for a student
const completedCourses = ['MATH_IMATH_I', 'MATH_IMATH_II'];
const eligible = getEligibleCourses(catalog.courses, 10, completedCourses);
```

### 4. Working with Prerequisites

```javascript
import { arePrerequisitesMet, getPrerequisites } from './utils/courseUtils';

const catalog = loadCourseCatalog();
const calcAB = catalog.courses.find(c => c.course_id === 'MATH_AP_CALC_AB');

// Get all prerequisites
const prereqs = getPrerequisites(calcAB);
console.log(prereqs); // ['MATH_ADV_FUNCTIONS', 'MATH_IMATH_III', 'MATH_AP_PRECALC']

// Check if student meets prerequisites
const studentCourses = ['MATH_IMATH_III', 'MATH_ADV_FUNCTIONS'];
const canEnroll = arePrerequisitesMet(calcAB, studentCourses);
console.log(canEnroll); // true
```

### 5. Course Sequences

```javascript
import { getCourseSequence, createCourseLookup } from './utils/courseUtils';

const catalog = loadCourseCatalog();
const courseLookup = createCourseLookup(catalog.courses);
const spanish1 = courseLookup['WL_SPA_1-2'];

// Get the full Spanish sequence
const sequence = getCourseSequence(spanish1, courseLookup);
console.log(sequence.map(c => c.full_name));
// ['Spanish 1-2', 'Spanish 3-4', 'Spanish 5-6', 'Spanish 7-8', 'AP Spanish Language 1-2']
```

## Integration with Existing App

### Option 1: Gradual Migration

Keep your existing `COURSE_CATALOG` in `App.jsx` and gradually migrate courses:

```javascript
import { loadCourseCatalog, toLegacyFormat } from './utils/courseUtils';

// Load new schema courses
const newCatalog = loadCourseCatalog();

// Convert to legacy format if needed
const legacyCourses = {};
newCatalog.courses.forEach(course => {
  legacyCourses[course.course_id] = toLegacyFormat(course);
});

// Merge with existing catalog
const COURSE_CATALOG = {
  ...existingCourses,
  ...legacyCourses
};
```

### Option 2: Full Replacement

Replace the hardcoded `COURSE_CATALOG` with the new schema:

```javascript
import { loadCourseCatalog, createCourseLookup } from './utils/courseUtils';

function App() {
  const catalog = loadCourseCatalog();
  const courseLookup = createCourseLookup(catalog.courses);

  // Use courseLookup instead of COURSE_CATALOG
  const selectedCourse = courseLookup[courseId];

  // Rest of your app logic...
}
```

### Option 3: Side-by-Side

Keep both systems running and use feature flags:

```javascript
import { loadCourseCatalog } from './utils/courseUtils';

const USE_NEW_SCHEMA = true; // Feature flag

function App() {
  const courses = USE_NEW_SCHEMA
    ? loadCourseCatalog().courses
    : Object.values(COURSE_CATALOG);

  // Adapt your logic to work with both formats
}
```

## Course Data Included

The new schema includes 32 courses across 5 pathways:

### Mathematics (11 courses)
- Integrated Math I, II, III
- Advanced Functions & Analysis
- AP Pre-Calculus, AP Calculus AB, AP Calculus BC
- Calculus BC Review
- Statistics, AP Statistics

### World Language (9 courses)
- Spanish 1-2 through 7-8, AP Spanish
- Chinese 1-2 through 5-6, AP Chinese

### Science (6 courses)
- Biology, Honors Biology, AP Biology
- Chemistry, Honors Chemistry, AP Chemistry

### History/Social Science (2 courses)
- World History 1-2
- AP World History 1-2

### English (2 courses)
- English 1-2
- English 3-4

## Key Schema Features

### Rich Metadata
- Course numbers, pathways, UC/CSU categories
- Grade restrictions, credit types
- Semester restrictions and dependencies

### Prerequisites
- Required and recommended prerequisites
- Validation functions for eligibility checking

### Course Relationships
- Linked courses (sequences)
- AP/Honors pairing
- Replacement equivalents

### Scheduling Info
- Term length (yearlong/semester/quarter)
- Offered terms (fall/spring)
- Semester-specific restrictions

## Testing the Integration

To test the new schema:

1. **Run the Course Explorer:**
   ```bash
   npm run dev
   ```
   Navigate to the CourseExplorer component to browse courses

2. **Test in Console:**
   ```javascript
   import { loadCourseCatalog } from './utils/courseUtils';
   const catalog = loadCourseCatalog();
   console.log(catalog);
   ```

3. **Validate Data:**
   ```javascript
   import { validateCourse } from './utils/courseUtils';

   catalog.courses.forEach(course => {
     const errors = validateCourse(course);
     if (errors.length > 0) {
       console.error(`Course ${course.course_id} has errors:`, errors);
     }
   });
   ```

## Next Steps

1. **Add More Courses**: Expand `src/data/courses.json` with additional courses from the catalog
2. **Migrate Existing Logic**: Update course selection and validation logic to use new schema
3. **Add Features**: Implement prerequisite checking, course recommendations, etc.
4. **Type Safety**: Consider adding TypeScript support for better type checking

## Support

- See `COURSE_SCHEMA.md` for complete schema documentation
- Check `src/components/CourseExplorer.jsx` for implementation examples
- Review `src/utils/courseUtils.js` for available helper functions

## Migration Checklist

- [ ] Review the new course schema structure
- [ ] Test the CourseExplorer component
- [ ] Decide on integration approach (gradual, full, or side-by-side)
- [ ] Update course lookup logic
- [ ] Migrate validation rules
- [ ] Update UI components to display new fields
- [ ] Test prerequisite checking
- [ ] Add remaining courses to the catalog
- [ ] Update documentation
- [ ] Remove legacy code (when ready)
