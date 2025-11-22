/**
 * Application Constants Configuration
 *
 * Centralized constants for pathways, colors, CTE requirements, test subjects, etc.
 */

/**
 * Grade options for GPA mode
 */
export const GRADE_OPTIONS = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];

/**
 * Pathway Color Mapping (for left border stripe on course cards) - Pastel Rainbow Theme
 */
export const PATHWAY_COLORS = {
  'English': 'border-l-[#E53E3E]',           // Classic Red
  'Math': 'border-l-[#3182CE]',              // Strong Blue
  'Physical Education': 'border-l-[#ED8936]', // Orange
  'History/Social Science': 'border-l-[#805AD5]', // Purple
  'Science - Biological': 'border-l-[#D69E2E]',   // Gold/Yellow
  'Science - Physical': 'border-l-[#D69E2E]',     // Gold/Yellow
  'Foreign Language': 'border-l-[#38A169]',  // Kelly Green
  'Fine Arts': 'border-l-[#38A169]',         // Kelly Green
  'CTE': 'border-l-[#38A169]',               // Kelly Green
  'Electives': 'border-l-[#D53F8C]',         // Pink/Magenta
  'Off-Roll': 'border-l-[#D53F8C]',          // Pink/Magenta
  'Clubs/Athletics': 'border-l-[#D53F8C]',   // Pink/Magenta (same as Electives)
  'Health': 'border-l-[#00B5D8]'             // Cyan/Teal
};

/**
 * CTE Pathway Icon Mapping (for course cards)
 */
export const CTE_PATHWAY_ICONS = {
  'business': { iconName: 'Briefcase', color: 'text-blue-600' },
  'biotech': { iconName: 'Beaker', color: 'text-purple-600' },
  'design': { iconName: 'Palette', color: 'text-pink-600' },
  'engineering': { iconName: 'Wrench', color: 'text-orange-600' },
  'ict': { iconName: 'Laptop', color: 'text-green-600' },
  'performingArts': { iconName: 'Music', color: 'text-red-600' },
  'productionArts': { iconName: 'Video', color: 'text-indigo-600' }
};

/**
 * Test Subjects by Type (AP, IB, CLEP, A-Level)
 */
export const TEST_SUBJECTS = {
  'AP': [
    'AP Biology', 'AP Calculus AB', 'AP Calculus BC', 'AP Chemistry', 'AP Physics 1',
    'AP Physics 2', 'AP Physics C: Mechanics', 'AP Physics C: Electricity and Magnetism',
    'AP English Language and Composition', 'AP English Literature and Composition',
    'AP United States History', 'AP World History', 'AP European History',
    'AP United States Government & Politics', 'AP Comparative Government & Politics',
    'AP Human Geography', 'AP Psychology', 'AP Economics (Macro)', 'AP Economics (Micro)',
    'AP Statistics', 'AP Computer Science A', 'AP Computer Science Principles',
    'AP Environmental Science', 'AP Spanish Language', 'AP Spanish Literature',
    'AP French Language', 'AP German Language', 'AP Chinese Language', 'AP Japanese Language',
    'AP Latin', 'AP Art History', 'AP Music Theory', 'AP Studio Art'
  ],
  'IB': [
    'IB Biology HL', 'IB Chemistry HL', 'IB Physics HL', 'IB Mathematics HL',
    'IB English A: Literature HL', 'IB English A: Language and Literature HL',
    'IB History HL', 'IB Geography HL', 'IB Economics HL', 'IB Psychology HL',
    'IB Spanish HL', 'IB French HL', 'IB German HL', 'IB Chinese HL',
    'IB Theatre HL', 'IB Visual Arts HL', 'IB Music HL'
  ],
  'CLEP': [
    'CLEP Biology', 'CLEP Chemistry', 'CLEP Calculus', 'CLEP College Algebra',
    'CLEP Precalculus', 'CLEP College Mathematics', 'CLEP American Literature',
    'CLEP English Literature', 'CLEP College Composition', 'CLEP Humanities',
    'CLEP United States History I', 'CLEP United States History II', 'CLEP Western Civilization I',
    'CLEP Western Civilization II', 'CLEP American Government', 'CLEP Psychology',
    'CLEP Sociology', 'CLEP Economics (Macro)', 'CLEP Economics (Micro)',
    'CLEP Spanish Language (Level 1)', 'CLEP Spanish Language (Level 2)',
    'CLEP French Language (Level 1)', 'CLEP French Language (Level 2)',
    'CLEP German Language (Level 1)', 'CLEP German Language (Level 2)'
  ],
  'A-Level': [
    'A-Level Biology', 'A-Level Chemistry', 'A-Level Physics', 'A-Level Mathematics',
    'A-Level Further Mathematics', 'A-Level English Literature', 'A-Level History',
    'A-Level Geography', 'A-Level Economics', 'A-Level Psychology', 'A-Level Sociology',
    'A-Level French', 'A-Level Spanish', 'A-Level German', 'A-Level Chinese',
    'A-Level Computer Science', 'A-Level Art and Design', 'A-Level Music'
  ]
};

