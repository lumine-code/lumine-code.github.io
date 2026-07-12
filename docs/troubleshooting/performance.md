# Performance

If Lumine feels slow to start or sluggish while editing, these steps narrow down
the cause.

## Slow startup

Run **`timecop:view`** (the bundled `timecop` package). It breaks down where time
goes while Lumine loads — how long the window, packages, and themes each take to
activate. A single package dominating the startup budget is usually the problem;
disable it (**Settings → Packages**) and measure again.

## Sluggish editing

- **Test in safe mode.** `lumine --safe` starts without your packages. If editing
  is smooth there, a package is the cause — re-enable them in batches to find it.
  See [Common issues](common-issues.md).
- **Profile it.** Open the developer tools (`window:toggle-dev-tools`) and use the
  **Performance** tab to record while you reproduce the slowness. The recording
  shows which code is consuming the time.

## Large files

Very large files stress any editor. Turning off expensive per-line features for
those files — soft wrap, some decorations, and heavy packages — helps. You can
apply lighter settings to specific languages via
[Language-specific settings](../customizing-lumine/language-settings.md).

## Graphics issues

Rendering glitches or high GPU usage can come from hardware-accelerated drawing.
If you suspect the GPU, the developer tools and Electron's logging
(`--enable-electron-logging`) can help confirm it before you adjust graphics
settings.

## Deprecated calls

Packages using outdated APIs can drag on performance and stability. Check
**`deprecation-cop:view`** for deprecated calls made by your installed packages,
and update the offenders.
