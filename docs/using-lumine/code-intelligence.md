# Code intelligence

A working [language-server setup](language-servers.md#installation) uses `ide-client` as a protocol hub that exposes editor services without rendering every feature itself. Install only the UI packages for the features you want; other providers can supply the same services without a language server.

| Feature                                   | Package           |
| ----------------------------------------- | ----------------- |
| Documentation tooltips and signature help | `hover`           |
| Symbol outline of the active file         | `outline-view`    |
| Code actions and quick fixes              | `intentions`      |
| Rename a symbol across the project        | `refactor`        |
| Formatting, on demand or on save          | `code-format`     |
| References to the symbol under the cursor | `find-references` |
| Callers, callees, supertypes and subtypes | `hierarchy-view`  |
| Actionable links above the code           | `code-lens`       |
| Inferred types and parameter names inline | `inlay-hints`     |
| Semantic highlighting over the grammar    | `semantic-tokens` |

Every package in the table is optional and available under **Settings → Install**.

## Hover and signature help

`hover` shows provider documentation, types, signatures, and linter messages at the pointer or cursor. Use `hover:toggle` at the cursor, `hover:toggle-signature-help` while entering arguments, and `hover:dismiss` to close either overlay. Pointer and cursor delays are configurable. Scrolling stays inside either overlay by default; enable `hover.scrollChaining` to pass wheel events to the editor when the overlay cannot scroll further.

Python doctest examples supplied by `ide-basedpyright` use Python syntax highlighting in hover documentation, with `>>>` prompts, `...` continuations, and expected output preserved. When several servers contribute to a hover, each example keeps its originating server's rendering. [Autocomplete documentation](autocomplete.md#documentation-and-detail) uses the same rendering.

## Outline

`outline-view` lists the active file's symbols as a collapsible dock tree and follows the cursor. Use `outline-view:toggle` to show or hide it and `outline-view:reveal-in-outline-view` to reveal the current symbol. A language server can provide the tree directly; otherwise the package can use an installed `symbol` hub and its providers.

## Code actions and quick fixes

`intentions` combines provider code actions and linter fixes. Run `intentions:show` (`Alt+Enter` by default), choose with the arrow keys, confirm with Enter, or close with Escape.

## Rename

`refactor:rename` (`F2` by default) asks a provider to rename the symbol under the cursor across affected files. The edits are applied transactionally, with one undo step per buffer and rollback if any file fails.

## References

`find-references` highlights references in visible editors and lists them by file with `find-references:show-panel`; `find-references:highlight` refreshes the inline highlights. Install `marker` and a compatible overview map to add scrollbar or minimap markers.

Moving the cursor keeps the previous highlights visible while the next lookup is pending, so navigating within a name does not make its references blink. The latest result replaces them, and an empty result clears them. Buffer edits clear old highlights immediately before a new lookup.

## Call and type hierarchies

`hierarchy-view:incoming-calls` and `hierarchy-view:outgoing-calls` show callers and callees; `hierarchy-view:supertypes` and `hierarchy-view:subtypes` show inheritance. Availability depends on the active server, and expanding an entry requests the next level.

## Formatting

`code-format:format-code` formats the selection or, when none exists, the whole file. **Format On Save** and **Format On Type** are opt-in scoped settings. The hub owns the save hook, chooses one capable provider, and discards cancelled or outdated results. Install `prettier` to add the Prettier engine and select it as the default formatter for the desired languages. Language-server formatting uses the same hub.

```json
{
  ".source.python": {
    "code-format": {
      "defaultProvider": "ide-client",
      "formatOnSave": true
    }
  }
}
```

The hub also owns save glob filters, session-only observed-file opt-ins and status-bar indicators. Provider eligibility checks still apply. `prettier:format` and `ide-client:format` explicitly choose their engine through the hub; Prettier project commands format files on disk.

## Code lens

`code-lens` renders provider actions above the lines they describe. It is enabled after installation; use `code-lens:toggle`, `code-lens:refresh`, or the per-language **Enabled** setting.

## Inlay hints

`inlay-hints` displays provider-supplied type and parameter labels without changing the buffer. It is enabled after installation; use `inlay-hints:toggle`, `inlay-hints:refresh`, or the per-language **Enabled** setting.

Labels follow edits and refresh as scrolling, folding, resizing or font changes expose different rows. Multiple labels at the same position appear together, while labels before the last character and after the line stay separate. Refresh reports when hints are disabled or no provider serves the file.

## Semantic tokens

`semantic-tokens` layers a server's identifier classifications over grammar highlighting, leaving unclassified text unchanged. It is enabled after installation; use `semantic-tokens:toggle`, `semantic-tokens:refresh`, or the per-language **Enabled** setting.

It needs a backend that supports semantic tokens. Highlighting follows edits and file renames. Large files cache the full classification and decorate only the rows near the view, so scrolling applies their colors before the next paint without another server request. A backend that only supplies ranges refreshes the visible rows after scrolling, folding or resizing settles. Deprecated identifiers keep their strike while linter underlines remain visible on the same text.
