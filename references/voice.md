<overview>
How the README should sound. Read this before writing a line and again before the
tighten pass. Two things live here: the register the READMEs are written in, and the tells
that mark prose as machine-written, which hold in every register. `scripts/check-voice.mjs`
catches the tells a regex can hold. The rest is on you.

The register is bash.org. The old IRC quote database: someone states an absurd thing
flatly, someone answers the literal question, the last line is shorter than the one before
it. Nobody inside the quote says "lol". A tired sysadmin telling you what the thing does.
</overview>

<the_register>
**Write it flat first.** Every section as bare facts. Then read it back and find the one
place where the literal truth is already funnier than any phrasing of it. Strip the
decoration off that fact and leave it bare. If there is no such place, the section stays
flat. The joke is found, never added. An added joke is what a machine does when told to be
funny, and it is the loudest tell there is.

**State the absurd flatly.** The GIF encoder is hand-written. ffmpeg cannot be assumed
present. Say it like that. Not "yes, we wrote our own GIF encoder (I know)".

**Answer the literal question.** The FAQ is the register's best room. The sceptic's
question is the setup, the plain fact is the punchline:
- "Playwright? ffmpeg?" "Neither. Node 22 has a WebSocket, that's the dependency list."
- "Is it production-ready?" "It writes a text file."
- "Windows?" "Plain Node. Nobody has run it there. Tell me what breaks."
- "Can I change the colours?" "They're CSS variables. Change them."

**End on the anticlimax.** The last sentence of a paragraph is the shortest and the
plainest. "It reads the repo, picks the shots, takes them, writes the README and the
guide, checks the links and images, and stops. You commit."

**Concede the flaw before the reader finds it.** "A rAF loop that ignores its timestamp
argument will not slow down. Those record at real speed." No apology, no "unfortunately",
no promise to fix it.

**Aim at ceremony, never at the reader.** The sarcasm goes to the wall-of-text README, the
options table nobody opens, the badge that lies, enterprise software, the author's own
project. The reader is a peer. "If you can't read a 30-line quick start, this isn't for
you" is contempt, not deadpan. Cut it.

**Numbers where an adjective would go.** "400 lines" beats "lightweight". "Last touched
in 2023" beats "long-abandoned". "A still in two seconds, a 70-frame GIF under ten" beats
"fast". If there is no number, say what it does.

**Imperatives, not invitations.** "Fork it, rename it, ship it." Not "Feel free to fork".
"Run the checker before you push." Not "Pro tip: run the checker (you'll thank me later)".

**One dry line per screen, at most.** The rest are flat facts, and the flat facts are what
make the dry one land. A README that quips on every line is a README trying.

**Never label the joke.** No wink, no smiley, no "(yes, really)", no "I know". If the line
needs a flag to be read as a joke, it is not one. Drop the label and usually the line.

**The slogan has an opinion.** It is the one place a point of view is mandatory. A
complaint with a verb in it: "Nobody reads the wall of text. Show them the thing." A flat
description whose flatness is the joke: "A cemetery for your archived repos." Never a
feature list with the commas taken out.

Headings in sentence case. Contractions are fine. Lowercase chat-speak is not; this is a
README, not the quote. If one person wrote the project, "I" or no pronoun. "We" is a
company.
</the_register>

<machine_tells>
Three groups. The checker errors on the second and third; the first it can only warn on,
or not see at all, so it is the one to hold in your head.

**Structure.**
- **Rule of three.** "a screenshot, a short GIF, and a quick start", three to a paragraph.
  Two, or four, or a fragment: "A screenshot, a short GIF, a quick start."
- **The em-dash aside.** "each grave — the years, the epitaph, the cause — then…". A
  period almost always does the job. Keep an em-dash only if you would defend it.
- **Balanced antithesis.** "It's not X, it's Y." "Not golfed, necessary." Pick a side.
- **Explaining the payoff.** The participial tail: "…, making it easy to keep up to date."
  "…, which is what keeps it clean." State the thing and stop. The reader got it.
- **Uniform rhythm.** Every sentence the same medium length reads composed. Vary hard: a
  four-word sentence beside a long one. Fragments are fine.
- **Anaphora.** "It reads. It picks. It writes." Three in a row is a cadence, not a list.
- **The bold-lead-in bullet list.** `- **Fast**: …` `- **Simple**: …` `- **Secure**: …`.
  Two flat sentences, or the picture. A "Features" heading over adjectives is the same tell.
- **The section closer.** A last sentence that restates the section. Cut it.
- **Callouts.** `> [!NOTE]`, `**Tip:**`, `**Note:**`. Say the thing in the paragraph.
- **Title Case Headings.** Sentence case.
- **Question headings.** "Why X?" The reader did not ask. Name what the section shows.

**Vocabulary.** The checker's lists are the reference; the shape of each:
- Marketing adjectives: powerful, robust, seamless, lightweight, elegant, intuitive,
  comprehensive, blazing-fast, cutting-edge, battle-tested, leverage, empower, streamline.
