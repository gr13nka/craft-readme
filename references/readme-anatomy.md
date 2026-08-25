<overview>
The shape of a good README and the rules for the prose in it. A README is a
landing page, not documentation: it shows what the thing is and the shortest
path to using it, and links out for everything else. Target ≤ ~100 lines.
</overview>

<section_order>
Top to bottom. Every section is optional except the header; skip any that has
nothing true to say.

1. **Centred header** — `<div align="center"> … </div>`:
   - optional mark (a repo-relative SVG/PNG at ~72px), then `# Name` — keep the
     markdown heading even under a logo; it is the page's only `<h1>`
   - **bold slogan**, ≤ 8 words, what it is in one breath — an opinion in deadpan
     and quiet, category + mechanism in plain
   - one plain sub-slogan line, ≤ 20 words, what it does
   - badge row (see `references/badges.md`) — only true ones, and **below** the
     sub-slogan: the first sentence on the page is the one a search engine quotes
   - a links row: live demo · docs · anything else, ` · `-separated
   - the hero image, `<img … width="100%">`, with alt text that says what it shows
   - for a doc/README tool, a **before/after** render of a real README (a messy
     spec beside the clean landing page) is a stronger hero than a screenshot —
     see `references/media-rules.md`
2. **Animated demo** — the GIF, `width="360"`–`480`, directly under the header
   so a reader who never scrolls still sees it. One line, or none — the GIF carries it.
3. **Quick start with an agent** — one pasteable prompt in a blockquote. Names
   the repo, says "read CLAUDE.md first" if that file exists (else the guide),
   and names only commands that exist in the repo.
4. **Quick start** (manual) — the fewest commands that reach a running thing.
5. **One or two feature sections** — each a still or a command, ≤ 3 lines, and
   an anchor link into the guide for the detail.
6. **FAQ** (optional) — 3–5 questions a sceptic actually asks. Deadpan answers
   each in one line with the literal fact (that register's best room); plain and
   quiet answer fully, the limit conceded. Never "Why another X?"; that is the
   machine's question, not the reader's.
7. **Docs** — a line linking `docs/GUIDE.md`, plus 2–4 anchor links to the
   sections a reader is most likely to want.
8. **License** — one line; name the licence and any credit.
</section_order>

<prose_rules>
These are the difference between a README someone reads and one they skim past.

**The bloat test.** A sentence earns its place only if it says something the
image above it does not already show **and** something the reader can act on.
A paragraph narrating a GIF — "strike the match sideways, carry it to the wick,
five seconds" under a GIF of exactly that — is bloat and the reader learns to
skip the next paragraph too. Keep the surprising fact the picture cannot show
("candles live in the visitor's browser, so there is no count"); cut the
narration.

**Each fact once.** An opinion restated in three phrasings ("the epitaph is the
only part worth reading" … "a generated one reads generated" … "the only part
anyone reads twice") is one fact. State it once, as a fact, and move on.

**No documentation in the README.** Option tables, schemas, token setup, the
full flag list — all of it goes to `docs/GUIDE.md`; the README links the anchor.

**No placeholders.** Never ship an empty list item ("1. Fork it:" with nothing
under it), a bare `…`, a `TODO`, or a copied path that only worked in the
original repo (`repos/:owner/Graveyard` → `'repos/{owner}/{repo}/pages'`,
quoted). `scripts/check-readme.mjs` fails on these; run it before declaring done.

**Link text is a promise.** "[Every flag →]", "[How it works →]" — the arrow
and a concrete noun. Never "click here" or a bare URL.

**Anchors are part of the link.** GitHub's slug rule: lowercase, drop
punctuation, spaces → hyphens. `check-readme.mjs` verifies every `#anchor`.
</prose_rules>

<voice>
Three registers over one core, in `references/voice.md`. Read it before writing a line and
pick the register first (`<choosing_the_register>`): plain for a library or CLI used by
strangers or anything formal, and when nothing decides; deadpan for a dev tool with a
thesis; quiet for an app a person lives with. Write every section flat; then the register's
one move. Deadpan leaves bare the fact that is already funny, plain licenses each claim with
a number and concedes the limit, quiet states the consequence and withholds the jab. The
README declares it on line 1: `<!-- craft-readme: voice=quiet -->`. `scripts/check-voice.mjs`
reads the marker and lints to it.
</voice>

<discoverability>
The README decides whether a visitor stays. The repo's description, topics, homepage
and social preview decide whether one arrives, and none of them is a line in this file.
`references/discoverability.md` carries them, with the fact that reorders the rest:
GitHub's repo search does not read the README at all — name, description and topics
only — while Google reads it in full and ignores the topics. Three things in this file
still matter to that: a real `# Name` heading, one descriptive sentence above the badge
row, and alt text on every image. `scripts/check-discovery.mjs` checks all of it.
</discoverability>

<relocation_rule>
When an existing README is being slimmed, text that moves to the guide **moves
verbatim** — this is a relocation, not a rewrite, because the old prose was
usually fine and rewriting loses detail silently. Prove nothing was lost with
`scripts/check-coverage.mjs --old <(git show HEAD:README.md) --new README.md
--new docs/GUIDE.md`, passing `--allow` for the few lines you meant to drop (the
old title block, a stale link). Repoint any "documented in README.md" pointers
in `CLAUDE.md` or other docs — they break when the section moves.
</relocation_rule>

<before_after>
Three cuts from a real session:

- **Narrates the GIF** → keep only the unseeable fact.
  Before: "Drag the match onto the box, scrub it sideways until it catches, then
  carry it up to the wick — you have five seconds before it burns down."
  After: "Anyone visiting can light a candle; it is still burning when they come
  back. Candles live in that visitor's browser, so there is no count."

- **Opinion ×3** → fact ×1.
  Before: "…those are the only part worth reading, and a generated one reads
  exactly like a generated one."
  After: "It will not write the epitaph or the cause; you supply those."

- **Placeholder** → filled, quoted, portable.
  Before: `gh api -X POST repos/:owner/Graveyard/pages …`
  After: `gh api -X POST 'repos/{owner}/{repo}/pages' …`
</before_after>

<agent_quick_start_block>
The pasteable prompt. Keep it to a few lines; it drives an agent, so it names
files, not intentions:

> Read CLAUDE.md first. Then run `<list command>` and show me the candidates.
> For each one I pick, run `<do command>` — take what you can from the repo,
> but leave `<the human part>` blank for me to write. When I've filled it in,
> commit and push.

Every command named in it must exist; `check-readme.mjs` verifies that.
</agent_quick_start_block>
