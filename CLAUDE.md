# seatview – instructions for Claude Code

## Project
seatview shows an approximate first-person view from a seat before the user buys a
ticket (open-air theaters, concert halls, cinemas; later train/bus window info).
Views are estimates and must always be labeled as such in the UI.

## Stack
- Monorepo: the Next.js app lives in `web/`, venue data in `venues/` at the repo root,
  a future backend goes in its own top-level folder (e.g. `api/`).
- Next.js (App Router) + TypeScript (run npm commands inside `web/`)
- Before writing any Next.js code, read `web/AGENTS.md` (this Next.js version has
  breaking changes; the docs ship in `web/node_modules/next/dist/docs/`).
- React Three Fiber (Three.js) + drei for 3D
- No backend yet (phase 2: Spring Boot + PostgreSQL)

## Architecture rules
- Venues are data: one JSON file per venue in `venues/`. Never hard-code venue
  geometry in components.
- Each venue type has its own generator in `web/src/engine/generators/`
  (amphitheater, cinema, train). Adding a venue = new JSON, adding a venue
  type = new generator.
- Keep 3D scene code in `web/src/viewer/`, pure seat-position math in `web/src/engine/`
  (no React or Three.js imports there, so it stays unit-testable).
- Colors, fonts and spacing live in one theme file so the design can change later.
- Sample or unverified measurements must be marked as sample data in the JSON.

## Working style
- Work in reasonably small steps and stop after each one to report. Within a step
  you have full freedom: create, edit, move or delete any file the step needs,
  including cleanup of leftovers (unused template files, dead code) and small
  fixes to config files such as .gitignore or tsconfig. Do not ask permission
  for these; just list what you changed.
- Dependencies: install what the step needs without asking, but say what each
  package is for and why. Ask first only for something unusual: paid services,
  large or unmaintained packages, or anything that changes the stack.
- NEVER run `git commit` or `git push`, and do not rewrite git history.
  The owner commits manually. After each step, suggest a commit message
  (Conventional Commits style, e.g. `feat: add amphitheater seat generator`).
  Read-only git commands (status, diff, log) are fine.
- Write all code, comments, identifiers and commit messages in English.
  Comment non-obvious logic (especially coordinate math and units: meters).
- Run lint and build after each step and report the result honestly.
  For anything visual, start the dev server and check it, or say clearly that
  you did not look at it in a browser. If something fails or is untested, say so.
- If a decision is genuinely ambiguous and expensive to undo, ask one short
  question. Otherwise pick a sensible default and mention it.
- Do not scrape ticketing sites. Venue seat data is entered by hand or
  provided by partners.

## Notes
- Planning notes live outside this repo in `../notes/`; do not move them here.
- Reference photos live in `../references/` and must not be committed.
