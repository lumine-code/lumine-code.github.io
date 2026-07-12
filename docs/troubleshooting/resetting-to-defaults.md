# Resetting to defaults

Because all of your customization lives in one
[configuration directory](../customizing-lumine/where-customization-is-stored.md)
(`~/.lumine`), returning to a clean state is straightforward. Work from the
least destructive option to the most.

## Start without packages

`lumine --safe` launches without loading your installed or development packages.
Nothing is deleted — it is a temporary clean environment for testing whether a
package is at fault.

## Clear saved window state

Layout, open files, and other per-window state are remembered between sessions.
If a window reopens broken, clear that state:

```sh
lumine --clear-window-state
```

This resets the remembered environment without touching your settings, keymap, or
packages.

## Reset individual customization

Each customization is a single file, so you can reset just one:

- Empty or delete `config.cson` to restore default settings.
- Empty `keymap.cson`, `snippets.cson`, or `styles.less` to drop your keybindings,
  snippets, or style tweaks.

Use the `application:open-your-*` commands to open each one.

## Reset everything

For a completely fresh start, move the whole configuration directory aside (rename
`~/.lumine` to `~/.lumine.bak`) and start Lumine — it recreates a default
directory. Your old setup is preserved in the backup if you need anything from it.

You can also keep an isolated configuration without disturbing your main one by
pointing the `ATOM_HOME` environment variable at a different directory before
launching.
