<overview>
Badges are claims, and a false claim on line one costs the whole README its
credibility. Add a badge only when its truth condition holds, and check the
condition rather than assuming it. shields.io, `?style=flat-square` across the
whole row so they read as one set. Owner and repo come from
`git remote get-url origin`, never hand-typed.
</overview>

<truth_table>
| Badge | shields URL (fill {owner}/{repo}/{name}) | Add it only when | How to check |
|---|---|---|---|
| live site | `https://img.shields.io/badge/live-{host}-6f6ac4?style=flat-square` linked to the URL | the site is actually deployed | open it, or the pages badge is green |
| pages deploy | `https://img.shields.io/github/deployments/{owner}/{repo}/github-pages?style=flat-square&label=pages` | GitHub Pages is enabled | `gh api 'repos/{owner}/{repo}/pages'` returns 200 |
| license | `https://img.shields.io/badge/license-{SPDX}-6f6ac4?style=flat-square` linked to `LICENSE` | a `LICENSE` file exists | `test -f LICENSE`; read its SPDX id |
| npm version | `https://img.shields.io/npm/v/{name}?style=flat-square` | the package is published | `npm view {name} version` succeeds |
| CI | `https://img.shields.io/github/actions/workflow/status/{owner}/{repo}/{file}?style=flat-square` | a workflow exists | `.github/workflows/*.yml` present |
| no build step | `https://img.shields.io/badge/build-none-8b8b8b?style=flat-square` | there is genuinely no build | no `build` script in the manifest |
| zero dependencies | `https://img.shields.io/badge/dependencies-0-8b8b8b?style=flat-square` | the manifest has no deps | `dependencies`/`requires` empty |
</truth_table>

<rules>
- **Never hand-write a status.** "build passing" as a static badge is a lie the
  moment the build breaks. Use the live `github/actions/workflow/status` endpoint
  or omit it.
- If the user wants a licence badge and there is no `LICENSE`, offer to add one
  (MIT unless they say otherwise) — then the badge is true.
- Colour: `6f6ac4` (a muted indigo) for identity/link badges, `8b8b8b` (grey)
  for factual ones. Adjust to the project's own accent if it has one.
- Keep the row to four or five. A wall of badges is its own kind of bloat.
</rules>
