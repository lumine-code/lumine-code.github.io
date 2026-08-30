# Launching Lumine

You can start an installed Lumine from your applications launcher or with the `lumine` command once it is on your `PATH`. For a source checkout, use `npm start -- [path ...]` from the repository instead.

## Opening files and folders

```sh
lumine .                 # open the current directory as a project
lumine path/to/file      # open a file
lumine file-a file-b     # open several paths
```

## Command-line options

Common options are:

| Option                                  | Description                                                                 |
| --------------------------------------- | --------------------------------------------------------------------------- |
| `-d`, `--dev`                           | Run in development mode.                                                    |
| `-n`, `--new-window`                    | Open a new window.                                                          |
| `-a`, `--add`                           | Open the given path as a new project in the last used window.               |
| `-w`, `--wait`                          | Wait for the window to close before returning (useful as a `$EDITOR`).      |
| `--safe`                                | Do not load packages from `~/.lumine/packages` or `~/.lumine/packages-dev`. |
| `-r <path>`, `--resource-path <path>`   | Use the given Lumine source directory in dev mode.                          |
| `--clear-window-state`                  | Delete all saved window/environment state.                                  |
| `--user-data-dir <path>`                | Use a custom Electron user-data directory.                                  |
| `--enable-electron-logging`             | Print low-level Electron logging.                                           |
| `-v`, `--version`                       | Print version information.                                                  |
| `-h`, `--help`                          | Print the usage message.                                                    |

Run `lumine --help` for the complete, current list, including test and profiling options.

Lumine can also install and manage packages from the command line (`--install`, `--uninstall`, `--list`, `--link`, `--unlink`); those are covered in [Managing packages and themes](../packages-and-themes/managing.md).

## Development mode

`--dev` opens a development window, loads packages from `~/.lumine/packages-dev`, and enables developer tooling. See [Developing a package](../developing-for-lumine/developing-a-package.md). For the safe-mode troubleshooting workflow, see [Common issues](../troubleshooting/common-issues.md#is-it-a-package).

Set `LUMINE_DEV_MODE=1` to force development mode independently of command-line arguments:

```sh
# PowerShell
$env:LUMINE_DEV_MODE = "1"
lumine .

# macOS / Linux
LUMINE_DEV_MODE=1 lumine .
```

To run a source checkout against an already-installed Lumine, point it at the checkout and launch in dev mode:

```sh
# PowerShell
$env:LUMINE_RESOURCE_PATH = (Get-Location).Path
lumine --dev .

# macOS / Linux
LUMINE_RESOURCE_PATH="$PWD" lumine --dev .
```
