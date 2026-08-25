# craft-readme — notes for agents

A Claude Code skill that rebuilds a project's README as a short, image-led landing page and
captures its own media. This file is for editing the skill's *code*; `SKILL.md` is the
skill itself, `references/` is its README-authoring knowledge.

## Layout

- `SKILL.md` — the router, loaded when the skill runs. Pure XML, no markdown headings in the
  body. Intake asks nothing on an **explicit** invocation (build by default); it asks only
  when the skill auto-triggered from a README mention.
- `workflows/` FOLLOW · `references/` READ · `templates/` COPY+FILL · `scripts/` EXECUTE.
- The skill mutates exactly one thing outside the working tree: `gh repo edit`, in
  `workflows/discoverability.md`. It still never commits.
- The slash command lives **outside this repo** at `~/.claude/commands/craft-readme.md` and
  is not bundled. It carries the "explicit invocation, skip intake" signal. Editing the
  skill does not touch it.

## The one rule: zero dependencies

**No npm, no ffmpeg, ever.** The scripts run with `node` alone inside any repo, touching
none of its deps — that is the whole value. Node 22+ is required because `cdp.mjs` drives
Chromium over the DevTools Protocol with the **global `WebSocket`**, which is what removes
the npm dependency. The GIF/APNG encoders are hand-written for the same reason. Do not add a
package to "simplify" a script.

## Invariants that cost time to rediscover

**Capture is at `deviceScaleFactor: 2`.** A `clip` is in CSS px; the output PNG is
`clip × dsf`. A hero at viewport width 1400 lands as a 2800px file. `round.mjs`'s `--radius`
is in **image px** — twice the CSS radius (16 CSS → `--radius 32`); `capture.mjs` and
`readme-shot.mjs` apply `radius × dsf` for you.

**`cdp.open()` always does four things, and each is load-bearing:** cache off (an edited
asset otherwise reads as a no-op), a **fresh browser profile** per launch (a page's
`localStorage` from the last run changes what it shows), `readyState` polled rather than
`Page.loadEventFired` awaited (the event can fire before a listener attaches — an
indistinguishable hang), and `document.fonts.ready`. Transparent background is re-applied
after every viewport change or the rounded corners come back white.

**Slow-motion record stretches four clocks together** (`Animation.setPlaybackRate`,
`setTimeout`, `performance.now`, `Date.now`, and a `requestAnimationFrame` timestamp shim).
A pure-rAF loop that ignores its timestamp argument will not slow — accept real-time fps
for those.

**`readme-shot.mjs` serves the README's own repo root.** It writes a temp preview HTML into
that root so repo-relative images (`docs/images/*`) resolve, screenshots the
`.markdown-body`, then deletes the temp file. Shields badges load over the network.

**The GIF encoder is median-cut + Floyd–Steinberg + transparent frame-differencing.**
Dithering is deterministic, so identical frames diff to nothing against the undisposed
canvas — that is what keeps a 70-frame take small. Pixels with alpha < 128 (rounded
corners) stay out of the palette and are written as the transparent index. `apng.mjs`
reuses each frame's IDAT as an fdAT (full alpha, ~5× the bytes) — the fallback when a dark
scene bands as a GIF.

**`check-readme.mjs` reads real byte size** (`fs.stat`), budgets 1.5 MB still / 3 MB
animation — `du -h` block-rounding lies. `check-coverage.mjs` matches exact substrings, so a
reworded line during a move flags as "lost"; that is expected — verify the fact survives and
pass `--allow`.

**The social card is the one image that keeps opaque corners.** Everything else here has
its corners cut to alpha 0 so it sits on the reader's GitHub theme. `templates/og-spec.json`
carries no `radius` key on purpose — Slack, X and LinkedIn composite the card onto their own
background, where a transparent corner goes black or white. Its budget is 1 MB, not 1.5 MB,
because that is GitHub's limit for the upload. `capture.mjs` resolves `serve` and `out`
**relative to the spec file**, not the cwd, so the spec's `"serve": "."` already means
`templates/` — overriding it is the way to get a 404 that still passes every size check.

**Discoverability is a separate question from the README, and the answer is counterintuitive.**
GitHub's repo search does not read the README (name, description and topics only); Google
reads the README and ignores the topics. So `check-discovery.mjs` splits from
`check-readme.mjs` — that script's header promises no network, and the fields worth checking
need `gh`. It reuses `checkVoiceText` from `check-voice.mjs` (extracted from `checkVoice` for
exactly this) to lint the repo description in the README's own register. Topics match as
exact atomic slugs, so the script verifies each one has other repos behind it rather than
trusting it looks plausible.

**Voice is part of the skill.** The READMEs it writes, and this repo's own, follow
`references/voice.md`: three registers (plain, deadpan, quiet) over one core, none of the
machine tells, no emoji, no `!`, no labelled joke. A README declares its register on line 1
(`<!-- craft-readme: voice=deadpan -->`). `scripts/check-voice.mjs` reads the marker
(`--voice` overrides; no marker → plain) and applies that register's `PROFILES` entry:
overrides keyed by rule key (`skip`, `warn`, `licensed`, `density`, `extra`) on the base
rules, which are the full set. Every finding goes through one `add()`, so an override reaches
the word-list rules and the inline checks alike. **Rule keys are unique and are the ids
printed; keep them unique when adding a row.** This repo's own docs are deadpan; hold to it
when editing them.

**The Pages site is generated, so it drifts.** `index.html` and `docs/guide.html` are built
from `README.md` and `docs/GUIDE.md` by `scripts/site.mjs`, using this repo's own
`markdown.mjs` and `github-readme.css` — no Jekyll, no front matter in the sources, same
zero-dependency rule as everything else. **Edit the markdown, then regenerate and commit
both.** It exists because a docs page tends to outrank the repo page it documents, and a
Pages site is the only surface where `<title>`, the meta description and the og: tags are
ours to set. Pages serves from the repo root, so `index.html` sees `docs/images/*` and
`docs/guide.html` sees `../` without any path rewriting; only markdown-to-markdown links
are rewritten. It is repo infrastructure, not part of the skill — the skill does not build
Pages sites for the projects it works on.

## Verify

No test suite. `node --check scripts/*.mjs`, then run the skill's own gates on itself:
`node scripts/check-readme.mjs README.md --docs docs`, `node scripts/check-voice.mjs
README.md` (the header must read `(deadpan)`, from the marker), and `node
scripts/check-discovery.mjs README.md` (`--no-remote` when `gh` is unavailable). After any
README or GUIDE edit, `node scripts/site.mjs README.md:index.html
docs/GUIDE.md:docs/guide.html --base https://gr13nka.github.io/craft-readme`. When touching
`check-voice.mjs`, run fixtures under all three `--voice` values: a machine-written paragraph
errors in each, a ripgrep-style paragraph passes plain with warnings only, a jab warns under
quiet only. Smoke-test a capture against any
served local site before trusting a change to `capture.mjs`/`readme-shot.mjs`.

## Pushing

Binary-heavy commits (the `docs/images/`) can fail the push with `sideband packet`. Fix it
**per-command**, never in config:
`git -c http.version=HTTP/1.1 -c http.postBuffer=524288000 push`.
