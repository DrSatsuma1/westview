import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('./src/data/courses_complete.json'));

// Bidirectional linked course mappings using course_numbers
// Format: [courseNumbers1, courseNumbers2] - both will link to each other
const linkedPairs = [
  [["001307", "001308"], ["001305", "001306"]], // AP World History ↔ Honors World History
  [["001382", "001383"], ["000382", "000383"]], // AP US History ↔ Honors American Lit
  [["001395", "001396"], ["091393", "091398"]], // AP US Gov ↔ Civics/Economics
  [["091085", "091086"], ["001060", "001061"]], // AP Pre-Calculus ↔ AP Calculus AB
  [["001064", "001065"], ["001039", "001054"]], // AP Statistics ↔ Statistics/College Algebra
  [["001232", "001233"], ["001228", "001229"]], // AP Biology ↔ Honors Biology
  [["001242", "001243"], ["001238", "001239"]], // AP Chemistry ↔ Honors Chemistry
  [["001216", "001217"], ["001248", "001249"]], // AP Physics 1 ↔ Physics of Universe
  [["000370", "000371"], ["000384", "000385"]], // AP English Lit ↔ British Literature
  [["001262", "001263"], ["001264", "001265"]], // AP Physics C: Mech ↔ AP Physics C: E&M
  [["000484", "000485"], ["000496", "000497"]], // AP Spanish ↔ Honors Spanish 7-8
  [["000159", "000160"], ["190150", "190151"]], // AP Studio Art 3D ↔ Studio Art: Ceramics
  [["000151", "000152"], ["090150", "090151"]], // AP Studio Art Drawing ↔ Studio Art: Drawing
  [["000157", "000158"], ["390150", "390151"]], // AP Studio Art 2D ↔ Studio Art: Photo
  [["001056", "001057"], ["000971", "000972"]], // AP CS A ↔ CS & Software Eng
  [["001056", "001057"], ["001072", "001073"]], // AP CS A ↔ Data Structures
  [["001595", "001596"], ["099301", "099302"]], // AVID 1-2 ↔ HS English 1-2
  [["001597", "001598"], ["090310", "090311"]], // AVID 3-4 ↔ HS English 3-4
  [["001599", "001600"], ["091376", "091377"]], // AVID 5-6 ↔ US History
];

// Build lookup: course_number -> course object
const courseByNumber = {};
data.courses.forEach(c => {
  if (c.course_numbers) {
    c.course_numbers.forEach(num => {
      courseByNumber[num] = c;
    });
  }
});

// Apply bidirectional links
let updates = 0;
linkedPairs.forEach(([nums1, nums2]) => {
  const course1 = courseByNumber[nums1[0]];
  const course2 = courseByNumber[nums2[0]];

  if (course1 && course2) {
    // Course1 links to Course2's numbers
    course1.linked_courses = [...new Set([...(course1.linked_courses || []), ...nums2])];
    // Course2 links to Course1's numbers
    course2.linked_courses = [...new Set([...(course2.linked_courses || []), ...nums1])];
    console.log(`${course1.full_name} ↔ ${course2.full_name}`);
    updates++;
  } else {
    console.log(`WARNING: Could not find courses for ${nums1.join(",")} or ${nums2.join(",")}`);
    if (!course1) console.log(`  Missing: ${nums1.join(",")}`);
    if (!course2) console.log(`  Missing: ${nums2.join(",")}`);
  }
});

console.log(`\nUpdated ${updates} pairs (${updates * 2} courses total)`);

writeFileSync('./src/data/courses_complete.json', JSON.stringify(data, null, 2));
console.log('Saved to courses_complete.json');
