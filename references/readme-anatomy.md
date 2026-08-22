<overview>
The shape of a good README and the rules for the prose in it. A README is a
landing page, not documentation: it shows what the thing is and the shortest
path to using it, and links out for everything else. Target ≤ ~100 lines.
</overview>

<section_order>
Top to bottom. Every section is optional except the header; skip any that has
nothing true to say.

1. **Centred header** — `<div align="center"> … </div>`:
   - optional mark (a repo-relative SVG/PNG at ~72px), then `# Name`
   - badge row (see `references/badges.md`) — only true ones
   - **bold slogan**, ≤ 8 words, what it is in one breath
   - one plain sub-slogan line, ≤ 20 words, what it does
   - a links row: live demo · docs · anything else, ` · `-separated
   - the hero image, `<img … width="100%">`
   - for a doc/README tool, a **before/after** render of a real README (a messy
     spec beside the clean landing page) is a stronger hero than a screenshot —
     see `references/media-rules.md`
2. **Animated demo** — the GIF, `width="360"`–`480`, directly under the header
   so a reader who never scrolls still sees it. One or two sentences, by the
   bloat test below.
3. **Quick start with an agent** — one pasteable prompt in a blockquote. Names
   the repo, says "read CLAUDE.md first" if that file exists (else the guide),
   and names only commands that exist in the repo.
4. **Quick start** (manual) — the fewest commands that reach a running thing.
5. **One or two feature sections** — each a still or a command, ≤ 3 lines, and
   an anchor link into the guide for the detail.
6. **Docs** — a line linking `docs/GUIDE.md`, plus 2–4 anchor links to the
   sections a reader is most likely to want.
7. **License** — one line; name the licence and any credit.
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
Structure keeps a reader on the page; voice is why the writing does not read as machine-
generated once they are there. Default to a terse, dry register — a competent developer
typing, not marketing copy. The author can change the register (cosy, formal, playful);
the anti-machine tells below hold in every register.

**Cut these — they are the tells that read as LLM-written:**
- **Rule-of-three lists.** "a screenshot, a short GIF, and a quick start", three to a
  paragraph. Break them — use two, or four, or a fragment.
- **The em-dash appositive.** "each grave — the years, the epitaph, the cause — then…".
  A period almost always does the job.
- **Balanced antithesis.** "It's not X, it's Y." "not golfed, necessary." Pick a side.
- **Explaining the payoff.** State the thing and stop. Drop the trailing "…which is what
  makes it clean." The reader already got it.
- **Uniform rhythm.** Every sentence the same medium length reads composed. Vary hard: a
  four-word sentence beside a long one. Fragments are fine.

**Reach for these instead:**
- Short declaratives. Periods over dashes and semicolons.
- Understatement, the occasional anticlimax. The joke is that it is true and flat.
- Concrete over abstract: "last touched in 2023" beats "long-abandoned".
- A point of view — the tagline most of all. An opinion, not a description.

Before → after, from real edits on this skill's own READMEs:
- "It captures its own media over headless Chromium, cutting the corners to transparency so
  a shot sits on either GitHub theme, and encodes GIFs in pure Node."
  → "Captured over headless Chromium. No Playwright, no ffmpeg. Corners cut out so they sit
  on either theme."
- "Anyone visiting can light a candle at a grave, and it is still burning when they come
  back. Candles live in that visitor's browser, so there is no count and nobody else's to
  see."
  → "Only you can see your candle, and there's no counter."
- "**A README that shows the thing, not a spec that describes it.**" (a description)
  → "*Nobody reads the wall of text. Show them the thing.*" (a tagline with a view)
</voice>

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
