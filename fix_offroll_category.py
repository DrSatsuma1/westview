#!/usr/bin/env python3
"""
Fix Off-Roll category - should be empty or have placeholder only.
Move tutor/aide courses to Electives instead.
"""

import json

def fix_offroll(courses):
    """Move tutor/aide courses back to their original pathways"""
    fixes = 0

    # Map courses to their original pathways
    original_pathways = {
        'ACADEMIC TUTOR (All Subjects)': 'Electives',
        'ACADEMIC TUTOR (Science)': 'Science - Physical',
        'LIBRARY & INFORMATION SCIENCE TEACHING ASSISTANT 1-2': 'Science - Physical',
        'VOCATIONAL LEARNING ASSISTANT': 'Science - Physical'
    }

    # Move current Off-Roll courses back to original pathways
    for course in courses:
        if course['pathway'] == 'Off-Roll' and course['full_name'] in original_pathways:
            old_pathway = course['pathway']
            new_pathway = original_pathways[course['full_name']]
            course['pathway'] = new_pathway
            print(f'✓ Moved back: {course["full_name"]}')
            print(f'  {old_pathway} → {new_pathway}')
            fixes += 1

    return fixes

def add_offroll_placeholder(courses):
    """Add a generic Off-Roll placeholder course"""
    # Check if Off-Roll placeholder already exists
    has_offroll = any(c.get('course_id') == 'OFF_ROLL_PLACEHOLDER' for c in courses)

    if not has_offroll:
        offroll_course = {
            "course_id": "OFF_ROLL_PLACEHOLDER",
            "full_name": "Off-Roll (Not Attending Westview)",
            "course_numbers": [],
            "grades_allowed": [9, 10, 11, 12],
            "credits": 0.0,
            "credit_type": "standard",
            "uc_csu_category": None,
            "pathway": "Off-Roll",
            "term_length": "semester",
            "offered_terms": ["fall", "spring"],
            "prerequisites_required": [],
            "prerequisites_recommended": [],
            "is_replacement_course": False,
            "replacement_equivalents": [],
            "is_ap_or_honors_pair": False,
            "pair_course_id": None,
            "fall_to_spring_dependency": False,
            "linked_courses": [],
            "category_priority": 1,
            "is_graduation_requirement": False,
            "semester_restrictions": None,
            "alternate_ids": [],
            "notes": "Select this option when the student is not taking courses at Westview during this semester (e.g., attending another school, independent study, etc.)"
        }
        courses.append(offroll_course)
        print('\n✓ Added Off-Roll placeholder course')
        return 1

    return 0

def main():
    print('=' * 80)
    print('FIXING OFF-ROLL CATEGORY')
    print('=' * 80)
    print('\nLoading courses_complete.json...\n')

    with open('src/data/courses_complete.json', 'r') as f:
        data = json.load(f)

    print(f'Total courses: {len(data["courses"])}\n')
    print('Moving current Off-Roll courses to Electives...\n')

    fixes = fix_offroll(data['courses'])
    print(f'\n{fixes} courses moved to Electives\n')

    print('Adding Off-Roll placeholder...\n')
    added = add_offroll_placeholder(data['courses'])

    # Save
    print('\nSaving updated data...')
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

    print(f'\nTotal: {len(offroll)} course(s)')

if __name__ == '__main__':
    main()
