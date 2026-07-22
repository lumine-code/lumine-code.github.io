# Global settings

Global settings apply everywhere in the editor. They are the defaults you can later override per language.

## Editing them

Open **Settings** and use the **Core** and **Editor** tabs. Every setting there is documented inline, so the Settings view is the authoritative reference for what exists and what it does. Anything you change is written to the `"*"` block of [`config.cson`](configuration.md).

- **Core** covers editor-wide behavior: which packages are disabled, project and file handling, telemetry, and similar.
- **Editor** covers the text editor itself: font family and size, line height, soft wrap, invisibles, the wrap guide, scroll behavior, indentation defaults, and so on.

## Editing in the file

The same settings can be set directly in `config.cson`. For example:

```cson
"*":
  editor:
    fontSize: 14
    tabLength: 2
    softWrap: true
    showInvisibles: false
```

Values you set here appear in the Settings view and vice versa — they are the same configuration.

## Overriding per language

Any editor setting can be overridden for a specific language so, for instance, Makefiles use real tabs while everything else uses spaces. That is covered in [Language-specific settings](language-settings.md).
