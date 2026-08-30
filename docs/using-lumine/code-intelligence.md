# Code intelligence

A working [language-server setup](language-servers.md#installation) exposes editor services. Install only the UI packages for the features you want; other providers can supply the same services without a language server.

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

`hover` shows provider documentation, types, signatures, and linter messages at the pointer or cursor. Use `hover:toggle` at the cursor, `hover:toggle-signature-help` while entering arguments, and `hover:dismiss` to close either overlay. Pointer and cursor delays are configurable.

## Outline

`outline-view` lists the active file's symbols as a collapsible dock tree and follows the cursor. Use `outline-view:toggle` to show or hide it and `outline-view:reveal-in-outline-view` to reveal the current symbol. A language server can provide the tree directly; otherwise the package can use an installed `symbol` hub and its providers.

## Code actions and quick fixes

`intentions` combines provider code actions and linter fixes. Run `intentions:show` (`Alt+Enter` by default), choose with the arrow keys, confirm with Enter, or close with Escape.

## Rename

`refactor:rename` (`F2` by default) asks a provider to rename the symbol under the cursor across affected files. The edits are applied transactionally, with one undo step per buffer and rollback if any file fails.

## References

`find-references` highlights references in visible editors and lists them by file with `find-references:show-panel`; `find-references:highlight` refreshes the inline highlights. Install `marker` and a compatible overview map to add scrollbar or minimap markers.

## Call and type hierarchies

`hierarchy-view:incoming-calls` and `hierarchy-view:outgoing-calls` show callers and callees; `hierarchy-view:supertypes` and `hierarchy-view:subtypes` show inheritance. Availability depends on the active server, and expanding an entry requests the next level.

## Formatting

`code-format:format-code` formats the selection or, when none exists, the whole file. **Format On Save** and **Format On Type** are opt-in scoped settings; enable at most one on-save formatter per language.

```json
{
  ".source.python": {
    "code-format": {
      "formatOnSave": true
    }
  }
}
```

## Code lens

`code-lens` renders provider actions above the lines they describe. It is enabled after installation; use `code-lens:toggle`, `code-lens:refresh`, or the per-language **Enabled** setting.

## Inlay hints

`inlay-hints` displays provider-supplied type and parameter labels without changing the buffer. It is enabled after installation; use `inlay-hints:toggle`, `inlay-hints:refresh`, or the per-language **Enabled** setting.

## Semantic tokens

`semantic-tokens` layers a server's identifier classifications over grammar highlighting, leaving unclassified text unchanged. It is enabled after installation; use `semantic-tokens:toggle`, `semantic-tokens:refresh`, or the per-language **Enabled** setting.
