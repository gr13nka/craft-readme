<overview>
Whether anyone finds the project. The README decides whether a visitor stays; these
fields decide whether a visitor arrives, and they all sit outside the README file.

The one fact that reorders everything else: **GitHub search and Google are two different
games, and they read different things.**

- **GitHub's repo search cannot see your README.** Default search covers the repository
  name, description and topics only. A phrase that appears only in ripgrep's README
  returns two repos, and ripgrep is not one of them; the same query with `in:readme`
  returns 706 with ripgrep second.
- **Google reads your README in full** and ignores your topics. The README is rendered
  into the repo page's HTML, so a README-only phrase does surface the repo on the web.

The description is the only field that wins both. It is also the field most repos leave
blank, at which point the page's title, its meta description, and every Slack and X
preview degrade to "Contribute to owner/repo development by creating an account on
GitHub."
</overview>

<truth_table>
| Field | Where it lands | Set it when | How to check |
|---|---|---|---|
| description | About box, `<title>`, `<meta name="description">`, `og:title`, `og:description`, `og:image:alt`, the social card, GitHub search | always | `gh repo view --json description` |
| topics | About box, `topic:` search, github.com/topics pages, GitHub's own suggester | always, 5-12 of them | `gh repo view --json repositoryTopics` |
| homepage | the About box link | a live demo or docs site exists | `gh repo view --json homepageUrl` |
| social preview | the card on every share surface | always, once there is a hero | `gh repo view --json usesCustomOpenGraphImage` |
| alt text | the only text an indexer gets from an image | every non-decorative image | `check-discovery.mjs` |
| `# Name` heading | the page's only `<h1>`, one of Google's title sources | always | `check-discovery.mjs` |
| first paragraph | Google's snippet | always | `check-discovery.mjs` |
</truth_table>

<description>
One line, and the most load-bearing string on the page — it appears twelve times in the
rendered HTML.

- **Front-load the searched phrase.** Google's title is `GitHub - {owner}/{repo}: {desc}`,
  and the prefix eats 25-30 characters before the description starts. Roughly the first
  35 characters survive on screen. Put the noun a stranger would type at the front.
- **Length**: 60-120 characters. The median across the hundred most-starred repos is 73.
  The social card truncates around 150. The hard cap is 350.
- **Shape**: what it is, for whom or what, and the one thing that separates it. No leading
  emoji — a trailing one is harmless, a leading one spends the characters that matter.
- **It is prose**, so it obeys `references/voice.md`: no marketing adjective, no claim
  without its number, no connective tissue. `check-discovery.mjs` runs it through the
  same rules as the README.

Ranking is relevance-first, not star-first. For `http client`, a repo with 3.1k stars
ranks first while axios (109k), requests (54k) and curl (43k) are absent from the top
eight. A description carrying the exact words someone types beats a fifty-fold star
advantage, which is why this field repays the minute it costs.
</description>

<topics>
Between five and twelve. Twenty is the hard limit, and filling all twenty with loose
matches dilutes the human signal for no gain.

**Topics match as exact atomic slugs.** No stemming, no splitting, no prefix matching:
`command` does not match `command-line-tool`, and `greps` does not match `grep`. An
invented or pluralised slug never fires at all, so it is dead weight on the sidebar.

- Format: lowercase letters, digits and hyphens; 50 characters or less.
- **Verify each one exists** before adding it. A slug with no other repos behind it is a
  slug nobody browses: `gh api '/search/repositories?q=topic:<slug>' --jq .total_count`.
- Prefer the conventional name over the accurate-sounding one. `cli` and
  `command-line-tool` are both real; `command-line-tools` is not.
- Topic names are public even when set on a private repo.
</topics>

<social_preview>
The only thing a reader sees before deciding whether to click, on every share surface.
With none, the card shows the owner's avatar and a fork count.

- **1280x640 PNG, under 1 MB.** The documented minimum is 640x320. GitHub re-encodes an
  upload to JPEG at 1200x630.
- **Opaque, full-bleed, no transparent corners.** This is the one image in this skill that
  keeps its corners — see `references/media-rules.md`. Slack, X and LinkedIn composite it
  onto their own background, and transparency there resolves to black or white
  unpredictably.
- Upload is manual: Settings, then Social preview. `gh repo edit` has no flag for it.
- `og:image:alt` still comes from the repo description, so a custom card does not retire
  the description.
</social_preview>

<in_the_readme>
Three things in the file itself, all of them free and none of them a change of voice.

- **A real `# Name` heading.** The README's first `#` becomes the page's only `<h1>`,
  which is one of Google's title sources. A header built from a centred logo image with no
  markdown heading leaves the page with zero `<h1>` — `sharkdp/bat` is the worked example.
  Keep the heading even when a logo sits above it.
- **One descriptive sentence early.** Google's snippet comes primarily from page content,
  so the first prose the page carries is the first thing a searcher reads. It goes above
  the badge row, not below it.
- **Real alt text on every image.** Repo-relative images are rewritten to `/raw/`, which
  robots.txt blocks, and external ones are proxied through hashed camo URLs. The image is
  never indexable; the alt text is the only description of it that any indexer, screen
  reader, or text-mode reader ever gets. Filenames are stripped and carry nothing.
</in_the_readme>

<advise_do_not_do>
Two one-click actions worth naming in the hand-off, because neither is a file edit and
both outrank most of what a README tool can do.

- **Pin the repo on the owner's profile.** github.com publishes no sitemap,
  `?tab=repositories` is blocked in robots.txt, and a profile page links only the pinned
  repos. For a repo nothing else links to, pinning is the difference between one crawl
  path and none.
- **Get listed on the relevant awesome-list.** A README link to another github.com repo is
  dofollow, while every external link is `rel="nofollow"` — including the About box's own
  website link. An awesome-list entry is the backlink, the crawl path and the human
  traffic in one line of a pull request.

Measure it afterwards in Insights, then Traffic: referring sites and popular content.
Push access, and a fourteen-day window.
</advise_do_not_do>

<not_worth_it>
Refuse these when asked, and never volunteer them.

- **Keyword stuffing.** GitHub's search never reads the README, so it buys nothing there,
  and Google demotes repetition that reads unnatural. It also fails `check-voice.mjs`.
- **Hidden text.** Mechanically impossible: GitHub strips HTML comments from the rendered
  DOM and sanitises `style` attributes, so white-on-white does not survive. Collapsed
  `<details>` content is real indexable text, not a hiding place.
- **A `keywords` meta tag or structured data.** GitHub emits neither, and a README cannot
  add either.
- **SEO image filenames.** Stripped by the camo proxy and blocked by robots.txt.
- **Buying stars.** Ranking barely uses them, and six million are already flagged.
- **A badge wall.** It pushes the descriptive sentence below the fold for no ranking gain.
  Keep the row to four or five, per `references/badges.md`.

One field the skill warns about but never acts on: **a run-together compound repo name**.
Names split on hyphens, so `aho-corasick` is findable by `aho` and by `corasick`, while
`ripgrep` is invisible to a search for `grep`. Renaming redirects issues, stars and
clones, but the old name must never be reused or the redirect dies, and Actions references
to the old path break. Say it; leave the decision with the owner.
</not_worth_it>
