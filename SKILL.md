---
name: craft-readme
description: Rebuilds a project's README as a short, image-led landing page: header, true badges, a slogan, a rounded screenshot, a short GIF, agent and manual quick-starts, reference detail moved to docs/GUIDE.md behind anchor links. Captures the screenshots and GIFs itself (headless web pages, or a terminal card for CLIs) with zero dependencies, and writes the prose in a register that fits the project (plain by default, deadpan, or quiet for calm apps) with the LLM tells stripped and linted. Use when the user says "write / polish / redo the README", "the README is bloated / too long", "it sounds AI-written / like ChatGPT, make it sound human", "make the README calmer / more formal / less sarcastic", "add a screenshot / GIF to the README", "make the readme look nice", or invokes /craft-readme. Not for running or screenshotting an app to verify a change (the run skill), desktop apps (computer-use), Orca's embedded browser (orca-cli), or end-of-session README touch-ups (finish-session; this skill is the full rewrite).
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

**Voice is part of the job.** A README that reads as machine-written undoes the rest of the
work. Three registers, one core. Plain (ripgrep, uv; a library or CLI used by strangers,
anything formal; the default), deadpan (bash.org; a dev tool with a thesis), quiet (a
meditation or notes app; calm, faintly clinical, nothing at the reader's expense). The core
holds in all three: no marketing word, no emoji, no exclamation mark, no labelled joke, each
fact once, cut to the bone. The register is picked in the audit, stated in the plan, and
declared on the README's first line (`<!-- craft-readme: voice=quiet -->`);
`scripts/check-voice.mjs` reads it and lints to it. `references/voice.md` has the choosing
signals and the mechanics. Run the check before saying done.
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
**Default to acting, not asking.** When the skill was invoked explicitly — the
`/craft-readme` command, or a direct "use craft-readme / write the README with this" —
go straight to `workflows/build-readme.md` and build it: create the README if there is
none, rewrite it if there is. Make the routine calls yourself and state them; do not ask
the intake question, and do not pause for storyboard approval. Route elsewhere only when
the request itself is explicitly narrower — "just capture a GIF" → `capture-media`, "just
tighten the prose" → `tighten-prose`.

**Ask only when the skill auto-triggered** — it fired from a README mention in
conversation rather than an explicit request. Then confirm intent first:

> What would you like — (1) build/rebuild the whole README, (2) capture screenshots or a
> GIF only, (3) tighten the existing prose? I'll otherwise rebuild it. And the register:
> deadpan, plain or quiet? I'd pick <x> for this project.

Wait for the answer before proceeding.

**Read the register out of the request**, on any path, and carry it into the workflow:
formal / serious / plain → plain; calm / quiet / gentle → quiet; dry / deadpan / sarcastic →
deadpan; "less sarcastic", "tone it down" → not deadpan, plain or quiet by the project. No
word → the workflow picks from the project, plain when nothing decides.
</intake>

<routing>
| Situation | Workflow |
|---|---|
| explicit invocation, or "build / rewrite / redo / make it nice" | `workflows/build-readme.md` (the default) |
| "screenshot", "gif", "capture", "add an image" only | `workflows/capture-media.md` |
| "tighten", "bloated", "too long", "trim" only | `workflows/tighten-prose.md` |
| "sounds AI-written / like an LLM / too corporate", "make it sound human" | `workflows/tighten-prose.md` |
| "make it calmer / more formal / less sarcastic / change the tone" | `workflows/tighten-prose.md` (a re-voice) |

**After reading the workflow, follow it exactly.**
</routing>

<workflows_index>
| Workflow | Purpose |
|---|---|
| build-readme.md | Audit → storyboard → capture → write README + GUIDE → verify → hand off |
| capture-media.md | Web (capture.mjs), CLI (term.mjs), or user-supplied (round.mjs) media |
| tighten-prose.md | The bloat pass, then the voice pass, on an existing README |
</workflows_index>

<reference_index>
All in `references/`:
- readme-anatomy.md — section order, word budgets, the prose rules, before/after examples
- voice.md — three registers (plain, deadpan, quiet) over one core, how to choose, the machine tells, worked rewrites
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
- `readme-shot.mjs README.md --out f.png` (or `--compare a.md b.md`, `--wipe a.md b.md`) — render a README GitHub-style, or a before/after
- `round.mjs in.png out.png [--radius 32]` (or `--batch in/ out/`) — cut transparent rounded corners
- `encode.mjs frames/ out.gif|out.apng [--fps 20]` — frames → animation
- `check-readme.mjs README.md --docs docs` — links, anchors, placeholders, image budgets, real commands
- `check-coverage.mjs --old old.md --new README.md --new docs/GUIDE.md [--allow pat]` — nothing lost in a move
- `check-voice.mjs README.md [--voice deadpan|plain|quiet] [--strict]` — the machine tells, linted to the register in the README's marker (or `--voice`; plain if neither): marketing words, softeners, boilerplate, emoji, winks error; em-dashes, triplets, antithesis, rhythm warn; plain licenses a claim by its number, quiet warns on a jab
- `serve.mjs dir [--port N]` — zero-dep static server (also used internally)
</scripts_index>

<never>
A terse pre-flight, drawn from the principles above plus two things they do not say:
- Persist the HTTP/1.1 push flags to git config — they are per-command only.
- Invent terminal output for a CLI card — paste a real run or `--help`.
- Add a joke, or label one. Deadpan leaves a true fact bare; plain and quiet do not joke; no register decorates.
- Write deadpan or quiet without a reason from the user's words or the project. The fallback is plain, and the choice goes into the marker.
</never>

<success_criteria>
- README ≤ ~100 lines, canonical section order, animated demo under the header
- ≥ 1 still and 1 animation in `docs/images/`, transparent corners, within budget
- all reference detail in `docs/GUIDE.md`, reached by anchor links
- `check-readme` and `check-voice` clean, in the README's declared register; `check-coverage` clean when restructuring
- nothing committed; the closing message points at `/finish-session`
</success_criteria>
