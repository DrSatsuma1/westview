import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('./src/data/courses_complete.json'));

// Find existing courses
console.log("--- Finding base courses ---");
data.courses.filter(c => c.full_name.includes("HIGH SCHOOL ENGLISH")).forEach(c => {
  console.log(c.full_name + " - " + c.course_numbers.join(", "));
});
data.courses.filter(c => c.full_name.includes("U.S. HISTORY") && !c.full_name.includes("AP") && !c.full_name.includes("SPECIAL")).forEach(c => {
  console.log(c.full_name + " - " + c.course_numbers.join(", "));
});

// Find a template course to copy structure from
const template = data.courses.find(c => c.course_id === "CIVICS__0013");
console.log("\nTemplate course structure:", Object.keys(template).join(", "));

// New linked section courses to add
const newCourses = [
  {
    course_id: "CIVICS_LINKED_0091",
    full_name: "CIVICS / ECONOMICS (Linked w/AP US Gov)",
    course_numbers: ["091393", "091398"],
    grades_allowed: [12],
    credits: 10,
    uc_csu_category: "A",
    pathway: "History/Social Science",
    term_length: "semester",
    offered_terms: ["fall", "spring"],
    notes: "Linked section with AP US Government & Politics",
    linked_courses: ["001395", "001396"]
  },
  {
    course_id: "AP_PRECALCULUS_LINKED",
    full_name: "AP PRE-CALCULUS 1-2 (Linked w/AP Calc AB)",
    course_numbers: ["091085", "091086"],
    grades_allowed: [11, 12],
    credits: 10,
    uc_csu_category: "C",
    pathway: "Math",
    term_length: "semester",
    offered_terms: ["fall", "spring"],
    notes: "Linked section with AP Calculus AB",
    linked_courses: ["001060", "001061"],
    uc_honors_weight: "A=5, B=4, C=3"
  },
  {
    course_id: "STUDIO_ART_CERAMICS_LINKED",
    full_name: "STUDIO ART 1-2: CERAMICS (Linked w/AP Studio Art 3D)",
    course_numbers: ["190150", "190151"],
    grades_allowed: [10, 11, 12],
    credits: 10,
    uc_csu_category: "F",
    pathway: "Fine Arts",
    term_length: "semester",
    offered_terms: ["fall", "spring"],
    notes: "Linked section with AP Studio Art 3D Design",
    linked_courses: ["000159", "000160"]
  },
  {
    course_id: "STUDIO_ART_DRAWING_LINKED",
    full_name: "STUDIO ART 1-2: DRAWING & PAINTING (Linked w/AP Studio Art)",
    course_numbers: ["090150", "090151"],
    grades_allowed: [10, 11, 12],
    credits: 10,
    uc_csu_category: "F",
    pathway: "Fine Arts",
    term_length: "semester",
    offered_terms: ["fall", "spring"],
    notes: "Linked section with AP Studio Art Drawing & Painting",
    linked_courses: ["000151", "000152"]
  },
  {
    course_id: "STUDIO_ART_PHOTO_LINKED",
    full_name: "STUDIO ART 1-2: DIGITAL PHOTOGRAPHY (Linked w/AP Studio Art 2D)",
    course_numbers: ["390150", "390151"],
    grades_allowed: [10, 11, 12],
    credits: 10,
    uc_csu_category: "F",
    pathway: "Fine Arts",
    term_length: "semester",
    offered_terms: ["fall", "spring"],
    notes: "Linked section with AP Studio Art 2D Design",
    linked_courses: ["000157", "000158"]
  },
  {
    course_id: "HS_ENGLISH_12_LINKED_AVID",
    full_name: "HIGH SCHOOL ENGLISH 1-2 (Linked w/AVID 1-2)",
    course_numbers: ["099301", "099302"],
    grades_allowed: [9],
    credits: 10,
    uc_csu_category: "B",
    pathway: "English",
    term_length: "semester",
    offered_terms: ["fall", "spring"],
    notes: "Linked section with AVID 1-2",
    linked_courses: ["001595", "001596"]
  },
  {
    course_id: "HS_ENGLISH_34_LINKED_AVID",
    full_name: "HIGH SCHOOL ENGLISH 3-4 (Linked w/AVID 3-4)",
    course_numbers: ["090310", "090311"],
    grades_allowed: [10],
    credits: 10,
    uc_csu_category: "B",
    pathway: "English",
    term_length: "semester",
    offered_terms: ["fall", "spring"],
    notes: "Linked section with AVID 3-4",
    linked_courses: ["001597", "001598"]
  },
  {
    course_id: "US_HISTORY_LINKED_AVID",
    full_name: "U.S. HISTORY 1-2 (Linked w/AVID 5-6)",
    course_numbers: ["091376", "091377"],
    grades_allowed: [11],
    credits: 10,
    uc_csu_category: "A",
    pathway: "History/Social Science",
    term_length: "semester",
    offered_terms: ["fall", "spring"],
    notes: "Linked section with AVID 5-6",
    linked_courses: ["001599", "001600"]
  }
];

// Add default fields from template
newCourses.forEach(nc => {
  nc.credit_type = "standard";
  nc.prerequisites_required = [];
  nc.prerequisites_recommended = [];
  nc.is_replacement_course = false;
  nc.replacement_equivalents = [];
  nc.is_ap_or_honors_pair = false;
  nc.pair_course_id = null;
  nc.fall_to_spring_dependency = false;
  nc.category_priority = 1;
  nc.is_graduation_requirement = false;
  nc.semester_restrictions = null;
  nc.alternate_ids = [];
  nc.homework_hours_per_week = null;
  nc.uc_honors_weight = nc.uc_honors_weight || null;
  nc.prerequisites_recommended_ids = [];
});

// Add new courses
data.courses.push(...newCourses);
data.total_courses = data.courses.length;

console.log(`\nAdded ${newCourses.length} linked section courses`);
console.log("New total:", data.total_courses);

writeFileSync('./src/data/courses_complete.json', JSON.stringify(data, null, 2));
console.log('Saved!');
