#!/usr/bin/env python3
"""
Convert Westview Course Catalog PDF to JSON format.
Handles extraction, parsing, and structured data generation.
"""

import pdfplumber
import json
import re
from typing import List, Dict, Any, Optional
import sys

def extract_pdf_text(pdf_path: str) -> str:
    """Extract all text from PDF"""
    try:
        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            print(f"Reading {len(pdf.pages)} pages from PDF...")
            for i, page in enumerate(pdf.pages, 1):
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n\n"
                if i % 10 == 0:
                    print(f"  Processed {i}/{len(pdf.pages)} pages...")
        print(f"Extracted {len(text)} characters total")
        return text
    except Exception as e:
        print(f"Error reading PDF: {e}")
        sys.exit(1)

def parse_course_id(full_name: str, course_number: str) -> str:
    """Generate a course ID from the course name and number"""
    # Remove common words and get key identifiers
    name_parts = re.sub(r'\b(and|the|of|for|in|to)\b', '', full_name, flags=re.IGNORECASE)
    name_parts = re.sub(r'[^\w\s-]', '', name_parts)
    words = [w.upper() for w in name_parts.split() if len(w) > 2][:3]

    # Create ID from first letters or significant words
    if 'AP' in full_name.upper():
        prefix = 'AP'
    elif 'HONORS' in full_name.upper() or 'HONOUR' in full_name.upper():
        prefix = 'HON'
    else:
        prefix = '_'.join(words[:2]) if len(words) >= 2 else words[0] if words else 'COURSE'

    # Add course number suffix
    number_clean = re.sub(r'[^\d]', '', course_number)
    if number_clean:
        return f"{prefix}_{number_clean[:4]}"
    else:
        return prefix

def extract_course_numbers(text: str) -> List[str]:
    """Extract course numbers from course text"""
    # Pattern: 6-digit numbers, or patterns like "001234-001235"
    numbers = re.findall(r'\b(\d{6})\b', text)
    return numbers

def extract_grades(text: str) -> List[int]:
    """Extract allowed grades from course text"""
    # Look for patterns like "Grades: 9, 10, 11, 12" or "Grade 9-12"
    grade_match = re.search(r'[Gg]rade[s]?[\s:]+([0-9,\s-]+)', text)
    if grade_match:
        grade_text = grade_match.group(1)
        grades = []
        # Extract individual numbers
        for g in re.findall(r'\b(9|10|11|12)\b', grade_text):
            grades.append(int(g))
        if grades:
            return sorted(list(set(grades)))

    # Default to all high school grades
    return [9, 10, 11, 12]

def extract_credits(text: str) -> float:
    """Extract credit value from course text"""
    # Look for credit patterns
    credit_match = re.search(r'(\d+(?:\.\d+)?)\s*credits?', text, re.IGNORECASE)
    if credit_match:
        return float(credit_match.group(1))

    # Look for semester vs yearlong
    if re.search(r'\b(semester|one term)\b', text, re.IGNORECASE):
        return 5.0

    # Default yearlong course
    return 10.0

def extract_term_info(text: str) -> tuple:
    """Extract term length and offered terms"""
    text_lower = text.lower()

    # Determine term length
    if 'semester' in text_lower or 'one term' in text_lower:
        term_length = 'semester'
    elif 'quarter' in text_lower:
        term_length = 'quarter'
    else:
        term_length = 'yearlong'

    # Determine offered terms
    offered = []
    if 'fall only' in text_lower:
        offered = ['fall']
    elif 'spring only' in text_lower:
        offered = ['spring']
    elif term_length == 'yearlong':
        offered = ['fall', 'spring']
    else:
        # Default to both if not specified
        offered = ['fall', 'spring']

    return term_length, offered

def extract_uc_csu_category(text: str) -> Optional[str]:
    """Extract UC/CSU A-G category"""
    # Look for patterns like "UC/CSU: A", "a-g: B", etc.
    match = re.search(r'(?:UC/CSU|a-g|A-G)[\s:]+([A-G])', text, re.IGNORECASE)
    if match:
        return match.group(1).upper()

    # Infer from subject
    text_lower = text.lower()
    if any(word in text_lower for word in ['history', 'social science', 'government']):
        return 'A'
    elif 'english' in text_lower:
        return 'B'
    elif 'math' in text_lower:
        return 'C'
    elif any(word in text_lower for word in ['biology', 'chemistry', 'physics', 'science']):
        return 'D'
    elif any(word in text_lower for word in ['spanish', 'chinese', 'french', 'language']):
        return 'E'

    return None

def determine_pathway(text: str, course_name: str) -> str:
    """Determine the pathway/subject area"""
    text_combined = (text + ' ' + course_name).lower()

    if any(word in text_combined for word in ['spanish', 'chinese', 'french', 'language']):
        return 'World Language'
    elif 'math' in text_combined or 'calculus' in text_combined or 'algebra' in text_combined:
        return 'Mathematics'
    elif any(word in text_combined for word in ['biology', 'chemistry', 'physics']):
        if any(word in text_combined for word in ['biology', 'living']):
            return 'Science - Biological'
        else:
            return 'Science - Physical'
    elif any(word in text_combined for word in ['history', 'government', 'social']):
        return 'History/Social Science'
    elif 'english' in text_combined:
        return 'English'
    elif any(word in text_combined for word in ['art', 'music', 'drama', 'visual']):
        return 'Visual & Performing Arts'
    elif any(word in text_combined for word in ['pe', 'physical education', 'health']):
        return 'Physical Education'
    else:
        return 'Elective'

