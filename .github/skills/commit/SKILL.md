---
name: commit
description: "Create git commits with conventional commit messages for KettleClock changes. Use when: code changes are complete and verified, after implementation and docs are updated, or user asks to commit. Handles staging, message formatting, and multi-commit splitting."
---

# Git Commit

Create well-structured git commits after code changes are complete and verified.

## When to Use

- After implementing a feature or fix and verifying the build
- After updating documentation
- When the orchestrator agent delegates committing
- When the user asks to commit current changes

## Procedure

### 1. Review Changes

```bash
git status
git diff --stat
git diff                 # Review actual changes
```

Understand what changed before writing the commit message.

### 2. Identify Distinct Changes

If changes span multiple concerns, split into separate commits. Each commit should be a **single logical unit**:

| Concern | Example |
|---------|---------|
| Feature code | New component + its CSS module + type additions |
| Refactor | Renaming, restructuring without behaviour change |
| Bug fix | Targeted fix with minimal diff |
| Documentation | specs.md and/or design.md updates |
| Tests | New or modified test files |
| Config | Build config, tsconfig, package.json changes |

### 3. Commit Message Format

Use **Conventional Commits**:

```
<type>(<scope>): <description>

[optional body — what and why, not how]
```

**Types:**
- `feat` — New feature or capability
- `fix` — Bug fix
- `refactor` — Code restructuring without behaviour change
- `docs` — Documentation only (specs.md, design.md)
- `test` — Adding or modifying tests
- `style` — CSS changes, formatting (no logic change)
- `chore` — Build config, tooling, dependencies

**Scopes** (use the most specific that applies):
- Component name: `workout-builder`, `exercise-library`, `timer`, `summary`
- Module name: `exercises`, `storage`, `segments`, `audio`, `types`
- General: `app`, `docs`, `build`

**Examples:**
```
feat(exercise-library): add exercise editor with CRUD operations

Unified model for built-in and custom exercises. Editor accessible
from setup screen with filter, add, edit, duplicate, delete, and
enable/disable functionality. Persisted in localStorage.
```

```
docs: update specs and design for exercise library feature

Added Exercise Library Editor section to specs.md.
Updated design.md with new file structure and data model.
```

```
fix(workout-builder): prevent auto-save when grid is empty
```

### 4. Stage and Commit

For a single logical change:
```bash
git add -A
git commit -m "<type>(<scope>): <description>"
```

For split commits (stage specific files):
```bash
git add src/types.ts src/exercises.ts src/components/ExerciseLibrary.tsx src/components/ExerciseLibrary.module.css
git commit -m "feat(exercise-library): add exercise editor with CRUD operations"

git add specs.md design.md
git commit -m "docs: update specs and design for exercise library feature"
```

### 5. Rules

- **Never** use `--no-verify` or `--force`
- **Never** amend published commits without user confirmation
- **Ask before pushing** — staging and committing locally is safe; pushing is not
- Keep the subject line ≤ 72 characters
- Use imperative mood: "add", "fix", "update" — not "added", "fixes", "updated"
- The body explains **what** and **why**, not **how** (the diff shows how)
- If changes are not yet verified (`tsc --noEmit` / `vite build`), verify first before committing
