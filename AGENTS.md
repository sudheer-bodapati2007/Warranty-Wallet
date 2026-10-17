# AGENTS.md — Instructions for Future AI Coding Agents

Before making any change in Warranty Wallet, read `PROJECT_MEMORY.md` in the project root and inspect the actual source code. Do not invent implementation details, deployment status, or test history. If a fact cannot be verified, label it clearly.

## Mandatory safety rules

1. Never open, read, print, modify, overwrite, rename, or delete any existing `.env` file, even if a task seems to require it.
2. Never print, copy, or expose API keys, secrets, tokens, passwords, connection strings, or OAuth secrets.
3. Never commit, push, deploy, or change production settings without explicit owner approval.
4. Do not delete, migrate, or rewrite existing MongoDB records without explicit approval.
5. Do not make unrelated changes while working on a task.
6. Prefer small, targeted changes that preserve existing architecture and user data.
7. Do not replace or corrupt documentation; keep `PROJECT_MEMORY.md` accurate.

## Working rules

1. Inspect the relevant source files before editing.
2. Explain planned changes before performing any major refactor.
3. Reuse existing components, routes, models, hooks, and services where practical.
4. Keep frontend values secret-safe; never expose backend secrets through `VITE_` variables.
5. Maintain authentication and warranty ownership restrictions.
6. Do not change production hosting settings, environment variables, or database deployment configuration without owner approval.
7. Avoid database or file migrations unless the owner explicitly approves them.
8. Run the relevant backend tests and frontend build after changes.
9. Report exactly which files changed and the verification results.
10. Update `PROJECT_MEMORY.md` after meaningful implementation changes, including pending-task status changes.

## Documentation rules

- Keep historical information separate from current verified implementation.
- Do not mark a task complete without evidence.
- Use actual file paths, route names, function names, and package scripts.
- Never include actual credentials.
- Maintain the pending-task checklist in `PROJECT_MEMORY.md`.

## When to stop and ask

Stop and ask the owner for clarification if:
- A task conflicts with these rules.
- A change would require revealing or editing an existing `.env` file.
- A change would affect production, secrets, database data, or user identity.
- The actual implementation differs significantly from the documented understanding.
- A major refactor is required and was not explicitly requested.
