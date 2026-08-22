<overview>
How the README should sound. Read this before writing a line and again before the
tighten pass. Three registers share one core. The core is what keeps prose from reading
machine-written: write it flat first, none of the machine tells, cut to the bone, each fact
once, no emoji, no exclamation marks, no joke ever labelled. A register is one move applied
after the flat draft, chosen to fit the project:

- `deadpan` leaves bare the one fact per screen that is already funny. bash.org. A dev tool
  with a thesis and a developer reader.
- `plain` licenses every claim with a number and concedes the limit early. ripgrep, uv,
  tokio. A library or CLI used by strangers, a tool for a non-technical relative, anything
  formal. **The default when nothing decides.**
- `quiet` states the consequence and withholds the jab. A meditation app's README. An app a
  person lives with.

Pick the register before writing a line (`<choosing_the_register>`). The README declares it
on its first line, `<!-- craft-readme: voice=quiet -->`, and `scripts/check-voice.mjs` reads
that and lints to it. What differs per register in the lint is small and listed under each.
</overview>

<choosing_the_register>
A ladder. Stop at the first rung that decides.

1. **The user's words.** formal, serious, plain, professional → `plain`. calm, quiet, gentle,
   soft, kind → `quiet`. dry, deadpan, sarcastic, bash.org, funny → `deadpan`. "Less
   sarcastic", "tone it down" → not deadpan; plain or quiet by rung 3.
2. **What the project already says.** An existing marker stays unless the user asked for a
   change. A CLAUDE.md line about voice or design decides: "quiet", "no exclamation marks",
   "plain and faintly clinical" → `quiet`; "professional", "enterprise", a corporate owner →
   `plain`. An existing README's register counts if it reads written rather than generated.
3. **What it is and who reads it.** `quiet`: an app a person lives with. Meditation, notes, a
   journal, a wallpaper, a reading list, a habit. The interface is quiet, so the README is.
   `plain`: a library, CLI or service used by strangers; a tool for a non-technical relative;
   anything read in a corporate context; a README not in English (the moves carry, the jokes
   do not). `deadpan`: a developer tool with an opinionated thesis and a developer reader,
   where the author would enjoy the slogan.
4. **The wince test.** Read the slogan aloud to the project's typical user. The author would
   wince at a joke → not deadpan. The author would wince at "A meditation app that never
   congratulates you" becoming "A meditation app for iOS and Android" → not plain.
5. **Nothing decides → `plain`.** Deadpan and quiet are chosen, never defaulted into.

| register | slogan | FAQ answer | person |
|---|---|---|---|
| `deadpan` | an opinion with a verb | the literal fact, one line | you, or none |
| `plain` | the category and the mechanism | full, the limit conceded | we for a team, I for one |
| `quiet` | an opinion, usually as a negation | full, no reassurance | you, or none |

A project outside the three (a community project in the Charm manner, a playful one in the
lazygit manner) gets its register described in a sentence by the author. The core still
holds; the lint runs as `plain`.

On an explicit invocation, state the pick in the plan line ("register: quiet") and go. On an
auto-trigger, it goes into the question. Either way the marker records it.
</choosing_the_register>

<core>
Holds in every register. The lint enforces the parts a regex can hold.

**Write it flat first.** Every section as bare facts. Sentence-case headings. No marketing
word, no emoji, no exclamation mark. Then, and only then, the register's one move. A joke
added is what a machine does when told to be funny; warmth added is what a machine does
when told to be warm. Both are the loudest tells there are.

**Numbers where an adjective would go.** "400 lines" beats "lightweight". "Last touched in
2023" beats "long-abandoned". "23 times faster than `find -iregex`" (fd) beats "fast".
"Every plant is one finished sitting" (JustSit) beats "a rewarding garden". No number → say
what it does.

**Concede the flaw before the reader finds it.** fd's third sentence: "While it does not aim
to support all of `find`'s powerful functionality, it provides sensible (opinionated)
defaults". ripgrep gives it a heading: "Why shouldn't I use ripgrep?". JustSit:
"Notifications are the one thing Expo Go cannot do." No apology, no promise to fix it.

**Invitations name a job or a person.** "Join us on Discord to meet other maintainers"
(astro). "Hack together a prototype" (tldraw). Not "feel free to", not "we'd love to hear".

**Never label the joke.** No wink, no smiley, no "(yes, really)", no "I know". If a line
needs a flag to read as a joke, it is not one.

