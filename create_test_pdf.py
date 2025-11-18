#!/usr/bin/env python3
"""Create a test PDF with sample course data"""

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

def create_test_catalog():
    filename = "Westview Course Catalog 2025-2026.pdf"
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter

    # Title page
    c.setFont("Helvetica-Bold", 24)
    c.drawString(100, height - 100, "Westview High School")
    c.setFont("Helvetica", 18)
    c.drawString(100, height - 130, "Course Catalog 2025-2026")

    c.showPage()

    # Sample courses
    courses = [
        {
            "name": "AP Computer Science A 1-2",
            "number": "001501",
            "grades": "Grades: 10, 11, 12",
            "credits": "10 credits (yearlong)",
            "uc_csu": "UC/CSU: G",
            "description": "This course introduces students to computer science with Java. "
                          "Topics include object-oriented programming, data structures, and algorithms. "
                          "Prerequisite: Completion of Algebra II or teacher recommendation. "
                          "Offered: Fall and Spring",
        },
        {
            "name": "Spanish 1-2",
            "number": "000401",
            "grades": "Grades: 9, 10, 11, 12",
            "credits": "10 credits (yearlong)",
            "uc_csu": "UC/CSU: E",
            "description": "Introduction to Spanish language and culture. Students develop basic "
                          "communication skills in listening, speaking, reading, and writing. "
                          "Prerequisite: None. Offered: Fall and Spring",
        },
        {
            "name": "AP Calculus BC 1-2",
            "number": "001062",
            "grades": "Grades: 11, 12",
            "credits": "10 credits (yearlong)",
            "uc_csu": "UC/CSU: C",
            "description": "Advanced calculus course covering differential and integral calculus. "
                          "Prerequisite: AP Calculus AB or equivalent. Spring only. "
                          "Students must complete Calculus BC Review (fall) before enrolling.",
        },
        {
            "name": "Honors Chemistry 1-2",
            "number": "001240",
            "grades": "Grades: 9, 10, 11, 12",
            "credits": "10 credits (yearlong)",
            "uc_csu": "UC/CSU: D",
            "description": "Honors-level chemistry course covering matter, energy, and chemical reactions. "
                          "Prerequisite: Integrated Math II (recommended). Offered: Fall and Spring",
        },
        {
            "name": "Digital Photography 1",
            "number": "002101",
            "grades": "Grades: 9, 10, 11, 12",
            "credits": "5 credits (semester)",
            "uc_csu": "UC/CSU: F",
            "description": "Introduction to digital photography techniques and composition. "
                          "Students learn camera operation, lighting, and basic editing. "
                          "Prerequisite: None. Offered: Fall and Spring",
        },
    ]

    y_position = height - 80
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, y_position, "Course Descriptions")
    y_position -= 40

    for course in courses:
        # Check if we need a new page
        if y_position < 150:
            c.showPage()
            y_position = height - 80

        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, y_position, f"{course['name']} ({course['number']})")
        y_position -= 20

        c.setFont("Helvetica", 10)
        c.drawString(70, y_position, course['grades'])
        y_position -= 15
        c.drawString(70, y_position, course['credits'])
        y_position -= 15
        c.drawString(70, y_position, course['uc_csu'])
        y_position -= 20

        # Word wrap description
        c.setFont("Helvetica", 9)
        words = course['description'].split()
        line = ""
        for word in words:
            if len(line + word) < 85:
                line += word + " "
            else:
                c.drawString(70, y_position, line)
                y_position -= 12
                line = word + " "
        if line:
            c.drawString(70, y_position, line)
        y_position -= 25

    c.save()
    print(f"Created test PDF: {filename}")
    print(f"Contains {len(courses)} sample courses")

if __name__ == "__main__":
    create_test_catalog()
