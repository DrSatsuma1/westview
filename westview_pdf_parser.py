#!/usr/bin/env python3
"""
Westview Course Catalog PDF to JSON converter.
Specifically designed for the Westview HS catalog format.
"""

import pdfplumber
import json
import re
from typing import List, Dict, Any, Optional
import sys

def extract_courses_from_pdf(pdf_path: str) -> List[Dict[str, Any]]:
    """Extract all courses from the Westview catalog PDF"""

    courses = []

    with pdfplumber.open(pdf_path) as pdf:
        print(f"Processing {len(pdf.pages)} pages...")

        full_text = ""
        for i, page in enumerate(pdf.pages, 1):
            text = page.extract_text()
            if text:
                full_text += text + "\n"
            if i % 10 == 0:
                print(f"  Extracted {i}/{len(pdf.pages)} pages...")

    print(f"\nTotal text extracted: {len(full_text)} characters")
    print("Parsing courses...\n")

    # Pattern to match course entries
    # Looks for: COURSE NAME (caps) followed by course numbers and GRADES
    # More flexible pattern to catch all variations
    pattern = r'^([A-Z][A-Z\s&/\-\(\)\.0-9]+?)\s+(\d{6}(?:\s*-\s*\d{6})?)\s+GRADES?:\s*([0-9\-, ]+)\s+UC/CSU:\s*(["\']?[A-G]["\']?|None|N/A|Pending)'

    matches = re.finditer(pattern, full_text, re.MULTILINE)

    course_positions = []
    for match in matches:
        course_positions.append({
            'start': match.start(),
            'end': match.end(),
            'name': match.group(1).strip(),
            'numbers': match.group(2),
            'grades': match.group(3).strip(),
            'uc_csu': match.group(4)
        })

    print(f"Found {len(course_positions)} courses with pattern matching\n")

    # Extract the full text for each course (from start to next course or end)
    for i, course_pos in enumerate(course_positions):
        start = course_pos['start']
        # End is the start of the next course, or end of text
        end = course_positions[i+1]['start'] if i+1 < len(course_positions) else len(full_text)

        course_text = full_text[start:end]

        # Parse the course
        course = parse_westview_course(
            course_text,
            course_pos['name'],
            course_pos['numbers'],
            course_pos['grades'],
            course_pos['uc_csu']
        )

        if course:
            courses.append(course)
            if (i + 1) % 20 == 0:
                print(f"  Parsed {i+1}/{len(course_positions)} courses...")

    print(f"\nSuccessfully parsed {len(courses)} courses")
    return courses

def parse_westview_course(
    course_text: str,
    course_name: str,
    course_numbers_str: str,
    grades_str: str,
    uc_csu_str: str
) -> Optional[Dict[str, Any]]:
    """Parse a single Westview course entry"""

    # Extract course numbers
    course_numbers = re.findall(r'\d{6}', course_numbers_str)

    # Parse grades
    grades = []
    for g in re.findall(r'\b(9|10|11|12)\b', grades_str):
        grades.append(int(g))
    if not grades:
        grades = [9, 10, 11, 12]
    grades = sorted(list(set(grades)))

    # Parse UC/CSU category
    uc_csu = None if uc_csu_str in ['None', 'N/A', ''] else uc_csu_str

    # Generate course ID
    course_id = generate_course_id(course_name, course_numbers[0] if course_numbers else '')

    # Determine pathway
    pathway = determine_pathway(course_name, course_text)

    # Extract prerequisites
    prereq_required, prereq_recommended = extract_prerequisites(course_text)

    # Determine term information
    term_length, offered_terms, semester_restrictions = determine_term_info(course_text, course_name)

    # Determine credits
    credits = 10.0  # Default yearlong
    if term_length == 'semester':
        credits = 5.0
    elif term_length == 'quarter':
        credits = 2.5

    # Check for AP/Honors
    is_ap = 'AP ' in course_name.upper() or 'ADVANCED PLACEMENT' in course_text.upper()
    is_honors = 'HONORS' in course_name.upper()

    # Check if it's a graduation requirement
    is_grad_req = determine_grad_requirement(pathway, course_name)

    # Extract notes/description
    notes = extract_description(course_text)

    # Build course object
    course = {
        "course_id": course_id,
        "full_name": course_name,
        "course_numbers": course_numbers,
        "grades_allowed": grades,
        "credits": credits,
        "credit_type": "standard" if credits >= 5 else "partial",
        "uc_csu_category": uc_csu,
        "pathway": pathway,
        "term_length": term_length,
        "offered_terms": offered_terms,
        "prerequisites_required": prereq_required,
        "prerequisites_recommended": prereq_recommended,
        "is_replacement_course": False,
        "replacement_equivalents": [],
        "is_ap_or_honors_pair": is_ap or is_honors,
        "pair_course_id": None,
        "fall_to_spring_dependency": False,
        "linked_courses": [],
        "category_priority": 1,
        "is_graduation_requirement": is_grad_req,
        "semester_restrictions": semester_restrictions,
        "alternate_ids": [],
        "notes": notes
    }

    return course

