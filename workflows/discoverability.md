# Workflow: Set the discovery surfaces

<required_reading>
Read these now:
1. references/discoverability.md
2. references/voice.md (the description is prose and lints like prose)
</required_reading>

<context>
The README decides whether a visitor stays. These fields decide whether one arrives, and
none of them lives in the README. Run this on its own for a repo whose README is already
fine, or as step 9 of build-readme.

The fact that drives the order below: **GitHub's repo search does not read the README** —
name, description and topics only — while **Google reads the README and ignores the
topics**. The description is the only field that wins both, so it is written first and
most carefully. Nothing here changes a line of README prose.
</context>

<process>

<step_1 name="Read the current state">
```
gh repo view --json name,nameWithOwner,description,repositoryTopics,homepageUrl,usesCustomOpenGraphImage
```
Note which fields are already set. A field a human chose is not overwritten without
saying so — show the current value beside the proposal in step 5.

Then run the gate to see what it already flags:
`node <skill>/scripts/check-discovery.mjs README.md`
</step_1>

<step_2 name="Draft the description">
One line, from the finished README's slogan and sub-slogan — not invented separately, or
the About box and the page disagree.

- **Front-load the searched noun.** Google's title is `GitHub - {owner}/{repo}: {desc}`,
  and the prefix spends 25-30 characters before yours starts. About 35 survive on screen.
- 60-120 characters. The median across the hundred most-starred repos is 73. The social
  card truncates near 150. The API rejects past 350.
- Say what it is, for what, and the one thing that separates it. No leading emoji.
- It obeys `references/voice.md` — no marketing adjective, no claim without its number,
  no connective tissue. `check-discovery.mjs` runs it through the README's own register.

A description is not a slogan. "Nobody reads the wall of text" is a good slogan and a
useless description, because nobody searches for it.
</step_2>

<step_3 name="Pick the topics">
Five to twelve. Twenty is the cap, and filling it with loose matches dilutes the sidebar
for no gain.

Topics match as **exact atomic slugs** — no stemming, no splitting, no prefix. `command`
never matches `command-line-tool`, and `greps` never matches `grep`. So an invented or
pluralised slug is dead weight.

Verify each one before adding it:
```
gh api '/search/repositories?q=topic:<slug>&per_page=1' --jq .total_count
```
A slug with almost nothing behind it is one nobody browses — take the conventional name
instead. Format is lowercase letters, digits and hyphens, 50 characters or less.

Cover: what it is (`cli`, `library`, `static-site-generator`), what it is built on
(`nodejs`, `rust`), and what it is for (`documentation`, `screenshot`). Skip anything the
project is not.
</step_3>

<step_4 name="Homepage">
Set it when a live demo or docs site exists — it is the first link a visitor looks for.
It is `rel="nofollow"`, so it is for people, not for rank. If there is none, leave it
empty rather than pointing it back at the repo.
</step_4>

<step_5 name="Show, then apply">
Print current vs proposed for every field being touched, then apply:

```
gh repo edit --description "<the line>" --homepage "<url>" \
  --add-topic <a> --add-topic <b> --add-topic <c>
```

State what changed. These fields are public the moment they are set, and the same command
reverses any of them.
</step_5>

<step_6 name="Capture the social card">
The card is the only thing a reader sees before deciding to click. Without one, the share
shows an avatar and a fork count.

```
node <skill>/scripts/capture.mjs <skill>/templates/og-spec.json \
  --set 'path=/og-card.html?title=NAME&slogan=THE%20SLOGAN&footer=github.com/OWNER/REPO' \
  --set out="$PWD/docs/images/og.png"
```

Do not override `serve` — `capture.mjs` resolves it relative to the spec file, so it
already points at the skill's own `templates/`. URL-encode the spaces. Optional params:
`theme=light`, `accent=RRGGBB`.

`Read` the result. It is 1280x640, opaque to the edges, under 1 MB. A card that comes back
as a browser error page is still the right size and still under budget, so look at it.

Then hand it over. There is genuinely no API: `UpdateRepositoryInput` carries no social
preview field, `Repository.openGraphImageUrl` is read-only, and a REST `PATCH` of an
og-image field is ignored. The web form is the only route, and it wants a session cookie
and a scraped token — not something this skill will drive.

So do the next best thing, which is put both windows in front of them:

```
gh browse --settings                      # or: open "https://github.com/OWNER/REPO/settings"
open -R docs/images/og.png                # macOS; Linux: xdg-open docs/images
```

Then say it in one line: **drag `docs/images/og.png` onto Social preview**. It is on the
main Settings page, under the repository name, about a third of the way down. Do not
claim the card is live until they confirm — `check-discovery` keeps warning until
`usesCustomOpenGraphImage` flips, which is the honest signal.
</step_6>

<step_7 name="Verify">
`node <skill>/scripts/check-discovery.mjs README.md` → exit 0. Every remaining warning is
a stated call, not a silent pass. `--no-remote` checks only the file, for when `gh` is
absent.
</step_7>

<step_8 name="Hand off the two one-clicks">
Neither is a file edit, and both outrank most of what this skill can do. Name them; do not
attempt them.

- **Pin the repo on the profile.** github.com publishes no sitemap, `?tab=repositories` is
  blocked in robots.txt, and a profile page links only pinned repos. For a repo nothing
  else links to, this is the difference between one crawl path and none.
- **Get listed on the relevant awesome-list.** A README link to another github.com repo is
  dofollow; every external link, including the About box's own website link, is nofollow.
  One pull request buys the backlink, the crawl path and the human traffic together.

Measurement, when they ask whether it worked: Insights, then Traffic — referring sites and
popular content, push access, fourteen-day window.
</step_8>

</process>

<success_criteria>
- description set, front-loaded, within length, and clean under the README's register
- 5-12 topics, each a real slug verified to have other repos behind it
- homepage set when a live site exists, empty when there is not
- `docs/images/og.png` captured, 1280x640, opaque, under 1 MB, opened and confirmed
- check-discovery clean; the manual upload and the two one-clicks stated in the hand-off
</success_criteria>
