# Workflow: Tighten an existing README's prose

<required_reading>
Read this now:
1. references/readme-anatomy.md
</required_reading>

<context>
The bloat pass. Run it on its own when a README is wordy but structurally fine,
or as step 8 of build-readme. The goal is fewer words carrying the same facts —
a reader's attention is the scarce thing.
</context>

<process>
Go sentence by sentence. Cut or move each one that fails:

- **Does the image above already show this?** If the sentence narrates a
  screenshot or GIF, cut it — keep only the fact the picture cannot show.
- **Can the reader act on it?** If not, cut it, unless it is the one surprising
  fact worth stating for its own sake.
- **Is it an opinion already stated?** Collapse the restatements to one, phrased
  as a fact.
- **Is it documentation?** Move it to `docs/GUIDE.md` and leave an anchor link.

Then compress what remains: two sentences carrying one fact become one. Do not
drop a true, load-bearing detail (a failure mode, a warning, a required flag) —
compression is fewer words, not fewer facts.

Verify: `node <skill>/scripts/check-readme.mjs README.md --docs docs`. Report the
word count before and after.
</process>

<success_criteria>
- no sentence merely restates an adjacent image
- no fact or opinion stated more than once
- no documentation left inline that belongs in the guide
- check-readme clean; word count reported before/after
</success_criteria>
