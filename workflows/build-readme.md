# Workflow: Build or rebuild a README

<required_reading>
Read these now:
1. references/readme-anatomy.md
2. references/badges.md
3. references/media-rules.md
</required_reading>

<process>

<step_1 name="Audit the project">
Read `CLAUDE.md` if present, the current `README.md`, and the manifest. Work out
what the project is and how it runs, in this order — stop at the first hit:
CLAUDE.md's command list → `package.json` (`scripts.dev`/`start`, `bin`) → a root
`index.html` (a static site → serve `./`) → `pyproject.toml [project.scripts]` →
`Cargo.toml [[bin]]` → electron/tauri deps (a desktop app). Ambiguous after that
→ ask once. Get owner/repo from `git remote get-url origin`.

Classify the surface, because it decides how media is made: **web** (has a URL or
a static root), **CLI** (has a `bin`/console entry point), or **other** (desktop
app, or a library with nothing to run).
</step_1>

<step_2 name="Restructure branch">
If the README is already long (> 80 lines, or it has documentation-shaped H2s
like an options table or a schema), this is a **restructure**, not a fresh write:
- relocation mode on — moved prose moves verbatim (references/readme-anatomy.md)
- the coverage check in step 9 is mandatory
- repoint any "documented in README.md" pointers in CLAUDE.md or other docs
</step_2>

<step_3 name="Storyboard, then get approval">
Propose the media as one line each — "hero: the yard with a grave lit and its
panel open", "GIF: a candle being lit", "second still: the ?edit form". Use
AskUserQuestion: approve / adjust / "I'll supply the media". Capture nothing
until this is settled — a capture the user did not want is wasted minutes.
</step_3>

<step_4 name="Capture the media">
Follow `workflows/capture-media.md`, then return here. Images land in
`docs/images/`.
</step_4>

<step_5 name="Choose badges">
From references/badges.md, keep only badges whose truth condition holds — check
each. If the user wants a licence badge and there is no `LICENSE`, offer to add
one first.
</step_5>

<step_6 name="Write the guide">
From `templates/guide-template.md`. ToC first, one H2 per topic, only the
sections this project needs. In restructure mode the moved README prose lands
here verbatim. Create `docs/` if absent.
</step_6>

<step_7 name="Write the README">
From `templates/readme-template.md`, in the order in references/readme-anatomy.md.
The animated demo goes directly under the header. Fill the agent quick-start
block with real commands (it drives an agent, so it names files); the manual
quick-start is the fewest commands that reach a running thing. The Docs section
links the guide and 2–4 anchors. Every sentence passes the bloat test.
</step_7>

<step_8 name="Tighten">
Follow `workflows/tighten-prose.md`, then return here.
</step_8>

<step_9 name="Verify">
- `node <skill>/scripts/check-readme.mjs README.md --docs docs` → exit 0
- restructure only: `node <skill>/scripts/check-coverage.mjs --old <(git show
  HEAD:README.md) --new README.md --new docs/GUIDE.md --allow "<each deliberate
  drop>"` → exit 0
- `Read` every image once; confirm the hero shows a settled frame (no half-faded
  entrance) and the GIF completes its motion and loops
- add or keep one line in CLAUDE.md: "README is the landing page; depth lives in
  docs/GUIDE.md" — so a later /finish-session routes doc edits to the guide
</step_9>

<step_10 name="Hand off">
List the changed and new files. Say: **ready — run `/finish-session`** to
document, verify and commit. This skill does not commit.
</step_10>

</process>

<success_criteria>
- README ≤ ~100 lines, sections in the canonical order, animated demo under the header
- at least one still and one animation in `docs/images/`, transparent corners, within budget
- full reference content lives in `docs/GUIDE.md`, reached by anchor links
- check-readme clean; check-coverage clean in restructure mode
- nothing committed; the closing message points at /finish-session
</success_criteria>
