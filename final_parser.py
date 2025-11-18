#!/usr/bin/env python3
"""
Final Westview Course Catalog PDF to JSON converter.
Uses a two-pass approach: find course headers first, then extract details.
"""

import pdfplumber
import json
import re
from typing import List, Dict, Any, Optional
import sys

def extract_courses_from_pdf(pdf_path: str) -> List[Dict[str, Any]]:
    """Extract all courses from the Westview catalog PDF"""

    print("Extracting text from PDF...")

    with pdfplumber.open(pdf_path) as pdf:
        all_text = ""
        for i, page in enumerate(pdf.pages, 1):
            text = page.extract_text()
            if text:
                all_text += text + "\n"
            if i % 10 == 0:
                print(f"  Processed {i}/{len(pdf.pages)} pages...")

    print(f"Total characters: {len(all_text)}")
    print("\nFinding course entries...")

    # Find all lines that match the course header pattern
    # Pattern: course code numbers followed by GRADES: and UC/CSU:
    lines = all_text.split('\n')
    courses_data = []

    i = 0
    while i < len(lines):
        line = lines[i].strip()

        # Look for course number pattern followed by GRADES:
        # Made more flexible - UC/CSU might be on same line or next line
        match = re.search(r'(\d{6}(?:\s*-\s*\d{6})?)\s+GRADES?:\s*([0-9\-, ]+)', line)

        if match:
            # Found a course! Now extract the name and UC/CSU category
            course_numbers = match.group(1)
            grades_str = match.group(2)

            # Look for UC/CSU on same line or next line
            uc_csu_str = 'N/A'
            uc_match = re.search(r'UC/CSU:\s*(["\']?[A-G]["\']?|None|N/A|Pending)', line[match.end():])
            if uc_match:
                uc_csu_str = uc_match.group(1).strip('"\'')
            elif i + 1 < len(lines):
                uc_match = re.search(r'UC/CSU:\s*(["\']?[A-G]["\']?|None|N/A|Pending)', lines[i+1])
                if uc_match:
                    uc_csu_str = uc_match.group(1).strip('"\'')

            # The course name should be before the numbers
            name_part = line[:match.start()].strip()

            # If name is empty, check previous line(s)
            if not name_part and i > 0:
                name_part = lines[i-1].strip()

            # Get the course description (next few lines until we hit another course or special marker)
            description_lines = []
            j = i + 1
            while j < len(lines) and j < i + 20:  # Look ahead max 20 lines
                next_line = lines[j].strip()

                # Stop if we hit another course header
                if re.search(r'\d{6}(?:\s*-\s*\d{6})?\s+GRADES?:', next_line):
                    break

                # Stop if we hit section headers or page markers
                if re.match(r'^[A-Z\s/&]+UC/CSU', next_line):
                    break
                if len(next_line) < 10 or next_line.isdigit():
                    j += 1
                    continue

                description_lines.append(next_line)
                j += 1

            description = ' '.join(description_lines)

            courses_data.append({
                'name': name_part,
                'numbers': course_numbers,
                'grades': grades_str,
                'uc_csu': uc_csu_str,
                'description': description[:800]  # Limit description length
            })

        i += 1

    print(f"Found {len(courses_data)} courses\n")

    # Parse each course
    courses = []
    for i, data in enumerate(courses_data, 1):
        course = parse_course(data)
        if course:
            courses.append(course)

        if i % 20 == 0:
            print(f"  Parsed {i}/{len(courses_data)} courses...")

    print(f"\nSuccessfully parsed {len(courses)} courses")
    return courses

