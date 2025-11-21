import pdfplumber
import re
import json

pdf_path = "./Westview Course Catalog 2025-2026.pdf"

# Store all course entries with their descriptions
courses_with_links = []

with pdfplumber.open(pdf_path) as pdf:
    print(f"Total pages: {len(pdf.pages)}")

    # Process all pages
    for i, page in enumerate(pdf.pages):
        text = page.extract_text()
        if not text:
            continue

        # Look for "linked w/" or "linked with" patterns
        if "linked w/" in text.lower() or "linked with" in text.lower():
            print(f"\n=== PAGE {i+1} - Found 'linked' mention ===")
            # Extract relevant sections (showing context around "linked")
            lines = text.split('\n')
            for j, line in enumerate(lines):
                if "linked w/" in line.lower() or "linked with" in line.lower():
                    # Show 3 lines before and 3 lines after for context
                    start = max(0, j-3)
                    end = min(len(lines), j+4)
                    context = '\n'.join(lines[start:end])
                    print(f"\nContext around line {j}:")
                    print(context)
                    print("-" * 60)

                    courses_with_links.append({
                        'page': i+1,
                        'line': j,
                        'context': context,
                        'matched_line': line
                    })

# Save to file for review
with open('linked_courses_found.json', 'w') as f:
    json.dump(courses_with_links, f, indent=2)

print(f"\n\nTotal instances of 'linked' found: {len(courses_with_links)}")
print("Saved to linked_courses_found.json for review")
