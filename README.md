# lumine-code.github.io

Website and documentation for the Lumine text editor.

A modern, extensible text editor built on the Pulsar and Atom legacy.

This site documents **[Lumine](https://github.com/lumine-code/lumine)**.

Served via GitHub Pages at **https://lumine-code.github.io**.

## Structure

```text
index.html      # landing page
api/            # generated Lumine API reference (HTML and JSON)
docs/           # Markdown documentation rendered by docs.html
styles.css      # centered static styles, no build step
assets/         # logo assets
```

## Regenerating the API reference

Install the website's small documentation toolchain and run the generator:

```sh
npm install
npm run docs:api -- --editor /path/to/lumine
```

The generator uses the canonical JSDoc extractor and source registry from the selected editor checkout, then rewrites `api/index.html` and `api/api.json`. Registered dependency sources are resolved from sibling repositories first and the editor's `node_modules` second, so a full workspace keeps `event-kit` beside `lumine`. `LUMINE_CORE_ROOT` may be set instead of passing `--editor`.

## Local preview

Serve the folder over HTTP and open the printed URL:

```sh
npm start
# serves http://127.0.0.1:8000 (pass a port with `npm start -- 8080`)
```

The manual loads its manifest and Markdown with `fetch()`, so preview the site over HTTP instead of opening `docs.html` directly from `file://`. The API reference is self-contained HTML, but serving the whole site keeps navigation consistent.

## Deploying

This repo is named `lumine-code.github.io`, so GitHub Pages serves it at the org root automatically. In the repo's **Settings -> Pages**, set the source to the `master` branch root folder.

## Contributing

Report documentation problems in [Issues](https://github.com/lumine-code/lumine-code.github.io/issues) and discuss broader changes in [lumine-code Discussions](https://github.com/orgs/lumine-code/discussions).