**The machine tells.** Three groups. These are house style: serious humans use some of them
(fzf opens "Whether you're…", Zed "Welcome to Zed", tokio has **Fast** / **Reliable** /
**Scalable** bullets) and a README can carry one and read fine. What reads generated is
density plus nothing specific. Logseq's README is the control: written by people, emoji on
every heading, twenty-six exclamation marks, "Whether you're a student, a professional, or
anyone who values a clear and organized approach", "follow these simple steps". Against it,
journaler's "What you write is your business, not mine." Both human. One worth imitating.

- *Structure* (the lint warns, or cannot see): the rule of three ("a screenshot, a short GIF,
  and a quick start" → two, four, or a fragment); the em-dash aside (a period almost always
  does the job); balanced antithesis ("it's not X, it's Y" → pick a side); the explained
  payoff ("…, making it easy to keep up to date" → state the thing and stop); uniform rhythm
  (vary hard; fragments are fine); anaphora ("It reads. It picks. It writes."); the
  bold-lead-in bullet list (`- **Fast**: …` ×3 → two flat sentences, or the picture); the
  section closer that restates the section; callouts (`> [!NOTE]`, `**Tip:**`); Title Case
  Headings; the "Why X?" heading.
- *Vocabulary* (the lint errors): marketing adjectives (powerful, robust, seamless,
  lightweight, elegant, intuitive, comprehensive, blazing-fast, leverage, empower,
  streamline); softeners (simply, easily, effortlessly, with ease, "just run", "out of the
  box"); connective tissue (whether you're…, designed to, aims to, allows you to, making it
  easy to, ensuring that, it's worth noting, additionally, ultimately, in order to, a wide
  range of, not only… but also); openers and closers (Welcome to, Introducing, Happy coding,
  Feel free to, Contributions are welcome, Made with ❤, Star this repo); emoji; exclamation
  marks; semicolons; "etc."
- *Trying to be funny* (the lint errors): the parenthetical wink ((yes, really), (I know),
  (you're welcome), (don't ask)); meme labels (spoiler alert, plot twist, fun fact, pro tip,
  hot take, wait for it, let that sink in, narrator:, TL;DR, mic drop); ™, *sigh*,
  ¯\_(ツ)_/¯, :), /s, lol, "just kidding"; "it's 2026 and…", "dear reader", "trust me",
  "I'll wait", "look,", "okay but", "because of course", "it just works". Ironic Capital
  Letters and scare "quotes" the lint cannot see. You can. Bare "Tip:" is human; "pro tip"
  appeared in none of forty-one READMEs surveyed.

**Cut to the bone.** The shortest version that still carries the fact wins. A line that only
adds flavour goes, even a good one, and especially under an image that already shows it. A
section is allowed to be a visual, one bare line, and the link. Real cuts, each the author's
own final call; good lines got cut, not just weak ones:
- Candle GIF caption: "Scroll a grave to the bottom and there's a candle. Light it before the
  match burns down. It's still lit when you come back, only you can see it, and there's no
  counter." → "Scroll a grave to the bottom and there's a candle." The GIF shows the rest.
- Agent section: "You have the repos. An agent has the free time. Open your fork in Claude
  Code…" → "Open your fork in Claude Code…" The joke was fine. The instruction is the point.
- "No server, no database, no build. The page commits to itself." → "No server, no database,
  no build."

**Each fact once.** An opinion restated in three phrasings is one fact. State it once.
</core>

<deadpan>
**Fits** a developer tool with a thesis and a developer reader. Graveyard, craft-readme,
CtrlClickDiff. The target of the sarcasm is software ceremony and the reader's own
procrastination, never the reader's competence.

bash.org was the IRC quote database. Someone states an absurd thing flatly, someone answers
the literal question, the last line is shorter than the one before it. Nobody inside the
quote says "lol". A tired sysadmin telling you what the thing does.

- **State the absurd flatly.** "The GIF encoder is hand-written. ffmpeg cannot be assumed
  present." Not "yes, we wrote our own GIF encoder (I know)".
- **Answer the literal question.** The FAQ is the register's best room. "Playwright? ffmpeg?"
  "Neither. Node 22 has a WebSocket, that's the dependency list." "Is it production-ready?"
  "It writes a text file." "Windows?" "Plain Node. Nobody has run it there. Tell me what
  breaks." "Can I change the colours?" "They're CSS variables. Change them."
