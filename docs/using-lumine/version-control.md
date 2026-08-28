# Version control

Lumine has built-in Git awareness. Rather than a single large integration, it bundles focused packages for the most common needs.

## Diff markers in the gutter

The **`git-diff`** package marks lines in the editor gutter that have been added, edited, or deleted since the last commit. You can:

- move between changes with `git-diff:move-to-next-diff` and `git-diff:move-to-previous-diff`, and
- open a searchable list of every change in the file with `git-diff:toggle-diff-list`.

The markers can be shown as colored icons or colored gutter marks — choose in the package's settings.

## Reverting changes

The editor can revert an uncommitted change back to what is committed: `editor:checkout-head-revision` restores the block at the cursor to its `HEAD` revision.

## Status indicators

Git status flows into other parts of the interface — for example the tree view and status bar reflect which files are new or modified — using the editor's built-in repository support and the bundled `language-git` grammar for Git files (commit messages, rebase todo lists, and so on).

File names in the tree view and on tabs are colored by their Git status (green for added, orange for modified, faded for ignored, and so on). The `git:colorize-toggle` command switches this coloring off or back on for the current window only — handy when you want a calmer view without changing any settings or affecting other windows.

## The repository, branch, and worktree tiles

The **`git-center`** package puts the window's active repository and its branch in the status bar. Both are buttons: clicking one opens a filterable picker, and each picker also has a command — `git-center:select-repository` and `git-center:select-branch`.

The active repository normally follows whatever you are editing. `git-center:toggle-lock` pins it in place so it stops following, and the repository picker's `Auto` row hands it back.

### Worktrees

A Git worktree is a second checkout of the same repository in its own folder, so you can have two branches open at once without stashing or switching. `git-center:select-worktree` lists every worktree of the active repository, with its branch, its working-tree counts, and whether it is locked or waiting to be pruned.

Confirming a worktree opens it in this window. The picker's actions list — press <kbd>Shift</kbd><kbd>F10</kbd> — has the rest: open it in a new window or alongside the current project, create a worktree on a new branch, and move, lock, unlock, or remove one. Removing runs unforced, so Git refuses to discard a worktree with uncommitted work; the failure offers to force it if that is what you meant.

Git allows a branch to be checked out in only one worktree at a time. The branch picker marks any branch that is open elsewhere with the name of the worktree holding it, and choosing that branch offers to open that worktree rather than attempting a checkout Git would refuse.

## Opening on your Git host

The **`open-repository`** package opens the current file or repository on its Git host's website. Install it from the Install pane in **Settings**, or with `lumine --install lumine-code/open-repository`. It supports GitHub, GitLab, and Bitbucket (and falls back to GitHub-style URLs for other hosts). It can open the file (`open-repository:file`), its blame or history, the repository, its issues or pull/merge requests, the branch compare page, and can copy a URL for the current file and selected lines (`open-repository:copy-url`).

## Going further

For richer workflows, install these `lumine-code` packages from the Install tab (see [The package system](../packages-and-themes/package-system.md)):

- **[git-command](https://github.com/lumine-code/git-command)**: a searchable select list in Lumine's modal pane zone for common Git workflows — stage and unstage changes; preview and compose commits; check out, merge, rebase, and cherry-pick; fetch, pull, push, and manage stashes; inspect status, diffs, history, and blame; or run arbitrary Git arguments.
- **[git-panel](https://github.com/lumine-code/git-panel)**: a full Git panel — stage, unstage, and discard changes per file, hunk, or line; compose commits and manage branches; fetch, pull, push, and force-push; view diffs with hunk/line/word-level highlighting; resolve merge conflicts in the editor; and initialize or clone repositories.
- **[github-panel](https://github.com/lumine-code/github-panel)**: adds GitHub-specific features on top of `git-panel` — browse and review pull requests (with Overview, Build Status, Commits, and Files Changed tabs), see review comments as inline decorations, open issues or pull requests by URL, and create or publish GitHub repositories.

Type `lumine-code/git-command`, `lumine-code/git-panel`, or `lumine-code/github-panel` directly into the Install tab's search box to find them.
