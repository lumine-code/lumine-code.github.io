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

## Opening on github.com

The bundled **`open-on-github`** package opens the current file or repository on
github.com. It can open the file (`open-on-github:file`), its blame or history,
the repository, its issues or pull requests, the branch compare page, and can
copy a github.com URL for the current file and selected lines
(`open-on-github:copy-url`).

## Going further

For richer workflows (staging, committing, branch management), install a
community Git package — see
[The package system](../packages-and-themes/package-system.md).
