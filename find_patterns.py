#!/usr/bin/env python3
import json

with open('src/data/courses_complete.json', 'r') as f:
    data = json.load(f)
courses = data['courses']

print('SEARCHING FOR PAIRING PATTERNS IN COURSE NAMES:\n')

# Look for courses with number patterns in name
print('Courses with number patterns in name:')
names_with_numbers = {}
for c in courses:
    name = c['full_name']
    if '1-2' in name or '3-4' in name or '5-6' in name:
        base = name.replace('1-2', 'X').replace('3-4', 'X').replace('5-6', 'X')
        if base not in names_with_numbers:
            names_with_numbers[base] = []
        names_with_numbers[base].append(c)

for base, course_list in list(names_with_numbers.items())[:5]:
    print(f'\n  Base pattern: {base}')
    for c in course_list[:2]:
        print(f"    - {c['full_name']} ({c['term_length']})")

# Look for language courses with level progressions
print('\n\nLANGUAGE COURSE PROGRESSIONS:')
spanish = [c for c in courses if 'SPANISH' in c['full_name']]
for c in sorted(spanish, key=lambda x: x['full_name'])[:6]:
    print(f"  - {c['full_name']}")
    print(f"    grades: {c['grades_allowed']}, term_length: {c['term_length']}")
    prereqs = c.get('prerequisites_required', [''])[0][:80]
    if prereqs and prereqs != 'None':
        print(f"    prereq: {prereqs}...")
