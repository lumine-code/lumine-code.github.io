# Finding and replacing

Search in Lumine is handled by the bundled **`search-panel`** package, which covers both the active editor (buffer search) and the whole project.

## Buffer search

Open the find panel with `search-panel:toggle` (or `search-panel:show`). As you type, matches are highlighted; move between them with `search-panel:find-next` and `search-panel:find-previous`, or turn every match into a selection with `search-panel:find-all`.

To replace, open the panel focused on the replace field with `search-panel:show-replace`, then use `search-panel:replace-next`, `search-panel:replace-current`, or `search-panel:replace-all`. Replacements are applied in place without refreshing the whole buffer.

### Search options

While the panel is open you can toggle:

- **Regular expression** — `search-panel:toggle-regex-option`
- **Case sensitivity** — `search-panel:toggle-case-option`
- **Whole word** — `search-panel:toggle-whole-word-option`
- **Within selection** — `search-panel:toggle-selection-option`

You can also seed the fields from the editor: `search-panel:use-selection-as-find-pattern` and `search-panel:use-selection-as-replace-pattern`. With the **Autocomplete search** setting enabled, the find field offers word completions from your open buffers as you type.

## Selecting matches to edit them together

Outside the panel, `search-panel:select-next` and `search-panel:select-all` add cursors at occurrences of the editor's current selection; `search-panel:select-skip` skips one and `search-panel:select-undo` removes the last. See [multiple selections](selections.md).

## Project search and replace

Search across every file in the project with `search-panel:project-toggle` (or `search-panel:project-show`). Project search uses Lumine's bundled **ripgrep** searcher unless a package provides another one. Replace across all results with `search-panel:project-replace-all`; to search one folder, select it in the tree view and run `search-panel:project-show-in-current-directory`.

Project search and replace use the files saved on disk. Matches that exist only in an open editor's unsaved text are excluded. Project replacement writes each affected file and sends those same changes to any open text buffer, preserving unsaved edits elsewhere in the buffer without saving them automatically.

If a replacement overlaps different unsaved text, Lumine preserves the edited text and marks the buffer as conflicted; other replacements in that file still reach the buffer. Resolve the conflict before saving so that you can choose which content to keep. Undo in an open editor reverses its buffer changes only: it does not undo the project replacement already written to disk.