def parse_course(data: Dict) -> Optional[Dict[str, Any]]:
    """Parse course data into JSON schema"""

    # Extract course numbers
    course_numbers = re.findall(r'\d{6}', data['numbers'])

    # Parse grades
    grades = []
    for g in re.findall(r'\b(9|10|11|12)\b', data['grades']):
        grades.append(int(g))
    grades = sorted(list(set(grades))) if grades else [9, 10, 11, 12]

    # Parse UC/CSU
    uc_csu = None if data['uc_csu'] in ['None', 'N/A', 'Pending'] else data['uc_csu']

    # Generate course ID
    course_id = generate_course_id(data['name'], course_numbers[0] if course_numbers else '')

    # Determine pathway/subject
    pathway = determine_pathway(data['name'], data['description'])

    # Extract prerequisites
    prereq_req, prereq_rec = extract_prerequisites(data['description'])

    # Determine term info
    term_length, offered_terms, semester_restrictions = determine_term_info(
        data['description'], data['name']
    )

    # Calculate credits
    if '4.5' in data['name'] or '2.5' in data['name']:
        credits = 2.5
    elif term_length == 'semester':
        credits = 5.0
    elif term_length == 'quarter':
        credits = 2.5
    else:
        credits = 10.0

    # Check AP/Honors
    is_ap = data['name'].startswith('AP ')
    is_honors = 'HONORS' in data['name'].upper()

    # Determine if graduation requirement
    is_grad_req = is_graduation_requirement(pathway, data['name'])

    course = {
        "course_id": course_id,
        "full_name": data['name'],
        "course_numbers": course_numbers,
        "grades_allowed": grades,
        "credits": credits,
        "credit_type": "standard" if credits >= 5 else "partial",
        "uc_csu_category": uc_csu,
        "pathway": pathway,
        "term_length": term_length,
        "offered_terms": offered_terms,
        "prerequisites_required": prereq_req,
        "prerequisites_recommended": prereq_rec,
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
        "notes": data['description'][:500]
    }

    return course

def generate_course_id(name: str, number: str) -> str:
    """Generate course ID"""
    name_upper = name.upper()

    # Handle AP
    if name_upper.startswith('AP '):
        subject = name_upper[3:].split()[0]
        subject = re.sub(r'[^\w]', '', subject)
        return f"AP_{subject}_{number[:4]}"

    # Handle Honors
    if 'HONORS' in name_upper:
        parts = name_upper.replace('HONORS', '').strip().split()
        subject = parts[0] if parts else 'HON'
        subject = re.sub(r'[^\w]', '', subject)
        return f"HON_{subject}_{number[:4]}"

    # Regular courses
    words = name_upper.split()[:2]
    prefix = '_'.join(re.sub(r'[^\w]', '', w) for w in words if w)
    return f"{prefix}_{number[:4]}"

def determine_pathway(name: str, description: str) -> str:
    """Determine subject pathway"""
    combined = (name + ' ' + description).upper()

    if any(word in combined for word in ['SPANISH', 'CHINESE', 'FRENCH', 'JAPANESE', 'GERMAN', 'MANDARIN']):
        return 'World Language'
    elif any(word in combined for word in ['MATH', 'CALCULUS', 'ALGEBRA', 'GEOMETRY', 'STATISTICS', 'DATA SCIENCE']):
        return 'Mathematics'
    elif any(word in combined for word in ['BIOLOGY', 'BIOMEDICAL', 'LIVING EARTH']):
        return 'Science - Biological'
    elif any(word in combined for word in ['CHEMISTRY', 'PHYSICS']):
        return 'Science - Physical'
    elif 'SCIENCE' in combined or 'ENVIRONMENTAL' in combined:
        return 'Science - General'
    elif any(word in combined for word in ['HISTORY', 'GOVERNMENT', 'SOCIAL STUDIES', 'ETHNIC STUDIES', 'HUMANITIES']):
        return 'History/Social Science'
    elif any(word in combined for word in ['ENGLISH', 'LITERATURE', 'WRITING', 'EXPOSITORY']):
        return 'English'
    elif any(word in combined for word in ['ART', 'MUSIC', 'DRAMA', 'THEATRE', 'DANCE', 'VISUAL', 'BAND', 'CHOIR', 'ORCHESTRA']):
        return 'Visual & Performing Arts'
    elif any(word in combined for word in ['PE ', 'PHYSICAL EDUCATION', 'HEALTH', 'FITNESS']):
        return 'Physical Education'
    elif any(word in combined for word in ['COMPUTER', 'PROGRAMMING', 'ENGINEERING', 'ROBOTICS', 'PLTW']):
        return 'Computer Science & Engineering'
    elif any(word in combined for word in ['BUSINESS', 'MARKETING', 'FINANCE', 'CAREER']):
        return 'Career Technical Education'
    else:
        return 'Elective'

