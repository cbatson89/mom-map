## Progress tracking

This project maintains a `progress.json` file at the repo root, used by an external
tracker to show status across all my projects. Update it every time a phase or
milestone completes, or whenever status/next_step changes — not just at the end of
a session.

Schema:

```json
{
  "project": "<human-readable project name>",
  "summary": "<one or two sentences: what this project IS, for someone with zero context>",
  "stage_type": "phase",
  "stage_label": "<free text, e.g. 'Phase 3 of 6: Auth' or 'Milestone: Beta Launch'>",
  "status": "not_started | in_progress | blocked | waiting | done",
  "next_step": "<single next action>",
  "notes": "<optional context, blockers, links>",
  "last_updated": "YYYY-MM-DD"
}
```

Rules:
- `status` must be exactly one of the five listed values — nothing else, no synonyms.
- `stage_type` is either `"phase"` or `"milestone"`, whichever convention this
  project uses. It's descriptive only; `stage_label` carries the actual detail.
- `summary` should rarely change — it's "what is this project," not "what's the
  status." Only update it if the project's scope or purpose actually changes.
- `last_updated` must be today's date whenever you touch this file.
- If `progress.json` doesn't exist yet, create it the first time you update status,
  writing `summary` based on the project's README or CLAUDE.md.
- Do not remove fields even if a value hasn't changed — write the full object each time.