- **End on the anticlimax.** "It reads the repo, picks the shots, takes them, writes the
  README and the guide, checks the links and images, and stops. You commit."
- **Imperatives, not invitations.** "Fork it, rename it, ship it." "Run the checker before
  you push."
- **One dry line per screen, at most.** The flat lines around it are what make it land. A
  README that quips on every line is a README trying.
- **The slogan has an opinion.** A complaint with a verb: "Nobody reads the wall of text.
  Show them the thing." "Your projects died. Bury them properly."
- "I" or no pronoun. "We" is a company. Contractions are fine; lowercase chat-speak is not.

**The machine's imitation:** the winks in the core list, "It's 2026 and…", a quip every
third paragraph. **Lint:** the full rule set, nothing relaxed.
</deadpan>

<plain>
**Fits** a library, CLI or service used by strangers; a tool for a non-technical relative;
anything read in a corporate context; a README in another language. And the fallback.
ripgrep, fd, uv, tokio, zstd, curl, prettier are the models; they are what a serious README
reads like when a person wrote it.

- **Opener = category + mechanism**, one or two sentences, no adjective a number does not
  back. "ripgrep is a line-oriented search tool that recursively searches the current
  directory for a regex pattern." "Prettier is an opinionated code formatter." "`fd` is a
  program to find entries in your filesystem." Position by a named rival if useful: "akin to
  `sed`, `awk`, `grep`, and friends for JSON data" (jq).
- **Sentence two is a default or a constraint, not a benefit.** "By default, ripgrep will
  respect gitignore rules and automatically skip hidden files/directories and binary files."
  "It's written in portable C and has zero runtime dependencies" (jq).
- **A claim is licensed in the same breath or not made.** uv: "[10-100x faster](BENCHMARKS.md)
  than pip". fd: "approximately **23 times faster** than `find -iregex`". zstd opens with a
  benchmark table. Ghostty concedes parity with Alacritty before claiming "something like
  100x faster than Terminal.app". The weak form is fzf's "fzf is fast. Performance should
  not be a problem in most use cases." The machine's form is "significantly faster than
  traditional tools", which nobody can check.
- **Concede the limit by the third sentence**, or give it a heading. fd: "While it does not
  aim to support all of `find`'s powerful functionality…". ripgrep: "Why shouldn't I use
  ripgrep?" with four honest bullets ("You need a portable and ubiquitous tool."). tokio:
  "Note that although we try to avoid the situation where a dependency transitively
  increases the MSRV of Tokio, we do not guarantee that this does not happen."
