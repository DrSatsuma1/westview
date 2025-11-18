import pdfplumber
import json
import re
from typing import List, Dict, Optional

def extract_pdf_text(pdf_path: str) -> str:
    """Extract all text from PDF"""
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() + "\n"
    return text

def parse_courses_with_claude(text_chunk: str) -> List[Dict]:
    """
    Use Claude API to parse a chunk of course text into structured JSON.
    This processes small chunks to avoid context limits.
    """
    import anthropic
    
    client = anthropic.Anthropic()
    
    prompt = f"""Parse the following course catalog text into JSON array matching this exact schema:

{{
  "course_id": "string",
  "full_name": "string",
  "course_numbers": ["string"],
  "grades_allowed": [9,10,11,12],
  "credits": 10,
  "credit_type": "standard",
  "uc_csu_category": "string or null",
  "pathway": "string",
  "term_length": "yearlong or semester or quarter",
  "offered_terms": ["fall","spring"],
  "prerequisites_required": ["course_id"],
  "prerequisites_recommended": ["course_id"],
  "is_replacement_course": false,
  "replacement_equivalents": ["course_id"],
  "is_ap_or_honors_pair": false,
  "pair_course_id": "course_id or null",
  "fall_to_spring_dependency": false,
  "linked_courses": ["course_id"],
  "category_priority": 1,
  "is_graduation_requirement": false,
  "semester_restrictions": "fall only / spring only / null",
  "alternate_ids": ["string"],
  "notes": "string"
}}

Course text:
{text_chunk}

Return ONLY a JSON array, no explanation."""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4000,
        messages=[{"role": "user", "content": prompt}]
    )
    
    # Extract JSON from response
    response_text = response.content[0].text
    # Strip markdown code blocks if present
    response_text = re.sub(r'```json\n?', '', response_text)
    response_text = re.sub(r'```\n?', '', response_text)
    
    return json.loads(response_text.strip())

def chunk_text_by_courses(text: str, separator: str = "\n\n") -> List[str]:
    """
    Split text into course chunks. Adjust separator based on your PDF structure.
    Common patterns: double newlines, course codes, page breaks
    """
    # Try to split by course pattern (adjust regex to match your PDF format)
    # Example: splits on course codes like "MATH-101" or numbered courses
    chunks = re.split(r'\n(?=[A-Z]{2,4}[-\s]\d{3})', text)
    
    # If that doesn't work, split by paragraph
    if len(chunks) == 1:
        chunks = text.split(separator)
    
    # Filter out very short chunks (likely not complete courses)
    return [c.strip() for c in chunks if len(c.strip()) > 100]

def process_pdf_to_json(pdf_path: str, output_path: str, chunk_size: int = 5):
    """
    Main function: extract PDF, chunk it, process with Claude, save to JSON
    
    chunk_size: number of course entries to process per API call
    """
    print("Extracting text from PDF...")
    full_text = extract_pdf_text(pdf_path)
    
    print("Splitting into course chunks...")
    course_chunks = chunk_text_by_courses(full_text)
    print(f"Found {len(course_chunks)} potential course entries")
    
    all_courses = []
    
    # Process in batches to manage API calls efficiently
    for i in range(0, len(course_chunks), chunk_size):
        batch = course_chunks[i:i+chunk_size]
        batch_text = "\n\n---COURSE SEPARATOR---\n\n".join(batch)
        
        print(f"Processing courses {i+1} to {min(i+chunk_size, len(course_chunks))}...")
        
        try:
            parsed_courses = parse_courses_with_claude(batch_text)
            all_courses.extend(parsed_courses)
        except Exception as e:
            print(f"Error processing batch {i//chunk_size + 1}: {e}")
            # Save what we have so far
            with open(f"{output_path}.partial.json", 'w') as f:
                json.dump(all_courses, f, indent=2)
            continue
    
    # Save final output
    print(f"Saving {len(all_courses)} courses to {output_path}...")
    with open(output_path, 'w') as f:
        json.dump(all_courses, f, indent=2)
    
    print("Done!")
    return all_courses

# Usage
if __name__ == "__main__":
    pdf_path = "course_catalog.pdf"  # Replace with your PDF path
    output_path = "courses.json"
    
    courses = process_pdf_to_json(pdf_path, output_path)
    print(f"Extracted {len(courses)} courses")
