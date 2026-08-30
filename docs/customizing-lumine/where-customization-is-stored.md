# Where customization is stored

All personal customization lives in one **configuration directory**. By default it is `~/.lumine` (on Windows, `%USERPROFILE%\.lumine`), but a portable profile or `LUMINE_HOME` can select another location.

## The configuration directory

| Path                               | What it holds                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| `config.json` / `config.jsonc`     | All settings (see [Configuration](configuration.md)).                         |
| `keymap.json` / `keymap.jsonc`     | Your personal keybindings (see [Keybindings](keybindings.md)).                |
| `snippets.json` / `snippets.jsonc` | Your snippets (see [Snippets](snippets.md)).                                  |
| `styles.css`                       | Your UI/style tweaks (see [Style tweaks](style-tweaks.md)).                   |
| `init.js`                          | Startup script run when Lumine loads (see [The init file](the-init-file.md)). |
| `packages/`                        | Installed packages, one directory per package.                                |
| `packages-dev/`                    | Packages loaded only in development mode.                                     |

Each personal file has an `application:open-your-*` command. When its path does not exist, Lumine opens an empty buffer there; save it to create the file.

## Using a different location

A writable portable `.lumine` directory beside the installation takes precedence. Otherwise you can set `LUMINE_HOME` before launching to use an isolated profile, such as a clean test setup or configuration on a removable drive.

## Resetting

Because everything is in this one directory, resetting Lumine to a clean state is a matter of moving or clearing it. See [Resetting to defaults](../troubleshooting/resetting-to-defaults.md).
