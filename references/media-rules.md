<overview>
How the images in a README should look and behave. The scripts do the
mechanics; these are the decisions the scripts cannot make and the reasons
behind them.
</overview>

<transparent_corners>
**Rounded corners, cut to transparency — never a mat.** A screenshot dropped
straight onto the page butts against whatever theme the reader is on; a dark
scene bleeds into GitHub's dark theme and reads as a hole. The instinct is to
put it on a card, and that instinct is wrong: an opaque mat is a dark rectangle
painted onto a page whose colour you do not control, and it was rejected on
sight ("dark borders, not transparent").

The fix is to remove the corners, not fill behind them. `capture.mjs` and
`round.mjs` capture RGBA with the page background forced transparent
(`Emulation.setDefaultBackgroundColorOverride {a:0}`) and cut the corner pixels
to alpha 0 with a one-pixel antialiased edge. The image then sits on any theme.
Check a new shot on both `#ffffff` and `#0d1117` before trusting it.
</transparent_corners>

<social_card>
**The one image that keeps its corners.** The 1280x640 social preview is opaque and
full-bleed — no rounding, no alpha. Every other image here has its corners cut to alpha 0
so it sits on the reader's GitHub theme; this one is never composited onto a GitHub page.
Slack, X and LinkedIn draw it on their own background, and a transparent corner there
resolves to black or white depending on the client and the viewer's theme, which is the
one thing the transparent-corner rule exists to prevent.

`templates/og-spec.json` therefore carries no `radius` key, and `capture.mjs` skips
rounding when it is absent. Budget is **1 MB**, tighter than a still's 1.5 MB, because
that is GitHub's own limit for the upload. Documented best-display size is 1280x640;
the minimum it accepts is 640x320, and it re-encodes the upload to JPEG at 1200x630.

Text only, and that is a decision rather than a shortcut: the card renders around 500px
wide in a feed, where a shrunk screenshot is mush. The name and one line survive.
Upload is manual, and unavoidably so: there is no API. `UpdateRepositoryInput` has no
field for it, `openGraphImageUrl` is read-only, and REST ignores it. Open the settings
page and reveal the file (`gh browse --settings`, `open -R docs/images/og.png`) so it is
a drag-and-drop, and let the user confirm before calling it done.
</social_card>

<formats>
- **Stills**: PNG, RGBA. Full alpha, so the corners are clean.
- **Animation**: GIF by default. Its alpha is one bit, so a rounded corner is a
  tiny staircase rather than a smooth curve — invisible at render size, and the
  right trade against a card that fights the page. When the scene is light and
  busy and the GIF bands (256 colours over soft gradients), switch to **APNG**
  (`encode.mjs out.apng`): full colour and full alpha, ~5× the bytes. Say which
  you used and why rather than hiding the trade.
- **GitHub renders** GIF, APNG and animated WebP straight from a repo path.
  It does **not** render mp4/mov from a path — those only play when uploaded
  through the web comment box, so a committed animation must be GIF or APNG.
- **Theme-specific images**: GitHub honours
  `<picture><source media="(prefers-color-scheme: dark)" srcset="…dark.png"><img src="…light.png"></picture>`.
  Use it only when a single transparent-corner image genuinely cannot serve both.
</formats>

<sizes>
- Capture at `deviceScaleFactor: 2` so the image is crisp on retina displays.
- Hero: 1200–1400 CSS px wide (2400–2800 px on disk). `width="100%"`.
- GIF / terminal card: 360–480 px rendered; `width="400"` is a good default.
- Budgets: a still ≤ 1.5 MB, an animation ≤ 3 MB. Over? `sips -Z 2400 in out`
  downscales a still; for a GIF, tighten the clip, shorten to ≤ 4 s, or drop the
  fps. `check-readme.mjs` enforces the budgets.
- Put images in `docs/images/`. Never `shots/` (a dead convention) and never the
  repo root.
</sizes>

<terminal_card>
For a CLI tool the hero is a terminal, drawn by `term.mjs` from a transcript.
It carries its own dark ground (One Dark, `#282c34`) so its transparent rounded
corners still read as a terminal on either theme — `#0d1117` would merge with
GitHub's dark. A title bar with three dots and an optional `--title` names it.
The transcript is `$ `-prefixed commands and their real output; never invent
output — paste a real `--help` or a real short run.
</terminal_card>

<rendering_a_readme>
A project whose output is a document should show that document. `readme-shot.mjs`
renders a README the way GitHub does — chrome-free, on white — and screenshots it
with transparent corners like any other image. For a restructure, a **before/after**
(`--compare` for a still, `--wipe` for a GIF) shows the transformation in one glance;
it is the most honest hero a README-cleanup produces. Badges and repo-relative images
render because the page is served from the repo root with network on.
</rendering_a_readme>

<pushing>
Committing a couple of MB of images can fail the push with
`send-pack: unexpected disconnect while reading sideband packet` (an HTTP/2
sideband problem, not auth or network). The fix, as **per-command** flags —
never persisted to config:

```
git -c http.version=HTTP/1.1 -c http.postBuffer=524288000 push
```
</pushing>
