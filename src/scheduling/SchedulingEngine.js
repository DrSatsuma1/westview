/**
 * SchedulingEngine.js
 * Handles all course scheduling logic including:
 * - Year-long vs semester courses
 * - AP/Honors pairing
 * - Prerequisites and sequencing
 * - Semester-only offerings
 */

export class SchedulingEngine {
  constructor(coursesData) {
    this.courses = coursesData;
    this.coursesById = this.indexCoursesById();
  }

  /**
   * Create a lookup table for fast course access by ID
   */
  indexCoursesById() {
    const index = {};
    this.courses.forEach(course => {
      index[course.course_id] = course;
    });
    return index;
  }

  /**
   * PATTERN 1: Year-long vs Semester Course Logic
   *
   * Determines if a course occupies one or both semesters.
   *
   * Examples:
   * - AP UNITED STATES HISTORY 1-2: yearlong, occupies fall AND spring
   * - SPANISH 3-4: yearlong, occupies fall AND spring
   * - AP COMPUTER SCIENCE A 1-2: semester, occupies fall OR spring
   */
  getTermRequirements(courseId) {
    const course = this.coursesById[courseId];
    if (!course) {
      throw new Error(`Course not found: ${courseId}`);
    }

    const termLength = course.term_length;
    const offeredTerms = course.offered_terms || [];

    if (termLength === 'yearlong') {
      return {
        type: 'yearlong',
        requiresBothSemesters: true,
        availableTerms: offeredTerms,
        semesters: ['fall', 'spring'] // Must take both
      };
    } else if (termLength === 'semester') {
      return {
        type: 'semester',
        requiresBothSemesters: false,
        availableTerms: offeredTerms,
        semesters: offeredTerms // Can take either offered semester
      };
    } else if (termLength === 'quarter') {
      return {
        type: 'quarter',
        requiresBothSemesters: false,
        availableTerms: offeredTerms,
        semesters: offeredTerms
      };
    }

    throw new Error(`Unknown term_length: ${termLength} for course ${courseId}`);
  }

  /**
   * Check if a course can be scheduled in a specific semester
   */
  canScheduleInSemester(courseId, semester) {
    const course = this.coursesById[courseId];
    if (!course) return false;

    const offeredTerms = course.offered_terms || [];

    // For yearlong courses, both semesters must be available
    if (course.term_length === 'yearlong') {
      return offeredTerms.includes('fall') && offeredTerms.includes('spring');
    }

    // For semester/quarter courses, check if offered in that semester
    return offeredTerms.includes(semester);
  }

