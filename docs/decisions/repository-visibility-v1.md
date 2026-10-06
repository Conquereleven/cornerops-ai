# Decision note: repository visibility v1

Status: **open — Founder decision.** No setting was changed.

## Current state (observed 2026-10-06)

`Conquereleven/cornerops-ai` is **public**. Its `LICENSE` says "Proprietary / Internal Use Only". Those two facts pull in opposite directions: the code is legally restricted but readable and clonable by anyone.

## What is exposed today

- The full application source, including the authorization design, route inventory and every migration.
- Runbooks naming environment variables, providers and the deployment shape.
- Product direction: Commerce OS, SupplyGraph, commercial operations, the sales model.
- Commit history and all pull request discussion.
- `frontend/AGENTS.md` and the landing page contain the Founder's contact email and WhatsApp number (already public on the website by Founder decision).

No credential was found in tracked files by the sprint's secret scan. History was not scanned.

## Options

| | Keep public | Make private |
|---|---|---|
| IP exposure | Commercial product code and roadmap are readable by competitors and prospects. The licence deters reuse only by those who respect it. | Source and roadmap are not readable. |
| Security assumptions | Must hold with the attacker reading the code. That is the right assumption anyway and the boundary in this sprint does not rely on secrecy, but public code shortens the path to any mistake. | Obscurity adds a little friction; it is not a control. |
| Secrets risk | An accidentally committed secret is exposed immediately and permanently (forks, caches). | Exposure is limited to collaborators. |
| Contributor workflow | Anyone can fork and open a PR. Not needed for an internal product. | Collaborators are invited explicitly. |
| Deployment integrations | Works. | Railway and GitHub Actions work with private repositories through the GitHub app; verify the Railway GitHub app is granted this repository before switching. Actions minutes are metered on private repositories. |
| GitHub features | Secret scanning, push protection and branch rulesets are free. | Some of these need a paid plan on private repositories. |
| Reversal | Going private later does not recall existing clones or forks. | Can be made public again at any time. |

## Recommendation

Make the repository **private**. It holds proprietary commercial code and operational runbooks for a product that is not open source, and nothing about how the product is built or sold depends on it being public. The one real cost is losing free secret scanning and push protection; the CI secret scan added in this sprint covers the same ground at commit time.

Before switching:

1. Confirm the Railway GitHub app has access to the repository as a private repository, so deploys do not silently stop.
2. Check for forks (`gh api repos/Conquereleven/cornerops-ai/forks`); existing forks stay public.
3. Decide whether anything public links to the repository.
4. Consider scanning git history for secrets once, since history has been public.

If the Founder prefers to stay public, the minimum is: enable secret scanning with push protection, protect `main`, and treat everything in the repository as published.
