# PM Guide: PRDs, Jira, And Confluence

This repo can be used directly from Cursor or Claude Code for product drafting, but it should not replace Jira or Confluence.

## What To Edit Where

| Work | Primary location | Notes |
| --- | --- | --- |
| Product contract for a new element or substantial behavior change | `docs/prds/<slug>/PRD.md` | Start from `_template.md`; keep it short and mark `Status: Proposal` until reviewed. |
| A11y audit, coverage, and remediation scope | `docs/a11y` | Use `docs/a11y/_audit-template.md` and link to Jira/Confluence. |
| Ticket status, owner, sprint, release | Jira | Ask the agent to update Jira only when you explicitly want it to write. |
| Stakeholder rollup and initiative status | Confluence | Repo-managed sections are synced; PM status sections are edited in Confluence. |

## Drafting A PRD With An Agent

Use a prompt like:

```text
Read docs/prds/README.md, docs/prds/_template.md, Jira PIE-123, and the relevant docs/a11y files.
Draft a Proposal PRD under docs/prds/<slug>/PRD.md.
Keep it to one screen, include accessibility requirements, and list open questions.
Do not implement code.
```

## Linking Jira

- Add a short `Related Jira` line near the top of the PRD or a11y audit doc.
- Add the repo path to the Jira issue description or as a Jira comment.
- Do not create follow-up tickets unless a human explicitly asks for them.

## Working With Confluence

- Use Confluence pages for the PM/program view.
- Use `docs/a11y/INDEX.md` for the source-of-truth rules.
- Use the Confluence sync commands to publish repo-managed summaries and pull PM status blocks.
- If a Confluence page and repo PRD disagree, treat the repo PRD as canonical for product contract details and update Confluence as a summary.

## Review Expectations

Before moving a PRD from `Proposal` to `Accepted`:

- Product agrees the goals and non-goals are right.
- Engineering agrees the proposed model/session surface is implementable.
- Accessibility concerns are covered or explicitly tracked as open questions.
- Jira links point to the implementation or remediation work.
