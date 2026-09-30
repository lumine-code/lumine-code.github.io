# Performance

If Lumine feels slow to start or sluggish while editing, these steps narrow down the cause.

## Slow startup

Run **`timecop:view`** (the bundled `timecop` package). It breaks down where time goes while Lumine loads — how long the window, packages, and themes each take to activate. A single package dominating the startup budget is usually the problem; disable it (**Settings → Packages**) and measure again.

## Sluggish editing

Compare the same short edit in the same file and at the same cursor position with its usual grammar and with **Plain Text** selected in the grammar selector. Undo each edit before the next trial. A substantial difference points to the grammar or packages that process that language.

Note whether characters appear late while you type or the editor freezes after a pause, when symbols and lint results may refresh. Include both phases in a performance recording. When reporting the slowdown, include the file size, line count, selected grammar name, cursor location, and steps that reproduce it.

- Start with the [safe-mode package test](common-issues.md#is-it-a-package).
- Record the slowdown in the developer tools' **Performance** tab; see [Developer tools](developer-tools.md).

## Large files

For a large generated file, repeat the typing comparison at the end of the file as well as where you first noticed the delay. Different cursor locations can expose different costs, so record which location you tested.

Very large files stress any editor. Turning off expensive per-line features for those files — soft wrap, some decorations, and heavy packages — helps. You can apply lighter settings to specific languages via [Scoped settings](../customizing-lumine/language-settings.md).

## Graphics issues

Rendering glitches or high GPU usage can come from hardware-accelerated drawing. If you suspect the GPU, the developer tools and Electron logging enabled with `--enable-electron-logging` can help confirm it before you adjust graphics settings.
