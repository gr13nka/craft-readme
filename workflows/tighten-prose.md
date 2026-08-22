# Workflow: Tighten an existing README's prose

<required_reading>
Read these now:
1. references/readme-anatomy.md
2. references/voice.md
</required_reading>

<context>
The bloat pass, then the voice pass. Run it on its own when a README is wordy
or reads machine-written but is structurally fine, or as step 8 of build-readme.
A re-voice ("make it calmer", "more formal", "less sarcastic") is this workflow
too: the bloat pass as usual, then pass 2 in the new register. The goal is fewer
words carrying the same facts, in a voice a person would use for this project.
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

**Pass 2: voice.** Settle the register first. The `<!-- craft-readme: voice=… -->`
marker on line 1 if present; else pick it by references/voice.md
`<choosing_the_register>` and insert the marker. If the user asked for a
different register, this is a re-voice: change the marker, keep every fact, and
recast each sentence by the new register's mechanics. A deadpan one-liner becomes
a full answer in plain; a jab becomes a withheld statement in quiet; a plain claim
keeps its number. `check-coverage` against the old README then takes
`--allow "craft-readme: voice"` for the changed marker line.

Run `node <skill>/scripts/check-voice.mjs README.md`. The header names the
register it used; `--voice x` trials another without editing. Fix every error.
Each warning is a call: keep the line only if you would defend it to the author,
and say which you kept. Then read the README top to bottom once for what the
checker cannot see:

- a three-item list → two, four, or a fragment
- "it's not X, it's Y" → pick a side
- a paragraph whose sentences are all one length → vary hard
- a line that needed a wink to read as a joke → the wink goes, and usually the line
- a line aimed at the reader instead of at the ceremony → cut
- a "Why X?" or Title Case heading → name what the section shows, sentence case
- deadpan: more than one dry line per screen → the rest go flat; a slogan that
  describes instead of opines → give it a view
- plain: an adjective without its number → the number, or cut; a limit nowhere
  conceded → concede it by the third sentence
- quiet: a line that jabs (the reader, a user, a competitor) → withhold it; a
  benefit stated as praise → the failure mode it removes; any reassurance → cut

Re-run both checks. Report the word count before and after, and the register.
</process>

<success_criteria>
- no sentence merely restates an adjacent image
- no fact or opinion stated more than once
- no documentation left inline that belongs in the guide
- check-readme clean; check-voice clean in the declared register, marker present,
  each kept warning named
- word count and register reported
</success_criteria>
