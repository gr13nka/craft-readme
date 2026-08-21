<overview>
`capture.mjs` and `term.mjs` already handle the traps that cost a full session
to find. This lists what they do for you (so you do not re-solve it) and the few
knobs still yours to set. All of it is why the scripts exist instead of a
one-off Playwright call.
</overview>

<handled_for_you>
Every capture already does these; you never set them:

- **Cache disabled.** An edited stylesheet or SVG otherwise reads as a no-op and
  you chase a bug that is not there.
- **A fresh browser profile per run.** A page's own `localStorage` from the
  previous run changes what it shows on the next — a state left set once made the
  scene skip the very thing being recorded, with no error.
- **readyState polled, not `Page.loadEventFired` awaited.** Under load the event
  fires before a listener attaches, and a missed event is indistinguishable from
  a hang.
- **`document.fonts.ready` awaited** — web fonts are usually the whole look.
- **Transparent background**, re-applied after every viewport change.
- **A free port and a built-in static server** when the spec has `serve` —
  `file://` breaks ES modules silently, so everything is served over http.
</handled_for_you>

<your_knobs>
- **`wait` after a click ≈ 1100 ms.** Entrance animations need to settle; a node
  sampled mid-fade is measured at a fraction of its opacity. Put a `wait` on any
  step whose result you are about to shoot.
- **`clip`.** A tight clip is what keeps a GIF's colour count down and its file
  small. Use `--probe "sel1,sel2"` to print element boxes and choose a clip
  without guessing coordinates.
- **`slow`** (record only). Clipped screenshots arrive at ~8 fps, too coarse for
  a motion under ~2 s. `slow: 3` records in slow motion and resamples to real
  time; `capture.mjs` stretches the animation clock and the page's own
  `setTimeout` / `performance.now` / `Date.now` / rAF-timestamp together so the
  picture and its timers cannot drift apart.
- **`--set key=value`** overrides any spec field from the command line
  (`--set viewport.width=1600`, `--set record.fps=15`), so iterating on a shot is
  one cheap re-run, not an edit.
</your_knobs>

<remaining_caveats>
- The slow-motion shim covers CSS animations, `setTimeout`, the clock readers and
  rAF timestamps. A pure-`requestAnimationFrame` loop that ignores its timestamp
  argument will still run at wall speed — for those, set `record.format` and
  accept real-time fps, or record more of the loop and trust the resample.
- Pages that pull Google Fonts need network access at capture time.
- A light, busy UI can blow past a GIF's 255 colours; keep the clip tight and the
  take short, and fall back to APNG (`references/media-rules.md`).
</remaining_caveats>
