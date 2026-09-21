# GitHub flow — stackedu-prod

Keep exactly two branches:

- `development` — working branch. Local work is pushed here. Context, docs, and the design system live only on this branch.
- `main` — production. Code reaches `main` only through a pull request that CodeRabbit has reviewed, then a filtered merge.

## Flow

1. Work locally on `development`.
2. Push from this environment to `origin/development`.
3. Open a pull request: `development` → `main`.
4. CodeRabbit reviews the PR.
5. After CodeRabbit approval, merge with the **Merge development into main** GitHub Action (Actions tab → Run workflow). Do not use GitHub’s Merge button — that would copy docs/context/design onto `main`.
6. `main` is what goes live. Do not push local work straight to `main`.

Track new files under the development-only paths with `git add -f` (they are listed in `.gitignore` so they cannot land on `main` by accident).

## Branch cleanup

The extra remote branches were Dependabot npm/yarn bump PRs, not feature branches. Close those PRs, delete the branches, and disable Dependabot version updates so they do not come back.

## What stays off `main`

These paths exist on `development` only. They must not appear in `main`:

- `docs/` (planning / local docs)
- `ems/docs/` (EMS docs and user-guide sources; GitHub Pages deploys these from `development`)
- `ems/context/` (internal context, including this file)
- `ems/design_system/` (UI kit reference)
- `ems/EMS-master-context.md`
- `stackedu-app-frontend-design/` (design-system reference)
- `code-standards.md` (moved to `ems/context/code-standards.md`)

`.gitignore` lists those paths on both branches. On `development` they are still tracked with `git add -f`.