def generate_course_id(course_name: str, course_number: str) -> str:
    """Generate a unique course ID"""

    # Clean up the name
    name = course_name.upper().strip()

    # Handle AP courses
    if name.startswith('AP '):
        subject = name[3:].split()[0]
        return f"AP_{subject}_{course_number[:4]}"

    # Handle Honors
    if 'HONORS' in name:
        subject = name.replace('HONORS', '').strip().split()[0]
        return f"HON_{subject}_{course_number[:4]}"

    # Get first meaningful words
    words = name.split()
    if len(words) >= 2:
        prefix = f"{words[0]}_{words[1]}"
    else:
        prefix = words[0] if words else "COURSE"

    # Clean prefix
    prefix = re.sub(r'[^\w]', '_', prefix)

    return f"{prefix}_{course_number[:4]}"

def determine_pathway(course_name: str, course_text: str) -> str:
    """Determine the subject pathway"""

    combined = (course_name + ' ' + course_text).upper()

    if any(word in combined for word in ['SPANISH', 'CHINESE', 'FRENCH', 'JAPANESE', 'GERMAN']):
        return 'World Language'
    elif any(word in combined for word in ['MATH', 'CALCULUS', 'ALGEBRA', 'GEOMETRY', 'STATISTICS']):
        return 'Mathematics'
    elif any(word in combined for word in ['BIOLOGY', 'LIVING EARTH']):
        return 'Science - Biological'
    elif any(word in combined for word in ['CHEMISTRY', 'PHYSICS']):
        return 'Science - Physical'
    elif 'SCIENCE' in combined:
        return 'Science - General'
    elif any(word in combined for word in ['HISTORY', 'GOVERNMENT', 'SOCIAL STUDIES', 'ETHNIC STUDIES']):
        return 'History/Social Science'
    elif 'ENGLISH' in combined or 'LITERATURE' in combined:
        return 'English'
    elif any(word in combined for word in ['ART', 'MUSIC', 'DRAMA', 'THEATRE', 'DANCE', 'VISUAL']):
        return 'Visual & Performing Arts'
    elif any(word in combined for word in ['PE', 'PHYSICAL EDUCATION', 'HEALTH']):
        return 'Physical Education'
    elif any(word in combined for word in ['COMPUTER', 'PROGRAMMING', 'ENGINEERING', 'ROBOTICS']):
        return 'Computer Science & Engineering'
    elif any(word in combined for word in ['BUSINESS', 'MARKETING', 'FINANCE']):
        return 'Career Technical Education'
    else:
        return 'Elective'

def extract_prerequisites(course_text: str) -> tuple:
    """Extract required and recommended prerequisites"""

    prereq_required = []
    prereq_recommended = []

    # Look for prerequisite sections
    prereq_patterns = [
        r'[Pp]rerequisites?:\s*([^\n]+)',
        r'[Rr]ecommended [Pp]rerequisites?:\s*([^\n]+)',
        r'[Rr]equired [Pp]rerequisites?:\s*([^\n]+)'
    ]

    for pattern in prereq_patterns:
        match = re.search(pattern, course_text)
        if match:
            prereq_text = match.group(1).strip()

            # Determine if required or recommended
            if 'recommend' in pattern.lower() or 'recommend' in prereq_text.lower():
                prereq_recommended.append(prereq_text[:200])
            else:
                prereq_required.append(prereq_text[:200])

    return prereq_required, prereq_recommended

