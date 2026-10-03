# Language servers

The optional **`ide-client`** package is the editor's minimal Language Server Protocol 3.17 hub. It starts and synchronizes servers, coordinates protocol operations, and routes results to editor services; feature packages render those results, and separate optional infrastructure can perform filesystem changes. `ide-client` is not bundled.

## Installation

A working setup has three layers:

1. Install `ide-client`.
2. Install an adapter for each language, such as `ide-typescript`, `ide-eslint`, `ide-bash`, `ide-html`, `ide-yaml`, `ide-marksman`, `ide-pyright`, or `ide-ruff`.
3. Install the frontends you want: `autocomplete` for completions, `linter` for diagnostics, `symbol` plus a symbol provider for symbol lists, and packages from [Code intelligence](code-intelligence.md) for other features.

Install the optional, UI-less `file-operations` package when language servers should be allowed to create, rename or delete files through `WorkspaceEdit`. Without it, text edits and the other language features continue to work, while `ide-client` does not advertise resource-operation support.

For example, a minimal TypeScript setup with completions and diagnostics is:

```sh
lumine --install lumine-code/ide-client
lumine --install lumine-code/ide-typescript
lumine --install lumine-code/autocomplete
lumine --install lumine-code/linter
```

A minimal CSS and HTML setup with completions is:

```sh
lumine --install lumine-code/ide-client
lumine --install lumine-code/ide-css
lumine --install lumine-code/ide-html
lumine --install lumine-code/autocomplete
```

For indented `.sass` files, also install `ide-sass`:

```sh
lumine --install lumine-code/ide-sass
```

Installing an adapter alone does not install or replace `ide-client`; adapters connect to it through an editor service. Each adapter's settings page contains its server path, feature switches, and server-specific options. Project configuration files such as `tsconfig.json`, `pyrightconfig.json`, and `ruff.toml` continue to apply when the corresponding editor setting is left empty.

Through `jupyter-view`, servers with notebook support — including Basedpyright and Ruff — can analyze notebook cells. The same document transforms apply to ordinary editors and cells, so IPython magics and adapter-specific source masking stay out of diagnostics without changing notebook text.

## C, Rust, Go, TOML and R

These adapters use the same `ide-client` and frontend packages as the other languages:

| Adapter | Languages | Server | Additional setup |
| --- | --- | --- | --- |
| `ide-clangd` | C, C++, Objective-C and Objective-C++ | clangd | install `language-c`, or `language-objective-c` for Objective-C; provide your project's compilation database. |
| `ide-rust` | Rust | rust-analyzer | install `language-rust` and a Rust toolchain; `rust-src` enables standard-library navigation and `rustfmt` enables formatting. |
| `ide-go` | Go | gopls | install `language-go` and the Go SDK; open the folder containing `go.mod` or `go.work`. |
| `ide-toml` | TOML | Tombi | install `language-toml`; `tombi.toml` can select schemas and project formatting rules. |
| `ide-r` | R source files | R languageserver | install `language-r` and R; Manage Servers can install the `languageserver` package into a private R library. |

For CMake projects, `-DCMAKE_EXPORT_COMPILE_COMMANDS=ON` generates the `compile_commands.json` clangd uses to resolve include paths, macros and compiler options. The adapter's Compile Commands Path selects another database directory, and Fallback Flags cover files without a database entry. Project `.clangd` and `.clang-format` settings continue to apply.

The Go SDK remains necessary after installing gopls because the server uses it to load modules and dependencies. Go Path selects the SDK's `go` or `go.exe` executable when it is outside PATH. Rscript Path similarly selects the R runtime; the R adapter uses that installation's libraries, the managed library when present, or Library Path for another library. A `.lintr` file controls R diagnostics, and `.Rprofile` can customize the server's styler formatting.

Tombi respects project configuration before editor fallback settings. Local schema associations entered in the editor use absolute paths or URLs; relative schema paths belong in `tombi.toml`. Its supported features include schema diagnostics, completions, hover, navigation and formatting; the server does not implement rename.

Rust and R reference code lenses use client commands specific to other editors, so these adapters disable those lenses. References remain available through `find-references`. Rust-analyzer does not implement type hierarchy; clangd, gopls and R expose the hierarchies their servers support.

## Java, C#, PHP and Ruby

Install `ide-client`, the language grammar and the adapter, then choose the frontends for the features you want:

