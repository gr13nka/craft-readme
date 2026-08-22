# Workflow: Tighten an existing README's prose

<required_reading>
Read these now:
1. references/readme-anatomy.md
2. references/voice.md
</required_reading>

<context>
The bloat pass, then the voice pass. Run it on its own when a README is wordy
or reads machine-written but is structurally fine, or as step 8 of build-readme.
The goal is fewer words carrying the same facts, in a voice a person would use.
A reader's attention is the scarce thing. Bloat first: there is no point voicing
a sentence that is about to be cut.
</context>

<process>

**Pass 1: bloat.** Go sentence by sentence. Cut or move each one that fails:

- **Does the image above already show this?** If the sentence narrates a
  screenshot or GIF, cut it; keep only the fact the picture cannot show.
- **Can the reader act on it?** If not, cut it, unless it is the one surprising
  fact worth stating for its own sake.
- **Is it an opinion already stated?** Collapse the restatements to one, phrased
  as a fact.
- **Is it documentation?** Move it to `docs/GUIDE.md` and leave an anchor link.

Then compress what remains: two sentences carrying one fact become one. Do not
drop a true, load-bearing detail (a failure mode, a warning, a required flag).
Compression is fewer words, not fewer facts.

**Pass 2: voice.** Run `node <skill>/scripts/check-voice.mjs README.md`. Fix
every error. Each warning is a call: keep the line only if you would defend it
to the author, and say which you kept. Then read the README top to bottom once
for what the checker cannot see:

- a three-item list → two, four, or a fragment
- "it's not X, it's Y" → pick a side
- a paragraph whose sentences are all one length → vary hard
- a line that needed a wink to read as a joke → the wink goes, and usually the line
- a line aimed at the reader instead of at the ceremony → cut
- more than one dry line per screen → the rest go flat
- a slogan that describes instead of opines → give it a view
- a "Why X?" or Title Case heading → name what the section shows, sentence case

Re-run both checks. Report the word count before and after.
</process>

<success_criteria>
- no sentence merely restates an adjacent image
- no fact or opinion stated more than once
- no documentation left inline that belongs in the guide
- check-readme clean; check-voice clean, each kept warning named
- word count reported before/after
</success_criteria>
