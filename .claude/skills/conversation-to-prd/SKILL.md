---
name: conversation-to-prd
description: Use when the user asks to turn a conversation, feature discussion, or implementation plan into a draft PIE Elements NG PRD under docs/prds/.
disable-model-invocation: true
---

# Conversation To PRD

Synthesize the current conversation and codebase context into a PRD draft. Do not reopen discovery by default; capture what is already known and call out gaps explicitly.

## Output Target

- Write or update a draft at `docs/prds/<slug>/PRD.md`.
- Use a concise kebab-case directory slug based on the element or feature name.
- Do not create Jira/GitHub issues, tracker labels, or external comments unless the user separately asks for that write.

## Process

1. Read `CONTEXT.md`, `docs/prds/README.md`, and `docs/prds/_template.md`.
2. Re-read the conversation and any relevant local docs or code already explored.
3. Use PIE vocabulary from `CONTEXT.md`, existing PRDs, rules, and element examples, especially model/session/controller contracts, authoring surfaces, assessment accessibility, and package distribution constraints.
4. Identify the highest useful testing seam: prefer user-facing element behavior, controller outcomes, custom-element boundaries, package exports, and accessibility outcomes over low-level implementation seams.
5. Draft the PRD by filling `docs/prds/_template.md`; keep sections concise, but do not omit required sections.
6. If important details are unknown, add them to **Open questions** instead of interviewing before drafting.

## PRD Expectations

- Start as `Status: **Proposal**` unless the user explicitly says the contract is accepted.
- Name the element or feature slug, implementation path, public package exports, consuming players/apps, and runtime environment when a contract is involved.
- Separate PIE-owned behavior from host-owned persistence, identity, policy, reporting, and standards certification.
- State compatibility impact for model fields, session fields, modes, controller behavior, package exports, player events/properties, and persisted or host-facing data.
- Include accessibility impact, test plan, rollout notes when relevant, and release-note expectations using the repo template.
