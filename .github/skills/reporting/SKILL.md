---
name: reporting
description: "Report what was done after implementing changes in KettleClock. Use when: a feature or fix is complete, after each iteration of user feedback, or when the orchestrator needs a change summary. Covers what changed, what's unclear, and what's unimplemented."
---

# Change Reporting

Produce a concise, structured report after each iteration of changes so the user knows exactly what happened, what to verify, and what might need attention.

## When to Use

- After completing an implementation task (feature, fix, refactor)
- After each round of user feedback and resulting changes
- When the orchestrator agent requests a summary
- Before asking the user for the next round of feedback

## Report Format

Structure every report with these sections:

### Template

```markdown
## Changes Made

### [Category: e.g. "Hamburger Menu", "Exercise Library"]
- Bullet list of specific changes
- Reference files changed: `ComponentName.tsx`, `styles.module.css`
- Mention new files created

### [Another category if applicable]
- ...

## Files Modified
- `path/to/file.tsx` — brief what changed
- `path/to/new-file.tsx` — **new file**

## Build Status
- TypeScript: ✅ clean / ❌ N errors
- Vite build: ✅ clean / ❌ failed

## Open Questions
- List any ambiguous requirements or design decisions made on assumption
- "Assumed X because Y — confirm if correct"

## Potentially Unclear Behaviour
- Edge cases that may surprise the user
- Interactions between features that weren't explicitly specified
- Mobile/touch behaviour that may differ from desktop

## Not Yet Implemented
- Features mentioned but deliberately deferred
- Known gaps or TODOs
- Things that need user input before proceeding
```

## Procedure

### 1. Gather Changes

Review what was actually modified:
```bash
git diff --stat          # If uncommitted
git log --oneline -5     # If recently committed
```

Read the modified files to confirm what changed.

### 2. Categorize

Group changes by **user-visible feature or concern**, not by file:
- Good: "Hamburger Menu", "New Workout Flow", "Auto-save"
- Bad: "WorkoutBuilder.tsx changes", "CSS updates"

### 3. Identify Gaps

For each feature requirement from the user's request:
- Was it fully implemented?
- Were any assumptions made?
- Are there edge cases not covered?
- Does it interact unexpectedly with other features?

Common areas to flag:
- Mobile touch behaviour vs desktop click
- localStorage migration when data shapes change
- Disabled/empty states (what happens with 0 exercises? empty grid?)
- Back-navigation and state preservation

### 4. Build Verification

Always include build status. If the build hasn't been verified:
```bash
npx tsc --noEmit
npx vite build
```

### 5. Tone and Style

- Be concise — bullets over paragraphs
- Be specific — "added `menuOpen` state to WorkoutBuilder" not "updated state"
- Be honest about assumptions — "assumed the menu should close on outside tap"
- Separate facts from suggestions — report what *is*, then suggest what *could be*
- Don't pad the report — if there are no open questions, omit that section
