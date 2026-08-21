<div align="center">

# craft-readme

[![license MIT](https://img.shields.io/badge/license-MIT-6f6ac4?style=flat-square)](LICENSE)
[![Claude Code skill](https://img.shields.io/badge/Claude_Code-skill-6f6ac4?style=flat-square)](https://docs.claude.com/en/docs/claude-code)
![zero dependencies](https://img.shields.io/badge/dependencies-0-8b8b8b?style=flat-square)
![node 22+](https://img.shields.io/badge/node-22%2B-8b8b8b?style=flat-square)

**A README that shows the thing, not a spec that describes it.**

A Claude Code skill that rebuilds a project's README as a short, image-led landing page —
and captures the screenshots and GIFs itself, with no dependencies.

**[How it works →](docs/GUIDE.md)**

<img src="docs/images/hero.png" alt="A terminal running the capture and check scripts, ending in check-readme: clean" width="100%">

</div>

## What it does

<img src="docs/images/demo.gif" alt="The capture and check commands typed out, each printing its JSON summary" width="600">

It captures its own media over headless Chromium — no Playwright, no ffmpeg — cuts the
corners to transparency so a shot sits on either GitHub theme, and encodes GIFs in pure
Node. Then it moves every option table and schema out to `docs/GUIDE.md` and leaves the
README short. [The full pipeline →](docs/GUIDE.md#the-capture-scripts)

## Use it with your agent

In Claude Code, from the project whose README you want:

```
/craft-readme
```

It audits the repo, proposes the shots, captures them, writes `README.md` and
`docs/GUIDE.md`, verifies every link and image, and hands off to `/finish-session`. It
never commits on its own.

## Install

Clone it where Claude Code loads skills:

```bash
git clone https://github.com/gr13nka/craft-readme ~/.claude/skills/craft-readme
```

Needs Node 22+ (for a built-in WebSocket) and any Chromium-based browser. Nothing to
`npm install`.

## Run the scripts directly

Every capture tool works on its own, outside the skill:

```bash
node scripts/capture.mjs spec.json                       # web page → rounded PNG, or GIF
node scripts/term.mjs run.txt --out cli.png --title app  # a transcript → terminal card
node scripts/check-readme.mjs README.md --docs docs      # dead links, placeholders, budgets
```

## Example output

A hero the skill captured — full-bleed, corners cut to transparency, straight from a
running page:

<img src="docs/images/example-output.png" alt="A night-scene web app captured as a rounded, transparent-cornered hero image" width="100%">

## Docs

Everything else is in **[docs/GUIDE.md](docs/GUIDE.md)**:
[install](docs/GUIDE.md#install) · [the capture scripts](docs/GUIDE.md#the-capture-scripts) · [the spec format](docs/GUIDE.md#the-shot-spec) · [the checks](docs/GUIDE.md#the-checks).

## License

MIT.
