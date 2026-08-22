# craft-readme — notes for agents

A Claude Code skill that rebuilds a project's README as a short, image-led landing page and
captures its own media. This file is for editing the skill's *code*; `SKILL.md` is the
skill itself, `references/` is its README-authoring knowledge.

## Layout

- `SKILL.md` — the router, loaded when the skill runs. Pure XML, no markdown headings in the
  body. Intake asks nothing on an **explicit** invocation (build by default); it asks only
  when the skill auto-triggered from a README mention.
- `workflows/` FOLLOW · `references/` READ · `templates/` COPY+FILL · `scripts/` EXECUTE.
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

**Voice is part of the skill.** The READMEs it writes, and this repo's own, follow
`references/voice.md`: the bash.org register, terse and deadpan, the sarcasm aimed at
ceremony and never at the reader, no joke ever labelled, none of the machine tells.
`scripts/check-voice.mjs` lints the lexical tells (marketing words, softeners, boilerplate,
emoji, winks) as errors and the structural ones (em-dash aside, rule of three, antithesis,
rhythm) as warnings a writer decides. Hold to it when editing the skill's docs too.

## Verify

No test suite. `node --check scripts/*.mjs`, then run the skill's own gates on itself:
`node scripts/check-readme.mjs README.md --docs docs` and `node scripts/check-voice.mjs
README.md`. When touching `check-voice.mjs`, feed it a deliberately machine-written
paragraph and confirm each list still fires. Smoke-test a capture against any
served local site before trusting a change to `capture.mjs`/`readme-shot.mjs`.

## Pushing

Binary-heavy commits (the `docs/images/`) can fail the push with `sideband packet`. Fix it
**per-command**, never in config:
`git -c http.version=HTTP/1.1 -c http.postBuffer=524288000 push`.
