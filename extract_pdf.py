import pdfplumber

pdf_path = "./Westview Course Catalog 2025-2026.pdf"

with pdfplumber.open(pdf_path) as pdf:
    print(f"Total pages: {len(pdf.pages)}")
    for i, page in enumerate(pdf.pages[:3]):  # First 3 pages
        print(f"\n=== PAGE {i+1} ===")
        text = page.extract_text()
        print(text[:2000])
