#!/bin/bash

# Script to convert semester references to quarter references

cp src/App.jsx src/App.jsx.backup

# Replace semester variable names with quarter
sed -i '' 's/semester}/quarter}/g' src/App.jsx
sed -i '' 's/semester =/quarter =/g' src/App.jsx
sed -i '' 's/semester,/quarter,/g' src/App.jsx
sed -i '' 's/semester)/quarter)/g' src/App.jsx
sed -i '' 's/semester:/quarter:/g' src/App.jsx
sed -i '' 's/semester\./quarter\./g' src/App.jsx
sed -i '' 's/semester ===/quarter ===/g' src/App.jsx
sed -i '' 's/semester>/quarter>/g' src/App.jsx
sed -i '' 's/semesterCourses/quarterCourses/g' src/App.jsx
sed -i '' 's/semesterCredits/quarterCredits/g' src/App.jsx

# Replace function names
sed -i '' 's/getCoursesForSemester/getCoursesForQuarter/g' src/App.jsx
sed -i '' 's/targetSemester/targetQuarter/g' src/App.jsx
sed -i '' 's/sourceSemester/sourceQuarter/g' src/App.jsx
sed -i '' 's/oppositeSemester/oppositeQuarter/g' src/App.jsx

echo "Conversion complete. Original file backed up to src/App.jsx.backup"
