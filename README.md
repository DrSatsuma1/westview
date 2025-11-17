# Westview UC/CSU A-G Course Planner

A web application designed to help Westview High School students and parents track course requirements for both high school graduation and UC/CSU admission eligibility.

## Features

- **Course Input & Tracking**: Add courses with grades and see real-time progress
- **UC/CSU A-G Requirements**: Track all 7 A-G categories (15 courses minimum)
- **High School Graduation**: Monitor Westview's 230-credit graduation requirement
- **Smart Recommendations**: Get personalized course suggestions based on deficiencies
- **Visual Progress Indicators**: Color-coded status badges and progress bars
- **Instant Feedback**: Know if you're on track in under 5 seconds

## Built With Usability Principles

This application follows "Don't Make Me Think" principles:
- Shows problems first and largest
- Uses plain English instead of A-G codes
- Eliminates mental math (shows "Need 2 more years" vs percentages)
- Clear visual hierarchy (size = importance)
- Instant status recognition through color

## UC/CSU A-G Requirements

- **A** - History/Social Science: 2 years
- **B** - English: 4 years  
- **C** - Mathematics: 3 years (4 recommended)
- **D** - Laboratory Science: 2 years (3 recommended)
- **E** - Language Other Than English: 2 years (3 recommended)
- **F** - Visual & Performing Arts: 1 year
- **G** - College Prep Elective: 1 year

All courses must be completed with a grade of C or better.

## Westview Graduation Requirements

- Total: 230 credits minimum
- English: 40 credits (4 years)
- Math: 30 credits (3 years)
- Science: 20 credits (2 years)
- Social Studies: 35 credits
- ENS/PE: 25 credits
- Foreign Language or CTE: 10 credits
- Fine Arts: 10 credits
- Electives: 60 credits

Courses can be passed with D or better for graduation (but UC/CSU requires C or better).

## Installation

```bash
# Clone the repository
git clone https://github.com/DrSatsuma1/westview.git
cd westview

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Usage

1. **Enter Student Info**: Current grade level and target colleges
2. **Add Courses**: Select from Westview course catalog with grades
3. **Review Dashboard**: See UC/CSU eligibility status and deficiencies
4. **Get Recommendations**: Follow suggested courses to complete requirements

## Project Structure

```
westview-planner/
├── public/
│   └── index.html
├── src/
│   ├── App.jsx          # Main application component
│   ├── index.js         # Entry point
│   └── index.css        # Global styles
├── package.json
├── vite.config.js
└── README.md
```

## Credit System

- Westview: 10 credits per semester course
- UC/CSU: 1 "year" per semester course
- Special case: Spanish 5-6 = 3 UC/CSU years
- AP courses: Full year (20 credits HS) = 1 UC/CSU year

## Development Notes

- Built with React 18 and Vite
- Uses Lucide React for icons
- Tailwind CSS utility classes for styling
- No backend required (client-side only)

## Future Enhancements

- PDF export of course plans
- GPA calculator with weighted grades
- AP credit calculator
- Upload transcript PDF parsing
- Multi-school support beyond Westview
- Save/load functionality

## License

MIT

## Author

Catherine - Building better tools for college planning

## Target Market

Initial focus: Poway Unified School District families ($29 pricing tier)
