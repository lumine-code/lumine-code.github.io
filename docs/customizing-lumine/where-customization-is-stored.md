# Where customization is stored

All of your personal customization lives in one **configuration directory**: `~/.lumine` (on Windows, `%USERPROFILE%\.lumine`). Knowing what is in it makes it easy to back up, sync, or reset your setup.

## The configuration directory

| Path            | What it holds                                                                 |
| --------------- | ----------------------------------------------------------------------------- |
| `config.cson`   | All settings (see [Configuration](configuration.md)).                         |
| `keymap.cson`   | Your personal keybindings (see [Keybindings](keybindings.md)).                |
| `snippets.cson` | Your snippets (see [Snippets](snippets.md)).                                  |
| `styles.less`   | Your UI/style tweaks (see [Style tweaks](style-tweaks.md)).                   |
| `init.js`       | Startup script run when Lumine loads (see [The init file](the-init-file.md)). |
| `packages/`     | Installed community packages, one directory per package.                      |
| `dev/packages/` | Packages loaded only in development mode.                                     |

Each of the personal files has an "open your…" command (`application:open-your-config`, `application:open-your-keymap`, `application:open-your-snippets`, `application:open-your-stylesheet`, `application:open-your-init-script`), which creates the file if it does not exist yet.

## Using a different location

You can point Lumine at a different configuration directory by setting the `ATOM_HOME` environment variable before launching. This is useful for keeping an isolated setup — for example, a clean profile for testing, or a portable configuration on a removable drive.

## Resetting

Because everything is in this one directory, resetting Lumine to a clean state is a matter of moving or clearing it. See [Resetting to defaults](../troubleshooting/resetting-to-defaults.md).
