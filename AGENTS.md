# Launderia agent guidance

## Project context

- The Git repository is this directory; the application and its npm commands are in `launderia/`.
- The app uses Angular 22, Ionic 9, Capacitor 8, TypeScript, and SCSS. Keep these existing patterns.
- Main screens and behavior currently live in `launderia/src/app/home/home.page.{ts,html,scss}`.
- Shared styles are in `launderia/src/global.scss` and `launderia/src/theme/variables.scss`.
- Tests use Angular's unit-test builder with Vitest and jsdom. Lint uses angular-eslint.

## Select skills efficiently

All 78 skills from the supplied collection are installed globally in `~/.agents/skills/`.
Installation records, including source commits, are in `~/.codex/skill-collections/codex-skills/sources.json`.

Choose the smallest set that fully covers the current task. Read each selected `SKILL.md` before using it.
Do not load the whole collection, run every workflow, or combine skills merely because they overlap.
Explicit user choices take priority. State the selected skills and their purpose in one short line.

| Task | Preferred selection |
| --- | --- |
| Small, clear change | `ponytail`; add `surgical-patch` when regression risk warrants it |
| Bug or failing check | `systematic-debugging`, then `test-driven-development` for meaningful regression coverage |
| Ambiguous investigation | `investigate-first`; use `caveman-explore` only for broad orientation or after a focused search fails |
| New behavior or substantial feature | `brainstorming`, then `writing-plans` when multiple steps need coordination, then `test-driven-development` |
| Executing an agreed written plan | `executing-plans` |
| Refactor | `safe-refactor`; add `investigate-first` only when ownership or behavior is unclear |
| Migration | `migration` |
| New UI or substantial visual redesign | `frontend-design` as the lead; consult `ui-ux-pro-max` for specific tokens, accessibility, or Angular guidance |
| Existing UI critique or polish | `impeccable` as the lead; load only the relevant command reference |
| Mobile layout or touch behavior | `mobile-native` |
| Long content, empty states, or UI robustness | `break-ui` |
| Motion | `emil-design-eng` for direction; then `animate` for new motion or `review-animations` for existing motion |
| Reviewing a change | `ponytail-review`; use `ponytail-audit` only for a repository-wide audit |
| Understanding a large or unfamiliar codebase | `understand`, then only the relevant `understand-*` skill; skip graph generation for questions answerable from a few files |
| Completion or validation-only work | `verification-before-completion`; use `verify-and-stop` to keep validation within scope |

Use one lead design skill per task. `design-taste-frontend` is available as an alternative when its art-direction workflow suits the brief or the user requests it; its folder is `~/.agents/skills/taste-skill/`.
Do not combine competing design systems. Preserve Launderia's existing brand, content, routes, forms, and behavior unless the request changes them.
Use Ionic components and existing dependencies before considering another UI library. React, Expo, Swift, and shadcn-specific skills do not fit this app's implementation stack.

Keep normal, clear prose. Use Caveman compression modes, `ultracave`, or `megacave` only when explicitly requested.
Installing a skill does not authorize enabling hooks, changing global settings, connecting external services, or uploading project data.
Use parallel-agent workflows only when the user requests delegation or the selected task workflow explicitly requires it.

## Working rules

1. Read the relevant code, Git status, and recent history before editing. Start with focused searches.
2. For substantial changes, state the intended scope and verification first. Resolve material ambiguity before dependent work; continue routine authorized work without repeated confirmation.
3. Use a `codex/` branch or an isolated worktree for feature work. Preserve existing user changes.
4. Make the smallest complete change. Avoid unrelated cleanup, framework migrations, speculative features, and unnecessary dependencies.
5. Add regression tests for meaningful behavior changes. Documentation-only or trivial edits do not need implementation-mirroring tests.
6. Review the final diff and verify the claims you will report. Run applicable checks and distinguish failures from checks that could not run.
7. Do not commit, push, merge, delete user files, or rewrite history without the required user authorization.

## Verification

Run application commands from `launderia/`, not the repository root:

```text
npm run lint
npm test -- --watch=false
npm run build
```

On Windows, use `npm.cmd` if PowerShell blocks `npm.ps1`.
For code or configuration changes, run the relevant checks above. For UI changes, also inspect desktop and phone layouts and exercise the affected interactions.
The production build enforces style budgets; report failures rather than raising limits to conceal them.
For guidance-only changes, verify referenced paths, installed skill names, and `git diff --check`; app checks are unnecessary unless app files changed.
Report the actual checks and results, any remaining limitation, and the relevant skill choices concisely.
