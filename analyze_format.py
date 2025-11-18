#!/usr/bin/env python3
import pdfplumber
import re

pdf_path = "Westview Course Catalog 2025-2026.pdf"

with pdfplumber.open(pdf_path) as pdf:
    # Look at pages 26-30 where courses should be
    for page_num in range(25, 35):
        page = pdf.pages[page_num]
        text = page.extract_text()

        # Find all capital letter sequences that might be course names
        lines = text.split('\n')

        print(f"\n=== PAGE {page_num + 1} ===")
        for i, line in enumerate(lines[:30]):
            # Look for lines with course numbers
            if re.search(r'\d{6}', line):
                print(f"{i:3d}: {line[:120]}")
