#!/usr/bin/env python3
"""
Fix foreign language course term lengths.
All foreign language level courses (X-X) should be semester, not yearlong.
"""

import json

def fix_foreign_language_terms(courses):
    """Fix foreign language courses to be semester-based"""
    fixes = 0

    for course in courses:
        # Check if it's a foreign language course
        if course.get('pathway') != 'Foreign Language':
            continue

        # Check if it has a level pattern (e.g., 1-2, 3-4, 5-6, 7-8, 9-10)
        name = course['full_name']
        has_level = any(level in name for level in ['1-2', '3-4', '5-6', '7-8', '9-10'])

        if has_level and course.get('term_length') == 'yearlong':
            old_term = course['term_length']
            course['term_length'] = 'semester'
            print(f'✓ Fixed: {name}')
            print(f'  {old_term} → semester')
            fixes += 1

    return fixes

def main():
    print('=' * 80)
    print('FIXING FOREIGN LANGUAGE COURSE TERM LENGTHS')
    print('=' * 80)
    print('\nLoading courses_complete.json...\n')

    with open('src/data/courses_complete.json', 'r') as f:
        data = json.load(f)

    print(f'Total courses: {len(data["courses"])}\n')
    print('Converting foreign language courses to semester-based...\n')

    fixes = fix_foreign_language_terms(data['courses'])

    print(f'\n{fixes} courses updated\n')

    # Save
    print('Saving updated data...')
    with open('src/data/courses_complete.json', 'w') as f:
        json.dump(data, f, indent=2)

    print('✓ Done!\n')

    # Verify
    print('VERIFICATION:')
    fl_courses = [c for c in data['courses'] if c.get('pathway') == 'Foreign Language']
    semester_count = sum(1 for c in fl_courses if c.get('term_length') == 'semester')
    yearlong_count = sum(1 for c in fl_courses if c.get('term_length') == 'yearlong')

    print(f'  Foreign Language semester courses: {semester_count}')
    print(f'  Foreign Language yearlong courses: {yearlong_count}')

if __name__ == '__main__':
    main()