def parse_course_from_text(course_text: str, existing_ids: set) -> Optional[Dict[str, Any]]:
    """Parse a single course entry from text into JSON schema"""

    # Try to extract course name (usually first line or bolded)
    lines = [l.strip() for l in course_text.split('\n') if l.strip()]
    if not lines:
        return None

    # First line is usually the course name
    full_name = lines[0]

    # Skip if this doesn't look like a course
    if len(full_name) < 3 or full_name.isdigit():
        return None

    # Extract course numbers
    course_numbers = extract_course_numbers(course_text)
    if not course_numbers:
        # Try to find in parentheses or after course name
        number_match = re.search(r'#?(\d{6})', course_text)
        if number_match:
            course_numbers = [number_match.group(1)]

    # Generate course ID
    course_id = parse_course_id(full_name, course_numbers[0] if course_numbers else '')

    # Make sure ID is unique
    base_id = course_id
    counter = 1
    while course_id in existing_ids:
        course_id = f"{base_id}_{counter}"
        counter += 1
    existing_ids.add(course_id)

    # Extract other fields
    grades_allowed = extract_grades(course_text)
    credits = extract_credits(course_text)
    term_length, offered_terms = extract_term_info(course_text)
    uc_csu_category = extract_uc_csu_category(course_text)
    pathway = determine_pathway(course_text, full_name)

    # Detect AP/Honors
    is_ap = 'AP' in full_name.upper() or 'ADVANCED PLACEMENT' in course_text.upper()
    is_honors = 'HONORS' in full_name.upper() or 'HONOUR' in course_text.upper()

    # Extract prerequisites
    prereq_required = []
    prereq_recommended = []
    prereq_match = re.search(r'[Pp]rerequisite[s]?[\s:]+([^\n]+)', course_text)
    if prereq_match:
        prereq_text = prereq_match.group(1).lower()
        if 'recommend' in prereq_text or 'suggest' in prereq_text:
            prereq_recommended.append(prereq_text[:100])
        else:
            prereq_required.append(prereq_text[:100])

    # Determine semester restrictions
    semester_restrictions = None
    if 'fall only' in course_text.lower():
        semester_restrictions = 'fall only'
    elif 'spring only' in course_text.lower():
        semester_restrictions = 'spring only'

    # Build the course object
    course = {
        "course_id": course_id,
        "full_name": full_name,
        "course_numbers": course_numbers,
        "grades_allowed": grades_allowed,
        "credits": credits,
        "credit_type": "standard" if credits >= 5 else "partial",
        "uc_csu_category": uc_csu_category,
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
        "is_graduation_requirement": False,
        "semester_restrictions": semester_restrictions,
        "alternate_ids": [],
        "notes": ""
    }

    return course

def split_into_courses(text: str) -> List[str]:
    """Split PDF text into individual course chunks"""

    # Try multiple splitting strategies

    # Strategy 1: Split by course number patterns (6 digits)
    chunks = re.split(r'\n(?=\d{6})', text)

    # Strategy 2: If that didn't work well, try splitting by common course headers
    if len(chunks) < 5:
        chunks = re.split(r'\n(?=[A-Z][A-Z\s]{5,40}\n)', text)

    # Strategy 3: Split by double newlines (paragraphs)
    if len(chunks) < 5:
        chunks = text.split('\n\n')

    # Filter out very short chunks
    chunks = [c.strip() for c in chunks if len(c.strip()) > 50]

    print(f"Split into {len(chunks)} potential course chunks")
    return chunks

def convert_pdf_to_json(pdf_path: str, output_path: str):
    """Main conversion function"""

    print(f"\n=== PDF to JSON Converter ===")
    print(f"Input: {pdf_path}")
    print(f"Output: {output_path}\n")

    # Extract text
    full_text = extract_pdf_text(pdf_path)

    if not full_text.strip():
        print("ERROR: PDF appears to be empty or unreadable")
        sys.exit(1)

    # Split into courses
    course_chunks = split_into_courses(full_text)

    # Parse each chunk
    courses = []
    existing_ids = set()

    print(f"\nParsing {len(course_chunks)} course entries...")
    for i, chunk in enumerate(course_chunks, 1):
        course = parse_course_from_text(chunk, existing_ids)
        if course:
            courses.append(course)
            if i % 10 == 0:
                print(f"  Parsed {i}/{len(course_chunks)} chunks, found {len(courses)} courses")

    print(f"\nSuccessfully parsed {len(courses)} courses")

    # Create output structure
    output = {
        "generated_for": "Westview HS Course Catalog 2025-2026",
        "schema_version": "2025-11-17.v1",
        "courses": courses
    }

    # Write to file
    print(f"\nWriting to {output_path}...")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n=== Conversion Complete ===")
    print(f"Total courses: {len(courses)}")
    print(f"Output saved to: {output_path}")

    # Print sample
    if courses:
        print(f"\nSample course:")
        print(json.dumps(courses[0], indent=2))

def main():
    pdf_path = "Westview Course Catalog 2025-2026.pdf"
    output_path = "courses_output.json"

    # Check if PDF exists and is not empty
    import os
    if not os.path.exists(pdf_path):
        print(f"ERROR: PDF file not found: {pdf_path}")
        sys.exit(1)

    if os.path.getsize(pdf_path) == 0:
        print(f"ERROR: PDF file is empty (0 bytes): {pdf_path}")
        print("\nPlease ensure you have a valid PDF file before running this script.")
        print("The script is ready to run once you provide a valid PDF.")
        sys.exit(1)

    convert_pdf_to_json(pdf_path, output_path)

if __name__ == "__main__":
    main()
