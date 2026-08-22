<div align="center">

# craft-readme

[![license MIT](https://img.shields.io/badge/license-MIT-6f6ac4?style=flat-square)](LICENSE)
[![Claude Code skill](https://img.shields.io/badge/Claude_Code-skill-6f6ac4?style=flat-square)](https://docs.claude.com/en/docs/claude-code)
![zero dependencies](https://img.shields.io/badge/dependencies-0-8b8b8b?style=flat-square)
![node 22+](https://img.shields.io/badge/node-22%2B-8b8b8b?style=flat-square)

***Nobody reads the wall of text. Show them the thing.***

<img src="docs/images/hero.png" alt="Before and after: a text-heavy spec-style README on the left, a short image-led landing page on the right" width="100%">

</div>

Every project ends up with the same README: a wall of setup steps, an options table nobody
scrolls to, and no picture of the thing actually running. craft-readme tears that down to a
landing page — a hero shot, a short GIF, a quick start — and files the reference behind a
link, where it belongs.

It's a Claude Code skill, and it captures its own media. No dependencies.

## What it does

<img src="docs/images/demo.gif" alt="A spec-style README wiping across into a short, image-led one" width="600">

The options and schemas move to `docs/GUIDE.md`; a hero screenshot and a short GIF go in.
Everything is captured over headless Chromium — no Playwright, no ffmpeg — with the corners
cut to transparency so a shot sits on either GitHub theme.
[The full pipeline →](docs/GUIDE.md#the-capture-scripts)

## Use it with your agent

In Claude Code, from the project whose README you want:

```
/craft-readme
```

It reads the repo, proposes the shots, captures them, writes `README.md` and
`docs/GUIDE.md`, checks every link and image, and hands off to `/finish-session`. It won't
commit behind your back.

## Install

Clone it where Claude Code keeps skills:

```bash
git clone https://github.com/gr13nka/craft-readme ~/.claude/skills/craft-readme
```

Node 22+ (for the built-in WebSocket) and any Chromium-based browser. Nothing to
`npm install`, because there is nothing to install.

## Run the scripts directly

Every tool works on its own, outside the skill:

```bash
node scripts/capture.mjs spec.json                        # web page → rounded PNG, or GIF
node scripts/term.mjs run.txt --out cli.png --title app   # a transcript → terminal card
node scripts/readme-shot.mjs README.md --out readme.png   # a README → the way GitHub shows it
node scripts/check-readme.mjs README.md --docs docs       # dead links, placeholders, budgets
```

## Example output

A README this made, rendered as GitHub shows it — centred header, real badges, a hero and a
GIF, the reference moved out to a linked guide:

<img src="docs/images/example-output.png" alt="A rendered README: centred title, badge row, a hero screenshot, and the first section" width="100%">

## FAQ

**Does it need Playwright or ffmpeg?** No. Node 22 ships a WebSocket, and that's the whole
dependency list. The GIFs are encoded in pure Node.

**Can it show my README before I push it?** Yes — it renders the local file. GitHub never
has to see it first.

**No screenshots in my project?** It makes them: web pages driven headless, CLIs as a
terminal card, and for anything else, one shot you hand over gets its corners rounded.

**Will it mangle my docs?** No. It moves them into `docs/GUIDE.md` verbatim and runs a
coverage check to prove nothing fell out.

## Docs

Everything else is in **[docs/GUIDE.md](docs/GUIDE.md)**:
[install](docs/GUIDE.md#install) · [the capture scripts](docs/GUIDE.md#the-capture-scripts) · [the spec format](docs/GUIDE.md#the-shot-spec) · [the checks](docs/GUIDE.md#the-checks).

## License

MIT. Fork it, rename it, ship it.