def extract_prerequisites(text: str) -> tuple:
    """Extract prerequisites"""
    prereq_required = []
    prereq_recommended = []

    # Look for prerequisite mentions
    prereq_patterns = [
        (r'Required Prerequisites?:\s*([^\n]+)', 'required'),
        (r'Recommended Prerequisites?:\s*([^\n]+)', 'recommended'),
        (r'Prerequisites?:\s*([^\n]+)', 'required'),
    ]

    for pattern, type_prereq in prereq_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            prereq_text = match.group(1).strip()
            if prereq_text.lower() != 'none':
                if type_prereq == 'recommended' or 'recommend' in prereq_text.lower():
                    prereq_recommended.append(prereq_text[:200])
                else:
                    prereq_required.append(prereq_text[:200])

    return prereq_required, prereq_recommended

def determine_term_info(text: str, name: str) -> tuple:
    """Determine term length and offerings"""
    text_lower = text.lower()

    # Check for semester restrictions
    if 'fall only' in text_lower or 'offered fall' in text_lower:
        return 'semester', ['fall'], 'fall only'
    elif 'spring only' in text_lower or 'offered spring' in text_lower:
        return 'semester', ['spring'], 'spring only'

    # Check for semester/yearlong indicators
    if 'semester' in text_lower or '1 semester' in text_lower:
        return 'semester', ['fall', 'spring'], None
    elif 'quarter' in text_lower:
        return 'quarter', ['fall', 'spring'], None

    # Check name for yearlong indicator (1-2, 3-4, etc.)
    if re.search(r'\d-\d', name):
        return 'yearlong', ['fall', 'spring'], None

    # Default
    return 'yearlong', ['fall', 'spring'], None

def is_graduation_requirement(pathway: str, name: str) -> bool:
    """Check if course is a graduation requirement"""
    name_upper = name.upper()

    # Core English
    if 'English' in pathway and any(x in name_upper for x in ['HIGH SCHOOL ENGLISH 1-2', 'HIGH SCHOOL ENGLISH 3-4']):
        return True

    # Core Science
    if 'Science' in pathway and 'BIOLOGY' in name_upper and '1-2' in name_upper:
        return True

    # Core Math
    if 'Math' in pathway and 'INTEGRATED' in name_upper:
        return True

    # Core History
    if 'History' in pathway and any(x in name_upper for x in ['WORLD HISTORY', 'US HISTORY']):
        return True

    return False

def save_to_json(courses: List[Dict], output_path: str):
    """Save to JSON"""
    output = {
        "generated_for": "Westview HS Course Catalog 2025-2026",
        "schema_version": "2025-11-17.v1",
        "total_courses": len(courses),
        "courses": courses
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"Saved to {output_path}")

def main():
    pdf_path = "Westview Course Catalog 2025-2026.pdf"
    output_path = "westview_courses_final.json"

    print("=== Westview Course Catalog to JSON ===\n")

    try:
        courses = extract_courses_from_pdf(pdf_path)

        if not courses:
            print("ERROR: No courses found")
            sys.exit(1)

        save_to_json(courses, output_path)

        print(f"\n=== SUCCESS ===")
        print(f"Extracted {len(courses)} courses")

        # Sample
        print("\nSample course:")
        print(json.dumps(courses[0], indent=2))

        # Stats
        pathways = {}
        ap_count = 0
        honors_count = 0
        for course in courses:
            pathway = course['pathway']
            pathways[pathway] = pathways.get(pathway, 0) + 1
            if course['full_name'].startswith('AP '):
                ap_count += 1
            if 'HONORS' in course['full_name'].upper():
                honors_count += 1

        print(f"\nStats:")
        print(f"  AP courses: {ap_count}")
        print(f"  Honors courses: {honors_count}")
        print(f"\nBy pathway:")
        for pathway, count in sorted(pathways.items(), key=lambda x: -x[1]):
            print(f"  {pathway}: {count}")

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
