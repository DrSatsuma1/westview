# Safe React/JSX Refactoring Patterns

This document catalogs proven patterns for safe, incremental refactoring of React components.

## Core Principles

1. **Atomic Changes**: One logical concern per edit (typically 10-50 lines)
2. **Validate Always**: Check JSX structure after each edit
3. **Test Checkpoints**: Run tests between changes
4. **One Concern**: Each edit addresses exactly one specific issue
5. **Independent Changes**: Each edit should work on its own

## Pattern 1: Extract JSX to Component

**When**: JSX block is repeated, or component exceeds 100-150 lines

**Steps**:
1. Identify the JSX block to extract (keep it small, <50 lines)
2. Identify all variables/props used by that block
3. Create new component function with those as props
4. Replace original JSX with component usage
5. Test

**Example**:

```jsx
// Before (step 1: identify block)
function UserProfile({ user }) {
  return (
    <div>
      <img src={user.avatar} alt={user.name} />
      <h2>{user.name}</h2>
      <p>{user.bio}</p>
    </div>
  );
}

// Step 2-3: Create new component
function UserCard({ avatar, name, bio }) {
  return (
    <div>
      <img src={avatar} alt={name} />
      <h2>{name}</h2>
      <p>{bio}</p>
    </div>
  );
}

// Step 4: Replace usage
function UserProfile({ user }) {
  return <UserCard {...user} />;
}
```

**Common Mistakes**:
- ❌ Extracting too much at once (>50 lines)
- ❌ Missing prop dependencies
- ❌ Not testing after extraction

## Pattern 2: Split Large Component

**When**: Component exceeds 150-200 lines

**Steps**:
1. Identify logical boundaries (rendering concerns, state management)
2. Extract ONE section at a time
3. Move related state with the section
4. Test after each extraction

**Example**:

```jsx
// Before: 200-line component with form + results
function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  return (
    <div>
      {/* 50 lines of search form */}
      {/* 100 lines of results display */}
    </div>
  );
}

// Step 1-2: Extract search form FIRST (smaller piece)
function SearchForm({ onSearch }) {
  const [query, setQuery] = useState('');
  
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSearch(query); }}>
      {/* form fields */}
    </form>
  );
}

function SearchPage() {
  const [results, setResults] = useState([]);
  
  return (
    <div>
      <SearchForm onSearch={setResults} />
      {/* results display */}
    </div>
  );
}

// Step 3-4: THEN extract results (after first extraction is tested)
```

## Pattern 3: Incremental State Refactoring

**When**: State management needs restructuring

**Steps**:
1. Add new state structure alongside old
2. Update one useState/reducer at a time
3. Gradually migrate references
4. Remove old state only after everything works

**Example**:

```jsx
// Before: Scattered state
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const [email, setEmail] = useState('');

// Step 1: Add new structure (keep old)
const [user, setUser] = useState({ firstName: '', lastName: '', email: '' });
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const [email, setEmail] = useState('');

// Step 2: Migrate ONE piece at a time
function handleFirstNameChange(value) {
  setFirstName(value); // Keep for now
  setUser(prev => ({ ...prev, firstName: value })); // Add new
}

// Step 3: Update references gradually
// Change JSX to use user.firstName instead of firstName

// Step 4: Remove old state (only after all references updated)
```

## Pattern 4: Safe Conditional Rendering Refactoring

**When**: Complex nested ternaries need simplification

**Steps**:
1. Extract condition to variable
2. Convert to if/early return
3. Test
4. Repeat for next condition

**Example**:

```jsx
// Before: Nested ternaries
return (
  <div>
    {loading ? (
      <Spinner />
    ) : error ? (
      <Error message={error} />
    ) : data ? (
      <DataDisplay data={data} />
    ) : null}
  </div>
);

// Step 1-2: Extract ONE condition
if (loading) return <Spinner />;

return (
  <div>
    {error ? (
      <Error message={error} />
    ) : data ? (
      <DataDisplay data={data} />
    ) : null}
  </div>
);

// Step 3: Test, then continue with next condition
if (loading) return <Spinner />;
if (error) return <Error message={error} />;

return (
  <div>
    {data ? <DataDisplay data={data} /> : null}
  </div>
);
```

## Pattern 5: Incremental Hook Extraction

**When**: useEffect or useState logic is complex

**Steps**:
1. Create custom hook with copied logic
2. Keep both versions running in parallel
3. Verify custom hook works
4. Remove original
5. Test

**Example**:

```jsx
// Before: Complex useEffect in component
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    setLoading(true);
    fetchUser(userId)
      .then(setUser)
      .finally(() => setLoading(false));
  }, [userId]);
  
  return <div>{/* render */}</div>;
}

// Step 1-2: Create hook, keep original (parallel)
function useUser(userId) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    setLoading(true);
    fetchUser(userId)
      .then(setUser)
      .finally(() => setLoading(false));
  }, [userId]);
  
  return { user, loading };
}

function UserProfile({ userId }) {
  // New version
  const { user: newUser, loading: newLoading } = useUser(userId);
  
  // Old version (keep temporarily)
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    setLoading(true);
    fetchUser(userId)
      .then(setUser)
      .finally(() => setLoading(false));
  }, [userId]);
  
  // Step 3: Verify both produce same results
  console.log('Match?', user === newUser, loading === newLoading);
  
  // Still use old version in render
  return <div>{/* render with user, loading */}</div>;
}

// Step 4: After verification, update render to use new version
// Step 5: Remove old version
```

## Red Flags - Stop and Split

Stop immediately if you encounter:

1. **Can't explain in 1 sentence**: Change addresses multiple concerns
2. **Multiple concerns**: Touching state + styling + structure together
3. **Won't work independently**: Creates broken intermediate state
4. **Test breaks unexpectedly**: Change scope was unclear
5. **>100 lines changed**: Definitely too large, must split
6. **50-100 lines and uncertain**: Probably should split into phases

## Testing Checkpoints

After each incremental change:

1. Validate JSX structure: `python validate_jsx.py Component.jsx`
2. Run component tests: `npm test Component.test.js`
3. Visual check: Does it render correctly?
4. If any fail: Revert immediately and take smaller step

## Common Pitfalls

### Pitfall 1: Partial Tag Edits
```jsx
// ❌ Wrong: Only changed opening tag
<div className="old">
  {content}
</span>  // Forgot to change closing tag

// ✅ Right: Change both in one atomic edit
<section className="new">
  {content}
</section>
```

### Pitfall 2: Missing Imports After Extract
```jsx
// ❌ Wrong: Extracted component but forgot imports
// NewComponent.jsx
function NewComponent() {
  return <Button>Click</Button>; // Button not imported!
}

// ✅ Right: Add imports immediately after extraction
import { Button } from './Button';

function NewComponent() {
  return <Button>Click</Button>;
}
```

### Pitfall 3: Extracting Too Much State
```jsx
// ❌ Wrong: Moved 5 pieces of state at once
// Can't tell which one broke tests

// ✅ Right: Move one state variable, test, then next
```

## Workflow Summary

1. **Identify** one atomic change (one concern, typically 10-50 lines)
2. **Verify** it's atomic (one sentence description, works independently)
3. **Plan** the exact str_replace operation
4. **Execute** the single edit
5. **Validate** JSX structure with script
6. **Test** the change works
7. **Commit** (if using git)
8. **Repeat** for next atomic change

Never skip steps. Atomic changes = clear reverts, fewer bugs.
