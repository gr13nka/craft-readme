# Workflow: Capture the media

<required_reading>
Read these now:
1. references/media-rules.md
2. references/capture-traps.md
</required_reading>

<context>
Scripts live in the skill's `scripts/`. They are zero-dependency Node (≥ 22) and
need a Chromium-based browser; they run with `node` alone — no npm install, no
ffmpeg. Work in the scratchpad for spec files and frames; write only the final
images into `docs/images/`.
</context>

<web>
Anything with a URL or a static root.

1. Copy `templates/shot-spec.json` and edit it: `serve` the repo root (or `url`
   a running dev server), set the viewport, the `steps` that bring the shot into
   view, the `clip`, `radius: 16`, and `out`.
2. Find coordinates without guessing: `node <skill>/scripts/capture.mjs spec.json
   --probe ".panel,.header"` prints element boxes.
3. Shoot: `node <skill>/scripts/capture.mjs spec.json`. Iterate cheaply with
   `--set scroll=700 --set out=docs/images/hero.png`.
4. For the animation, add a `record` block (trigger, duration, fps, and `slow: 3`
   if the motion is under ~2 s). `format` defaults to `gif`; use `apng` if it
   bands.
5. `Read` each result. Re-shoot if a frame is caught mid-animation or the clip is
   off.
</web>

<cli>
A command-line tool.

1. Write `transcript.txt`: `$ `-prefixed commands, their real output below (paste
   a real `--help` or a real short run — never invent output), `~ 800` for a
   pause in the animation.
2. Still: `node <skill>/scripts/term.mjs transcript.txt --out docs/images/cli.png
   --title <name>`.
3. Animation: add `--animate --fps 15`. `--out …/cli.gif`.
</cli>

<readme_or_doc>
A project whose output is a document — a README tool, a static-site or docs
generator — or any before/after cleanup of a README itself.

- Render a finished README as the hero: `node <skill>/scripts/readme-shot.mjs
  README.md --out docs/images/readme.png`. It renders GitHub-style and resolves
  repo-relative images; badges load over the network.
- Show a restructure as a **before/after**: `--compare old.md new.md --out
  docs/images/hero.png` for a side-by-side still, `--wipe old.md new.md --out
  docs/images/demo.gif` for the transition. Fetch a pre-restructure README with
  `git show <ref>:README.md` into the repo root so its relative paths resolve.
- Keep the wipe narrow (`--width 680`) — a full-width render blows the GIF past
  its budget.
</readme_or_doc>

<other>
A desktop app, or a library with nothing to run.

- Say exactly what you need — the window, at what size, in what state — and wait
  for the file(s). Then `node <skill>/scripts/round.mjs in.png docs/images/hero.png
  --radius 32` (radius in image px ≈ 2× the CSS radius). For a recording handed
  over as frames, `node <skill>/scripts/encode.mjs frames/ docs/images/demo.gif`.
- A library with nothing visual: the hero is a **terminal card** of the install
  and first call — write that transcript and use `term.mjs`.
</other>

<success_criteria>
- every image in `docs/images/`, transparent rounded corners, within the size budget
- at least one still and one animation, unless the user supplied their own
- each image opened and confirmed to show a settled, complete frame
</success_criteria>
