# PDF view

Lumine's **`pdf-view`** package opens PDF files directly in the workspace, rendered with Mozilla's PDF.js. Install it from the Install pane in **Settings**, or with `lumine --install lumine-code/pdf-view`. Once installed, opening any `.pdf` file — from the tree view, a fuzzy finder, or a link — shows it in an editor pane.

## Moving around

A focused PDF handles its own keys. Step through the document with `pdf-view:next-page` / `pdf-view:previous-page` (also bound to `n` / `p` and `j` / `k`), jump to the ends with `pdf-view:first-page` / `pdf-view:last-page`, and scroll with the arrow keys or `pdf-view:page-up` / `pdf-view:page-down` (`space`, `shift-space` and `backspace`).

Zoom with `pdf-view:zoom-in` / `pdf-view:zoom-out` (also bound to `+` and `-`, which need no modifier — PDF.js zooms on Ctrl alone, so the bare keys are free), or `pdf-view:zoom-reset` to return to automatic zoom. `pdf-view:page-fit` (`f`) fits a whole page in the viewer and `pdf-view:page-width` (`w`) fits its width, while `pdf-view:page-actual` shows the size the page would print at. Rotate with `pdf-view:rotate-clockwise` / `pdf-view:rotate-counterclockwise`. Changing the zoom or the rotation clears any text you had selected.

`pdf-view:find` searches the document, with `pdf-view:find-next` and `pdf-view:find-previous` to step through matches. `pdf-view:toggle-sidebar` shows the thumbnail, outline, and attachment panes, and `pdf-view:presentation-mode` fills the screen.

## Auto-reload

The viewer watches the file on disk and reloads it when it changes, so a PDF re-rendered by an external tool refreshes in place. Toggle this per-viewer with `pdf-view:toggle-refreshing`, force a reload with `pdf-view:refresh`, or reload every open viewer with `pdf-view:reload-all`. The auto-reload delay and whether the viewer closes when its file is deleted are configurable in the package settings. A load that catches the file mid-write — restoring a window while a build is still running, say — retries by itself once the file settles.

## LaTeX and Typst

When a `latex-tools` or `typst-tools` package is installed, `pdf-view:compile` builds the PDF's `.tex` or `.typ` source, and `pdf-view:open-tex` opens that source alongside the PDF. Auto-reload pauses during a compile and resumes when the build finishes, so you never see a half-written file. For documents built with SyncTeX, right-clicking a location in the PDF jumps to the matching line in the source.

## Outline and scrollmap

The viewer publishes its document outline to a navigation panel, so you can browse and jump through headings while the active section stays highlighted as you scroll. When the scrollmap package is installed, outline markers are also drawn on the scrollbar; their depth and density are configurable in the package settings.

## Appearance

The viewer's chrome derives its colors from the active Lumine UI and syntax theme, and updates live when you switch themes. When opening a PDF you can pass options in the URI — a starting page, an initial zoom level, a named destination, or a sidebar state — following the [pdf.js viewer options](https://github.com/mozilla/pdf.js/wiki/Viewer-options).
