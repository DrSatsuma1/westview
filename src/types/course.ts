/**
 * Course Schema Type Definitions
 * Version: 2025-11-17.v1
 */

export type GradeLevel = 9 | 10 | 11 | 12;

export type CreditType = "standard" | "partial";

export type UCCSUCategory = "A" | "B" | "C" | "D" | "E" | "F" | "G" | null;

export type TermLength = "yearlong" | "semester" | "quarter";

export type Term = "fall" | "spring";

export type SemesterRestriction = "fall only" | "spring only" | null;

/**
 * Complete course definition with all metadata
 */
export interface Course {
  /** Unique course identifier */
  course_id: string;

  /** Full course name as displayed in catalog */
  full_name: string;

  /** Official course numbers (e.g., district IDs) */
  course_numbers: string[];

  /** Grade levels allowed to take this course */
  grades_allowed: GradeLevel[];

  /** Number of credits awarded */
  credits: number;

  /** Type of credit (standard 10, partial for review courses, etc.) */
  credit_type: CreditType;

  /** UC/CSU A-G category or null if not A-G approved */
  uc_csu_category: UCCSUCategory;

  /** Subject area or pathway (e.g., "Mathematics", "Science - Biological") */
  pathway: string;

  /** How long the course runs */
  term_length: TermLength;

  /** Terms when the course is offered */
  offered_terms: Term[];

  /** Course IDs that MUST be completed before taking this course */
  prerequisites_required: string[];

  /** Course IDs that are recommended but not required */
  prerequisites_recommended: string[];

  /** If true, this course can replace another course */
  is_replacement_course: boolean;

  /** Course IDs that this course is equivalent to */
  replacement_equivalents: string[];

  /** If true, this is part of an AP/Honors pairing */
  is_ap_or_honors_pair: boolean;

  /** Course ID of the paired course (AP/Honors counterpart) */
  pair_course_id: string | null;

  /** If true, fall semester must be completed before spring */
  fall_to_spring_dependency: boolean;

  /** Related courses in the same sequence or pathway */
  linked_courses: string[];

  /** Priority for course sequencing (1 = highest priority) */
  category_priority: number;

  /** If true, this course fulfills a graduation requirement */
  is_graduation_requirement: boolean;

  /** Semester-specific restrictions */
  semester_restrictions: SemesterRestriction;

  /** Alternative course identifiers */
  alternate_ids: string[];

  /** Additional notes about the course */
  notes: string;

  /** Optional: source information for the course data */
  source?: string;
}

/**
 * Course catalog structure
 */
export interface CourseCatalog {
  /** Description of what this catalog represents */
  generated_for: string;

  /** Schema version identifier */
  schema_version: string;

  /** Array of all courses in the catalog */
  courses: Course[];
}

/**
 * Legacy course format (for backward compatibility)
 */
export interface LegacyCourse {
  name: string;
  credits: number;
  ag: UCCSUCategory;
  category: string;
  ap?: boolean;
  yearLong?: boolean;
  years?: number;
  schoolService?: boolean;
  workExperience?: boolean;
}

/**
 * Helper type for course catalog lookup
 */
export type CourseLookup = Record<string, Course>;

/**
 * Student course record (enrolled/completed course)
 */
export interface StudentCourseRecord {
  id: number;
  courseId: string;
  grade: string;
  year: string;
  semester: string;
}
