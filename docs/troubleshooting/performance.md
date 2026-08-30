# Performance

If Lumine feels slow to start or sluggish while editing, these steps narrow down the cause.

## Slow startup

Run **`timecop:view`** (the bundled `timecop` package). It breaks down where time goes while Lumine loads — how long the window, packages, and themes each take to activate. A single package dominating the startup budget is usually the problem; disable it (**Settings → Packages**) and measure again.

## Sluggish editing

- Start with the [safe-mode package test](common-issues.md#is-it-a-package).
- Record the slowdown in the developer tools' **Performance** tab; see [Developer tools](developer-tools.md).

## Large files

Very large files stress any editor. Turning off expensive per-line features for those files — soft wrap, some decorations, and heavy packages — helps. You can apply lighter settings to specific languages via [Scoped settings](../customizing-lumine/language-settings.md).

## Graphics issues

Rendering glitches or high GPU usage can come from hardware-accelerated drawing. If you suspect the GPU, the developer tools and Electron logging enabled with `--enable-electron-logging` can help confirm it before you adjust graphics settings.
