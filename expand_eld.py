#!/usr/bin/env python3
"""
Expand ELD to English Language Development (ELD) in course names.
"""

import json

def expand_eld(courses):
    """Expand ELD abbreviation in course names"""
    fixes = 0

    for course in courses:
        old_name = course['full_name']

        # Check if name starts with ELD
        if old_name.startswith('ELD '):
            new_name = 'English Language Development (ELD) ' + old_name[4:]
            course['full_name'] = new_name
            print(f'✓ Expanded: {old_name}')
            print(f'  → {new_name}')
            fixes += 1

    return fixes

def main():
    print('=' * 80)
    print('EXPANDING ELD TO ENGLISH LANGUAGE DEVELOPMENT (ELD)')
    print('=' * 80)
    print('\nLoading courses_complete.json...\n')

    with open('src/data/courses_complete.json', 'r') as f:
        data = json.load(f)

    print(f'Total courses: {len(data["courses"])}\n')

    fixes = expand_eld(data['courses'])

    print(f'\n{fixes} course names updated\n')

    # Save
    print('Saving updated data...')
    with open('src/data/courses_complete.json', 'w') as f:
        json.dump(data, f, indent=2)

    print('✓ Done!\n')

    # Verify
    print('VERIFICATION - Courses with ELD:')
    eld_courses = [c for c in data['courses'] if 'ELD' in c['full_name']]
    for c in eld_courses:
        print(f'  - {c["full_name"]}')

if __name__ == '__main__':
    main()
