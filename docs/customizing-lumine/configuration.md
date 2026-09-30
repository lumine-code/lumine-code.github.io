# Configuration

Lumine can be adjusted from a graphical settings screen or by editing plain text files. Settings can be shared between windows or changed temporarily in the current window.

## The Settings view

Open **Settings** (the bundled `settings-view` package) to configure the editor and packages through a UI. **Core** covers application-wide behavior, while **Editor** covers text editing, fonts, wrapping, scrolling, and indentation. Other panels manage Git, keybindings, packages, themes, updates, and installs; platform-specific panels appear when relevant. Every setting is documented inline, so most users never need to edit a config file.

Configuration pages have a checkbox immediately to the left of the scope selector. It is unchecked by default, so edits are saved globally in your config file. Check it to edit temporary overrides belonging to the current window; its tooltip explains the two modes. The scope selector still chooses whether an override applies to the base settings or a particular language or syntax scope.

With the window checkbox checked, check an individual setting's override checkbox to give it a local value. Uncheck that setting's checkbox to inherit the current global value again. Settings that apply to the entire application are unavailable locally, with an explanation beside the control. Theme selection, package installation, and system integration panels continue to make global changes.

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

The top-level `"*"` key holds base settings. Values changed with the window checkbox unchecked in Settings are written here automatically, and scoped values inherit from this block. Saved changes propagate to other windows.

A legacy `config.cson` is not loaded. Convert it to `config.json` or `config.jsonc` before moving it into your Lumine configuration directory.

## Temporary window settings

Local overrides live only in the current window's memory. They are never written to the config file, copied to another window, or included in saved window state. They disappear when you reload or close the window; closing Settings or reloading a package leaves them in place.

If another window or an external editor changes the config file, this window receives the new global values while keeping its local overrides, including overrides of the same setting. Removing an override reveals the latest global value. A normal global write to a setting in this window also removes that setting's local override for the same selector.

A local value replaces the corresponding user-config entry before normal configuration resolution. Project settings and more specific language or syntax selectors keep their existing priority; a local base value does not force every project or language to use it.

Packages and startup code can use the same API:

```js
// Change only this window.
lumine.config.set("editor.fontSize", 20, { local: true });

// Reads and observers automatically include local overrides.
lumine.config.get("editor.fontSize");

// Remove the override and inherit the latest global value.
lumine.config.unset("editor.fontSize", { local: true });

// A normal write saves globally and removes this key's local override.
lumine.config.set("editor.fontSize", 14);
```

The `local` option can be combined with `scopeSelector` — see [Scoped settings](language-settings.md). Existing commands that call `set()` without `local: true` continue to write globally.

## Scoped settings

Settings can also be stored under grammar or syntax selectors. The same selector is available on every configuration page — see [Scoped settings](language-settings.md).

## The rest of your customization

`config.json` is one of several files in your configuration directory. Keybindings, snippets, styles, and startup code each live in their own file — see [Where customization is stored](where-customization-is-stored.md).
