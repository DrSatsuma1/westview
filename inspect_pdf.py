#!/usr/bin/env python3
"""Inspect PDF structure to understand course layout"""

import pdfplumber
import re

pdf_path = "Westview Course Catalog 2025-2026.pdf"

with pdfplumber.open(pdf_path) as pdf:
    print(f"Total pages: {len(pdf.pages)}\n")

    # Look at a few pages to understand structure
    for page_num in [10, 15, 20, 25]:  # Sample pages
        page = pdf.pages[page_num]
        text = page.extract_text()

        print(f"=== PAGE {page_num + 1} ===")
        print(text[:1500])
        print("\n" + "="*80 + "\n")

        # Find course number patterns
        course_numbers = re.findall(r'#(\d{6})', text)
        if course_numbers:
            print(f"Found course numbers: {course_numbers[:5]}")
            print()
