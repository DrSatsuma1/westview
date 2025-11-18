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
    """Replace L/ prefix with Special Ed and expand ELL"""
    fixes = 0
    for course in courses:
        old_name = course['full_name']
        changed = False

        # Fix L/ prefix
        if old_name.startswith('L/'):
            new_name = 'Special Ed ' + old_name[2:]
            course['full_name'] = new_name
            print(f'✓ Fixed Special Ed course: {old_name} → {new_name}')
            fixes += 1
            changed = True

        # Expand ELL to English Language Learner (ELL)
        if not changed and old_name.startswith('ELL '):
            new_name = 'English Language Learner (ELL) ' + old_name[4:]
            course['full_name'] = new_name
            print(f'✓ Expanded ELL course: {old_name} → {new_name}')
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

    # Fine Arts course keywords (excluding JOURNALISM - that's Electives)
    fine_arts_keywords = [
        'DRAMA', 'ORCHESTRA', 'MUSIC', 'BAND', 'CHOIR', 'THEATER', 'THEATRE', 'DANCE',
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
        'Science - General': 'Science - Physical',  # Naval Science etc
        'Science': 'Science - Physical',  # Default Science to Physical
        'Elective': 'Electives',
        # Keep these as-is
        'English': 'English',
        'History/Social Science': 'History/Social Science',
        'Physical Education': 'Physical Education',
        'Science - Biological': 'Science - Biological',
        'Science - Physical': 'Science - Physical'
    }

    # Biology keywords for Science - Biological
    biology_keywords = [
        'BIOLOGY', 'BIOMEDICAL', 'ZOOLOGY', 'ANATOMY',
        'PHYSIOLOGY', 'MEDICAL', 'HUMAN BODY', 'MARINE SCIENCE'
    ]

    # Physical science keywords for Science - Physical
    physical_keywords = [
        'CHEMISTRY', 'PHYSICS', 'ENVIRONMENTAL SCIENCE'
    ]

    for course in courses:
        course_name = course['full_name']
        current_pathway = course['pathway']
        name_upper = course_name.upper()

        # Fix AVID courses - should be Electives
        if 'AVID' in name_upper:
            if current_pathway != 'Electives':
                print(f'✓ Fixed AVID course: {course_name}')
                print(f'  {current_pathway} → Electives')
                course['pathway'] = 'Electives'
                fixes += 1
                continue

        # Fix Engineering & Architecture courses (PLTW) - should be Electives
        if 'PLTW' in name_upper or \
           ('ENGINEERING' in name_upper and 'DESIGN' in name_upper) or \
           'CIVIL ENGINEERING' in name_upper or \
           'COMPUTER INTEGRATED MANUFACTURING' in name_upper or \
           ('COMPUTER SCIENCE' in name_upper and 'SOFTWARE ENGINEERING' in name_upper):
            if current_pathway != 'Electives':
                print(f'✓ Fixed Engineering/Architecture course: {course_name}')
                print(f'  {current_pathway} → Electives')
                course['pathway'] = 'Electives'
                fixes += 1
                continue

        # Fix Filipino courses - should be Foreign Language
        if 'FILIPINO' in course_name:
            if current_pathway != 'Foreign Language':
                print(f'✓ Fixed Filipino: {course_name}')
                print(f'  {current_pathway} → Foreign Language')
                course['pathway'] = 'Foreign Language'
                fixes += 1
                continue

        # Fix AP CS A - should be Math
        if 'AP COMPUTER SCIENCE A' in name_upper:
            if current_pathway != 'Math':
                print(f'✓ Fixed AP CS A: {course_name}')
                print(f'  {current_pathway} → Math')
                course['pathway'] = 'Math'
                fixes += 1
                continue

        # Fix AP CS Principles - should be Science - Physical
        if 'AP COMPUTER SCIENCE PRINCIPLES' in name_upper:
            if current_pathway != 'Science - Physical':
                print(f'✓ Fixed AP CS Principles: {course_name}')
                print(f'  {current_pathway} → Science - Physical')
                course['pathway'] = 'Science - Physical'
                fixes += 1
                continue

        # Fix CIS, Data Structures, and all Journalism - should be Electives
        if 'COMPUTER INFORMATION SYSTEMS' in name_upper or \
           'DATA STRUCTURES' in name_upper or \
           'JOURNALISM' in name_upper or \
           'YEARBOOK' in name_upper or \
           'BROADCAST' in name_upper:
            if current_pathway != 'Electives':
                print(f'✓ Fixed elective course: {course_name}')
                print(f'  {current_pathway} → Electives')
                course['pathway'] = 'Electives'
                fixes += 1
                continue

        # Fix Writing Seminar - should be English
        if 'WRITING SEMINAR' in name_upper:
            if current_pathway != 'English':
                print(f'✓ Fixed Writing Seminar: {course_name}')
                print(f'  {current_pathway} → English')
                course['pathway'] = 'English'
                fixes += 1
                continue

        # Categorize Science courses into Biological or Physical
        if current_pathway in ['Science', 'Science - General', 'Science - Biological', 'Science - Physical']:
            # Check if it's biological
            if any(keyword in name_upper for keyword in biology_keywords):
                if current_pathway != 'Science - Biological':
                    print(f'✓ Categorized as Biological Science: {course_name}')
                    print(f'  {current_pathway} → Science - Biological')
                    course['pathway'] = 'Science - Biological'
                    fixes += 1
                    continue
            # Check if it's physical
            elif any(keyword in name_upper for keyword in physical_keywords):
                if current_pathway != 'Science - Physical':
                    print(f'✓ Categorized as Physical Science: {course_name}')
                    print(f'  {current_pathway} → Science - Physical')
                    course['pathway'] = 'Science - Physical'
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
