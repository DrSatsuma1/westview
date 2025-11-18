#!/usr/bin/env python3
"""
Consolidate and fix course pathway categories to match curriculum structure:
- English
- Math
- History/Social Science
- Science
- Fine Arts
- Foreign Language
- CTE
- Physical Education
- Electives
"""

import json
import re

def fix_course_names(courses):
    """Replace L/ prefix with Special Ed"""
    fixes = 0
    for course in courses:
        if course['full_name'].startswith('L/'):
            old_name = course['full_name']
            new_name = 'Special Ed ' + old_name[2:]  # Replace "L/" with "Special Ed "
            course['full_name'] = new_name
            print(f'✓ Fixed Special Ed course: {old_name} → {new_name}')
            fixes += 1
    return fixes

def consolidate_pathways(courses):
    """Consolidate pathways and fix miscategorizations"""
    fixes = 0

    # Science course keywords
    science_keywords = [
        'CHEMISTRY', 'PHYSICS', 'BIOLOGY', 'ZOOLOGY', 'ANATOMY',
        'PHYSIOLOGY', 'MARINE', 'ENVIRONMENTAL SCIENCE', 'COMPUTER SCIENCE'
    ]

    # Fine Arts course keywords
    fine_arts_keywords = [
        'DRAMA', 'ORCHESTRA', 'JOURNALISM', 'YEARBOOK', 'BROADCAST',
        'MUSIC', 'BAND', 'CHOIR', 'THEATER', 'THEATRE', 'DANCE',
        'PHOTOGRAPHY', 'FILM', 'ANIMATION', 'CERAMICS', 'SCULPTURE',
        'DRAWING', 'PAINTING'
    ]

    # Pathway consolidation mapping
    pathway_mapping = {
        'Mathematics': 'Math',
        'Visual & Performing Arts': 'Fine Arts',
        'World Language': 'Foreign Language',
        'Career Technical Education': 'CTE',
        'Computer Science & Engineering': 'CTE',
        'Science - Biological': 'Science',
        'Science - General': 'Science',
        'Elective': 'Electives',
        # Keep these as-is
        'English': 'English',
        'History/Social Science': 'History/Social Science',
        'Physical Education': 'Physical Education'
    }

    for course in courses:
        course_name = course['full_name']
        current_pathway = course['pathway']
        name_upper = course_name.upper()

        # Fix Filipino courses - should be Foreign Language
        if 'FILIPINO' in course_name:
            if current_pathway != 'Foreign Language':
                print(f'✓ Fixed Filipino: {course_name}')
                print(f'  {current_pathway} → Foreign Language')
                course['pathway'] = 'Foreign Language'
                fixes += 1
                continue

        # Fix science courses incorrectly categorized as Math
        if current_pathway == 'Mathematics' or current_pathway == 'Math':
            if any(keyword in name_upper for keyword in science_keywords):
                print(f'✓ Fixed science course: {course_name}')
                print(f'  {current_pathway} → Science')
                course['pathway'] = 'Science'
                fixes += 1
                continue

        # Fix Fine Arts courses incorrectly categorized as English
        if current_pathway == 'English':
            if any(keyword in name_upper for keyword in fine_arts_keywords):
                print(f'✓ Fixed fine arts course: {course_name}')
                print(f'  {current_pathway} → Fine Arts')
                course['pathway'] = 'Fine Arts'
                fixes += 1
                continue

        # Fix PE/Sports courses incorrectly categorized as Fine Arts
        if current_pathway == 'Fine Arts':
            # Specific PE courses
            if ('SPORTS' in name_upper and 'E-SPORTS' not in name_upper) or \
               'UNIFIED PE' in name_upper or \
               name_upper.startswith('MARCHING PE'):
                print(f'✓ Fixed PE course: {course_name}')
                print(f'  {current_pathway} → Physical Education')
                course['pathway'] = 'Physical Education'
                fixes += 1
                continue

        # Apply pathway consolidation
        if current_pathway in pathway_mapping:
            new_pathway = pathway_mapping[current_pathway]
            if new_pathway != current_pathway:
                course['pathway'] = new_pathway
                fixes += 1

    return fixes

def main():
    print('=' * 80)
    print('COURSE DATA CONSOLIDATION AND FIXES')
    print('=' * 80)
    print('\nLoading courses_complete.json...\n')

    with open('src/data/courses_complete.json', 'r') as f:
        data = json.load(f)

    print(f'Total courses: {len(data["courses"])}\n')

    # Fix 1: Remove L/ prefix from course names
    print('STEP 1: Removing L/ prefix from course names...\n')
    name_fixes = fix_course_names(data['courses'])
    print(f'\n{name_fixes} course names updated\n')

    # Fix 2: Consolidate pathways and fix categorization
    print('STEP 2: Consolidating pathways and fixing categorization...\n')
    pathway_fixes = consolidate_pathways(data['courses'])
    print(f'\n{pathway_fixes} pathway assignments updated\n')

    # Save fixed data
    print('Saving consolidated data to courses_complete.json...')
    with open('src/data/courses_complete.json', 'w') as f:
        json.dump(data, f, indent=2)

    print('✓ Done!\n')

    # Show final distribution
    print('=' * 80)
    print('FINAL PATHWAY DISTRIBUTION:')
    print('=' * 80)
    pathways = {}
    for course in data['courses']:
        pathway = course['pathway']
        pathways[pathway] = pathways.get(pathway, 0) + 1

    for pathway in sorted(pathways.keys()):
        print(f'  {pathway}: {pathways[pathway]} courses')

    print('\n' + '=' * 80)
    print('VERIFICATION SAMPLES:')
    print('=' * 80)

    print('\nForeign Language courses:')
    foreign = [c for c in data['courses'] if c['pathway'] == 'Foreign Language']
    for c in foreign[:10]:
        print(f'  - {c["full_name"]}')
    if len(foreign) > 10:
        print(f'  ... and {len(foreign) - 10} more')

    print('\nScience courses (sample):')
    science = [c for c in data['courses'] if c['pathway'] == 'Science']
    for c in science[:10]:
        print(f'  - {c["full_name"]}')
    if len(science) > 10:
        print(f'  ... and {len(science) - 10} more')

    print('\nMath courses (sample):')
    math = [c for c in data['courses'] if c['pathway'] == 'Math']
    for c in math[:5]:
        print(f'  - {c["full_name"]}')
    if len(math) > 5:
        print(f'  ... and {len(math) - 5} more')

if __name__ == '__main__':
    main()
