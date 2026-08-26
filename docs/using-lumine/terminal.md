# Terminal

Lumine's **`terminal`** package is a terminal emulator built into the workspace, so you can run a real shell without leaving the editor. Install it from the Install pane in **Settings**, or with `lumine --install lumine-code/terminal`.

## Opening a terminal

`terminal:open` opens a new terminal in the default location. To choose where it goes, use `terminal:open-center`, `terminal:open-bottom-dock`, `terminal:open-left-dock`, `terminal:open-right-dock`, or split the active pane with `terminal:open-split-up` / `-down` / `-left` / `-right`. `terminal:focus` focuses the active terminal, or creates one if none is open. Cycle between open terminals with `terminal:focus-next` and `terminal:focus-previous`.

The default `ctrl-backquote` binding focuses the active terminal, creates one if needed, and returns focus to the editor when the terminal already has it. `backquote` names the physical key rather than the character printed by the active keyboard layout. Terminal chords begin with `ctrl-shift-backquote`: press `n` for a new terminal, an arrow for a split, `b` / `l` / `r` for a dock, `x` / `i` in an editor to run or insert its selection, and `w` / `s` in a terminal to close or restart it.

A focused terminal handles most other keystrokes itself, so use `terminal:unfocus` — bound to the same `ctrl-backquote` shortcut — before another Lumine keybinding will fire.

## Running editor text

`terminal:run-selected-text` sends the editor's current selection to the active terminal and runs it; `terminal:insert-selected-text` inserts it without pressing Enter.

## Finding in scrollback

`terminal:find` opens an in-terminal find palette, with `terminal:find-next` and `terminal:find-previous` to step through matches, and `terminal:set-selection-as-find-pattern` to search for the currently selected text.

The terminal keeps 10,000 lines of scrollback by default; adjust **Scrollback** in the package settings.

## Images

The terminal draws images written with SIXEL or iTerm's inline image protocol in place, so `imgcat`, `chafa` and matplotlib's sixel backend render in the terminal instead of opening a window. Turn it off under **Inline Images**, and cap how much memory each terminal spends on decoded images under **Inline Image Memory Limit** — past the cap the oldest images are dropped and leave a placeholder in the scrollback.

Pasting an image goes the other way. A clipboard holding an image has no text to paste, so instead of writing nothing the terminal hands the paste to Lumine's paste providers. With the [`image-paste`](https://github.com/lumine-code/image-paste) package installed, the normal paste command — or `terminal:paste-image` — asks where to save the image, writes it relative to the terminal's working directory, and types the saved file's absolute path onto the input line. Nothing is submitted for you, and the path is quoted only if it contains a space.

That is how you hand a screenshot to a command-line program, including the coding agents that accept an image by path. Agents that read the clipboard themselves keep working too: the terminal claims no bare `alt-` letter, so a binding like `alt-v` reaches the program rather than Lumine.

## Shell integration

When your shell emits OSC 133 shell-integration sequences, the terminal marks each command's prompt in the left gutter — tinted red when the command exited non-zero — and `terminal:previous-command` / `terminal:next-command` jump between them. This is off until your shell sources the matching script from the package's `shell-integration/` folder:

- **bash** — in `~/.bashrc`: `source <package>/shell-integration/lumine.bash`
- **zsh** — in `~/.zshrc`: `source <package>/shell-integration/lumine.zsh`
- **PowerShell** — in your `$PROFILE`: `. <package>/shell-integration/lumine.ps1`

Toggle the feature under **Shell Integration** in the package's settings.

## Appearance

The terminal derives its colors from the active UI theme by default — it sits in a dock, so it takes panel colors and blends with the surrounding chrome. It draws with a WebGL renderer that falls back to xterm's DOM renderer. Override any color by redefining its CSS custom property (for example `--terminal-color-red`) in your `styles.css`. Coding-font ligatures such as `==` and `>=` can be enabled in settings.