- **Caveats open "Note that…" or "However,…".** Install facts are version-pinned ("available
  on Ubuntu since 20.04", bat). The licence line is exact ("distributed under the terms of
  both the MIT License and the Apache License 2.0"; neovim cites a commit hash).
- **Say the fact only the author knows.** "The binary name for ripgrep is `rg`." "Note there
  is an old broken package called `htmx`. This is `htmx.org`."
- **"We" for a team, "I" for one; pick and hold.** ripgrep: "my blog", "my email address and
  PGP public key". Second person for instructions.
- **Headings are specific and project-shaped**, not the Features / Installation / Usage /
  Configuration / Contributing / License skeleton: "Dictionary compression How To:" (zstd),
  "Why should I use ripgrep?", "Warrant Canary Signing Key" (joplin). Question headings are
  normal here. Contributing and Acknowledgements are short and name people: "We're grateful
  to the PubGrub maintainers, especially Jacob Finkelman" (uv).
- **Install = the conditional clause, then the bare command.** "If you're a macOS Homebrew or
  a Linuxbrew user, then you can install ripgrep from homebrew-core:". fish steers you away:
  "Rather than building from source, consider using a packaged build for your platform."
- **The closer is the licence.** No send-off, no thank-you, no call to action. esbuild just
  stops.
- **Do not sand every sentence to one finish.** Human serious READMEs are ragged: curl has
  eight administrative sections and no feature list; esbuild has one heading; fd says
  "simple, fast and user-friendly" in its second sentence. Uniform polish is itself a tell.

**The machine's imitation of formal:** "a robust, comprehensive, enterprise-grade solution
designed to empower teams", agentless passive voice, the skeleton headings, a benefit where
the constraint should be, a claim with no number. Three rewrites:
- "Graveyard is a powerful static site generator designed to help developers showcase their
  archived projects with ease." → "Graveyard is a static-site generator for archived GitHub
  repos: one page per repo, the dates from the API, the epitaph from you. Node 18+, no build
  step."
- "Blazing fast performance ensures your builds complete in record time." → "A 2,000-file
  site builds in about 1.4 s on an M1 ([benchmarks](docs/bench.md))." No number → cut the
  sentence.
- "**Is it production-ready?** Absolutely! Used by developers around the world." → "**Is it
  production-ready?** It writes a static HTML file; there is no server to run. Tested on
  macOS and Linux; Windows is untested."

**Lint:** a claim adjective (powerful, robust, lightweight, comprehensive, blazing-fast)
becomes a warning on a line that carries its number or a link, and stays an error without
one. `!` and bold-label bullets warn instead of error (three `!` in a file is an error again:
tokio has one, Logseq twenty-six). "Note that", question headings, Contributing-style and
Credits headings, and sentence rhythm are not reported. "extremely fast" (uv's own opener)
still warns as an intensifier; a plain author keeps that one knowingly.
</plain>

<quiet>
**Fits** an app a person lives with. Meditation, notes, a journal, a wallpaper, a reading
list, a habit. The interface is quiet, so the README is. JustSit's CLAUDE.md states the
doctrine: "quiet is about voice rather than austerity… plain and faintly clinical, like
Wallace. Not mystical. No exclamation marks, no congratulation, no pep talk."

Quiet is deadpan's syntax with the mockery and the second-person jab removed. Short
declaratives, no hedging, no enthusiasm, no adjective piles. It withholds rather than jabs.
Nothing is at the reader's expense.

- **The consequence clause is the register's move.** A feature, then what it guarantees you.
  "Joplin is 'offline first', which means you always have all your data on your phone or
  computer." "It uses Android's built-in notification system to trigger the alarm, which
  means it works even when your device is asleep." (BodhiTimer). The lint allows "which
  means" and ", so you can" here; elsewhere they are the explained payoff.
- **Name the failure mode it removes, not the benefit.** "Reliability is of extreme
  importance to a meditation tool in order to eliminate all possible worries about the
  timer not behaving correctly" (nyxkn/meditation). Pile's cost warning is the warmth: "we
  strongly recommend that you configure a spending limit within OpenAI's interface to
  prevent unexpected costs."
- **Promises as short negations.** "A meditation app that never congratulates you."
  (JustSit). "No sign-ups, no data collection, no tracking. Ever." "What you write is your
  business, not mine." (journaler). A negation is a promise, not a joke.
- **Withhold.** "Every plant is one finished sitting. Leave one early and nothing grows.
  Nothing is said about that either." "Whether that stage describes your mind is yours to
  decide." (JustSit). The register trusts the reader to draw the conclusion.
- **Boundaries without apology.** "at my discretion" (Pile). "Do not use the issue queue"
  (hugo). Warm is not soft.
- **Warmth by naming people.** "The Enso image was drawn by Ryōnen Gensō (1646-1711)."
  (BodhiTimer). "MIT. Drawn in Karakuli; the practice is B. Alan Wallace's." (JustSit). A
  credit line does more than any adjective and costs nothing.
- **Features as noun phrases with full stops.** Never "X lets you…". Invitations name a
  concrete job or person. "You" is fine; "we'd love" is not.
- **The temperature may drop.** A quiet lede, then flat build steps (Zettlr does exactly
  this). Generated warm files hold one temperature start to finish.
- No exclamation mark, no congratulation, no pep, no emoji. The slogan is an opinion, usually
  stated as what the thing does not do.

**The machine's imitation of warm:** "delightful", "beautifully crafted", "cozy ✨", "a gentle
reminder", "take a moment to", "you deserve", "your journey", "we'd love to hear from you",
"feel free to". It promises transformation ("empower your practice") where a human grants
agency ("Hack together a prototype"). And deadpan with the jokes deleted is not quiet:
"Nobody reads your docs. You won't either." is a jab and the lint warns on it. Three rewrites:
- "Welcome to JustSit, a beautifully crafted meditation companion designed to gently guide
  you on your mindfulness journey ✨" → "JustSit is a meditation timer. Wallace's ten stages
  of shamatha, taught slowly. Finish a sitting and something grows."
- "Track your progress and celebrate every milestone with delightful rewards!" → "Every plant
  is one finished sitting. Leave one early and nothing grows."
- "We'd love to hear your thoughts! Feel free to open an issue 💬" → "Issues go on GitHub.
  Say what you sat with when it broke."

**Lint:** "which means" and ", so you can" are not reported; a Credits heading is not
reported; a jab (nobody, you won't, dead, garbage, useless) warns. Emoji and `!` stay errors.
</quiet>

<worked_examples>
Section-scale rewrites. The machine on the left of the arrow; one line per register on the
right where they differ.

**Intro.**
"Welcome to Graveyard! Graveyard is a lightweight, zero-dependency static site generator
that turns your archived GitHub repos into a beautiful, interactive cemetery — complete
with epitaphs, candles, and more. Whether you're a solo developer or a team, Graveyard
makes it effortless to give your old projects the send-off they deserve."
→ deadpan: "Graveyard builds a cemetery out of your archived repos. One grave each. It pulls
the dates from GitHub. The cause of death it leaves to you."
→ plain: "Graveyard is a static-site generator for archived GitHub repos: one page per
repo, the dates from the API, the epitaph from you. Node 18+, no build step."
→ quiet: "Graveyard makes a cemetery of your archived repos. One grave each. The dates come
from GitHub. The cause of death is yours to write, or to leave."

**Features.**
```
## ✨ Features
- **Zero dependencies**: runs with Node alone, no npm install required
- **Blazing fast**: captures a screenshot in seconds
- **Beautiful output**: transparent rounded corners that look great on any theme
```
→ deadpan: "Node 22 and a Chromium. Nothing else. The corners come out transparent so the
shot sits on either GitHub theme." The GIF above it shows the rest.
→ plain: "Node 22 and a Chromium browser; no other dependency. Screenshots come out with
transparent rounded corners, so they sit on either GitHub theme."
→ quiet: "Node 22 and a Chromium browser. Nothing else. The corners come out transparent, so
the picture sits on either theme."

**FAQ.**
"**Is it production-ready?** Absolutely! Graveyard has been thoroughly tested and is used by
developers around the world. 🌍"
→ deadpan: "**Is it production-ready?** It writes a text file."
→ plain: "**Is it production-ready?** It writes a static HTML file; there is no server to
run. Tested on macOS and Linux; Windows is untested."

"**Does it work on Windows?** Yes! Graveyard is fully cross-platform and works seamlessly on
Windows, macOS, and Linux."
→ deadpan: "**Windows?** Plain Node. Nobody has run it there. Tell me what breaks."
→ quiet: "**Windows?** Plain Node. It has not been run there. If something breaks, say so."

"**Why another README tool?** Great question! While there are many excellent README
generators out there, none of them…"
→ cut the question, in every register. "Why another" is the machine's question.

**Sarcasm, attempted** (deadpan only; the other registers do not attempt it).
"Yes, we wrote our own GIF encoder. (I know.) Because apparently ffmpeg is too much to ask
for in 2026™." → "The GIF encoder is hand-written. ffmpeg can't be assumed present."
"Pro tip: run the checker before you push (you'll thank me later)." → "Run the checker
before you push."

**Closer.**
"## 🤝 Contributing\nContributions are welcome! Feel free to open an issue or submit a PR.
Happy coding! 🚀"
→ deadpan: "MIT. Fork it, rename it, ship it." Or nothing.
→ plain: "MIT. Open an issue before a large PR; run `npm test` first."
→ quiet: "MIT. Drawn in Karakuli; the practice is B. Alan Wallace's."
</worked_examples>

<check>
```bash
node <skill>/scripts/check-voice.mjs README.md            # register from the marker; plain if none
node <skill>/scripts/check-voice.mjs README.md --voice quiet   # trial another without editing
```

The header names the register it used: `(deadpan)` from the marker; `(plain, no marker)`
means the marker is missing, add it; `(quiet, marker says plain)` is a trial. Errors are the
vocabulary, the boilerplate, the emoji, the winks. Fix every one. Warnings are the structural
tells a regex can only suspect. Each is a call: keep the line only if you would defend it to
the author, and say which you kept. `--strict` makes warnings fail too.

| | `deadpan` | `plain` | `quiet` |
|---|---|---|---|
| claim adjective | error | warn if the line has a number or link | error |
| `!` | error | warn; three in a file → error | error |
| bold-label bullets, machine headings | error | warn | error |
| "Note that", question headings, Contributing/Credits headings, rhythm | warn | off | warn (Credits off) |
| "which means", ", so you can" | warn | warn | off |
| a jab (nobody, you won't, dead…) | — | — | warn |
| emoji, winks, marketing, softeners, boilerplate | error | error | error |
</check>