def determine_term_info(course_text: str, course_name: str) -> tuple:
    """Determine term length, offered terms, and restrictions"""

    text_lower = course_text.lower()

    # Check for explicit term restrictions
    semester_restrictions = None
    if 'fall only' in text_lower or 'offered fall' in text_lower:
        semester_restrictions = 'fall only'
        offered_terms = ['fall']
        term_length = 'semester'
    elif 'spring only' in text_lower or 'offered spring' in text_lower:
        semester_restrictions = 'spring only'
        offered_terms = ['spring']
        term_length = 'semester'
    elif 'semester' in text_lower or 'one semester' in text_lower:
        term_length = 'semester'
        offered_terms = ['fall', 'spring']
    elif 'quarter' in text_lower:
        term_length = 'quarter'
        offered_terms = ['fall', 'spring']
    else:
        # Default to yearlong
        term_length = 'yearlong'
        offered_terms = ['fall', 'spring']

    # Check course name for term indicators (like "1-2" usually means yearlong)
    if re.search(r'\d-\d', course_name):
        term_length = 'yearlong'
        if not semester_restrictions:
            offered_terms = ['fall', 'spring']

    return term_length, offered_terms, semester_restrictions

def determine_grad_requirement(pathway: str, course_name: str) -> bool:
    """Determine if course is a graduation requirement"""

    # Core subjects at grade level are usually required
    name_upper = course_name.upper()

    # English 1-2, 3-4, etc. are required
    if 'ENGLISH' in pathway and any(x in name_upper for x in ['1-2', '3-4']):
        return True

    # Biology, Chemistry basics are often required
    if 'Science' in pathway and any(x in name_upper for x in ['BIOLOGY', 'CHEMISTRY 1-2']):
        return True

    # Math sequence Integrated I, II, III
    if 'Math' in pathway and 'INTEGRATED' in name_upper:
        return True

    # History requirements
    if 'History' in pathway and any(x in name_upper for x in ['WORLD HISTORY', 'US HISTORY']):
        return True

    return False

def extract_description(course_text: str) -> str:
    """Extract course description/notes"""

    # Get first few sentences after the header
    lines = course_text.split('\n')

    # Skip the first line (course name/number)
    description_lines = []
    for line in lines[1:]:
        line = line.strip()
        if line and not line.startswith('GRADES:') and not line.startswith('UC/CSU:'):
            description_lines.append(line)
        if len(' '.join(description_lines)) > 300:
            break

    description = ' '.join(description_lines)

    # Limit to 500 characters
    if len(description) > 500:
        description = description[:497] + '...'

    return description

def save_to_json(courses: List[Dict], output_path: str):
    """Save courses to JSON file"""

    output = {
        "generated_for": "Westview HS Course Catalog 2025-2026",
        "schema_version": "2025-11-17.v1",
        "total_courses": len(courses),
        "courses": courses
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\nSaved {len(courses)} courses to {output_path}")

def main():
    pdf_path = "Westview Course Catalog 2025-2026.pdf"
    output_path = "westview_courses.json"

    print("=== Westview Course Catalog Converter ===\n")

    try:
        courses = extract_courses_from_pdf(pdf_path)

        if not courses:
            print("ERROR: No courses extracted from PDF")
            sys.exit(1)

        save_to_json(courses, output_path)

        print("\n=== Conversion Complete ===")
        print(f"Total courses extracted: {len(courses)}")

        # Show sample
        if courses:
            print("\nSample course:")
            print(json.dumps(courses[0], indent=2))

            # Show pathways breakdown
            pathways = {}
            for course in courses:
                pathway = course['pathway']
                pathways[pathway] = pathways.get(pathway, 0) + 1

            print("\nCourses by pathway:")
            for pathway, count in sorted(pathways.items(), key=lambda x: -x[1]):
                print(f"  {pathway}: {count}")

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