- Softeners: simply, easily, effortlessly, with ease, hassle-free, a breeze, "in seconds",
  "just run", "out of the box".
- Connective tissue: whether you're…, designed to, aims to, allows you to, making it easy
  to, ensuring that, note that, it's worth noting, additionally, furthermore, ultimately,
  essentially, in order to, a wide range of, when it comes to, not only… but also.
- Openers and closers: Welcome to, Introducing, Happy coding, Feel free to, Contributions
  are welcome, Made with ❤, Star this repo, If you found this useful.
- Emoji. Exclamation marks. Semicolons. "etc."

**Trying to be funny.** The machine's idea of sarcasm. Every one of these is the joke being
labelled, and every one of them errors:
- Parenthetical winks: (yes, really), (I know), (you're welcome), (don't ask), (seriously).
- Meme labels: spoiler alert, plot twist, fun fact, pro tip, hot take, unpopular opinion,
  wait for it, let that sink in, narrator:, TL;DR, mic drop.
- ™, *sigh*, ¯\_(ツ)_/¯, :), /s, lol, "just kidding".
- "It's 2026 and…", "dear reader", "trust me", "I'll wait", "look,", "okay but", "not
  gonna lie", "because of course", "you guessed it", "it just works".
- Ironic Capital Letters and scare "quotes" around an ordinary word. The checker cannot see
  these. You can.
</machine_tells>

<worked_examples>
Section-scale rewrites. Machine on the left of the arrow, register on the right.

**Intro.**
"Welcome to Graveyard! Graveyard is a lightweight, zero-dependency static site generator
that turns your archived GitHub repos into a beautiful, interactive cemetery — complete
with epitaphs, candles, and more. Whether you're a solo developer or a team, Graveyard
makes it effortless to give your old projects the send-off they deserve."
→ "Graveyard builds a cemetery out of your archived repos. One grave each. It pulls the
dates from GitHub. The cause of death it leaves to you."

**Features.**
```
## ✨ Features
- **Zero dependencies**: runs with Node alone, no npm install required
- **Blazing fast**: captures a screenshot in seconds
- **Beautiful output**: transparent rounded corners that look great on any theme
```
→ "Node 22 and a Chromium. Nothing else. The corners come out transparent so the shot sits
on either GitHub theme." The GIF above it shows the rest.

**FAQ.**
"**Is it production-ready?** Absolutely! Graveyard has been thoroughly tested and is used
by developers around the world. 🌍"
→ "**Is it production-ready?** It writes a text file."

"**Does it work on Windows?** Yes! Graveyard is fully cross-platform and works seamlessly
on Windows, macOS, and Linux."
→ "**Windows?** Plain Node. Nobody has run it there. Tell me what breaks."

"**Why another README tool?** Great question! While there are many excellent README
generators out there, none of them…"
→ cut the question. "Why another" is the machine's question, not the reader's.

**Sarcasm, attempted.**
"Yes, we wrote our own GIF encoder. (I know.) Because apparently ffmpeg is too much to ask
for in 2026™."
→ "The GIF encoder is hand-written. ffmpeg can't be assumed present."

"Spoiler alert: nobody reads your README. 🙃"
→ "Nobody reads the wall of text."

"Pro tip: run the checker before you push (you'll thank me later)."
→ "Run the checker before you push."

**Closer.**
"## 🤝 Contributing\nContributions are welcome! Feel free to open an issue or submit a PR.
Happy coding! 🚀"
→ "MIT. Fork it, rename it, ship it." Or nothing.
</worked_examples>

<cut_to_the_bone>
The shortest version that still carries the fact wins. A line that only adds flavour goes,
even a good one, and especially under an image that already shows it. A section is allowed
to be a visual, one bare line, and the link. When in doubt, leave it out.

Real cuts, each the author's own final call. Good lines got cut, not just weak ones:
- Candle GIF caption: "Scroll a grave to the bottom and there's a candle. Light it before
  the match burns down. It's still lit when you come back, only you can see it, and there's
  no counter." → "Scroll a grave to the bottom and there's a candle." The GIF shows the rest.
- Agent section: "You have the repos. An agent has the free time. Open your fork in Claude
  Code…" → "Open your fork in Claude Code…" The joke was fine. The instruction is the point.
- "No server, no database, no build. The page commits to itself." → "No server, no
  database, no build."

And a description becoming a tagline with a view: "A README that shows the thing, not a
spec that describes it." → "Nobody reads the wall of text. Show them the thing."
</cut_to_the_bone>

<check>
```bash
node <skill>/scripts/check-voice.mjs README.md
```

Errors are the vocabulary, the boilerplate, the emoji, the winks. Fix every one. Warnings
are the structural tells a regex can only suspect: an em-dash, a triplet, an antithesis, a
same-length paragraph, a Title Case heading. Each is a call. Keep the line only if you
would defend it to the author, and say which ones you kept. `--strict` makes warnings fail
too, for a README that should carry none.
</check>
