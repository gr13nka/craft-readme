<!-- craft-readme: voice={{deadpan|plain|quiet}} -->
<!-- keep the line above: check-voice reads it. Choose by references/voice.md <choosing_the_register>; plain when nothing decides. Delete this comment. -->
<div align="center">

<!-- optional mark: <img src="docs/images/logo.svg" width="72" alt=""> -->

<!-- keep a real "# Name": it is the page's only <h1> and one of Google's title sources. A logo image alone leaves the page without one. references/discoverability.md -->
# {{Name}}

<!-- the slogan: an opinion with a verb in deadpan and quiet; the category and the mechanism in plain. A feature list is not a slogan. references/voice.md -->
**{{Slogan — what it is, ≤ 8 words}}**

<!-- this line is what Google shows as the snippet, so it sits above the badges, not below them -->
{{One plain line — what it does, ≤ 20 words.}}

<!-- badge row — only true ones; see references/badges.md. Owner/repo from the remote. -->
[![live](https://img.shields.io/badge/live-{{host}}-6f6ac4?style=flat-square)]({{live-url}})
[![license {{SPDX}}](https://img.shields.io/badge/license-{{SPDX}}-6f6ac4?style=flat-square)](LICENSE)

**[{{Live demo →}}]({{live-url}})** · [Docs](docs/GUIDE.md)

<!-- alt text is the only description of an image that survives: /raw/ is robots-blocked and externals go through camo -->
<img src="docs/images/hero.png" alt="{{what the hero shows}}" width="100%">

</div>

## {{Animated section title}}

<img src="docs/images/demo.gif" alt="{{what the demo shows}}" width="400">

<!-- One or two sentences, by the bloat test: only what the GIF cannot show and the reader can act on. -->
{{The one surprising fact the animation does not itself show.}} [{{Detail →}}](docs/GUIDE.md#{{anchor}})

## Quick start with an agent

<!-- A prompt to paste. Names the repo and only commands that exist. Read CLAUDE.md if present, else the guide. -->
> Read {{CLAUDE.md | docs/GUIDE.md}} first. Then run `{{list command}}` and show me {{what}}.
> For each {{item}} I pick, run `{{do command}}` — take {{what from where}}, but leave
> {{the human part}} blank for me to write. When I've filled it in, commit and push.

## Quick start

```bash
{{fewest commands that reach a running thing}}
```

## {{Feature}}

<!-- optional: a still or a command, ≤ 3 lines, then an anchor link into the guide -->
<img src="docs/images/{{shot}}.png" alt="{{alt}}" width="100%">

{{≤ 3 lines.}} [{{More →}}](docs/GUIDE.md#{{anchor}})

## FAQ

<!-- optional: 3–5 questions a sceptic actually asks. deadpan: the literal one-line answer; plain and quiet: a full answer, one to three sentences, the limit conceded. Never "Why another X?". -->
**{{Sceptic's question?}}** {{The literal answer, one line.}}

## Docs

Everything else is in **[docs/GUIDE.md](docs/GUIDE.md)**: {{2–4 anchor links, e.g.}}
[install](docs/GUIDE.md#install) · [options](docs/GUIDE.md#options) · [how it works](docs/GUIDE.md#how-it-works).

## License

{{SPDX}}.{{ optional: credit / built-with line.}}
