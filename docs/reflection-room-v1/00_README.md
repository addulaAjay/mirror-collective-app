# Reflection Room V1 — Spec Bundle

Four documents. Read them in order, or jump to the one that matches your role.

| File | Audience | Purpose |
|---|---|---|
| `01_BACKEND_IMPLEMENTATION_SPEC.md` | Backend engineer / Claude Code | Full backend spec: data models, all 5 endpoints, all 7 config files (with contents), DynamoDB schemas, service-layer algorithms, error envelopes, environment vars |
| `02_TASK_BREAKDOWN_AND_TESTS.md` | Backend engineer / PM | 9-phase build plan with exit criteria; full test plan (unit + integration + acceptance) mapped to PDF §17 checklist |
| `03_UI_DEVELOPER_HANDOFF.md` | Frontend / mobile engineer | Endpoint contracts, UI states, Mirror Moment label matrix, accessibility/privacy requirements, edge cases |
| `04_CLAUDE_CODE_PROMPT.md` | You — paste this into Claude Code | Ready-to-use prompt + how to handle off-script behavior + Figma/GitHub MCP recommendations |

## Source of truth

The original PDF (`Reflection_Room_Logic_Weighting_Dev_Handoff_V1`) is the canonical product spec. These four files are the **engineering interpretation** of that PDF, structured for execution.

When in doubt, the PDF wins on intent and copy. These files win on implementation detail (algorithms, payloads, file paths).

## Recommended workflow

1. Skim `01` and `02` yourself — confirm nothing in the architecture surprises you.
2. Hand `03` to your UI developer. Have them confirm the contracts match what they expected from the design.
3. Drop all four files into your repo at `docs/reflection-room-v1/`.
4. Open Claude Code and paste the prompt from `04`.
5. After each phase Claude Code completes, review the diff and run `pytest` before saying "continue."