  /**
   * PATTERN 2: Validate Schedule Constraints
   *
   * Ensures year-long courses occupy both semesters correctly
   */
  validateSchedule(schedule) {
    const errors = [];
    const warnings = [];

    // schedule format: { fall: [courseIds], spring: [courseIds] }
    const fallCourses = schedule.fall || [];
    const springCourses = schedule.spring || [];

    // Check yearlong courses appear in both semesters
    const yearlongInFall = fallCourses.filter(id => {
      const course = this.coursesById[id];
      return course && course.term_length === 'yearlong';
    });

    const yearlongInSpring = springCourses.filter(id => {
      const course = this.coursesById[id];
      return course && course.term_length === 'yearlong';
    });

    // Yearlong courses must be in both semesters
    yearlongInFall.forEach(courseId => {
      if (!yearlongInSpring.includes(courseId)) {
        const course = this.coursesById[courseId];
        errors.push({
          type: 'missing_semester',
          courseId,
          courseName: course.full_name,
          message: `Year-long course "${course.full_name}" is in Fall but not Spring`
        });
      }
    });

    yearlongInSpring.forEach(courseId => {
      if (!yearlongInFall.includes(courseId)) {
        const course = this.coursesById[courseId];
        errors.push({
          type: 'missing_semester',
          courseId,
          courseName: course.full_name,
          message: `Year-long course "${course.full_name}" is in Spring but not Fall`
        });
      }
    });

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * PATTERN 3: AP/Honors Course Detection
   *
   * Identifies if a course is an AP or Honors level course.
   * While pair_course_id is not populated in current data,
   * we detect these courses for future pairing logic.
   *
   * Examples:
   * - AP CALCULUS AB 1-2: is_ap_or_honors_pair = true
   * - HONORS WORLD HISTORY 1-2: is_ap_or_honors_pair = true
   * - SPANISH 3-4: is_ap_or_honors_pair = false
   */
  isAPOrHonorsCourse(courseId) {
    const course = this.coursesById[courseId];
    if (!course) return false;

    return course.is_ap_or_honors_pair === true;
  }

  /**
   * Get all AP/Honors courses in a subject area
   */
  getAPHonorsCourses(pathway = null) {
    return this.courses
      .filter(course => course.is_ap_or_honors_pair === true)
      .filter(course => !pathway || course.pathway === pathway)
      .map(course => ({
        id: course.course_id,
        name: course.full_name,
        pathway: course.pathway,
        pairId: course.pair_course_id
      }));
  }

  /**
   * PATTERN 4: Prerequisite Chain Validation
   *
   * Validates that prerequisites are met before taking a course.
   *
   * Examples:
   * - SPANISH 3-4 requires SPANISH 1-2
   * - SPANISH 5-6 requires SPANISH 3-4
   * - AP SPANISH LANGUAGE 1-2 requires Spanish 7-8
   */
  getPrerequisites(courseId) {
    const course = this.coursesById[courseId];
    if (!course) {
      throw new Error(`Course not found: ${courseId}`);
    }

    return {
      required: course.prerequisites_required || [],
      recommended: course.prerequisites_recommended || []
    };
  }

  /**
   * Check if prerequisites are satisfied
   * NOTE: Current prereq data is text-based, not course IDs.
   * This provides basic validation; full implementation would need
   * prerequisite parsing or structured prereq data.
   */
  checkPrerequisites(courseId, completedCourseIds) {
    const prereqs = this.getPrerequisites(courseId);

    // If no required prerequisites, student can take the course
    if (!prereqs.required || prereqs.required.length === 0 ||
        prereqs.required[0] === 'None' || prereqs.required[0] === '') {
      return {
        satisfied: true,
        missing: [],
        recommended: prereqs.recommended
      };
    }

    // For now, we'll do basic text matching
    // A full implementation would parse prerequisite course IDs
    const completedCourseNames = completedCourseIds.map(id => {
      const course = this.coursesById[id];
      return course ? course.full_name : '';
    });

    return {
      satisfied: null, // Unknown - needs manual verification
      missing: prereqs.required,
      recommended: prereqs.recommended,
      completedCourses: completedCourseNames,
      note: 'Prerequisites are text-based; manual verification required'
    };
  }

  /**
   * PATTERN 5: Course Sequencing
   *
   * Builds the progression path for multi-level courses.
   *
   * Examples:
   * - Spanish sequence: 1-2 → 3-4 → 5-6 → 7-8 → AP Spanish
   */
  getCourseSequence(courseId) {
    const course = this.coursesById[courseId];
    if (!course) {
      throw new Error(`Course not found: ${courseId}`);
    }

    // Extract level from course name (e.g., "SPANISH 3-4" -> 3)
    const name = course.full_name;
    const levelMatch = name.match(/(\d+)-(\d+)/);

    if (!levelMatch) {
      return {
        course: course.full_name,
        level: null,
        previousCourse: null,
        nextCourse: null,
        isStartOfSequence: true,
        isEndOfSequence: true
      };
    }

    const currentLevel = parseInt(levelMatch[1]);
    const baseName = name.replace(/\d+-\d+/, '').trim();

    // Find previous and next courses in sequence
    const previousLevel = currentLevel - 2;
    const nextLevel = currentLevel + 2;

    const allCourses = this.courses.filter(c => {
      const cname = c.full_name;
      return cname.includes(baseName.split(' ')[0]); // Same subject
    });

    const previous = allCourses.find(c =>
      c.full_name.includes(`${previousLevel}-${previousLevel + 1}`)
    );

    const next = allCourses.find(c =>
      c.full_name.includes(`${nextLevel}-${nextLevel + 1}`)
    );

    return {
      course: course.full_name,
      level: currentLevel,
      previousCourse: previous ? { id: previous.course_id, name: previous.full_name } : null,
      nextCourse: next ? { id: next.course_id, name: next.full_name } : null,
      isStartOfSequence: !previous,
      isEndOfSequence: !next
    };
  }

  /**
   * PATTERN 6: Semester Availability
   *
   * Gets which semesters a course is offered.
   *
   * Examples:
   * - Most courses: ['fall', 'spring']
   * - Some specialized courses may be fall-only or spring-only
   */
  getSemesterAvailability(courseId) {
    const course = this.coursesById[courseId];
    if (!course) {
      throw new Error(`Course not found: ${courseId}`);
    }

    return {
      courseId: course.course_id,
      courseName: course.full_name,
      offeredTerms: course.offered_terms || [],
      restrictions: course.semester_restrictions,
      termLength: course.term_length
    };
  }

  /**
   * PATTERN 7: Grade Level Validation
   *
   * Checks if a student's grade level can take this course.
   */
  canTakeCourse(courseId, studentGrade) {
    const course = this.coursesById[courseId];
    if (!course) return false;

    const allowedGrades = course.grades_allowed || [];
    return allowedGrades.includes(studentGrade);
  }

  /**
   * Get all courses available to a student based on grade level
   */
  getCoursesForGrade(gradeLevel) {
    return this.courses
      .filter(course => {
        const allowedGrades = course.grades_allowed || [];
        return allowedGrades.includes(gradeLevel);
      })
      .map(course => ({
        id: course.course_id,
        name: course.full_name,
        pathway: course.pathway,
        termLength: course.term_length,
        credits: course.credits
      }));
  }
}

export default SchedulingEngine;