| Adapter | Server | Runtime and project setup |
| --- | --- | --- |
| `ide-java` | Eclipse JDT Language Server | use a Java 21 or newer JDK and `language-java`; open the project's Maven, Gradle or Eclipse root. |
| `ide-csharp` | Standalone Roslyn Language Server | use the .NET 10 SDK and `language-csharp`; open the solution or project folder. |
| `ide-php` | PHPantom | use `language-php`; open the Composer project root, or a folder of PHP files. Built-in analysis and formatting need no PHP runtime. |
| `ide-ruby` | Ruby LSP | use Ruby 3.0 or newer and `language-ruby`; select the project's Ruby version and run `bundle install` when the project has a Gemfile. |

Manage Servers installs the server independently of its runtime. Java uses a milestone distribution with separate Eclipse cache directories for each project and editor window. Its launch JDK requires Java 21 or newer; project build files can still target earlier Java versions. Ruby installs gems into a private directory and records the selected Ruby ABI and platform; reinstall the managed server after changing to an incompatible runtime. Windows native gem dependencies need RubyInstaller's Devkit or equivalent build tools.

C# uses Microsoft's standalone MIT-licensed Roslyn NuGet distribution, currently published as a prerelease. The adapter launches `Microsoft.CodeAnalysis.LanguageServer.dll` directly through the selected .NET runtime, preserving the full MSBuild payload. Roslyn requires .NET 10 to start and an SDK to load projects; keep other SDKs required by `global.json` installed too. **.NET Path** can select a portable SDK, and an explicit server selection can name the engine DLL. Project solutions, dependencies and SDK selection remain authoritative.

PHPantom reads `composer.json` and `.phpantom.toml` directly. Its adapter redirects supported method renames to the canonical inheritance declaration, so a concrete implementation and its interface change together. PHPantom 0.10.0 cannot safely rename a method shared by independent contracts; the adapter refuses that case before applying edits. Plain and mixed HTML/PHP documents are served, while Blade templates remain outside the adapter's document scope. PHPantom does not implement call hierarchy or range formatting. External tools such as PHPStan and PHP-CS-Fixer keep their own runtime requirements.

Ruby LSP uses the project's `Gemfile.lock` and composes its own `.ruby-lsp/Gemfile` through the official executable. Add RuboCop or Syntax Tree to the project bundle for formatting; formatter and linter settings default to upstream detection. The adapter corrects Prism UTF-16 ranges in Ruby LSP 0.26.0 through 0.26.11, preserving Unicode positions in preparation, references and rename edits. Constant rename and type ancestors are supported; Ruby LSP does not implement call hierarchy or type descendants, and it may defer references, rename and workspace symbols when it detects Sorbet.

Java project-source navigation is supported. Virtual JDK and dependency class-file documents require another client capability and are not enabled by this adapter; C# metadata definitions are supported. The Java, C# and Ruby adapters omit client-only code lenses; PHP method-prototype lenses use an executable server command. Code actions that require another editor's client command, including Roslyn's client-only Fix All actions, are filtered by `ide-client`, while ordinary edit-based fixes remain available.

## Lua, Dart, Swift and Zig

These adapters use `ide-client`, their language grammar and the same feature frontends as the other languages:

| Adapter | Server | Runtime and project setup |
| --- | --- | --- |
| `ide-lua` | LuaLS | install `language-lua`; open the Lua module folder. The complete LuaLS distribution includes its runtime and formatter. |
| `ide-dart` | Dart SDK Analysis Server | install `language-dart`; open the pub or Flutter project and resolve its dependencies with the matching SDK. |
| `ide-swift` | SourceKit-LSP | install `language-swift`; open the Swift package and keep its matching compiler, SDK and SourceKit-LSP together. |
| `ide-zig` | ZLS | install `language-zig` and the Zig SDK; open the folder containing `build.zig`. ZLS and Zig must share their major and minor version. |

LuaLS 3.19.1 analyzes Lua 5.1 through 5.5 and LuaJIT without a separately installed Lua interpreter. Manage Servers downloads the full distribution, including the scripts, metadata and native formatter required beside the executable. `.luarc.json` or `.luarc.jsonc` takes precedence over editor fallbacks; use it to select the analyzed Lua version, application globals and annotated library paths. Reference-count labels are informational, and `find-references` supplies navigation. LuaLS does not implement standard call or type hierarchy, and the adapter disables the upstream editor's addon-manager integration.

Dart's managed installation contains the complete Dart SDK, including the analyzer, formatter, pub tools, libraries and licenses. Dart SDK 3.13.5 provides both hierarchy APIs, analyzer diagnostics, quick fixes and Unicode workspace edits. **Dart Path** selects a project SDK explicitly. For Flutter, select its bundled Dart executable and run `flutter pub get`; a managed standalone Dart SDK does not install Flutter. `pubspec.yaml`, resolved pub dependencies and `analysis_options.yaml` remain authoritative, including `formatter.page_width`. Dart-specific test and navigation lenses are disabled; Flutter outlines, hot reload and debugging require separate integrations.

