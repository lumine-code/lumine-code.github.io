# Where customization is stored

All of your personal customization lives in one **configuration directory**: `~/.lumine` (on Windows, `%USERPROFILE%\.lumine`). Knowing what is in it makes it easy to back up, sync, or reset your setup.

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

Lumine does not load `config.cson`, `keymap.cson`, `styles.less`, or `init.coffee`; convert those files to the matching format above. The bundled snippets package is the one migration exception: it can still read an existing `snippets.cson`, although new snippet files are JSON.

Each of the personal files has an "open your…" command (`application:open-your-config`, `application:open-your-keymap`, `application:open-your-snippets`, `application:open-your-stylesheet`, `application:open-your-init-script`), which creates the file if it does not exist yet.

## Using a different location

You can point Lumine at a different configuration directory by setting the `LUMINE_HOME` environment variable before launching. This is useful for keeping an isolated setup — for example, a clean profile for testing, or a portable configuration on a removable drive.

## Resetting

Because everything is in this one directory, resetting Lumine to a clean state is a matter of moving or clearing it. See [Resetting to defaults](../troubleshooting/resetting-to-defaults.md).
