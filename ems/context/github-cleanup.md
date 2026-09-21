# GitHub flow — stackedu-prod

This is a live product. `main` is production. Nothing goes onto `main` except through a pull request.

## The two branches

- `development` — where you work. Docs, context, and the design system live here.
- `main` — the live site. Code gets here only after a pull request and a review.

## What “PR required” means

You cannot push straight to `main` from your laptop. You open a pull request from `development` to `main`, CodeRabbit reviews it, then it can be merged.

A “bypass” would be a secret exception: a person or robot allowed to ignore that rule and write to production anyway. We are not giving anyone that exception. A live product should not have a backdoor.

## Why a GitHub Action must not write to `main`

GitHub Actions is a robot in the cloud. Your organisation does not let that robot skip branch rules. That is the right call for production: the robot must not be able to change the live branch on its own.

So the cleanup robot does not push to `main`. If a merge accidentally copies docs/context/design onto `main`, the robot opens a pull request to take them off. That cleanup PR still needs a review, the same as any other production change.

## Daily flow

1. Work and push on `development`.
2. Open a pull request: `development` → `main`.
3. Wait for CodeRabbit to review and approve.
4. Merge with a **merge commit** (not squash, not rebase). Do not delete `development`.
5. If docs/context/design landed on `main`, merge the small cleanup PR the robot opens.

Track new files under the development-only paths with `git add -f`.

## Production settings (locked)

- Pull request required before anything reaches `main`
- One approving review required (CodeRabbit)
- New commits dismiss old approvals
- Review comments do not block merge (CodeRabbit nits can stay open)
- Force-push to `main` blocked
- Deleting `main` blocked
- Only merge commits (squash and rebase are off, so `development` is not rewritten or deleted)
- Auto-delete of the head branch is off (so merging does not delete `development`)

## What stays off `main`

- `docs/`
- `ems/docs/` (user guides still publish from `development` via GitHub Pages)
- `ems/context/`
- `ems/design_system/`
- `ems/EMS-master-context.md`
- `stackedu-app-frontend-design/`
- `code-standards.md` (now `ems/context/code-standards.md`)

`.gitignore` lists those paths. On `development` they are still tracked with `git add -f`. `.vercelignore` lists them so they cannot ship to the live website even if they briefly appear on `main`.
