# Contributing a Recipe

Each recipe lives in `recipes/<category>/<slug>/` and must contain four files:

- `README.md` — title (H1), description (first paragraph used as summary)
- `rule.yaml` — the Jommit automation YAML (use `version: '1.0'`)
- `fixture-event.json` — a realistic Jira event payload for dry-run validation
- `screenshot.png` — a screenshot of the rule in the Jommit editor

## YAML key conventions

- `name:` should be human-readable (≤60 chars)
- `type:` must be one of: `event`, `scheduled`, `workflow`, `shared`
- `enabled:` set to `false` for recipes (users enable when ready)

## Running validation locally

```bash
npm install
npm run validate
```

## Categories

- `approvals/` — approval flows, review gates
- `automation/` — general automation patterns
- `integrations/` — third-party integrations (Slack, email, etc.)
- `calculated-fields/` — field computation recipes
- `scheduled-jobs/` — scheduled task patterns
