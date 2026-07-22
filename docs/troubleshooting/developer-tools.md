# Developer tools

Because Lumine is built on web technology, it ships the same developer tools you use in a browser. They are the best window into what the editor is actually doing.

## Opening them

Run `window:toggle-dev-tools` to open (or close) the developer tools for the current window.

## The console

The **Console** tab shows log messages, warnings, and errors. When a package throws, the error and its stack trace appear here — usually pointing straight at the file and line responsible. If you are reporting a bug, the console output is the most useful thing to include.

You can also poke at the editor live from the console: the global `atom` object is available, so you can inspect state or try API calls interactively.

## The inspector

The **Elements** inspector lets you hover over any part of the interface to see its HTML and CSS. This is how you find the right selector for a [style tweak](../customizing-lumine/style-tweaks.md) or understand why something looks the way it does.

## Errors surfaced in the editor

Uncaught errors are also surfaced by the bundled `notifications` package as a dismissable notification with a stack trace and a link to report it — so you do not have to keep the console open to notice something went wrong.
