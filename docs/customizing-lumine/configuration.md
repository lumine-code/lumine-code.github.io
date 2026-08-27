# Configuration

Lumine can be adjusted from a graphical settings screen or by editing plain text files. Both change the same underlying configuration.

## The Settings view

Open **Settings** (the bundled `settings-view` package) to configure the editor and your packages through a UI. It has tabs for **Core** and **Editor** settings, **Language**, **Keybindings**, **Themes**, **Packages**, and **Install**. Most users never need to touch a config file directly.

## The config file

Settings are stored in **`config.json`** in your configuration directory (`~/.lumine`). A manually created `config.jsonc` works too. Open the active file with the `application:open-your-config` command. Lumine accepts JSON comments and trailing commas:

```json
{
  "*": {
    "core": {
      "telemetryConsent": "no"
    },
    "editor": {
      "fontSize": 14,
      "showInvisibles": true
    }
  }
}
```

The top-level `"*"` key holds settings that apply everywhere. Settings you change in the Settings view are written here automatically, so you can use whichever approach you prefer.

A legacy `config.cson` is not loaded. Convert it to `config.json` or `config.jsonc` before moving it into your Lumine configuration directory.

## Scoped settings

Below `"*"`, settings can be stored under grammar or syntax selectors. Settings exposes the same selector on every configuration page — see [Scoped settings](language-settings.md).

## The rest of your customization

`config.json` is one of several files in your configuration directory. Keybindings, snippets, styles, and startup code each live in their own file — see [Where customization is stored](where-customization-is-stored.md).
