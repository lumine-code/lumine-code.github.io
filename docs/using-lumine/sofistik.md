# SOFiSTiK

Use `ide-sofistik` for offline CADINP language intelligence and `language-sofistik` for syntax highlighting and folding.

> **NOTE**: This package is not an official SOFiSTiK product and is not affiliated with or endorsed by SOFiSTiK AG.

## Installation

Install the language grammar, the language-server client and its SOFiSTiK adapter:

```sh
lumine --install lumine-code/language-sofistik
lumine --install lumine-code/ide-client
lumine --install lumine-code/ide-sofistik
```

Add `autocomplete` for completion, `hover` for documentation and record signatures, `linter` for diagnostics, and `symbol`, `find-references` or `semantic-tokens` for navigation and contextual colors. The adapter includes its server, which runs with the editor's Node runtime. Static language intelligence works without a SOFiSTiK installation.

## Release, language and edition

Open the project directory as an editor project root. One server uses one release, language and edition for the entire directory. The shared SOFiSTiK data library resolves the release from the root `sofistik.def`, then the newest installed release under `C:\Program Files\SOFiSTiK`, and finally the newest bundled dataset. An explicitly selected release without a matching dataset is reported rather than replaced with another release.

For example, a project definition can contain:

```text
SOF_VERSION = 2026
SOF_LANGUAGE = EN
SOF_EDITION = professional
```

Use `EN` or `DE` for the keyword language and `professional` or `educational` for the licensed edition. Language defaults to English and edition to professional when the project does not specify them. These declarations are shared by the language server and the SOFiSTiK tool packages. Source-file headers are ignored when selecting the release, language and edition.

## Language intelligence

The server provides contextual records, parameters and values in completion, documentation on hover, parameter signatures, static diagnostics, document and project symbols, definitions and references. Each supported feature can be enabled or disabled per grammar in the adapter settings.

The language grammar supplies ordinary syntax colors. Semantic tokens add color only to enum values recognized in the current record, slot, release and language; comments, numbers, variables and unknown values keep their grammar colors. Disabling semantic tokens leaves ordinary highlighting visible. The adapter does not format or rename source files or run calculations.

## Existing calculation diagnostics

Run `ide-sofistik:read-calculation-diagnostics` on a saved, unchanged CADINP file to read its existing `.error_positions` file. The file contains one JSON object per line, with an error number, severity flag and source position. The server validates the imported records and combines them with its static findings in the linter.

This command reads an existing result; it never starts SOFiSTiK. Logs are not watched or imported automatically. Editing the source clears imported findings until the command is run again. Keep `sofistik-tools` if you also want the separate calculation and manual-opening workflows.

## Migration

`ide-sofistik` replaces the language-intelligence functions of `autocomplete-sofistik` and `linter-sofistik`. Disable or uninstall those older providers to avoid duplicate results; keep `autocomplete` and `linter`, which provide the interfaces used by `ide-client`.

The new packages do not use `sofistik-environment` or its settings. Move release, language and edition choices into the root `sofistik.def`; shared detection uses `C:\Program Files\SOFiSTiK` when installed programs are needed. The older packages remain available during migration. See [Language servers](language-servers.md) for the client and frontend setup, and [Optional packages](../packages-and-themes/optional-packages.md) for the other maintained packages.
