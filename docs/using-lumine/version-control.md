# Version control

Lumine has built-in Git awareness. Rather than a single large integration, it
bundles focused packages for the most common needs.

## Diff markers in the gutter

The bundled **`git-diff`** package marks lines in the editor gutter that have
been added, edited, or deleted since the last commit. You can:

- move between changes with `git-diff:move-to-next-diff` and
  `git-diff:move-to-previous-diff`, and
- open a searchable list of every change in the file with
  `git-diff:toggle-diff-list`.

The markers can be shown as colored icons or colored gutter marks — choose in the
package's settings.

## Reverting changes

The editor can revert an uncommitted change back to what is committed:
`editor:checkout-head-revision` restores the block at the cursor to its
`HEAD` revision.

## Status indicators

Git status flows into other parts of the interface — for example the tree view
and status bar reflect which files are new or modified — using the editor's
built-in repository support and the bundled `language-git` grammar for Git files
(commit messages, rebase todo lists, and so on).

## Opening on your Git host

The bundled **`open-repository`** package opens the current file or repository on
its Git host's website. It supports GitHub, GitLab, and Bitbucket (and falls back
to GitHub-style URLs for other hosts). It can open the file
(`open-repository:file`), its blame or history, the repository, its issues or
pull/merge requests, the branch compare page, and can copy a URL for the current
file and selected lines (`open-repository:copy-url`).

## Going further

For richer workflows, install these `lumine-code` packages from the Install
tab (see [The package system](../packages-and-themes/package-system.md)):

- **[git-panel](https://github.com/lumine-code/git-panel)**: a full Git panel —
  stage, unstage, and discard changes per file, hunk, or line; compose commits
  and manage branches; fetch, pull, push, and force-push; view diffs with
  hunk/line/word-level highlighting; resolve merge conflicts in the editor;
  and initialize or clone repositories.
- **[github-panel](https://github.com/lumine-code/github-panel)**: adds
  GitHub-specific features on top of `git-panel` — browse and review pull
  requests (with Overview, Build Status, Commits, and Files Changed tabs),
  see review comments as inline decorations, open issues or pull requests by
  URL, and create or publish GitHub repositories.

Type `lumine-code/git-panel` or `lumine-code/github-panel` directly into the
Install tab's search box to find them.
