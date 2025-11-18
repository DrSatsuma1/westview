# Course Schema Documentation

## Overview

This document describes the robust course schema used in the Westview HS Course Catalog system. The schema is designed to capture all relevant course metadata, prerequisites, sequencing, and relationships.

**Schema Version:** 2025-11-17.v1

## Schema Fields

### Core Identification

- **`course_id`** (string, required): Unique identifier for the course (e.g., "MATH_IMATH_I", "AP_SPANISH")
- **`full_name`** (string, required): Complete course name as displayed in the catalog
- **`course_numbers`** (string[], required): Official course numbers/IDs from the district system
- **`alternate_ids`** (string[], optional): Alternative identifiers for the course

### Eligibility & Credits

- **`grades_allowed`** (number[], required): Array of grade levels (9, 10, 11, 12) that can take this course
- **`credits`** (number, required): Number of credits awarded (typically 10 for full courses, can be partial like 2.5)
- **`credit_type`** (string, required): Type of credit - "standard" or "partial"

### Classification

- **`uc_csu_category`** (string|null, required): UC/CSU A-G category:
  - `"A"` - History/Social Science
  - `"B"` - English
  - `"C"` - Mathematics
  - `"D"` - Laboratory Science
  - `"E"` - Language Other Than English
  - `"F"` - Visual & Performing Arts
  - `"G"` - College Prep Elective
  - `null` - Not A-G approved

- **`pathway`** (string, required): Subject area or pathway (e.g., "Mathematics", "World Language", "Science - Biological")
- **`is_graduation_requirement`** (boolean, required): Whether this course fulfills a graduation requirement

### Scheduling

- **`term_length`** (string, required): Duration of the course
  - `"yearlong"` - Full academic year
  - `"semester"` - One semester
  - `"quarter"` - One quarter

- **`offered_terms`** (string[], required): When the course is available
  - Possible values: `"fall"`, `"spring"`

- **`semester_restrictions`** (string|null, required): Term-specific restrictions
  - `"fall only"` - Only offered in fall
  - `"spring only"` - Only offered in spring
  - `null` - No restrictions

- **`fall_to_spring_dependency`** (boolean, required): If true, fall semester must be completed before spring semester

### Prerequisites & Relationships

- **`prerequisites_required`** (string[], required): Course IDs that MUST be completed before enrollment
- **`prerequisites_recommended`** (string[], required): Course IDs that are recommended but not mandatory
- **`linked_courses`** (string[], required): Related courses in the same sequence or pathway
- **`category_priority`** (number, required): Priority for course sequencing (1 = highest)

### Course Pairing & Equivalency

- **`is_replacement_course`** (boolean, required): Whether this course can substitute for another
- **`replacement_equivalents`** (string[], required): Course IDs this course is equivalent to
- **`is_ap_or_honors_pair`** (boolean, required): If true, this is part of an AP/Honors pairing
- **`pair_course_id`** (string|null, required): Course ID of the AP/Honors counterpart

### Metadata

- **`notes`** (string, optional): Additional information about the course
- **`source`** (string, optional): Source citation for the course data

## TypeScript Types

The schema is defined in TypeScript for type safety:

```typescript
import type { Course, CourseCatalog } from './src/types/course';
```

See `src/types/course.ts` for complete type definitions.

## Usage Examples

### Loading the Course Catalog

```typescript
import { loadCourseCatalog, createCourseLookup } from './src/utils/courseUtils';

const catalog = loadCourseCatalog();
const courseLookup = createCourseLookup(catalog.courses);
```

### Finding Courses by Pathway

```typescript
import { getCoursesByPathway } from './src/utils/courseUtils';

const mathCourses = getCoursesByPathway(catalog.courses, 'Mathematics');
```

### Checking Prerequisites

```typescript
import { arePrerequisitesMet } from './src/utils/courseUtils';

const completedCourses = ['MATH_IMATH_I', 'MATH_IMATH_II'];
const canTakeCourse = arePrerequisitesMet(
  courseLookup['MATH_IMATH_III'],
  completedCourses
);
```

### Getting Eligible Courses for a Student

```typescript
import { getEligibleCourses } from './src/utils/courseUtils';

const eligibleCourses = getEligibleCourses(
  catalog.courses,
  10, // Grade level
  completedCourseIds
);
```

## Course Sequences

The schema supports complex course sequencing through several fields:

1. **Linear Prerequisites**: Use `prerequisites_required` for strict sequences
2. **Linked Courses**: Use `linked_courses` to show related courses in a pathway
3. **AP/Honors Pairing**: Use `is_ap_or_honors_pair` and `pair_course_id` for parallel tracks
4. **Semester Dependencies**: Use `fall_to_spring_dependency` for courses requiring completion of fall before spring

### Example: Math Sequence

```
MATH_IMATH_I → MATH_IMATH_II → MATH_IMATH_III → MATH_ADV_FUNCTIONS → MATH_AP_CALC_AB
                                                                    ↘
                                                                     MATH_AP_STATISTICS
```

### Example: AP/Honors Pairing

```
MATH_AP_PRECALC (AP track)
       ↕ (paired)
MATH_ADV_FUNCTIONS (Honors track)
```

## Special Cases

### Year-Long Courses

Courses with `term_length: "yearlong"` typically:
- Award full credits (10)
- Appear in both fall and spring schedules
- May have `fall_to_spring_dependency: true`

### Partial Credit Courses

Courses with `credit_type: "partial"`:
- Award less than standard credits (e.g., 2.5)
- Often review courses (e.g., "MATH_CALC_BC_REVIEW")
- May have semester restrictions

### Semester-Restricted Courses

Use `semester_restrictions` for courses only offered in specific terms:
- AP Calculus BC: `"spring only"`
- Calculus BC Review: `"fall only"`

## Data Files

- **Type Definitions**: `src/types/course.ts`
- **Course Data**: `src/data/courses.json`
- **Utility Functions**: `src/utils/courseUtils.ts`

## Validation

Use the `validateCourse` utility to check course data:

```typescript
import { validateCourse } from './src/utils/courseUtils';

const errors = validateCourse(courseData);
if (errors.length > 0) {
  console.error('Course validation failed:', errors);
}
```

## Migration from Legacy Format

The schema includes utilities for backward compatibility:

```typescript
import { toLegacyFormat, fromLegacyFormat } from './src/utils/courseUtils';

// Convert to legacy format
const legacyCourse = toLegacyFormat(newCourse);

// Convert from legacy format
const newCourse = fromLegacyFormat(courseId, legacyCourse);
```

## Future Enhancements

Potential additions to the schema:

- Teacher assignments
- Classroom locations
- Maximum enrollment caps
- Concurrent enrollment requirements
- Industry certifications
- Articulation agreements with colleges
