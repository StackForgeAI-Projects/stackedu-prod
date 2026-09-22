# GitHub flow — stackedu-prod

This is a live product. `main` is production. Nothing goes onto `main` except through a pull request.

## The two branches

- `development` — where you work. Docs, context, and the design system live here.
- `main` — the live site. Code gets here only after a pull request.

A third name, `auto/strip-dev-only`, appears only while a cleanup pull request is open. That pull request takes docs and design off `main` after a production merge. It is not a place to do work. After you merge it, the next update to `main` deletes that branch.

## What “PR required” means

You cannot push straight to `main` from your laptop. You open a pull request from `development` to `main`. CodeRabbit reviews it. Then you merge it.

A “bypass” would be a secret exception: a person or robot allowed to ignore that rule and write to production anyway. We are not giving anyone that exception. A live product should not have a backdoor.

## Why a GitHub Action must not write to `main`

GitHub Actions is a robot in the cloud. Your organisation does not let that robot skip branch rules. That is the right call for production: the robot must not be able to change the live branch on its own.

So the cleanup robot does not push to `main`. If a merge accidentally copies docs/context/design onto `main`, the robot opens a pull request to take them off. That cleanup pull request waits for you to press Merge. It does not merge by itself.

## Daily flow

1. Work and push on `development`. That push does not update the live website.
2. If a pull request from `development` to `main` is already open, the push updates it. If the last one was merged, open a new pull request. The organisation does not let a GitHub Action open that pull request, so it is opened with your GitHub login.
3. Wait until the **CodeRabbit** check is green. GitHub blocks **Merge pull request** while that check is still running or has failed.
4. **You** press **Merge pull request**. GitHub must not merge by itself. Auto-merge is off.
5. That merge is the only thing that updates `main`. Vercel deploys the live site from `main` only, after the merge.
6. Use a **merge commit** (not squash, not rebase). Do not delete `development`.
7. If docs/context/design landed on `main`, the cleanup robot opens a pull request. You merge that one too, after its CodeRabbit check is green. It does not merge itself.

A green “deployed” line on a pull request is not the live site. Live Vercel deploys are the rows marked Production on `main`.

## What “1 commit ahead and 2 commits behind” means

**Ahead** means `development` has work that is not on `main` yet. That work belongs in a pull request.

**Behind** means `main` has merge commits that are not in `development`’s history. Those commits are created when you press Merge. They do not mean files are missing from `development`. After the next catch-up merge, the “behind” count goes back to zero. It can show up again the next time you merge to `main`.

## Work list — 22 Sep 2026

Mark each item DONE when it is finished. Do not reopen a DONE item.

1. DONE — Explain the Vercel preview failure. The log lines that list `.vercelignore` files are not the error. The web build command exited 1 because `at-risk.tsx` uses `CheckCircle2` without importing it. The same web build now completes.
2. DONE — Restore the `CheckCircle2` import so the academic at-risk empty state and the Vercel web build work. Risk-factor chips wrap inside the card on a phone.
3. DONE — CORS: require `NODE_ENV` and add localhost origins only when it is `development`.
4. DONE — Classroom recording job: bound `expiresAt` in SQL, and keep going if one institution fails.
5. DONE — Mute students by microphone source only.
6. DONE — File-too-large dialog: no ref write during render, no sync state reset in an effect.
7. DONE — Notifications: do not let an older full list undo a newer read; academic mark-all waits for every request.
8. DONE — Lecturer auto-record switch opens the confirm dialog itself. Turning it on and back off was checked in the browser.
9. DONE — Date-only strings stay on the local calendar day in date-time display.
10. DONE — Rename test `module` bindings so root lint does not fail.
11. DONE — Live classroom session poll does not write state inside `queryFn`.
12. DONE — Whiteboard poll ignores unversioned scenes and pauses when a live channel exists.
13. DONE — Build class detail only when auto-record needs the fallback.
14. DONE — Turn off GitHub auto-merge so `main` waits for your Merge click. `allow_auto_merge` is false. Pull request 10 has no auto-merge request.
15. DONE — E-library lifecycle stays the plain-English guide in `ems/docs/E-Library-Lifecycle.md`.
16. DONE — Relevant API tests passed: config, live classroom, course modules, role notifications, and provisioning. The web production build passed.
17. DONE — Live Vercel deploy waits for a manual merge to `main`. CodeRabbit is a required check, so Merge stays blocked until that review finishes. Pull-request builds are ignored; only a production deploy of `main` is built.
18. DONE — After pull request 11 was merged, the next `development` push had no open pull request. `development` is caught up with `main`’s merge commits, and a new pull request is open. The extra branch is only the docs cleanup.

Track new files under the development-only paths with `git add -f`.

## Production settings (locked)

- Pull request required before anything reaches `main`
- No required human/CodeRabbit Approve (you cannot approve your own PR)
- Review comments do not block merge
- Force-push to `main` blocked
- Deleting `main` blocked
- Only merge commits (squash and rebase are off, so `development` is not rewritten or deleted)
- Auto-delete of the head branch is off (so merging does not delete `development`)
- Auto-merge is off. A green review does not merge the pull request. You press **Merge pull request**.
- The CodeRabbit check is required. Merge stays blocked until that check is green.
- Vercel builds the live site only when `main` is updated. A pull request does not deploy the live site.

## What stays off `main`

- `docs/`
- `ems/docs/` (user guides still publish from `development` via GitHub Pages)
- `ems/context/`
- `ems/design_system/`
- `ems/EMS-master-context.md`
- `stackedu-app-frontend-design/`
- `code-standards.md` (now `ems/context/code-standards.md`)

`.gitignore` lists those paths. On `development` they are still tracked with `git add -f`. `.vercelignore` lists them so they cannot ship to the live website even if they briefly appear on `main`.
