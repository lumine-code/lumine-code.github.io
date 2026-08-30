# Version control

Lumine has built-in repository support and bundles `git-diff`; additional Git interfaces are optional packages.

## Diff markers in the gutter

The **`git-diff`** package marks lines in the editor gutter that have been added, edited, or deleted since the last commit. You can:

- move between changes with `git-diff:move-to-next-diff` and `git-diff:move-to-previous-diff`, and
- open a searchable list of every change in the file with `git-diff:toggle-diff-list`.

The markers can be shown as colored icons or colored gutter marks — choose in the package's settings.

## Reverting changes

The editor can revert an uncommitted change back to what is committed: `editor:checkout-head-revision` restores the block at the cursor to its `HEAD` revision.

## Status indicators

The tree view and tabs color file names by Git status. `git:colorize-toggle` switches the coloring for the current window. The bundled `language-git` grammar highlights Git files such as commit messages and rebase todo lists.

## The repository, branch, and worktree tiles

Install **`git-center`** to show the active repository, working-tree counts, and branch in the status bar. Its filterable pickers are also available through `git-center:select-repository` and `git-center:select-branch`.

The active repository normally follows whatever you are editing. `git-center:toggle-lock` pins it in place so it stops following, and the repository picker's `Auto` row hands it back.

### Worktrees

A Git worktree is another checkout of the repository. `git-center:select-worktree` lists worktrees and opens one in this window; its actions can open one elsewhere, create, move, lock, unlock, or remove it. The branch picker marks branches checked out in another worktree and offers to open that checkout.

## Opening on your Git host

The **`open-repository`** package opens the current file or repository on its Git host's website. Install it from the Install pane in **Settings**, or with `lumine --install lumine-code/open-repository`. It supports GitHub, GitLab, and Bitbucket (and falls back to GitHub-style URLs for other hosts). Run `open-repository:file` to open the file, its blame or history, the repository, its issues or pull/merge requests, or the branch compare page; run `open-repository:copy-url` to copy a URL for the current file and selected lines.

## Going further

For richer workflows, install these `lumine-code` packages from the Install tab (see [The package system](../packages-and-themes/package-system.md)):

- **[git-command](https://github.com/lumine-code/git-command)** — searchable modal workflows for staging, commits, branches, remotes, history, and stashes.
- **[git-panel](https://github.com/lumine-code/git-panel)** — a full panel for changes, commits, branches, remotes, diffs, and conflicts.
- **[github-panel](https://github.com/lumine-code/github-panel)** — pull requests, reviews, issues, and repository publishing on top of `git-panel`.

Type `lumine-code/git-command`, `lumine-code/git-panel`, or `lumine-code/github-panel` directly into the Install tab's search box to find them.
