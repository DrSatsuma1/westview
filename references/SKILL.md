---
name: incremental-refactoring
description: Enforce safe, incremental refactoring of React/JSX code through small validated changes, preventing broken code from incomplete edits, mismatched tags, or overly complex changes. Use when refactoring React components, extracting JSX, restructuring components, or any JSX/TSX editing task where code correctness is critical. Particularly important for complex component refactoring, large file edits, or when previous attempts have resulted in broken JSX structure.
---

# Incremental Refactoring for React/JSX

This skill enforces a disciplined, test-driven approach to refactoring React components and JSX code. It prevents common errors like mismatched tags, incomplete edits, and overly ambitious changes by mandating small, validated increments.

## Core Discipline: The Atomic Change Rule

**CRITICAL**: Make ONE logical change at a time that addresses ONE concern.

**Size guidelines** (not hard limits):
- Target: 10-30 lines per change
- Acceptable: Up to 50 lines if truly atomic
- Reconsider: 50-100 lines (probably should split)
- Must split: >100 lines

**What matters more than line count**:
1. Can you describe it in one sentence?
2. Does it address exactly one concern?
3. Does it work independently?
4. Can you easily revert it?
5. If tests break, will you know why?

If yes to all → proceed (even if 40 lines)
If no to any → split (even if 15 lines)

## Workflow for Every Refactoring

Follow this exact sequence for EVERY refactoring task:

### 1. Read Refactoring Patterns (First)

Before starting any refactoring, read the patterns reference:

```bash
view references/refactoring-patterns.md
```

This provides proven patterns for common refactoring scenarios.

### 2. Analyze and Plan

- Read the file to be refactored completely
- Identify ONE specific concern to address
- Describe the change in one sentence
- Verify it's atomic (passes the 5 questions above)
- Estimate lines affected - if >50, consider splitting

### 3. Execute Single Change

- Use str_replace for exactly one atomic edit
- Keep the change focused on one concern
- Ensure JSX tags remain balanced

### 4. Validate JSX Structure

After EVERY edit, validate the JSX structure:

```bash
node scripts/validate_jsx.js <filepath>
```

**Why parser-based validation:**
- Industry-standard approach (used by ESLint, Babel, jscodeshift)
- Handles all edge cases: comments, strings, complex nesting
- Performance: ~10ms regardless of file size (tested up to 2000 lines)
- Reliable: properly parses JSX AST, no regex fragility

If validation fails:
- STOP immediately
- Revert the change
- Find a smaller increment
- Try again

### 5. Test the Change

After validation passes:
- If tests exist, run them
- Visually inspect the change
- Verify functionality is preserved

### 6. Repeat for Next Change

Only after validation + testing pass, proceed to the next incremental change.

## Common Refactoring Scenarios

### Scenario 1: Extracting JSX to Component

**Goal**: Move JSX block to new component

**Steps**:
1. Identify the exact JSX block (count lines - if >50, extract smaller piece)
2. List all props/variables it needs
3. Create new component file with proper imports
4. Test new component renders
5. Replace original JSX with component usage
6. Validate both files

**Example Sequence**:
```bash
# Step 1: Create new component file
create_file NewComponent.jsx <content>

# Step 2: Validate new file
node scripts/validate_jsx.js NewComponent.jsx

# Step 3: Update original file to use new component (one str_replace)
str_replace OriginalComponent.jsx <old_jsx> <new_component_usage>

# Step 4: Validate original file
node scripts/validate_jsx.js OriginalComponent.jsx

# Step 5: Test
```

### Scenario 2: Splitting Large Component

**Goal**: Break 200+ line component into smaller pieces

