# craft-readme — the full guide

Everything the [README](../README.md) leaves out: how the skill routes, what each
capture script does, the four checks that keep the output honest, the voice, and the
fields that decide whether anyone finds the repo at all.

- [Install](#install)
- [How the skill works](#how-the-skill-works)
- [The capture scripts](#the-capture-scripts)
- [The shot spec](#the-shot-spec)
- [The terminal card](#the-terminal-card)
- [The checks](#the-checks)
- [The voice](#the-voice)
- [Being found](#being-found)
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
| `check-voice.mjs` | fails on the vocabulary and the winks that mark prose as machine-written; warns on the structural tells; lints to the register the README declares |
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
node scripts/check-discovery.mjs README.md
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
and badges are skipped) and reports each hit with its line. Errors: marketing adjectives
(`seamless`, `leverage`, `elegant`), claim adjectives without a number (`powerful`,
`lightweight`), softeners (`simply`, `easily`, `with ease`), connective tissue (`whether
you're`, `designed to`, `making it easy to`, `additionally`), boilerplate (`Welcome to`,
`Feel free to`, `Happy coding`, `Contributions are welcome`), emoji, exclamation marks, a
bold-lead-in features list, and the winks (`(yes, really)`, `spoiler alert`, `pro tip`, `™`,
`/s`). Warnings: an em-dash, a semicolon, a rule-of-three list, "not X, but Y", a participial
payoff, a `Why X?` heading, three sentences of one length, three sentences opening on one
word, a Title Case heading. Errors fail it; `--strict` makes warnings fail too. The lists are
at the top of the script.

It lints to a register. The README declares one on its first line
(`<!-- craft-readme: voice=quiet -->`); `--voice deadpan|plain|quiet` overrides it; neither →
plain. `plain` lets a claim adjective through as a warning when the line carries its number
or a link, turns `!` and bold-label bullets into warnings (three `!` in a file is an error
again), and stops warning on "Note that", question headings, Contributing-style and Credits
headings and sentence rhythm. `quiet` stops warning on "which means" / ", so you can" and on
a Credits heading, and warns on a jab (nobody, you won't, dead, garbage). `deadpan` is the
full set. The header names the register it used; an unmarked README lints as plain until it
gets its marker, and the header says `(plain, no marker)`.

`check-discovery` asks the question the other three do not: whether anyone arrives. In the
file it checks the `# Name` heading (the README's first `#` is the repo page's only `<h1>`,
and a header built from a centred logo image alone leaves the page without one), alt text on
every image, and that the first sentences name the project. Over `gh` it checks the repo's
description, its topics, the homepage and whether a custom social preview is set. Errors: no
`<h1>`, an image with no `alt=`, an empty description, one over 350 characters, no topics, a
topic that is not a valid slug. Warnings: a badge row above the first sentence, a topic
almost nobody else uses, a missing social preview, a run-together repo name. `--no-remote`
runs the file checks alone. The description is fed through `check-voice`'s own rules, in the
register the README declares, because a description is prose too.

## The voice

`references/voice.md`. Three registers over one core. The core is what keeps prose from
reading machine-written: every section written flat first, none of the machine tells, cut to
the bone, each fact once, no emoji, no exclamation marks, no joke ever labelled. The
register is one move applied after the flat draft. **plain** (ripgrep, uv, fd; the default)
licenses every claim with a number and concedes the limit early. **deadpan** (bash.org; a
dev tool with a thesis) leaves bare the one fact per screen that is already funny.
**quiet** (a meditation app's README) states the consequence and withholds the jab. The
skill picks by the user's words, then the project's own doctrine, then what it is and who
reads it; plain when nothing decides. The pick goes on the README's first line as a marker
and `check-voice` lints to it. The reference carries the choosing ladder, the mechanics of
each register with quoted lines from real READMEs, the machine's imitation of each, and
section-scale rewrites in all three.

## What it enforces

The prose rules live in `references/readme-anatomy.md`. The load-bearing one: a sentence
earns its place only if it says something the image above it does not already show **and**
something the reader can act on. A paragraph narrating a GIF is bloat. Reference detail —
option tables, schemas, setup steps — belongs in this guide, not the README.

## Being found

`references/discoverability.md`. One fact reorders the rest: **GitHub's repo search does not
read your README.** It covers the repository name, description and topics, unless the
searcher types `in:readme`. **Google does read it**, in full, and ignores the topics. They
are two different games, and the description is the only field that wins both — which is
awkward, because it is the field most repos leave empty, and with it empty the page title,
the meta description and every Slack and X preview fall back to "Contribute to owner/repo
development by creating an account on GitHub".

So the skill writes the description from the finished slogan (front-loaded — roughly the
first 35 characters survive in a Google title after the `GitHub - owner/repo: ` prefix),
picks five to twelve topics and verifies each is a slug other repos actually use, sets the
homepage, and captures a 1280x640 social card. Topics match as exact atomic slugs: no
stemming, no splitting, no prefix, so `command` never matches `command-line-tool` and an
invented slug never fires.

Moving reference detail into this guide costs nothing here. A `blob` page like this one is
separately indexable by Google; it keeps the README short without hiding the content.

What the skill will not do: stuff keywords (GitHub's search never reads the README, and
Google demotes it), hide text (GitHub strips HTML comments from the rendered DOM and
sanitises `style`, so it cannot be done), or chase image filenames (`/raw/` is blocked in
robots.txt and external images are proxied through hashed camo URLs — alt text is the only
description of an image that survives). Two things it names but leaves to you: pinning the
repo on your profile, and getting listed on the relevant awesome-list. github.com publishes
no sitemap and a profile page links only pinned repos, so for an unlinked repo pinning is
the difference between one crawl path and none.

## Requirements

- **Node 22+** — it uses the global `WebSocket` to speak the DevTools Protocol, which is
  what keeps the toolkit dependency-free.
- **A Chromium-based browser** — Chromium, Chrome, Edge or Brave, auto-discovered; set
  `CHROME=/path/to/binary` to override.
- No `npm install`, no ffmpeg.
