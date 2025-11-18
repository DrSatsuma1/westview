#!/usr/bin/env python3
"""
Analyze scheduling patterns in the course catalog JSON.
"""

import json
from collections import defaultdict, Counter

def load_courses():
    with open('src/data/courses_complete.json', 'r') as f:
        data = json.load(f)
    return data['courses']

def analyze_patterns(courses):
    patterns = {
        'term_lengths': Counter(),
        'semester_restrictions': defaultdict(list),
        'ap_honors_pairs': [],
        'fall_spring_dependencies': [],
        'yearlong_courses': [],
        'semester_only_courses': [],
        'prerequisite_chains': [],
        'replacement_courses': []
    }

    for course in courses:
        # Term length distribution
        term_length = course.get('term_length')
        patterns['term_lengths'][term_length] += 1

        # Categorize by term length
        if term_length == 'yearlong':
            patterns['yearlong_courses'].append({
                'name': course['full_name'],
                'id': course['course_id'],
                'offered_terms': course.get('offered_terms', [])
            })
        elif term_length == 'semester':
            patterns['semester_only_courses'].append({
                'name': course['full_name'],
                'id': course['course_id'],
                'offered_terms': course.get('offered_terms', []),
                'semester_restrictions': course.get('semester_restrictions')
            })

        # AP/Honors pairs
        if course.get('is_ap_or_honors_pair'):
            patterns['ap_honors_pairs'].append({
                'name': course['full_name'],
                'id': course['course_id'],
                'pair_id': course.get('pair_course_id'),
                'fall_to_spring_dep': course.get('fall_to_spring_dependency')
            })

        # Fall-to-spring dependencies
        if course.get('fall_to_spring_dependency'):
            patterns['fall_spring_dependencies'].append({
                'name': course['full_name'],
                'id': course['course_id'],
                'pair_id': course.get('pair_course_id')
            })

        # Semester restrictions
        if course.get('semester_restrictions'):
            patterns['semester_restrictions'][course['semester_restrictions']].append({
                'name': course['full_name'],
                'id': course['course_id']
            })

        # Prerequisites (chains)
        prereq_req = course.get('prerequisites_required', [])
        prereq_rec = course.get('prerequisites_recommended', [])
        if prereq_req or prereq_rec:
            patterns['prerequisite_chains'].append({
                'name': course['full_name'],
                'id': course['course_id'],
                'required': prereq_req,
                'recommended': prereq_rec
            })

        # Replacement courses
        if course.get('is_replacement_course'):
            patterns['replacement_courses'].append({
                'name': course['full_name'],
                'id': course['course_id'],
                'equivalents': course.get('replacement_equivalents', [])
            })

    return patterns

def print_patterns(patterns):
    print("=" * 80)
    print("SCHEDULING PATTERN ANALYSIS")
    print("=" * 80)

    print("\n1. TERM LENGTH DISTRIBUTION:")
    print("-" * 80)
    for term_length, count in patterns['term_lengths'].most_common():
        print(f"  {term_length}: {count} courses")

    print("\n2. YEAR-LONG COURSES (first 5 examples):")
    print("-" * 80)
    for course in patterns['yearlong_courses'][:5]:
        print(f"  - {course['name']}")
        print(f"    ID: {course['id']}, Offered: {course['offered_terms']}")
    print(f"  ... and {len(patterns['yearlong_courses']) - 5} more")

    print("\n3. SEMESTER-ONLY COURSES (first 5 examples):")
    print("-" * 80)
    for course in patterns['semester_only_courses'][:5]:
        print(f"  - {course['name']}")
        print(f"    ID: {course['id']}, Offered: {course['offered_terms']}")
        if course['semester_restrictions']:
            print(f"    Restrictions: {course['semester_restrictions']}")
    if len(patterns['semester_only_courses']) > 5:
        print(f"  ... and {len(patterns['semester_only_courses']) - 5} more")

    print("\n4. SEMESTER RESTRICTIONS:")
    print("-" * 80)
    for restriction, courses in patterns['semester_restrictions'].items():
        print(f"  {restriction}: {len(courses)} courses")
        for course in courses[:2]:
            print(f"    - {course['name']}")

    print("\n5. AP/HONORS PAIRS (first 10 examples):")
    print("-" * 80)
    for course in patterns['ap_honors_pairs'][:10]:
        print(f"  - {course['name']}")
        print(f"    ID: {course['id']}, Pair: {course['pair_id']}, Fall→Spring: {course['fall_to_spring_dep']}")
    if len(patterns['ap_honors_pairs']) > 10:
        print(f"  ... and {len(patterns['ap_honors_pairs']) - 10} more")

    print("\n6. FALL-TO-SPRING DEPENDENCIES:")
    print("-" * 80)
    for course in patterns['fall_spring_dependencies']:
        print(f"  - {course['name']}")
        print(f"    ID: {course['id']}, Pair: {course['pair_id']}")

    print("\n7. PREREQUISITE CHAINS (first 5 examples):")
    print("-" * 80)
    for course in patterns['prerequisite_chains'][:5]:
        print(f"  - {course['name']}")
        if course['required']:
            print(f"    Required: {course['required'][0][:100]}...")
        if course['recommended']:
            print(f"    Recommended: {course['recommended'][0][:100]}...")
    if len(patterns['prerequisite_chains']) > 5:
        print(f"  ... and {len(patterns['prerequisite_chains']) - 5} more")

    print("\n8. REPLACEMENT COURSES:")
    print("-" * 80)
    for course in patterns['replacement_courses']:
        print(f"  - {course['name']}")
        print(f"    Equivalents: {course['equivalents']}")

    print("\n" + "=" * 80)
    print("SUMMARY STATISTICS:")
    print("=" * 80)
    print(f"Total courses analyzed: {sum(patterns['term_lengths'].values())}")
    print(f"Year-long courses: {len(patterns['yearlong_courses'])}")
    print(f"Semester courses: {len(patterns['semester_only_courses'])}")
    print(f"AP/Honors pairs: {len(patterns['ap_honors_pairs'])}")
    print(f"Fall→Spring dependencies: {len(patterns['fall_spring_dependencies'])}")
    print(f"Courses with prerequisites: {len(patterns['prerequisite_chains'])}")
    print(f"Replacement courses: {len(patterns['replacement_courses'])}")
    print("=" * 80)

if __name__ == '__main__':
    courses = load_courses()
    patterns = analyze_patterns(courses)
    print_patterns(patterns)
