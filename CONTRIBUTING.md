# Git Workflow — Read This Before You Push

This is the required workflow for everyone on the team. Follow it every time — it avoids the rejected-push and lost-work issues we've already hit once.

## The Golden Rule

**Never edit files directly on GitHub's website.** Always edit locally, commit, and push through git. Web edits create commits nobody else has locally, which causes conflicts and rejected pushes.

## Before You Start Any New Work

Every single time you sit down to code — even if you worked on this yesterday — do this first:

```bash
git checkout main
git pull origin main
```

This brings your local `main` up to date with whatever the team has already merged. Skipping this step is the #1 cause of push errors.

## Create a Branch for Your Task

Never commit directly on `main`. Create a branch named after what you're doing:

```bash
git checkout -b feature/short-task-name
```

Examples: `feature/admin-login`, `feature/frontend-dashboard`, `feature/comments-section`

## Do Your Work, Then Commit

```bash
git add .
git commit -m "Add category filter to admin dashboard"
```

### Commit Message Rules

Write commit messages that actually describe what changed, in plain English. A teammate (or the lecturer checking commit history) should understand what happened without opening the diff.

**Good:**
- `Add login validation for empty email field`
- `Fix broken image path on artwork upload page`
- `Style admin dashboard sidebar with new color scheme`

**Not acceptable:**
- `update`
- `fix`
- `asdasd`
- `final final v2`
- `idk`

If your change does more than one unrelated thing, split it into separate commits instead of writing one vague message covering everything.

## Push Your Branch

```bash
git push origin feature/short-task-name
```

This pushes to your own branch — it will never conflict with `main` or anyone else's work, since it's a separate line of history.

## Open a Pull Request

1. Go to the repo on GitHub
2. Click **Compare & pull request** on your branch
3. Write a short description of what the PR does
4. Tag a teammate to review if possible
5. Once it looks good, merge it into `main`

## If GitHub Says There's a Conflict

This means someone else changed the same lines you did. Do this:

```bash
git checkout main
git pull origin main
git checkout feature/short-task-name
git merge main
```

Git will mark the conflicting section in the file like this:

```
<<<<<<< HEAD
your version
=======
their version
>>>>>>> main
```

Open the file, decide which version (or combination) is correct, delete the `<<<<<<<`, `=======`, `>>>>>>>` lines, save, then:

```bash
git add .
git commit -m "Resolve merge conflict in dashboard.php"
git push origin feature/short-task-name
```

## Quick Reference

| Situation | Command |
|---|---|
| Start of every session | `git pull origin main` |
| New task | `git checkout -b feature/name` |
| Save progress | `git add .` then `git commit -m "..."` |
| Share your branch | `git push origin feature/name` |
| Merge conflict appeared | See conflict section above |

## If You Get Stuck

Don't guess or run random commands you don't understand — ask in the group chat first. Some git commands can permanently discard work, so when in doubt, stop and ask.
