# seatview – instructions for Claude Code

## Project
seatview shows an approximate first-person view from a seat before the user buys a
ticket (open-air theaters, concert halls, cinemas; later train/bus window info).
Views are estimates and must always be labeled as such in the UI.

## Stack
- Next.js (App Router) + TypeScript
- React Three Fiber (Three.js) + drei for 3D
- No backend yet (phase 2: Spring Boot + PostgreSQL)

## Architecture rules
- Venues are data: one JSON file per venue in `venues/`. Never hard-code venue
  geometry in components.
- Each venue type has its own generator in `src/engine/generators/`
  (amphitheater, cinema, train). Adding a venue = new JSON, adding a venue
  type = new generator.
- Keep 3D scene code in `src/viewer/`, pure seat-position math in `src/engine/`
  (no React or Three.js imports there, so it stays unit-testable).
- Colors, fonts and spacing live in one theme file so the design can change later.
- Sample or unverified measurements must be marked as sample data in the JSON.

## Working style
- Work in small steps. Finish one step, show what changed, then stop and wait.
  Do not build several features in one go.
- NEVER run `git commit`, `git push` or any command that changes git history.
  The owner commits manually. After each step, only suggest a commit message
  (Conventional Commits style, e.g. `feat: add amphitheater seat generator`).
  Staging (`git add`) is also left to the owner.
- Before adding a dependency, say what it is for and ask.
- Write all code, comments, identifiers and commit messages in English.
  Comment non-obvious logic (especially coordinate math and units: meters).
- Run the build/lint after each step and report the result honestly.
  If something fails or is untested, say so.
- Do not scrape ticketing sites. Venue seat data is entered by hand or
  provided by partners.

## Notes
- Planning notes live outside this repo in `../notes/`; do not move them here.
- Reference photos live in `../references/` and must not be committed.