/**
 * CTE Pathway Requirements
 */
export const CTE_PATHWAYS = {
  business: {
    name: 'Business & Finance',
    courses: [
      { name: 'BUSINESS PRINCIPLES', level: 'Capstone', grades: [9, 10] },
      { name: 'INTRO TO FINANCE', level: 'Concentrator', grades: [9, 10] },
      { name: 'MARKETING ECONOMICS', level: 'Capstone', grades: [10, 11] },
      { name: 'ECONOMICS OF BUSINESS OWNERSHIP', level: 'Capstone', grades: [10, 11] },
      { name: 'INTERNSHIP', level: 'Capstone', grades: [12] }
    ]
  },
  biotech: {
    name: 'Biotechnology',
    courses: [
      { name: 'PRINCIPLES OF BIOMEDICAL SCIENCE', level: 'Concentrator', grades: [9, 10] },
      { name: 'HUMAN BODY SYSTEMS', level: 'Concentrator', grades: [9, 10] },
      { name: 'MEDICAL INTERVENTIONS', level: 'Capstone', grades: [10, 11, 12] }
    ]
  },
  design: {
    name: 'Design, Visual, and Media Arts',
    courses: [
      { name: '3D COMPUTER ANIMATION', level: 'Concentrator', grades: [9, 10, 11, 12] },
      { name: 'DIGITAL PHOTOGRAPHY', level: 'Concentrator/Capstone', grades: [9, 10, 11, 12] },
      { name: 'GRAPHIC DESIGN', level: 'Concentrator/Capstone', grades: [9, 10, 11, 12] },
      { name: 'STUDIO ART', level: 'Capstone', grades: [9, 10, 11, 12] }
    ]
  },
  engineering: {
    name: 'Engineering & Architecture',
    courses: [
      { name: 'INTRODUCTION TO ENGINEERING DESIGN', level: 'Concentrator', grades: [9, 10] },
      { name: 'PRINCIPLES OF ENGINEERING', level: 'Capstone', grades: [9, 10] },
      { name: 'CIVIL ENGINEERING AND ARCHITECTURE', level: 'Capstone', grades: [10, 11] },
      { name: 'COMPUTER INTEGRATED MANUFACTURING', level: 'Capstone', grades: [10, 11] },
      { name: 'DIGITAL ELECTRONICS', level: 'Capstone', grades: [11, 12] }
    ]
  },
  ict: {
    name: 'Information & Communication Technology',
    courses: [
      { name: 'COMPUTER INFORMATION SYSTEMS', level: 'Concentrator', grades: [9, 10, 11, 12] },
      { name: 'WEB DESIGN', level: 'Capstone', grades: [9, 10, 11, 12] },
      { name: 'AP COMPUTER SCIENCE PRINCIPLES', level: 'Capstone', grades: [10, 11] },
      { name: 'AP COMPUTER SCIENCE A', level: 'Capstone', grades: [10, 11] },
      { name: 'MOBILE APP DEVELOPMENT', level: 'Capstone', grades: [11, 12] }
    ]
  },
  performingArts: {
    name: 'Performing Arts',
    courses: [
      { name: 'DRAMA 1-2', level: 'Concentrator', grades: [9, 10, 11, 12] },
      { name: 'DRAMA 3-4', level: 'Capstone', grades: [9, 10, 11, 12] },
      { name: 'DRAMA 5-6', level: 'Capstone', grades: [9, 10, 11, 12] },
      { name: 'THEATER ARTS STUDY', level: 'Capstone', grades: [9, 10, 11, 12] }
    ]
  },
  productionArts: {
    name: 'Production & Managerial Arts',
    courses: [
      { name: 'DIGITAL MEDIA PRODUCTION 1-2', level: 'Concentrator', grades: [9, 10] },
      { name: 'DIGITAL MEDIA PRODUCTION', level: 'Capstone', grades: [9, 10, 11, 12] },
      { name: 'BROADCAST JOURNALISM', level: 'Capstone', grades: [10, 11, 12] },
      { name: 'TECHNICAL PRODUCTION FOR THEATER', level: 'Concentrator', grades: [9, 10, 11, 12] }
    ]
  }
};

