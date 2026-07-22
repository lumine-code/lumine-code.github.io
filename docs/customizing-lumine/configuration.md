# Configuration

Lumine can be adjusted from a graphical settings screen or by editing plain text files. Both change the same underlying configuration.

## The Settings view

Open **Settings** (the bundled `settings-view` package) to configure the editor and your packages through a UI. It has tabs for **Core** and **Editor** settings, **Languages**, **Keybindings**, **Themes**, **Packages**, and **Install**. Most users never need to touch a config file directly.

## The config file

Settings are stored in **`config.json`** in your configuration directory (`~/.lumine`). Open it with the `application:open-your-config` command. It is written as JSON, but Lumine parses it leniently, so comments and trailing commas are allowed:

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

Lumine still reads a legacy **`config.cson`** ([CSON](https://github.com/bevry/cson)) file if you already have one, but new configuration is created as JSON.

## Scoped settings

Below `"*"`, settings can be **scoped** to a language so they only apply to files of that type. This is how per-language indentation, soft wrap, and similar options work — see [Language-specific settings](language-settings.md).

## The rest of your customization

`config.json` is one of several files in your configuration directory. Keybindings, snippets, styles, and startup code each live in their own file — see [Where customization is stored](where-customization-is-stored.md).
