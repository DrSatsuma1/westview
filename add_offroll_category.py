#!/usr/bin/env python3
"""
Add Off-Roll category for aide/tutor/assistant courses.
"""

import json

def move_to_offroll(courses):
    """Move aide/tutor/assistant courses to Off-Roll pathway"""
    fixes = 0

    # Keywords that indicate off-roll courses
    offroll_keywords = ['TUTOR', 'AIDE', 'ASSISTANT', 'TEACHING ASSISTANT']

    for course in courses:
        name = course['full_name'].upper()

        # Check if it's an off-roll course
        is_offroll = any(keyword in name for keyword in offroll_keywords)

        if is_offroll and course['pathway'] != 'Off-Roll':
            old_pathway = course['pathway']
            course['pathway'] = 'Off-Roll'
            print(f'✓ Moved to Off-Roll: {course["full_name"]}')
            print(f'  {old_pathway} → Off-Roll')
            fixes += 1

    return fixes

def main():
    print('=' * 80)
    print('ADDING OFF-ROLL CATEGORY')
    print('=' * 80)
    print('\nLoading courses_complete.json...\n')

    with open('src/data/courses_complete.json', 'r') as f:
        data = json.load(f)

    print(f'Total courses: {len(data["courses"])}\n')
    print('Moving aide/tutor/assistant courses to Off-Roll...\n')

    fixes = move_to_offroll(data['courses'])

    print(f'\n{fixes} courses moved to Off-Roll\n')

    # Save
    print('Saving updated data...')
    with open('src/data/courses_complete.json', 'w') as f:
        json.dump(data, f, indent=2)

    print('✓ Done!\n')

    # Show Off-Roll courses
    print('=' * 80)
    print('OFF-ROLL COURSES:')
    print('=' * 80)
    offroll = [c for c in data['courses'] if c['pathway'] == 'Off-Roll']
    for c in offroll:
        print(f'  - {c["full_name"]}')

    print(f'\nTotal: {len(offroll)} courses')

if __name__ == '__main__':
    main()
