#!/usr/bin/env python3
"""
Fix incorrectly categorized course pathways in courses_complete.json
"""

import json

def fix_pathways(courses):
    """Fix pathway assignments for miscategorized courses"""
    fixes = 0

    for course in courses:
        course_name = course['full_name']
        course_id = course['course_id']
        original_pathway = course['pathway']
        new_pathway = None

        # Fix ENS courses - should be Physical Education
        if 'ENS' in course_name or 'ENS' in course_id:
            new_pathway = 'Physical Education'

        # Fix Digital Media courses - should be Visual & Performing Arts
        elif 'DIGITAL MEDIA PRODUCTION' in course_name:
            new_pathway = 'Visual & Performing Arts'

        # Fix Design/Mixed Media - should be Visual & Performing Arts
        elif 'DESIGN AND MIXED MEDIA' in course_name:
            new_pathway = 'Visual & Performing Arts'

        # Fix Digital Photography 1-2 (not the Studio Art one)
        elif course_name == 'DIGITAL PHOTOGRAPHY 1-2':
            new_pathway = 'Visual & Performing Arts'

        # Fix Digital Electronics - should be Career Technical Education
        elif 'DIGITAL ELECTRONICS' in course_name:
            new_pathway = 'Career Technical Education'

        if new_pathway and new_pathway != original_pathway:
            print(f'✓ Fixed: {course_name}')
            print(f'  {original_pathway} → {new_pathway}')
            course['pathway'] = new_pathway
            fixes += 1

    return fixes

def main():
    print('Loading courses_complete.json...')
    with open('src/data/courses_complete.json', 'r') as f:
        data = json.load(f)

    print(f'Total courses: {len(data["courses"])}\n')

    print('Fixing pathway categorization...\n')
    fixes = fix_pathways(data['courses'])

    print(f'\n{fixes} courses fixed\n')

    # Save fixed data
    print('Saving fixed data to courses_complete.json...')
    with open('src/data/courses_complete.json', 'w') as f:
        json.dump(data, f, indent=2)

    print('✓ Done!\n')

    # Show summary
    print('PATHWAY DISTRIBUTION AFTER FIXES:')
    pathways = {}
    for course in data['courses']:
        pathway = course['pathway']
        pathways[pathway] = pathways.get(pathway, 0) + 1

    for pathway in sorted(pathways.keys()):
        print(f'  {pathway}: {pathways[pathway]} courses')

if __name__ == '__main__':
    main()