/**
 * Recommended Electives for 9th Grade
 */
export const RECOMMENDED_9TH_GRADE = {
  'World Language': [
    'CHINESE 1-2', 'CHINESE 3-4', 'CHINESE 5-6',
    'FILIPINO 1-2', 'FILIPINO 3-4', 'FILIPINO 5-6',
    'FRENCH 1-2', 'FRENCH 3-4', 'FRENCH 5-6',
    'SPANISH 1-2', 'SPANISH 3-4', 'SPANISH 5-6'
  ],
  'Business': ['BUSINESS PRINCIPLES'],
  'Computer Science': ['COMPUTER INFORMATION SYSTEMS', 'WEB DESIGN 1-2'],
  'Engineering': ['INTRODUCTION TO ENGINEERING DESIGN', 'HONORS PLTW PRINCIPLES OF ENGINEERING'],
  'Fine Arts': [
    '3D COMPUTER ANIMATION 1-2',
    'BAND WITH COMPETITIVE MARCHING',
    'BAND WITH NON-COMPETITIVE MARCHING',
    'CERAMICS 1-2',
    'DESIGN AND MIXED MEDIA 1-2',
    'DIGITAL MEDIA PRODUCTION 1-2',
    'DIGITAL PHOTOGRAPHY 1-2',
    'DRAMA 1-2',
    'DRAWING AND PAINTING 1-2',
    'DRAWING & PAINTING 1-2',
    'GRAPHIC DESIGN 1-2',
    'ORCHESTRA 1-2',
    'ORCHESTRA/STRING ENSEMBLE 1-2',
    'TECHNICAL PRODUCTION FOR THEATER 1-',
    'DANCE PROP'
  ]
};

/**
 * Courses no longer offered (do not delete from catalog, just prevent selection/suggestion)
 */
export const DEPRECATED_COURSES = [
  'MOBILE_APP_0002',      // Mobile App Development 1-2
  'WRITING_SEMINAR_0003', // Writing Seminar 1-2
  'SPANISH_910_0004'      // Spanish 9-10
];

/**
 * Complex linked course relationships for auto-suggest
 * BIDIRECTIONAL: Both courses trigger each other
 * SEQUENTIAL: First course must trigger second
 * ONE-WAY: First course can exist alone, triggers second
 */
