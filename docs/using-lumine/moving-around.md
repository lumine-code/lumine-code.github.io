# Moving around

Lumine gives you fine-grained control over cursor movement, from single characters to whole documents, plus a bundled line jumper and optional bookmarks.

## Moving the cursor

The `core:move-left`, `core:move-right`, `core:move-up`, and `core:move-down` commands move a single step. To move further in one action:

- **By word** — `editor:move-to-beginning-of-word` / `editor:move-to-end-of-word`.
- **By subword** (across camelCase and snake_case boundaries) — `editor:move-to-previous-subword-boundary` / `editor:move-to-next-subword-boundary`.
- **By line** — `editor:move-to-first-character-of-line`, `editor:move-to-end-of-line`, and `editor:move-to-end-of-screen-line` (which stops at the visible edge of a soft-wrapped line).
- **By page** — `core:page-up` / `core:page-down`.
- **To the document edges** — `core:move-to-top` / `core:move-to-bottom`.

## Scrolling

`editor:scroll-up` and `editor:scroll-down` scroll the view without moving the cursor; `editor:scroll-to-cursor` brings the cursor back into view.

## Jumping to a line

The bundled `go-to-line` package jumps straight to a line (and optionally a column) number. Open it and type a line number to go there.

## Bookmarks

Install `bookmarks` to mark lines and cycle between them. Its commands appear in the Command Palette and **Settings → Keybindings**.

## Next

- [Selections](selections.md) — extend movement into selections.
- [Navigating your project](navigating-your-project.md) — jump between files and symbols.