SourceKit-LSP from Swift 6.4 runs with its matching compiler, SDK, libraries and runtime resources. Manage Servers downloads the complete toolchain into private editor storage, verifying the official Linux release signature, Windows installer checksum or macOS package signature for the selected platform. Existing **Server Path** or **Swift Toolchain** selections take precedence over the managed copy; PATH and the selected Xcode toolchain supply discovery fallbacks. Windows also needs the platform C++ build tools and Windows SDK. Keep `SDKROOT` and project SourceKit-LSP configuration authoritative; managed extraction preserves the payload without performing a global toolchain installation or installing those platform prerequisites.

Swift supplies compiler diagnostics, completion and signatures, source and cross-module navigation, rename, formatting, edit-based fixes, hints, semantic highlighting and both call and type hierarchies. Background indexing follows the server and project defaults unless overridden. Swift run, debug and test lenses require editor-specific commands and are disabled.

ZLS 0.16.0 works with Zig 0.16.x; Manage Servers installs the matching ZLS server, while **Zig Path** selects the separately installed SDK. Build-runner discovery, standard-library navigation and compiler checks depend on that SDK. ZLS preserves automatic build-on-save detection, including a project's `check` step. Its comptime and semantic analysis remain incomplete. ZON files use diagnostics, formatting and semantic highlighting; source completion, navigation, rename, actions and hints are gated off. ZLS does not advertise call hierarchy, type hierarchy, code lenses or range formatting.

## XML and PowerShell

These adapters connect through `ide-client` and the same completion, diagnostic and navigation frontends:

| Adapter | Server | Runtime and project setup |
| --- | --- | --- |
| `ide-xml` | Eclipse LemMinX | use Java 11 or newer and `language-xml`; open XML or XSL files with their schemas, DTDs and XML catalogs. |
| `ide-powershell` | PowerShell Editor Services | use PowerShell 7 and `language-powershell`; open the script or module folder. `.ps1xml` files belong to `language-xml`. |

Manage Servers installs LemMinX as a checksum-verified JAR and PowerShell Editor Services as its complete official release ZIP. Java and PowerShell remain separate runtimes. Explicit runtime and server selections take precedence over managed copies.

LemMinX provides schema and DTD diagnostics, schema completions, navigation, document symbols, formatting, paired-tag rename and edit-based fixes. PowerShell Editor Services includes PSScriptAnalyzer diagnostics and fixes, signatures, navigation, formatting and semantic highlighting; project analyzer rules remain authoritative. Its rename is the upstream single-file operation and asks for acknowledgement of its limitations. Debugging and an integrated PowerShell terminal require separate integrations.

## Installing a server

Some adapters include an npm-based server; standalone servers such as Ruff, Texlab, Tinymist, and Marksman must be on `PATH`, selected with **Server Path**, or installed by Lumine. ESLint still uses the ESLint library and plugins from each project.

Run `ide-client:manage-servers` to install, update, or remove managed copies under `language-servers/` in your configuration directory. A configured **Server Path** wins, followed by the managed copy; standalone adapters then search `PATH`, while npm-based adapters fall back to the version shipped with the adapter. Removing a managed copy never removes a server installed by another tool.

The Bash adapter always runs its audited bundled server fork. Its managed install is a separately versioned, checksum-verified toolchain containing ShellCheck and shfmt, which provide diagnostics, fixes and formatting.

The SOFiSTiK adapter also includes its maintained server. It provides offline CADINP intelligence and manual import of existing calculation diagnostics, using only `sofistik.def` alongside each saved file and shared release detection. Files in different directories can use different releases within one server session; definitions in workspace roots or ancestors do not apply to child directories. It replaces the archived `autocomplete-sofistik` and `linter-sofistik` providers; see [SOFiSTiK](sofistik.md) for setup and migration.

## Sessions

Servers start when a matching editor first opens or its grammar changes. By default each project root gets a session; a server advertising multi-root support can share one process across roots, and a file outside the project gets a temporary file session. Several servers may serve one file: mergeable results are combined, while operations such as formatting or rename use an enabled server that supports them.

Untitled editors receive language-server features after you select a supported grammar. The client gives each one a stable untitled document identity and uses the first project root, falling back to the editor process's working directory when no project is open. Saving closes the untitled document and opens the same buffer under its file identity in the session selected for that path.

## Features

Each adapter's **Features** group exposes the capabilities that can be switched off, including diagnostics, completions, navigation, formatting, rename, code actions, hints, lenses, and semantic tokens. Use these switches to choose between overlapping servers; for example, disable Ruff hover to leave it to Basedpyright. Feature settings can be scoped per language, and adapters keep the corresponding server capability available whenever any served grammar enables it.

