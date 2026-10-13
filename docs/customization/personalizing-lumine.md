# Customization

Start in Settings: each setting explains its effect there. Use personal configuration files for changes you want to keep or share.

## Settings and scopes

Settings covers the editor, application and active packages. The scope selector limits supported settings to a language or syntax scope. The checkbox beside it selects temporary overrides for the current window; those disappear when the window reloads or closes. Leave it unchecked to save changes to your profile.

Open the config file with `application:open-your-config`. Base settings live under `"*"`; language-specific settings use a selector such as `".source.python"`:

```json
{
  "*": {
    "editor": { "fontSize": 14 }
  },
  ".source.python": {
    "editor": { "tabLength": 4 }
  }
}
```

## Configuration files

The default profile is `~/.lumine` (`%USERPROFILE%\.lumine` on Windows). A portable `.lumine` directory beside the installation takes precedence; `LUMINE_HOME` can also select a profile.

| File            | Purpose               | Open command                        |
| --------------- | --------------------- | ----------------------------------- |
| `config.json`   | Settings.             | `application:open-your-config`      |
| `keymap.json`   | Personal keybindings. | `application:open-your-keymap`      |
| `snippets.json` | Personal snippets.    | `application:open-your-snippets`    |
| `styles.css`    | Appearance overrides. | `application:open-your-stylesheet`  |
| `init.js`       | Startup code.         | `application:open-your-init-script` |

JSON configuration files can use the `.jsonc` extension. The profile also contains installed `packages/` and development `packages-dev/`. Back up the profile before resetting it.

## Keybindings

Settings → Keybindings shows current bindings. Personal bindings map a keystroke and a CSS selector to a command:

```json
{
  "lumine-text-editor:not([mini])": {
    "ctrl-alt-r": "editor:duplicate-lines"
  }
}
```

Use `cmdorctrl` for Cmd on macOS and Ctrl on other platforms. If a binding does not work, run `keybinding-resolver:toggle` to inspect what matched. Panel and picker reveal commands generally use Alt plus a letter; Git and Jupyter group related commands behind chord prefixes.

## Snippets

A snippet expands a prefix into text with tab stops. Group snippets by language scope:

```json
{
  ".source.js": {
    "Log a value": {
      "prefix": "log",
      "body": "console.log(${1:value});$0"
    }
  }
}
```

Run `snippets:expand` after typing the prefix, or browse snippets with `snippets:available`. See the [snippets package](https://github.com/lumine-code/snippets#readme) for more.

## Styles and startup code

Save CSS in `styles.css` to apply it live. Prefer the active theme's CSS variables:

```css
.tree-view {
  color: var(--text-color);
  font-size: 15px;
}
```

Use the developer tools' inspector to find a selector. The [theme variable guide](https://github.com/lumine-code/lumine/blob/master/docs/theme-variables.md) documents shared colors and dimensions.

`init.js` runs at startup with access to the global `lumine` object. Reload the window after changing it:

```js
lumine.notifications.addInfo("Welcome back!");
```

For larger additions, see [Extending Lumine](../extending-lumine/developing-extensions.md) and the [API reference](https://lumine-code.github.io/api/).
