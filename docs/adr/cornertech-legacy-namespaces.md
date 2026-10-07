# Corner Tech AI identity and compatibility namespaces

Date: 2026-10-07. Status: accepted for the public reconstruction branch.

Visible frontend identity is Corner Tech AI. Preserve `cornerops-ai` workspace slug, `cornerops_internal`, environment names, persisted audit identifiers, repository paths and historical migrations. These identifiers implement compatibility and authorization; they are not the active public brand.

The frontend maps the existing primary workspace slug to the current display brand. It does not change membership records, production authentication or database configuration. Other workspace names are preserved.

The reconstruction branches from PR #91 head `22c8510559b6a583a7a13b63301e79cdfe1b7d10`, so the real login and server-verified private boundary are inherited without a separate merge. Review the website diff against #91; staging and production promotion require a separate Founder decision.
