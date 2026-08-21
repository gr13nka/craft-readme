---
name: craft-readme
description: Rebuilds a project's README as a short, image-led landing page — a big header with true badges, a slogan, a rounded screenshot and a small animated demo, an agent quick-start and a manual one, with all reference detail moved out to docs/GUIDE.md behind anchor links. Captures the screenshots and GIFs itself (headless web pages, or a terminal card for CLIs) with zero dependencies. Use when the user says "write / polish / redo the README", "the README is bloated / too long / daunting", "add a screenshot or GIF to the README", "make the readme look nice", or invokes /craft-readme. Not for running or screenshotting an app to verify a change (that is the run skill), driving desktop apps (computer-use), Orca's embedded browser (orca-cli), or routine end-of-session README touch-ups (finish-session, which edits a README only when setup or commands changed — this skill is the full rewrite).
---

<objective>
Turn a project's README into a landing page a visitor actually reads: what the
thing is, one look at it working, the shortest path to using it, and links out
for everything else. Short and image-led, with the documentation moved to
`docs/GUIDE.md` — the README links to it, never contains it.
</objective>

<essential_principles>
These hold in every workflow and cannot be skipped.

**The bloat test.** A sentence earns its place only if it says something the
image above it does not already show **and** something the reader can act on. A
paragraph narrating a GIF — "strike the match, carry it to the wick, five
seconds", under a GIF of exactly that — is bloat, and a reader who hits one
learns to skip the next. Keep the surprising fact the picture cannot show; cut
the narration.

**Each fact once.** An opinion restated in three phrasings is one fact. State it
once, as a fact.

**No documentation in the README.** Option tables, schemas, setup steps → the
guide; the README links the anchor. Target ≤ ~100 lines.

**No placeholders.** Never an empty list item ("1. Fork it:" with nothing under
it), a bare `…`, a `TODO`, or a copied path that only worked in the source repo
(`repos/:owner/Name` → quoted `'repos/{owner}/{repo}'`). `scripts/check-readme.mjs`
fails on these — run it before saying done.

**Animation goes directly under the hero**, so a reader who never scrolls sees it.

**Transparent rounded corners, never a mat.** Screenshots have their corners cut
to alpha 0, not filled with a dark card — the image must sit on the reader's
theme, whichever it is. Check on white and on `#0d1117`.

**Relocation, not rewrite.** Text moved to the guide moves verbatim;
`scripts/check-coverage.mjs` proves nothing was lost.

**Badges are true statements.** Each has a truth condition in
`references/badges.md`; verify it, never hand-write a status.

**Never commit.** End by listing changed files and pointing at `/finish-session`.
</essential_principles>

<context>
The `scripts/` are zero-dependency Node (≥ 22) — Node ships a global WebSocket so
driving Chromium needs no npm package, and the GIF/APNG encoders are pure Node
because ffmpeg cannot be assumed present. They run with `node` alone, inside any
repo, touching none of its dependencies. They need a Chromium-based browser
(`$CHROME`, else Chromium/Chrome/Edge/Brave are auto-found). The working
directory during this skill is the **target project**, so scripts are invoked
as `<skill>/scripts/NAME` — substitute this skill's own directory for `<skill>`.
</context>

<intake>
Ask the user:

What would you like to do?
1. Build or rebuild a README (the whole thing)
2. Capture screenshots / a GIF only
3. Tighten an existing README's prose
4. Something else

**Wait for the answer before proceeding.**
</intake>

<routing>
| Answer | Workflow |
|---|---|
| 1, "build", "rewrite", "redo", "make it nice", bare /craft-readme | `workflows/build-readme.md` |
| 2, "screenshot", "gif", "capture", "add an image" | `workflows/capture-media.md` |
| 3, "tighten", "bloated", "too long", "trim" | `workflows/tighten-prose.md` |
| 4 | clarify, then pick one |

**After reading the workflow, follow it exactly.**
</routing>

<workflows_index>
| Workflow | Purpose |
|---|---|
| build-readme.md | Audit → storyboard → capture → write README + GUIDE → verify → hand off |
| capture-media.md | Web (capture.mjs), CLI (term.mjs), or user-supplied (round.mjs) media |
| tighten-prose.md | The bloat pass on an existing README |
</workflows_index>

<reference_index>
All in `references/`:
- readme-anatomy.md — section order, word budgets, the prose rules, before/after examples
- badges.md — shields URLs and the truth condition for each badge
- media-rules.md — transparent corners, sizes, GIF vs APNG, formats GitHub renders, the push trick
- capture-traps.md — what the scripts handle for you, and the knobs you still own
</reference_index>

<templates_index>
All in `templates/`:
- readme-template.md — the landing page with `{{placeholders}}` and inline guidance
- guide-template.md — `docs/GUIDE.md` with a ToC and an optional-section skeleton
- shot-spec.json — a worked capture spec (a still and a recording)
</templates_index>

<scripts_index>
All in `scripts/`, run with `node`:
- `capture.mjs spec.json [--probe "a,b"] [--set k=v]` — web page → PNG, or GIF/APNG if the spec has `record`
- `term.mjs transcript.txt --out f.png [--animate --fps 15] [--title x]` — terminal card, still or animated
- `round.mjs in.png out.png [--radius 32]` (or `--batch in/ out/`) — cut transparent rounded corners
- `encode.mjs frames/ out.gif|out.apng [--fps 20]` — frames → animation
- `check-readme.mjs README.md --docs docs` — links, anchors, placeholders, image budgets, real commands
- `check-coverage.mjs --old old.md --new README.md --new docs/GUIDE.md [--allow pat]` — nothing lost in a move
- `serve.mjs dir [--port N]` — zero-dep static server (also used internally)
</scripts_index>

<never>
A terse pre-flight, drawn from the principles above plus two things they do not say:
- Persist the HTTP/1.1 push flags to git config — they are per-command only.
- Invent terminal output for a CLI card — paste a real run or `--help`.
</never>

<success_criteria>
- README ≤ ~100 lines, canonical section order, animated demo under the header
- ≥ 1 still and 1 animation in `docs/images/`, transparent corners, within budget
- all reference detail in `docs/GUIDE.md`, reached by anchor links
- `check-readme` clean; `check-coverage` clean when restructuring
- nothing committed; the closing message points at `/finish-session`
</success_criteria>