`ide-css` serves CSS, SCSS, and Less, including formatting.

`ide-sass` serves indented `.sass` files through Some Sass. Property completions retain indentation and omit semicolons, and signature help shows parameters for functions and mixins. The server does not provide a formatter.

`ide-html` serves HTML, EJS, ERB, and Mustache, including CSS and JavaScript embedded in HTML. In PHP, Blade, and Markdown, it sends only the grammar's HTML fragments to the server while preserving their document positions. HTML formatting is unavailable for those three host languages even when the Format setting is enabled; their own formatters handle the complete document. Vue documents use `ide-vue`. CSS in JavaScript template strings, such as styled-components, remains outside `ide-css`'s scope.

Document diagnostics and workspace diagnostics use the same route into `linter`: open buffers update as you type, while a server that implements `workspace/diagnostic` can also report files that are not open. Install `linter-panel` to browse the combined project result.

## File operations

`ide-client` coordinates file changes from the protocol but does not implement filesystem access. It validates document versions and ordered changes and prepares text edits; when the optional `file-operations` package is installed, closed-path inspection plus every create, rename and delete step goes to its `file-operations.executor@1.0.0` service. The executor's `inspect()` and `prepare()` calls inspect affected paths, simulate the complete sequence without mutation, and return frozen results or an opaque identity-checked plan; `ide-client` executes plan steps in `documentChanges` order, applies the interleaved text edits, and retargets open buffers from the effects that remain.

The executor has no commands or user interface and deliberately exposes only its versioned service. Its neutral step lifecycle identifies private staging roots and durable logical effects so protocol consumers can gate watcher noise; it neither emits nor consumes `tree-view`'s package-private events and does not manufacture a user-operation boundary from watcher notifications. Completed editor-owned moves retarget registered documents in the initiating workspace; an external rename does not retarget them.

The bundled `tree-view` owns the interface, conflict choices, queue and will/did boundary for file operations initiated by the user. Before a create, move, rename, copy or delete batch touches the filesystem, it publishes the exact planned paths through `tree-view.file-operations`; `ide-client` translates that boundary into matching LSP `workspace/will*Files` requests and preflights the returned edits. A server veto or failed preparation cancels the complete tree operation before mutation, while the matching `workspace/did*Files` notifications contain only effects that actually completed. `tree-view` never executes a server-authored `WorkspaceEdit` itself.

Document links from a server open through `hyperclick`. Four built-in commands expose protocol features that do not need another frontend package: `ide-client:fold-server-ranges` folds every server range, `ide-client:expand-selection-range` grows each selection to its next structural parent, `ide-client:select-linked-ranges` selects linked occurrences, and `ide-client:color-presentation` lets you choose and apply a server-provided spelling for the color under the cursor.

When filesystem observation recovers after lost delivery, affected language-server sessions restart and receive the current open documents again, including unsaved contents. This restores the server's state without pretending to replay changes that happened during the interruption.

## Custom servers

Any other language server can be wired up without a package. `ide-client:open-custom-servers-file` opens `language-servers.json` in your configuration directory; each entry names a command and the grammar scopes it serves:

```json
{
  "gopls": {
    "command": "gopls",
    "args": ["serve"],
    "scopes": ["source.go"],
    "settings": { "gopls": { "usePlaceholders": true } },
    "features": { "inlayHints": false }
  }
}
```

`command` and `scopes` are required. `args`, `env`, `languageId`, `sessionScope`, `transport`, `initializationOptions`, `settings`, and `features` are optional; `settings` is handed to the server as its configuration, and `features` switches individual capabilities off, as an adapter package's settings page does. Saving the file restarts exactly the servers whose entries changed.

## Inspecting and controlling servers

`ide-client:servers` lists running servers, with those serving the active editor first. A session is labeled **Root**, **Roots**, **Workspace**, or **File** according to what it covers; choose it to restart or stop it, open its log, or show its diagnostics.

The status-bar item opens the same list and reports failures; disable it with the **Status Bar** setting. With `busy-signal` installed, the shared busy indicator shows server startup and common finite language requests after 400 ms, plus background work reported by the server, such as indexing. This is managed centrally for adapters and custom servers. Concurrent operations remain visible until each finishes; running servers are listed in the separate IDE status item.

- `ide-client:restart` restarts every server for the active editor.
- `ide-client:format` formats the active document through a server.
- `ide-client:toggle-problems` opens `linter-panel` when it is installed.

## Troubleshooting

Open the server log with `ide-client:show-log`; set **Protocol Trace** to `messages` or `verbose` for protocol traffic. Crashed servers restart up to **Maximum Automatic Restarts**, after which the failure notification links to the log. Fix the reported cause and restart the session from `ide-client:servers`.
