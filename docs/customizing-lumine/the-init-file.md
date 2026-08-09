# The init file

The init file is a small script that runs once, when Lumine starts. It is the quickest way to add a bit of custom behavior without writing a whole package.

## Your init file

The file is **`init.js`** in your configuration directory, opened with `application:open-your-init-script`. It runs in the editor's context with the global **`lumine`** object available, so it can reach the whole editor API.

```js
// Log a message once the editor is ready.
lumine.notifications.addInfo("Welcome back!");
```

## What it is good for

- **Small custom commands.** Register a command and bind it in your [keymap](keybindings.md):

  ```js
  lumine.commands.add("lumine-text-editor", "custom:insert-date", () => {
    const editor = lumine.workspace.getActiveTextEditor();
    if (editor) editor.insertText(new Date().toISOString());
  });
  ```

- **Reacting to events**, such as running something whenever an editor is saved.
- **One-off tweaks** that are not worth packaging.

When an idea in your init file grows, move it into a real package — see [Developing a package](../developing-for-lumine/developing-a-package.md).

## Reloading

Changes to the init file take effect after you reload the window (`window:reload`) or restart Lumine.

> The full editor API — every class and method reachable through `lumine` — is documented in the [Lumine API reference](https://lumine-code.github.io/api/).
