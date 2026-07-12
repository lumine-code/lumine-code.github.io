# Launching Lumine

You can start Lumine from your applications launcher, or from a terminal with the
`lumine` command (available once Lumine is installed on your `PATH`). Running from
a terminal lets you open files and folders and pass options.

## Opening files and folders

```sh
lumine .                 # open the current directory as a project
lumine path/to/file      # open a file
lumine file-a file-b     # open several paths
```

## Command-line options

These are the options accepted by the `lumine` command:

| Option                      | Description                                                                 |
| --------------------------- | --------------------------------------------------------------------------- |
| `-d`, `--dev`               | Run in development mode.                                                    |
| `-n`, `--new-window`        | Open a new window.                                                          |
| `-a`, `--add`               | Open the given path as a project in the last used window.                   |
| `-w`, `--wait`              | Wait for the window to close before returning (useful as a `$EDITOR`).      |
| `--safe`                    | Do not load packages from `~/.lumine/packages` or `~/.lumine/dev/packages`. |
| `-r <path>`                 | Set the path to the Lumine source directory and enable dev mode.            |
| `-t`, `--test`              | Run the specs in the given path.                                            |
| `--clear-window-state`      | Delete all saved window/environment state.                                  |
| `--user-data-dir <path>`    | Use a custom Electron user-data directory.                                  |
| `--enable-electron-logging` | Print low-level Electron logging.                                           |
| `-v`, `--version`           | Print version information.                                                  |
| `-h`, `--help`              | Print the usage message.                                                    |

Lumine can also install and manage community packages from the command line
(`--install`, `--uninstall`, `--list`, `--link`, `--unlink`); those are covered in
[Managing packages and themes](../packages-and-themes/managing.md).

## Development mode

`--safe` and `--dev` are the two options you will reach for most while
troubleshooting or building extensions:

- **`--safe`** starts the editor without loading your installed or development
  packages — the quickest way to tell whether a problem comes from a package.
- **`--dev`** opens a window in development mode, which loads packages from
  `~/.lumine/dev/packages` and enables extra developer tooling. See
  [Developing a package](../developing-for-lumine/developing-a-package.md).

To run a source checkout against an already-installed Lumine, point it at the
checkout and launch in dev mode:

```sh
# PowerShell
$env:ATOM_DEV_RESOURCE_PATH = (Get-Location).Path
lumine --dev .

# macOS / Linux
ATOM_DEV_RESOURCE_PATH="$PWD" lumine --dev .
```
