# GitHub flow — stackedu-prod

Keep exactly two branches:

- `development` — working branch. Local work is pushed here. Context, docs, and the design system live only on this branch.
- `main` — production. Code reaches `main` only through a pull request that CodeRabbit has reviewed.

## Flow

1. Work locally on `development`.
2. Push from this environment to `origin/development`.
3. Open a pull request: `development` → `main`.
4. CodeRabbit reviews the PR (it ignores docs/context/design paths).
5. After CodeRabbit approval, merge the PR.
6. A GitHub Action then strips docs/context/design from `main` if they came along with the merge. Prefer the **Merge development into main** Action (Actions tab → Run workflow) so those paths never land on `main`.
7. Do not push local work straight to `main`.

Track new files under the development-only paths with `git add -f` (they are listed in `.gitignore` so they cannot land on `main` by accident).

## Branch cleanup

The extra remote branches were Dependabot npm/yarn bump PRs, not feature branches. Those PRs are closed and the branches deleted. Dependabot security auto-updates are off. If Dependabot version updates recreate branches, turn them off in GitHub → Settings → Code security.

## What stays off `main`

These paths exist on `development` only. They must not appear in `main`:

- `docs/` (planning / local docs)
- `ems/docs/` (EMS docs and user-guide sources; GitHub Pages deploys these from `development`)
- `ems/context/` (internal context, including this file)
- `ems/design_system/` (UI kit reference)
- `ems/EMS-master-context.md`
- `stackedu-app-frontend-design/` (design-system reference)
- `code-standards.md` (moved to `ems/context/code-standards.md`)

`.gitignore` lists those paths on both branches. On `development` they are still tracked with `git add -f`. `.vercelignore` lists the same paths so a brief merge onto `main` cannot ship them to production.
