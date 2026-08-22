# craft-readme — the full guide

Everything the [README](../README.md) leaves out: how the skill routes, what each
capture script does, the three checks that keep the output honest, and the voice.

- [Install](#install)
- [How the skill works](#how-the-skill-works)
- [The capture scripts](#the-capture-scripts)
- [The shot spec](#the-shot-spec)
- [The terminal card](#the-terminal-card)
- [The checks](#the-checks)
- [The voice](#the-voice)
- [What it enforces](#what-it-enforces)
- [Requirements](#requirements)

## Install

```bash
git clone https://github.com/gr13nka/craft-readme ~/.claude/skills/craft-readme
```

Claude Code discovers skills under `~/.claude/skills/`. Once cloned, `/craft-readme` is
available in any session. The scripts also run standalone from anywhere with `node`.

## How the skill works

It is a router. `SKILL.md` hands to one of three workflows: build by default on an
explicit `/craft-readme`, and it asks which only when it auto-triggered from a README
mention:

- **build-readme** — audit the repo, storyboard the shots, capture them, write `README.md`
  and `docs/GUIDE.md`, verify, hand off.
- **capture-media** — the media path on its own (web, CLI, or user-supplied).
- **tighten-prose** — the bloat pass, then the voice pass, over an existing README.

The reference files (`references/`) carry the durable knowledge: the section order and
word budgets, the voice, the badge truth conditions, the media rules, and the capture
traps. The skill never commits — it ends by pointing at `/finish-session`.

## The capture scripts

All in `scripts/`, zero-dependency Node, run with `node` alone.

| Script | Does |
| --- | --- |
| `capture.mjs spec.json` | drives a headless page from a JSON spec → a rounded PNG, or a GIF/APNG when the spec has a `record` block |
| `term.mjs transcript.txt` | renders a One Dark terminal card from a transcript → still or typed-out animation |
| `round.mjs in.png out.png` | cuts transparent rounded corners on an existing image (or a frames directory with `--batch`) |
| `encode.mjs frames/ out.gif` | frames → GIF or APNG, ffmpeg-free |
| `check-readme.mjs` | fails on dead links, broken anchors, placeholders, oversized images |
| `check-coverage.mjs` | proves a restructure moved prose verbatim |
| `check-voice.mjs` | fails on the vocabulary and the winks that mark prose as machine-written; warns on the structural tells |
| `serve.mjs dir` | a zero-dependency static server, used internally and standalone |

The GIF encoder is pure Node — a median-cut palette (255 colours plus a transparent
slot), Floyd–Steinberg dithering, and transparent frame-differencing against an undisposed
canvas — because ffmpeg cannot be assumed present and a dark scene with soft glows bands
hard without dithering.

## The shot spec

`capture.mjs` reads a small JSON spec. `templates/shot-spec.json` is a worked example.

```json
{
  "serve": "./",
  "viewport": { "width": 1400, "height": 900, "dsf": 2 },
  "settle": 2000,
  "steps": [
    { "eval": "document.querySelector('.scene').scrollTop = 630" },
    { "click": ".marker", "wait": 1400 },
    { "hover": [478, 618], "wait": 500 }
  ],
  "clip": { "selector": ".panel", "pad": 16 },
  "radius": 16,
  "out": "docs/images/hero.png",
  "record": { "trigger": { "click": ".play" }, "duration": 3600, "fps": 20, "slow": 3 }
}
```

Step verbs are `eval`, `click`, `hover`, `wait`. A cache-disabled context, a fresh browser
profile, a free port, `readyState` polling, `document.fonts.ready`, a transparent
background, and a built-in static server (when `serve` is set) are always on — they are the
traps that otherwise cost a session to rediscover. `--probe "sel1,sel2"` prints element
boxes so a `clip` can be chosen without guessing; `--set key=value` overrides any field.

For a short animation, `record.slow` records in slow motion and resamples to real time:
clipped screenshots arrive at roughly eight a second, too coarse for a motion under two
seconds, so the animation clock and the page's own timers are stretched together and the
frames are resampled back.

## The terminal card

For a CLI tool the hero is a terminal, drawn by `term.mjs` from a transcript:

```
$ some command
its real output
~ 800
```

A `$ `-prefixed line is a command (typed out in the animation); other lines are output; `~
800` is an 800 ms pause. A subset of ANSI SGR colour is honoured, so real coloured output
pastes in. The card carries its own One Dark background so its transparent rounded corners
still read as a terminal on any page. Never invent output — paste a real run or `--help`.

## The checks

```bash
node scripts/check-readme.mjs README.md --docs docs
node scripts/check-coverage.mjs --old <(git show HEAD:README.md) --new README.md --new docs/GUIDE.md
node scripts/check-voice.mjs README.md
```

`check-readme` fails, with the exact line, on: a relative link or image whose target is
missing; an in-page `#anchor` with no matching heading (GitHub's own slug rule); a
placeholder left in (an empty list item, a bare `…`, a `TODO`, a `:owner`-style path); an
image over budget (1.5 MB a still, 3 MB an animation); and a command in a fenced block that
names a repo file which is not there.

`check-coverage` takes every substantial line of the old README and checks it survives
somewhere in the new files, so a restructure cannot paraphrase content away. Pass `--allow`
for the lines you meant to drop.

`check-voice` reads the prose only (fenced code, inline code, quoted mentions, HTML, URLs
and badges are skipped) and reports each hit with its line. Errors: marketing adjectives (`powerful`,
`seamless`, `lightweight`, `leverage`), softeners (`simply`, `easily`, `with ease`),
connective tissue (`whether you're`, `designed to`, `making it easy to`, `additionally`),
boilerplate (`Welcome to`, `Feel free to`, `Happy coding`, `Contributions are welcome`),
emoji, exclamation marks, a bold-lead-in features list, a `Why X?` heading, and the winks
(`(yes, really)`, `spoiler alert`, `pro tip`, `™`, `/s`). Warnings: an em-dash, a
semicolon, a rule-of-three list, "not X, but Y", a participial payoff, three sentences of
one length, three sentences opening on one word, a Title Case heading. Errors fail it;
`--strict` makes warnings fail too. The full lists are the script's first hundred lines.

## The voice

`references/voice.md`. The register is bash.org: terse, deadpan, the sarcasm aimed at the
wall-of-text README and the options table nobody opens, never at the reader. The skill
writes every section flat and then leaves bare the one fact per screen that is already
funny. It never adds a joke and never labels one. The slogan is an opinion. An FAQ of
one-line literal answers is allowed. The reference carries the mechanics, the full list of
machine tells, section-scale rewrites, and the author's own cuts.

## What it enforces

The prose rules live in `references/readme-anatomy.md`. The load-bearing one: a sentence
earns its place only if it says something the image above it does not already show **and**
something the reader can act on. A paragraph narrating a GIF is bloat. Reference detail —
option tables, schemas, setup steps — belongs in this guide, not the README.

## Requirements

- **Node 22+** — it uses the global `WebSocket` to speak the DevTools Protocol, which is
  what keeps the toolkit dependency-free.
- **A Chromium-based browser** — Chromium, Chrome, Edge or Brave, auto-discovered; set
  `CHROME=/path/to/binary` to override.
- No `npm install`, no ffmpeg.
