# Configuration

Lumine can be adjusted from a graphical settings screen or by editing plain text files. Both change the same underlying configuration.

## The Settings view

Open **Settings** (the bundled `settings-view` package) to configure the editor and packages through a UI. **Core** covers application-wide behavior, while **Editor** covers text editing, fonts, wrapping, scrolling, and indentation. Other panels manage Git, keybindings, packages, themes, updates, and installs; platform-specific panels appear when relevant. Every setting is documented inline, so most users never need to edit a config file.

## The config file

Settings are stored in **`config.json`** inside the active configuration directory (normally `~/.lumine`). A manually created `config.jsonc` works too. Open the active file with the `application:open-your-config` command. Lumine accepts JSON comments and trailing commas:

```json
{
  "*": {
    "core": {
      "restorePreviousState": "yes"
    },
    "editor": {
      "fontSize": 14,
      "showInvisibles": true
    }
  }
}
```

The top-level `"*"` key holds global settings. Values changed in Settings are written here automatically, and scoped values inherit from this block.

A legacy `config.cson` is not loaded. Convert it to `config.json` or `config.jsonc` before moving it into your Lumine configuration directory.

## Scoped settings

Settings can also be stored under grammar or syntax selectors. The same selector is available on every configuration page — see [Scoped settings](language-settings.md).

## The rest of your customization

`config.json` is one of several files in your configuration directory. Keybindings, snippets, styles, and startup code each live in their own file — see [Where customization is stored](where-customization-is-stored.md).
