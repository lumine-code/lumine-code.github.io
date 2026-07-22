# Terminal

Lumine bundles the **`terminal`** package: a terminal emulator built into the workspace, so you can run a real shell without leaving the editor.

## Opening a terminal

`terminal:open` opens a new terminal in the default location. To choose where it goes, use `terminal:open-center`, `terminal:open-bottom-dock`, `terminal:open-left-dock`, `terminal:open-right-dock`, or split the active pane with `terminal:open-split-up` / `-down` / `-left` / `-right`. `terminal:focus` focuses the active terminal, or creates one if none is open. Cycle between open terminals with `terminal:focus-next` and `terminal:focus-previous`.

A focused terminal handles most keystrokes itself, so move focus out of it with `terminal:unfocus` before a Lumine keybinding will fire.

## Running editor text

`terminal:run-selected-text` sends the editor's current selection to the active terminal and runs it; `terminal:insert-selected-text` inserts it without pressing Enter.

## Finding in scrollback

`terminal:find` opens an in-terminal find palette, with `terminal:find-next` and `terminal:find-previous` to step through matches, and `terminal:set-selection-as-find-pattern` to search for the currently selected text.

## Shell integration

When your shell emits OSC 133 shell-integration sequences, the terminal marks each command's prompt in the left gutter — tinted red when the command exited non-zero — and `terminal:previous-command` / `terminal:next-command` jump between them. This is off until your shell sources the matching script from the package's `shell-integration/` folder:

- **bash** — in `~/.bashrc`: `source <package>/shell-integration/lumine.bash`
- **zsh** — in `~/.zshrc`: `source <package>/shell-integration/lumine.zsh`
- **PowerShell** — in your `$PROFILE`: `. <package>/shell-integration/lumine.ps1`

Toggle the feature under **Shell Integration** in the package's settings.

## Appearance

The terminal derives its colors from the active syntax theme by default, and draws with a WebGL renderer that falls back to canvas. Override any color by redefining its CSS custom property (for example `--terminal-color-red`) in your `styles.less`. Coding-font ligatures such as `==` and `>=` can be enabled in settings.
