# Finding and replacing

Search in Lumine is handled by the bundled **`search-panel`** package, which covers both the active editor (buffer search) and the whole project.

## Buffer search

Open the find panel with `search-panel:toggle` (or `search-panel:show`). As you type, matches are highlighted; move between them with `search-panel:find-next` and `search-panel:find-previous`, or highlight every match with `search-panel:find-all`.

To replace, open the panel focused on the replace field with `search-panel:show-replace`, then use `search-panel:replace-next`, `search-panel:replace-current`, or `search-panel:replace-all`. Replacements are applied in place without refreshing the whole buffer.

### Search options

While the panel is open you can toggle:

- **Regular expression** — `search-panel:toggle-regex-option`
- **Case sensitivity** — `search-panel:toggle-case-option`
- **Whole word** — `search-panel:toggle-whole-word-option`
- **Within selection** — `search-panel:toggle-selection-option`

You can also seed the fields from the editor: `search-panel:use-selection-as-find-pattern` and `search-panel:use-selection-as-replace-pattern`.

## Selecting matches to edit them together

Instead of stepping through matches, you can turn them into selections and edit them all at once: `search-panel:select-next`, `search-panel:select-all`, `search-panel:select-skip`, and `search-panel:select-undo` (available in a non-mini editor). This pairs well with [multiple selections](selections.md).

## Project search and replace

Search across every file in the project with `search-panel:project-toggle` (or `search-panel:project-show`). Project search uses **ripgrep** where available and falls back to a built-in scanner. Replace across all results with `search-panel:project-replace-all`. To scope a search to one folder, select it in the tree view and run `search-panel:project-show-in-current-directory`.