**Steps**:
1. Read full component, identify logical sections
2. Choose SMALLEST section to extract first
3. Extract that section only (don't touch others)
4. Validate and test
5. Repeat for next section

**Critical**: Extract one section at a time, never multiple sections in one pass.

### Scenario 3: Refactoring Component Structure

**Goal**: Restructure component internals (hooks, state, JSX organization)

**Steps**:
1. Identify one aspect to change (e.g., "consolidate useState calls")
2. Make that one change
3. Validate and test
4. Identify next aspect
5. Repeat

**Never**: Try to reorganize hooks, state, AND JSX structure in one edit.

### Scenario 4: Fixing Nested Ternaries

**Goal**: Simplify complex conditional rendering

**Steps**:
1. Extract ONE condition at a time
2. Convert to if/early return
3. Validate and test
4. Continue with next condition

Reference: See Pattern 4 in refactoring-patterns.md

## JSX Structure Validation

The validation script checks:

✅ Matching opening/closing tags
✅ Balanced React Fragments (<> and </>)
✅ Self-closing tags (img, input, br, etc.)
✅ JSX-specific attributes (className vs class)
✅ Proper nesting

**Supports both .jsx and .tsx files** (TypeScript and JavaScript React components)

**Usage**:
```bash
# Basic validation (checks JSX structure only)
node scripts/validate_jsx.js Component.jsx
node scripts/validate_jsx.js Component.tsx  # TypeScript also supported

# With line-change guideline check (e.g., warn if >30 lines changed)
node scripts/validate_jsx.js Component.jsx 30 Component.jsx.bak

# The script will:
# - Report any JSX structure errors (required)
# - Warn about common JSX mistakes
# - Optionally warn if changes exceed guideline (not enforced)
# - Exit with code 1 only for structure errors
```

## Red Flags - When to Stop and Split

STOP immediately if you encounter:

1. **Can't describe in one sentence**: Change addresses multiple concerns
2. **Multiple unrelated changes**: State + styling + extraction together
3. **Validation fails**: JSX structure broken
4. **Won't work independently**: Creates broken intermediate state
5. **Testing breaks unexpectedly**: Change was too large to debug
6. **>100 lines changed**: Definitely too large, must split
7. **50-100 lines and uncertain**: Probably should split
8. **External dependencies**: Requires simultaneous modification of external API contracts (GraphQL queries, REST endpoints, TypeScript interfaces/types shared across files) AND component logic - split into separate atomic changes

## Testing Checkpoints

After EVERY change:

1. **Structure**: `node scripts/validate_jsx.js <file>`
2. **Syntax**: Check for TypeScript/ESLint errors
3. **Tests**: Run component tests if available
4. **Visual**: Does it still render correctly?

If ANY fail → Revert → Smaller increment

## Examples of Atomic Changes

### Good: One Concern, Clear Description

✅ "Change div to section" (5 lines, trivial)
✅ "Add className prop to Component" (1 line, trivial)
✅ "Extract UserCard JSX block to component" (35 lines, atomic)
✅ "Add error handling to form submission" (28 lines, atomic)
✅ "Rename userId prop to id throughout file" (42 lines, atomic)
✅ "Add authentication to API call" (30 lines, atomic)

### Bad: Multiple Concerns, Unclear Scope

❌ "Restructure entire component" (100+ lines, too large)
❌ "Extract 3 components simultaneously" (multiple concerns)
❌ "Add feature and refactor styling" (2 concerns in 15 lines)
❌ "Reorganize imports, state, hooks, and JSX" (4 concerns)
❌ "Fix validation and error handling and loading" (3 concerns)
❌ "Update component and also its tests and types" (3 files, unclear scope)

## Integration with TDD

This skill complements test-driven development:

1. **Red**: Test fails or needs new feature
2. **Green**: Make MINIMAL atomic change to pass (use this skill's discipline)
3. **Refactor**: Use incremental refactoring patterns
4. **Validate**: Use JSX validation after each refactor step

The atomic change principle aligns with TDD's "minimal change" philosophy - but "minimal" means "smallest complete concern," not "fewest lines possible."

## Handling Complex Refactorings

For large refactorings (e.g., 500-line component needs major restructuring):

1. Break into phases (state, hooks, JSX, extraction)
2. Each phase = multiple atomic changes
3. Complete one phase fully before next
4. Validate + test after EVERY change
5. Commit after each phase (if using git)

**Time estimates**:
- Simple extract: 2-3 atomic changes, ~5 minutes
- Medium refactor: 5-8 atomic changes, ~15 minutes  
- Complex restructure: 15-25 atomic changes, ~45-60 minutes

Small atomic changes may feel slower initially but prevent debugging time. Each change is independently verifiable.

## Error Recovery

If validation or tests fail:

1. **Revert**: Use str_replace to undo last change
2. **Analyze**: What broke? Why?
3. **Smaller**: Find a smaller increment that avoids the issue
4. **Retry**: Attempt the smaller change
5. **Validate**: Check if it works now

Never push forward with broken code to "fix it later."

## When NOT to Use This Skill

This skill is NOT needed for:

- ❌ Creating new components from scratch (no refactoring involved)
- ❌ Simple one-line changes
- ❌ Non-React/JSX files (though principles still apply)
- ❌ Fixing typos or formatting

Use this skill when:

- ✅ Restructuring existing React components
- ✅ Extracting JSX to new components
- ✅ Splitting large components
- ✅ Complex state or hook refactoring
- ✅ Any JSX editing with risk of breaking structure
- ✅ When previous attempts resulted in broken code

## Success Metrics

Good incremental refactoring achieves:

- Zero broken intermediate states
- Each increment independently testable
- Clear revert point if issues arise
- Continuous validation throughout process
- Reduced debugging time

## Quick Reference

```bash
# 1. Read patterns first
view references/refactoring-patterns.md

# 2. Plan ONE atomic change
# - Can I describe it in one sentence?
# - Does it address one concern?
# - Will it work independently?

# 3. Execute the change
str_replace <file> <old> <new>

# 4. Validate immediately
node scripts/validate_jsx.js <file>

# 5. Test
npm test <file>.test.js

# 6. Repeat steps 2-5 for next atomic change
```

**Remember**: One concern at a time, validate always, test after each change.
