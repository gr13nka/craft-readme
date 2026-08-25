# Workflow: Build or rebuild a README

<required_reading>
Read these now:
1. references/readme-anatomy.md
2. references/voice.md
3. references/badges.md
4. references/media-rules.md
</required_reading>

<process>

<step_1 name="Audit the project">
Read `CLAUDE.md` if present, the current `README.md`, and the manifest. Work out
what the project is and how it runs, in this order — stop at the first hit:
CLAUDE.md's command list → `package.json` (`scripts.dev`/`start`, `bin`) → a root
`index.html` (a static site → serve `./`) → `pyproject.toml [project.scripts]` →
`Cargo.toml [[bin]]` → electron/tauri deps (a desktop app). Ambiguous after that
→ ask once. Get owner/repo from `git remote get-url origin`, and read the repo's own
discovery fields while you are there — `gh repo view --json
description,repositoryTopics,homepageUrl,usesCustomOpenGraphImage`. Blank ones are
filled in step 9; a field a human already set is not overwritten without saying so.

Classify the surface, because it decides how media is made: **web** (has a URL or
a static root), **CLI** (has a `bin`/console entry point), or **other** (desktop
app, or a library with nothing to run).

**Pick the register**, by references/voice.md `<choosing_the_register>`: the
user's words first, then an existing marker or a CLAUDE.md line about voice, then
what the project is and who reads it. One word: deadpan, plain or quiet; plain
when nothing decides.
</step_1>

<step_2 name="Restructure branch">
If the README is already long (> 80 lines, or it has documentation-shaped H2s
like an options table or a schema), this is a **restructure**, not a fresh write:
- relocation mode on — moved prose moves verbatim (references/readme-anatomy.md)
- the coverage check in step 9 is mandatory
- repoint any "documented in README.md" pointers in CLAUDE.md or other docs
</step_2>

<step_3 name="Storyboard">
Decide the media as one line each — "hero: the yard with a grave lit and its
panel open", "GIF: a candle being lit", "second still: the ?edit form".

On an **explicit** invocation, state the plan in one line, the media and the
register (`hero: …; GIF: …; register: quiet`), and go; do not stop for approval.
On an **auto-triggered** run, confirm it first with AskUserQuestion (approve /
adjust / "I'll supply the media"), with the register in the same question and
your pick named, since the user did not ask for this outright. Either way,
capture nothing the plan does not name.
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

Write in the register from step 1, by references/voice.md: every section flat
first, bare facts, sentence-case headings, no marketing word, no emoji, no
exclamation mark. Then the register's one move. Deadpan leaves bare the one fact
per screen that is already funny; plain licenses each claim with its number and
concedes the limit by the third sentence; quiet states the consequence and
withholds the jab. Never add a joke, never label one. Line 1 of the file is the
marker: `<!-- craft-readme: voice=<register> -->`. The slogan: an opinion in
deadpan and quiet, category and mechanism in plain. If the project invites
sceptical questions, an FAQ: one-line literal answers in deadpan, full answers
with the limit conceded in plain and quiet.
</step_7>

<step_8 name="Tighten">
Follow `workflows/tighten-prose.md`, then return here.
</step_8>

<step_9 name="Set the discovery surfaces">
Follow `workflows/discoverability.md`, then return here. It writes the repo description,
the topics and the homepage from the finished slogan, captures the 1280x640 social card,
and names the two one-click actions this skill cannot do itself.

It runs **after** the tighten pass, because the description is derived from the slogan and
the tighten pass can still change the slogan. Nothing here edits README prose.
</step_9>

<step_10 name="Verify">
- `node <skill>/scripts/check-readme.mjs README.md --docs docs` → exit 0
- `node <skill>/scripts/check-discovery.mjs README.md` → exit 0. Alt text, the `# Name`
  heading, and the repo's own description and topics. `--no-remote` when `gh` is absent
- `node <skill>/scripts/check-voice.mjs README.md` → exit 0. It reads the register
  from the marker and names it in the header; `(plain, no marker)` means the
  marker is missing, add it. Every warning a stated call, not a silent pass
- restructure only: `node <skill>/scripts/check-coverage.mjs --old <(git show
  HEAD:README.md) --new README.md --new docs/GUIDE.md --allow "<each deliberate
  drop>"` → exit 0
- `Read` every image once; confirm the hero shows a settled frame (no half-faded
  entrance) and the GIF completes its motion and loops
- add or keep one line in CLAUDE.md: "README is the landing page; depth lives in
  docs/GUIDE.md" — so a later /finish-session routes doc edits to the guide
</step_10>

<step_11 name="Hand off">
List the changed and new files. Say: **ready — run `/finish-session`** to
document, verify and commit. This skill does not commit.
</step_11>

</process>

<success_criteria>
- README ≤ ~100 lines, sections in the canonical order, animated demo under the header
- at least one still and one animation in `docs/images/`, transparent corners, within budget
- full reference content lives in `docs/GUIDE.md`, reached by anchor links
- check-readme, check-voice and check-discovery clean, in the README's declared
  register; check-coverage clean in restructure mode
- description, topics and social card set; the manual upload and the two one-clicks stated
- nothing committed; the closing message points at /finish-session
</success_criteria>