export const LINKED_COURSE_RULES = [
  // AVID Program (bidirectional, but English/History CAN be standalone)
  { type: 'bidirectional', courses: ['HIGH_SCHOOL_0003', 'AVID_12_0015'] }, // English 1-2 ↔ AVID 1-2
  { type: 'bidirectional', courses: ['HIGH_SCHOOL', 'AVID_34_0015'] },      // English 3-4 ↔ AVID 3-4
  { type: 'bidirectional', courses: ['UNITED_STATES_0013', 'AVID_56_0015'] }, // US History ↔ AVID 5-6

  // BIDIRECTIONAL REQUIRED (neither can be alone)
  { type: 'bidirectional', courses: ['HON_SPANISH_0004', 'AP_SPANISH_0004'] },       // Honors Spanish 7-8 ↔ AP Spanish
  { type: 'bidirectional', courses: ['AP_PRECALCULUS_0010', 'AP_CALCULUS_0010'] },   // AP Pre-Calc ↔ AP Calc AB
  { type: 'bidirectional', courses: ['BRITISH_LITERATURE_0003', 'AP_ENGLISH'] },     // Brit Lit ↔ AP English Lit
  { type: 'bidirectional', courses: ['HON_AMERICAN_0003', 'AP_UNITED'] },           // Hon Am Lit ↔ AP US History

  // Science pairs - ALWAYS TOGETHER
  { type: 'bidirectional', courses: ['HON_BIOLOGY_0012', 'AP_BIOLOGY_0012'] },       // Honors Biology ↔ AP Biology 3-4
  { type: 'bidirectional', courses: ['HON_CHEMISTRY_0012', 'AP_CHEMISTRY_0012'] },   // Honors Chemistry ↔ AP Chemistry 3-4
  { type: 'bidirectional', courses: ['HON_WORLD_0013', 'AP_WORLD_0013'] },           // Honors World History ↔ AP World History

  // Statistics pair - ALWAYS TOGETHER
  { type: 'bidirectional', courses: ['COLLEGE_ALGEBRA_0010', 'AP_STATISTICS_0010'] }, // College Algebra ↔ AP Statistics
  { type: 'bidirectional', courses: ['STATISTICS_0010', 'AP_STATISTICS_0010'] },      // Statistics ↔ AP Statistics

  // Studio Art pairs - ALWAYS TOGETHER
  { type: 'bidirectional', courses: ['STUDIO_ART', 'AP_STUDIO_0001'] },              // Studio Art Digital Photography ↔ AP Studio 2D
  { type: 'bidirectional', courses: ['STUDIO_ART_0002', 'AP_STUDIO_0002'] },         // Studio Art Drawing & Painting ↔ AP Studio Drawing
  { type: 'bidirectional', courses: ['STUDIO_ART_0001', 'AP_STUDIO'] },              // Studio Art Ceramics ↔ AP Studio 3D

  // Dance Prop/Marching PE pair - ALWAYS TOGETHER
  { type: 'bidirectional', courses: ['MARCHING_PE_0011', 'DANCE_PROP_0011'] },       // Marching PE Flags ↔ Dance Prop (Tall Flags)

  // SEQUENTIAL REQUIRED
  { type: 'sequential', first: 'AP_PHYSICS_0001', second: 'AP_PHYSICS' },  // AP Physics C: Mechanics → E&M

  // BIDIRECTIONAL (Computer Science courses)
  { type: 'bidirectional', courses: ['COMPUTER_SCIENCE_0009', 'AP_COMPUTER_0010'] }, // CS ↔ AP CS A
  { type: 'bidirectional', courses: ['DATA_STRUCTURES_0010', 'AP_COMPUTER_0010'] },  // Data Struct ↔ AP CS A
  { type: 'bidirectional', courses: ['STUDIO_ART_0003', 'AP_COMPUTER_0010'] },       // Studio Art Graphic Design ↔ AP CS A

  // ONE-WAY TRIGGERS (first can be alone, optionally triggers second)
  { type: 'one_way', trigger: 'AP_UNITED_0013', adds: 'CIVICS__0013' },      // AP US Gov → Civics (Civics can be solo)
  { type: 'one_way', trigger: 'PHYSICS_OF_0012', adds: 'AP_PHYSICS_0012' },  // Physics → AP Physics 1A-1B
];

/**
 * AVID courses - should never be auto-suggested
 */
export const AVID_COURSES = ['AVID_12_0015', 'AVID_34_0015', 'AVID_56_0015'];

/**
 * Maximum semester credits
 */
export const MAX_SEMESTER_CREDITS = 45;
