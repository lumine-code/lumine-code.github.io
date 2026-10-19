# First steps

Open a project folder and a file, then use the Command Palette to discover the editor's actions. Menus and the palette show the keybindings available on your platform.

## Find commands

Open the Command Palette from the menu or with `command-palette:toggle`. Type part of a command's name, choose a result and confirm. The empty query shows recently used commands. Toggle descriptions with `command-palette:toggle-descriptions` to include them in your search.

Open **Settings → Keybindings** to search by command or keystroke and see which package owns a binding. [Customization](../customization/personalizing-lumine.md#keybindings) explains how to change one.

## Open and navigate a project

Use the file menu to open a folder, then browse its files in the [tree view](https://github.com/lumine-code/tree-view#readme). The optional [file finder](https://github.com/lumine-code/fuzzy-files#readme) jumps to a file by name; [symbol tools](https://github.com/lumine-code/symbol#readme) navigate definitions and headings when a provider is available. The grammar selector in the status bar lets you check or change the active language.

Reopen projects from **File → Recent Projects**; install [Recent List](https://github.com/lumine-code/recent-list#readme) to search that history with **Browse All Recent Projects…**. For a saved project list, install [Project List](https://github.com/lumine-code/project-list#readme) and use **File → Projects → Saved Projects…**.

A single click can open a preview tab that the next file replaces. Double-click the file to keep its tab; editing or saving also makes a preview permanent. See [Workspace](../workspace/layout.md) for splits, docks and additional windows.

## Edit text

Save with `core:save`, save under another name with `core:save-as`, or save all editors with `window:save-all`. Undo, redo, cut, copy and paste use the usual editing commands.

Multiple selections let one edit affect several positions. Search the palette for selection commands, line duplication, indentation, comments and folding. These commands are available through menus or keybindings; the palette is the quickest way to find a less familiar one.

## Find and replace

Use Find to search the active file, or Find in Project to search across project files. Review matches before replacing them. Selecting matching text as multiple selections is useful when each occurrence needs the same edit.

## Add tools

Open **Settings → Install** to find languages and tools. Each package's card links to its documentation. Terminal, language servers, Jupyter and other optional workflows are explained by their packages; see [Packages and themes](../packages-and-themes/managing-packages.md).
