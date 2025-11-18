#!/usr/bin/env python3
"""
Fix duplicate course_ids in courses_complete.json.
Each course must have a unique course_id.
"""

import json
import re

def generate_course_id(full_name, existing_ids):
    """Generate a unique course ID from course name"""
    # Remove special characters and convert to uppercase
    name = re.sub(r'[^A-Z0-9\s]', '', full_name.upper())

    # Take first words to create base ID
    words = name.split()
    if len(words) >= 2:
        base = '_'.join(words[:2])
    else:
        base = words[0] if words else 'COURSE'

    # Try base ID first
    if base not in existing_ids:
        return base

    # Add incrementing number suffix
    counter = 1
    while f"{base}_{counter:04d}" in existing_ids:
        counter += 1

    return f"{base}_{counter:04d}"

def fix_duplicate_ids(courses):
    """Fix all duplicate course IDs"""
    id_map = {}  # Maps course_id to list of courses with that ID

    # Find duplicates
    for course in courses:
        course_id = course['course_id']
        if course_id not in id_map:
            id_map[course_id] = []
        id_map[course_id].append(course)

    # Find which IDs are duplicated
    duplicates = {cid: courses for cid, courses in id_map.items() if len(courses) > 1}

    if not duplicates:
        print('No duplicate course IDs found.')
        return 0

    print(f'Found {len(duplicates)} duplicate course IDs affecting {sum(len(c) for c in duplicates.values())} courses\n')

    existing_ids = set(id_map.keys())
    fixes = 0

    # Fix each set of duplicates
    for dup_id, dup_courses in duplicates.items():
        print(f'\n{"="*80}')
        print(f'Duplicate ID: {dup_id}')
        print(f'{"="*80}')

        # Keep first course with original ID, rename the rest
        for i, course in enumerate(dup_courses):
            if i == 0:
                print(f'  KEEP: {course["full_name"]} → {dup_id}')
            else:
                old_id = course['course_id']
                new_id = generate_course_id(course['full_name'], existing_ids)
                course['course_id'] = new_id
                existing_ids.add(new_id)
                print(f'  FIX:  {course["full_name"]}')
                print(f'        {old_id} → {new_id}')
                fixes += 1

    return fixes

def main():
    print('=' * 80)
    print('FIXING DUPLICATE COURSE IDs')
    print('=' * 80)
    print('\nLoading courses_complete.json...\n')

    with open('src/data/courses_complete.json', 'r') as f:
        data = json.load(f)

    print(f'Total courses: {len(data["courses"])}\n')

    fixes = fix_duplicate_ids(data['courses'])

    print(f'\n{"="*80}')
    print(f'SUMMARY: {fixes} course IDs updated')
    print('=' * 80)

    if fixes > 0:
        print('\nSaving updated data...')
        with open('src/data/courses_complete.json', 'w') as f:
            json.dump(data, f, indent=2)
        print('✓ Done!')
    else:
        print('\nNo changes needed.')

    # Verify no duplicates remain
    print('\nVerifying...')
    id_counts = {}
    for course in data['courses']:
        cid = course['course_id']
        id_counts[cid] = id_counts.get(cid, 0) + 1

    remaining_dups = {cid: count for cid, count in id_counts.items() if count > 1}
    if remaining_dups:
        print(f'⚠ WARNING: {len(remaining_dups)} duplicate IDs still remain!')
        for cid, count in remaining_dups.items():
            print(f'  {cid}: {count} courses')
    else:
        print('✓ All course IDs are now unique!')

if __name__ == '__main__':
    main()
