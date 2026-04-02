---
name: docs-update
description: "Update project documentation (specs.md and design.md) after code changes. Use when: features were added or modified, architecture changed, new components created, data model updated, or user asks to update docs."
---

# Documentation Update

Keep `specs.md` (product specifications) and `design.md` (technical design) in sync with the codebase after every meaningful change.

## When to Use

- After implementing a new feature or modifying existing behaviour
- After adding/removing/renaming components or modules
- After changing the data model (types.ts)
- After modifying the screen flow or navigation
- When the orchestrator agent delegates doc updates

## Procedure

### 1. Understand What Changed

Read the code that was modified. Identify:
- New or changed **user-facing behaviour** → affects `specs.md`
- New or changed **architecture, modules, data model** → affects `design.md`
- Both docs may need updates for a single change

### 2. Update specs.md

`specs.md` describes **what the app does** from a user/product perspective.

**Structure to follow** (preserve existing sections, add as needed):
- Overview
- Phases / Screens table
- Core Concepts (Workout Structure, Exercise Library, Muscle Groups, Visual Grid, Timing)
- Features (numbered by phase: Setup, Exercise Library, Workout, Summary)
- Non-Functional Requirements

**Rules:**
- Write in present tense, declarative style ("Users can…", "The grid shows…")
- Be specific about behaviour: mention tap targets, toggles, confirmation dialogs
- Use tables for structured data (timing defaults, muscle groups, etc.)
- When adding a new feature, place it in the correct phase section
- When modifying behaviour, update the existing description in place — don't append duplicates
- Keep the feature list exhaustive: if it's in the UI, it should be in specs

### 3. Update design.md

`design.md` describes **how the app is built** from an engineering perspective.

**Structure to follow** (preserve existing sections, add as needed):
- Tech Stack table
- Project Structure (file tree)
- Data Model (TypeScript interfaces)
- Visual Grid description
- Timer Engine
- Screens & Navigation diagram
- Responsive / Mobile Strategy
- Audio Strategy
- Wake Lock
- Persistence

**Rules:**
- Update the **Project Structure** file tree when files are added or removed
- Update **Data Model** section when types.ts changes — show the actual TypeScript interfaces
- Keep the ASCII navigation diagram current when screens change
- Document new modules with their purpose and key exports
- Include code snippets showing key interfaces or algorithms
- When data model evolves, show the current state — not a changelog

### 4. Consistency Check

After editing both files, verify:
- [ ] Screen names in specs match the `Screen` type in types.ts
- [ ] Muscle groups listed match `MUSCLE_ORDER` in types.ts
- [ ] File tree in design.md matches actual `src/` contents
- [ ] Data model in design.md matches actual types in types.ts
- [ ] Feature descriptions in specs match actual UI behaviour
- [ ] No stale references to removed features or files

### 5. Format

- Use GitHub-flavoured Markdown
- Use tables for structured comparisons
- Use code blocks with language tags for TypeScript snippets
- Keep lines ≤ 120 characters where practical
- Preserve existing heading hierarchy (don't change `##` to `###` etc.)
